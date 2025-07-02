import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ShoppingCart, Plus, Minus, ScanBarcode, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomerData } from '@/types/payment';
import PrintSimulator from '../components/PrintSimulator';
import BarcodeModal from '../components/BarcodeModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import PaymentMethodSelector from '../components/PaymentMethodSelector';

import PixPayment from '../components/PixPayment';
import CashPayment from '../components/CashPayment';

interface TotemProduct {
  id: string;
  nome: string;
  preco: number;
  codigo_barras: string;
  categoria: string;
  estoque: number; // Mantido para compatibilidade
  estoque_atual: number; // Adicionado para compatibilidade com a interface principal
  status: string;
  imagem_url?: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

interface TotemCartItem extends TotemProduct {
  quantity: number;
}

const Index: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Usando o toast do sonner diretamente
  
  const [cart, setCart] = useState<TotemCartItem[]>([]);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [showCashPayment, setShowCashPayment] = useState(false);
  const [showPrintSimulator, setShowPrintSimulator] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TotemProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [quantityInputs, setQuantityInputs] = useState<{ [key: string]: string }>({});
  const [paymentData, setPaymentData] = useState<{ method: string; nsu?: string } | null>(null);
  
  // Cliente padrão para pagamentos PIX
  const defaultCustomer: CustomerData = {
    name: 'Cliente PDV',
    email: 'cliente@pdv.com',
    document: '00000000000',
    document_type: 'CPF',
    type: 'individual',
    phones: {
      mobile_phone: {
        country_code: '55',
        area_code: '11',
        number: '999999999',
      },
    },
    address: {
      line_1: 'Rua do Cliente, 123',
      line_2: 'Sala 1 - Centro',
      zip_code: '01001000',
      city: 'São Paulo',
      state: 'SP',
      country: 'BR',
    },
    metadata: {
      source: 'pdv-mariapass',
    },
  };

  // Buscar produtos do Supabase
  const {
    data: products = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['produtos-totem'],
    queryFn: async () => {
      console.log('Buscando produtos para o totem...');
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('status', 'ativo')
        .gt('estoque', 0)
        .order('nome');
        
      // Garantir que estoque_atual seja preenchido mesmo se não vier do banco
      const produtosProcessados = data?.map(prod => ({
        ...prod,
        // Se estoque_atual não estiver definido, usa o valor de estoque
        estoque_atual: 'estoque_atual' in prod ? prod.estoque_atual : prod.estoque,
        // Garantir que estoque também esteja definido para compatibilidade
        estoque: 'estoque' in prod ? prod.estoque : 0
      })) || [];
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao carregar produtos: ' + error.message, {
          description: 'Por favor, tente novamente mais tarde.',
          duration: 3000 // Reduzido para 3 segundos
        });
        throw error;
      }
      
      console.log('Produtos carregados para totem:', produtosProcessados);
      return produtosProcessados as TotemProduct[];
    }
  });

  // Buscar categorias disponíveis dos produtos ativos
  const {
    data: categories = []
  } = useQuery({
    queryKey: ['categorias-produtos-ativos'],
    queryFn: async () => {
      console.log('Buscando categorias dos produtos ativos...');
      const {
        data,
        error
      } = await supabase
        .from('produtos')
        .select('categoria')
        .eq('status', 'ativo')
        .gt('estoque', 0);
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        return [];
      }

      const uniqueCategories = [...new Set(data?.map(product => product.categoria) || [])];
      console.log('Categorias encontradas:', uniqueCategories);
      return uniqueCategories;
    }
  });

  // Mutation para registrar impressão no histórico - AGORA USANDO A TABELA CORRETA
  const registrarImpressaoMutation = useMutation({
    mutationFn: async (dadosImpressao: {
      pedido_id: string;
      produto_nome: string;
      quantidade: number;
    }) => {
      console.log('🖨️ REGISTRANDO IMPRESSÃO NO HISTÓRICO:', dadosImpressao);
      const {
        data,
        error
      } = await supabase
        .from('impressoes_vendas')
        .insert({
          pedido_id: dadosImpressao.pedido_id,
          produto_nome: dadosImpressao.produto_nome,
          quantidade: dadosImpressao.quantidade,
          tipo: 'comprovante',
          impressora: 'Impressora Principal',
          status: 'concluido',
          paginas: 1,
          copias: dadosImpressao.quantidade,
          usuario: `Sistema Totem - ${dadosImpressao.produto_nome}`,
          data_impressao: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao registrar impressão:', error);
        throw error;
      }
      
      console.log('✅ Impressão registrada com sucesso no histórico:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Impressão salva no banco de dados:', data);
      console.log('📋 Produto associado:', variables.produto_nome);
      queryClient.invalidateQueries({ queryKey: ['impressoes-vendas'] });
    },
    onError: (error, variables) => {
      console.error('❌ Erro ao registrar impressão no histórico:', error);
      console.error('📋 Dados que falharam:', variables);
      toast.error(`Erro ao registrar impressão para ${variables.produto_nome}`, {
        description: error.message,
        duration: 3000 // Reduzido para 3 segundos
      });
    }
  });

  // Mutation para registrar vendas e atualizar estoque
  const processOrderMutation = useMutation({
    mutationFn: async (cartItems: TotemCartItem[]) => {
      console.log('Iniciando processamento do pedido:', cartItems);
      const salesRecords = [];
      const stockUpdates = [];

      for (const item of cartItems) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from('produtos')
          .select('estoque')
          .eq('id', item.id)
          .single();
        
        if (fetchError) {
          console.error(`Erro ao buscar produto ${item.nome}:`, fetchError);
          throw new Error(`Erro ao buscar produto ${item.nome}: ${fetchError.message}`);
        }
        
        const currentStock = currentProduct.estoque;
        const newStock = currentStock - item.quantity;
        
        console.log(`Processando produto ${item.nome}: estoque atual ${currentStock} - vendido ${item.quantity} = novo estoque ${newStock}`);
        
        if (newStock < 0) {
          throw new Error(`Estoque insuficiente para o produto ${item.nome}. Disponível: ${currentStock}, solicitado: ${item.quantity}`);
        }

        const saleRecord = {
          produto_id: item.id,
          quantidade: item.quantity,
          valor_unitario: item.preco,
          valor_total: item.preco * item.quantity,
          forma_pagamento: 'debito_pulseira',
          numero_autorizacao: `PED-${Date.now()}-${item.id.slice(0, 6)}`,
          data_venda: new Date().toISOString()
        };
        
        salesRecords.push(saleRecord);
        stockUpdates.push({
          id: item.id,
          nome: item.nome,
          novoEstoque: newStock,
          vendido: item.quantity
        });
      }

      console.log('Registrando pedido e itens...');
      
      // Cria o pedido principal
      const pedidoData = {
        numero_pedido: `PED-${Date.now()}`,
        tipo_pagamento: 'debito_pulseira',
        status: 'concluido',
        valor_total: salesRecords.reduce((sum, item) => sum + item.valor_total, 0),
        data_pedido: new Date().toISOString(),
        terminal_id: null // Adicionar ID do terminal se necessário
      };
      
      // Insere o pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(pedidoData)
        .select()
        .single();
      
      if (pedidoError) {
        console.error('Erro ao criar pedido:', pedidoError);
        throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);
      }
      
      // Prepara os itens do pedido com os campos exatos da tabela
      const itensPedido = salesRecords.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.valor_unitario,
        subtotal: item.valor_total
      }));
      
      // Insere os itens do pedido
      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensPedido);
      
      if (itensError) {
        console.error('Erro ao registrar itens do pedido:', itensError);
        throw new Error(`Erro ao registrar itens do pedido: ${itensError.message}`);
      }

      for (const update of stockUpdates) {
        const { error: stockError } = await supabase
          .from('produtos')
          .update({
            estoque: update.novoEstoque,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);
        
        if (stockError) {
          console.error(`Erro ao atualizar estoque do produto ${update.nome}:`, stockError);
          throw new Error(`Erro ao atualizar estoque do produto ${update.nome}: ${stockError.message}`);
        }
        
        console.log(`Produto ${update.nome} - estoque atualizado para ${update.novoEstoque}`);

        if (update.novoEstoque <= 5 && update.novoEstoque > 0) {
          toast.warning(`⚠️ ALERTA DE ESTOQUE BAIXO: ${update.nome}`, {
            description: `Apenas ${update.novoEstoque} unidades restantes!`,
            duration: 3000, // Reduzido para 3 segundos
            action: {
              label: 'Reabastecer',
              onClick: () => navigate('/estoque')
            }
          });
        } else if (update.novoEstoque === 0) {
          toast.error(`🚨 PRODUTO ESGOTADO: ${update.nome}`, {
            description: 'Não há mais unidades disponíveis em estoque!',
            duration: 4000, // Reduzido para 4 segundos
            action: {
              label: 'Gerenciar Estoque',
              onClick: () => navigate('/estoque')
            }
          });
        }
      }
      
      console.log('Pedido processado com sucesso. Vendas registradas e estoque atualizado.');
      return { salesRecords, stockUpdates };
    },
    onSuccess: ({ salesRecords, stockUpdates }) => {
      console.log('Pedido processado com sucesso:', { salesRecords, stockUpdates });

      const orderId = currentOrderId;
      console.log('📝 Registrando impressões para pedido:', orderId);
      
      stockUpdates.forEach((update, index) => {
        console.log(`🖨️ Registrando impressão ${index + 1}/${stockUpdates.length} para produto:`, update.nome);
        registrarImpressaoMutation.mutate({
          pedido_id: orderId,
          produto_nome: update.nome,
          quantidade: update.vendido
        });
      });

      queryClient.invalidateQueries({ queryKey: ['produtos-totem'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-produtos-ativos'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['impressoes-vendas'] });
      
      const totalProdutos = stockUpdates.length;
      const totalVendas = salesRecords.length;
      const resumo = stockUpdates.map(u => `${u.nome}: ${u.vendido} vendido(s), restam ${u.novoEstoque}`).join('\n');
      
      toast.success(`✅ Venda Finalizada: ${totalVendas} item(ns) vendido(s) com sucesso!`, {
        description: `${resumo}\n\n🖨️ Impressões registradas no histórico!`,
        duration: 3000 // Reduzido para 3 segundos
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao processar pedido:', error);
      toast.error('❌ Erro ao Processar Venda', {
        description: error.message,
        duration: 3000 // Reduzido para 3 segundos
      });
    }
  });

  // Filtrar produtos por categoria
  const filteredProducts = selectedCategory === 'todas' 
    ? products.slice(0, 20) // Aumentar para 20 produtos quando mostrar todos
    : products.filter(product => product.categoria === selectedCategory);
  const addToCart = (product: TotemProduct, customQuantity?: number) => {
    if (product.estoque <= 0) {
      toast.error('Produto Indisponível', {
        description: 'Produto sem estoque disponível!',
        duration: 3000
      });
      return;
    }
    
    const quantityToAdd = customQuantity || 1;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantityToAdd;
        if (newQuantity > product.estoque) {
          toast.warning('Estoque Insuficiente', {
            description: 'Estoque insuficiente para este produto!',
            duration: 3000
          });
          return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantityToAdd > product.estoque) {
          toast.warning('Estoque Insuficiente', {
            description: 'Estoque insuficiente para este produto!',
            duration: 3000
          });
          return prevCart;
        }
        return [...prevCart, { ...product, quantity: quantityToAdd }];
      }
    });

    setQuantityInputs(prev => ({ ...prev, [product.id]: '' }));
  };
  const handleQuantityInputChange = (productId: string, value: string) => {
    setQuantityInputs(prev => ({ ...prev, [productId]: value }));
  };
  const handleAddWithQuantity = (product: TotemProduct) => {
    const inputQuantity = quantityInputs[product.id];
    const quantity = inputQuantity ? parseInt(inputQuantity) : 1;
    if (quantity > 0) {
      addToCart(product, quantity);
    }
  };
  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      return prevCart.map(item => 
        item.id === productId && item.quantity > 1 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ).filter(item => !(item.id === productId && item.quantity <= 1));
    });
  };
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.preco * item.quantity), 0);
  };
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  const generateOrder = () => {
    if (cart.length === 0) {
      toast.warning('Carrinho Vazio', {
        description: 'Adicione itens ao carrinho primeiro!',
        duration: 3000
      });
      return;
    }

    const stockErrors = [];
    for (const item of cart) {
      if (item.quantity > item.estoque) {
        stockErrors.push(`${item.nome}: solicitado ${item.quantity}, disponível ${item.estoque}`);
      }
    }
    
    if (stockErrors.length > 0) {
      toast.error('Estoque Insuficiente', {
        description: `Estoque insuficiente:\n${stockErrors.join('\n')}`,
        duration: 6000
      });
      return;
    }
    
    const orderId = `PED-${Date.now()}`;
    setCurrentOrderId(orderId);
    setShowPaymentMethod(true);
    
    toast.success('Pedido Gerado', {
      description: 'Selecione o método de pagamento.',
      duration: 3000
    });
  };

  const handlePaymentMethodSelect = (method: 'pix' | 'dinheiro') => {
    setShowPaymentMethod(false);
    
    if (method === 'dinheiro') {
      setShowCashPayment(true);
    } else {
      setShowPixPayment(true);
    }
  };

  const handlePaymentSuccess = (paymentInfo?: { method: string; nsu?: string }) => {
    setShowPixPayment(false);
    setShowCashPayment(false);
    setPaymentData(paymentInfo || { method: 'PIX' });
    setShowPrintSimulator(true);
  };

  const handlePaymentCancel = () => {
    setShowPaymentMethod(false);
    setShowPixPayment(false);
    setShowCashPayment(false);
    setCurrentOrderId('');
  };

  const handlePrintClose = () => {
    setShowPrintSimulator(false);
    console.log('Iniciando finalização da venda e registro no sistema...');

    if (cart.length > 0) {
      processOrderMutation.mutate(cart);
    }

    setCart([]);
    setCurrentOrderId('');
    setPaymentData(null);
  };

  const handleBarcodeProductScanned = (product: TotemProduct) => {
    // Verifica se o produto já está no carrinho
    const existingItem = cart.find(item => item.id === product.id);
    
    // Se o produto já estiver no carrinho, apenas seleciona para exibir os detalhes
    if (existingItem) {
      setSelectedProduct(product);
      return;
    }
    
    // Adiciona o produto ao carrinho
    addToCart(product);
    
    // Exibe os detalhes do produto
    setSelectedProduct(product);
    
    // Feedback visual para o usuário
    toast.success('Produto adicionado', {
      description: `${product.nome} foi adicionado ao carrinho`,
      duration: 2000 // Definido para 2 segundos
    });
  };

  if (isLoading) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-sm">Erro ao carregar produtos: {error.message}</p>
          <Button className="mt-2" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      {/* Alertas são mostrados usando toast diretamente */}
      
      <div className="text-center mb-3 sm:mb-4">
        <h1 className="text-lg sm:text-xl font-bold text-green-600 mb-1">MariaPass Totem</h1>
        <p className="text-xs sm:text-sm text-gray-600">Selecione seus produtos e faça o pagamento via QR Code</p>
        
        <div className="mt-2 flex flex-col gap-2">
          <div className="w-full max-w-4xl mx-px px-[16px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <Carousel className="w-full">
                  <CarouselContent className="-ml-1">
                    <CarouselItem className="pl-1 basis-auto">
                      <Button
                        variant={selectedCategory === 'todas' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('todas')}
                        className="text-xs whitespace-nowrap h-7"
                      >
                        Todas
                      </Button>
                    </CarouselItem>
                    {categories.map(category => (
                      <CarouselItem key={category} className="pl-1 basis-auto">
                        <Button
                          variant={selectedCategory === category ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          className="text-xs whitespace-nowrap h-7"
                        >
                          {category}
                        </Button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
              
              <Button
                onClick={() => setShowBarcodeModal(true)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-xs h-7 flex-shrink-0"
              >
                <ScanBarcode className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 font-medium">Código de Barras</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BarcodeModal
        open={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        onProductScanned={handleBarcodeProductScanned}
      />
      
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product) => addToCart(product)}
        onRemoveFromCart={(productId) => removeFromCart(productId)}
        cartItems={cart}
      />

      {filteredProducts.length === 0 ? (
        <div className="text-center py-6">
          <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-xs sm:text-sm">
            {selectedCategory === 'todas' 
              ? 'Nenhum produto disponível no momento' 
              : `Nenhum produto disponível na categoria "${selectedCategory}"`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-1.5 sm:gap-2">
          {filteredProducts.map(product => {
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const availableStock = product.estoque - quantity;
            const isLowStock = product.estoque <= 5;
            
            return (
              <div key={product.id} className="relative">
                <Card 
                  className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.imagem_url ? (
                      <img
                        src={product.imagem_url}
                        alt={product.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="p-1.5 pb-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-[10px] sm:text-xs line-clamp-2 leading-tight font-medium">
                          {product.nome}
                        </CardTitle>
                        <Badge variant="outline" className="mt-0.5 text-[8px] sm:text-[9px] px-1 py-0">
                          {product.categoria}
                        </Badge>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                        <Badge
                          variant={availableStock < 10 ? "destructive" : "secondary"}
                          className="text-[8px] sm:text-[9px] whitespace-nowrap px-1 py-0"
                        >
                          {availableStock}
                        </Badge>
                        {isLowStock && (
                          <div className="flex items-center">
                            <AlertTriangle className="w-2 h-2 text-orange-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm font-bold text-green-600 mt-0.5">
                      R$ {product.preco.toFixed(2)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0 p-1.5">
                    <div className="h-6 flex items-center justify-center">
                      {availableStock <= 0 ? (
                        <span className="text-xs text-red-500 font-medium">Esgotado</span>
                      ) : (
                        <span className="text-xs text-gray-500">{availableStock} disponíveis</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {quantity > 0 ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(product.id);
                            }}
                            className="w-6 h-6 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 flex items-center justify-center flex-shrink-0"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </Button>
                          <Badge variant="secondary" className="text-[10px] flex-shrink-0 px-2 py-0 h-6 flex items-center">
                            {quantity}
                          </Badge>
                        </>
                      ) : null}
                      <Button
                        size="sm"
                        variant={quantity > 0 ? "outline" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        disabled={availableStock <= 0}
                        className={`w-6 h-6 p-0 flex items-center justify-center flex-shrink-0 ${
                          quantity > 0 
                            ? 'border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-400' 
                            : 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {quantity > 0 && (
                  <Badge
                    className="absolute bg-red-500 text-white text-[8px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white z-50"
                    variant="destructive"
                    style={{ top: '4px', right: '4px' }}
                  >
                    {quantity}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cart.length > 0 && (
        <Card className="fixed bottom-2 right-2 w-72 sm:w-80 shadow-lg border-2 border-green-500 z-40">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Carrinho</span>
              </div>
              <Badge className="text-xs">{getTotalItems()} itens</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            <div className="max-h-48 sm:max-h-64 overflow-y-auto pr-1 space-y-2">
              {cart.map(item => {
                const product = products.find(p => p.id === item.id);
                const availableStock = product ? (product.estoque - item.quantity) : 0;
                
                return (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-xs truncate">{item.nome}</div>
                      <div className="text-xs text-gray-500">
                        R$ {item.preco.toFixed(2)} un.
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        className="w-6 h-6 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 flex-shrink-0 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <span className="text-sm font-semibold w-6 text-center">
                        {item.quantity}
                      </span>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        disabled={availableStock <= 0}
                        className="w-6 h-6 p-0 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300 flex-shrink-0 flex items-center justify-center disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      
                      <span className="font-bold text-green-600 text-sm min-w-[60px] text-right">
                        R$ {(item.preco * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t pt-3 mt-2">
              <div className="flex justify-between items-center font-bold mb-3">
                <span className="text-sm">Total:</span>
                <span className="text-green-600 text-lg">R$ {getTotalPrice().toFixed(2)}</span>
              </div>
              
              <Button 
                onClick={generateOrder} 
                className="w-full h-10 text-sm font-medium bg-green-600 hover:bg-green-700" 
                size="lg"
              >
                Finalizar Compra
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showPaymentMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PaymentMethodSelector
            onSelectMethod={handlePaymentMethodSelect}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}

      {showCashPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CashPayment
            valor={getTotalPrice()}
            recargaId={currentOrderId}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}

{showPixPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PixPayment
            valor={getTotalPrice()}
            recargaId={currentOrderId}
            customer={defaultCustomer}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}

      {showPrintSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PrintSimulator
            orderId={currentOrderId}
            cart={cart}
            total={getTotalPrice()}
            paymentMethod={paymentData?.method}
            nsu={paymentData?.nsu}
            onClose={handlePrintClose}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
