import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ShoppingCart, Plus, Minus, ScanBarcode, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import QRCodeGenerator from '../components/QRCodeGenerator';
import PrintSimulator from '../components/PrintSimulator';
import BarcodeModal from '../components/BarcodeModal';

interface TotemProduct {
  id: string;
  nome: string;
  preco: number;
  codigo_barras: string;
  categoria: string;
  estoque: number;
  status: string;
  imagem_url?: string;
  descricao?: string;
}

interface TotemCartItem extends TotemProduct {
  quantity: number;
}

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<TotemCartItem[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPrintSimulator, setShowPrintSimulator] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // Buscar produtos do Supabase
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['produtos-totem'],
    queryFn: async () => {
      console.log('Buscando produtos para o totem...');
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('status', 'ativo')
        .gt('estoque', 0)
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao carregar produtos: ' + error.message);
        throw error;
      }
      
      console.log('Produtos carregados para totem:', data);
      return data as TotemProduct[];
    },
  });

  // Buscar categorias disponíveis
  const { data: categories = [] } = useQuery({
    queryKey: ['categorias-totem'],
    queryFn: async () => {
      console.log('Buscando categorias...');
      const { data, error } = await supabase
        .from('categorias')
        .select('nome')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        return [];
      }
      
      return data?.map(cat => cat.nome) || [];
    },
  });

  // Filtrar produtos por categoria
  const filteredProducts = selectedCategory === 'todas' 
    ? products.slice(0, 12) // Limitar a 12 produtos quando mostrar todos
    : products.filter(product => product.categoria === selectedCategory);

  const addToCart = (product: TotemProduct) => {
    if (product.estoque <= 0) {
      toast.error('Produto sem estoque disponível!');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.estoque) {
          toast.error('Estoque insuficiente para este produto!');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
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
      toast.error('Adicione itens ao carrinho primeiro!');
      return;
    }

    const orderId = `PED-${Date.now()}`;
    setCurrentOrderId(orderId);
    setShowQRCode(true);
    toast.success('Pedido gerado! Apresente o QR Code para pagamento.');
  };

  const handleQRCodeClose = () => {
    setShowQRCode(false);
    setShowPrintSimulator(true);
  };

  const handlePrintClose = () => {
    setShowPrintSimulator(false);
    setCart([]);
    setCurrentOrderId('');
    toast.success('Novo pedido iniciado!');
  };

  const handleBarcodeProductScanned = (product: any) => {
    // Convert the scanned product to TotemProduct format
    const totemProduct: TotemProduct = {
      id: product.id,
      nome: product.nome || product.name,
      preco: product.preco || product.price,
      codigo_barras: product.codigo_barras || product.barcode,
      categoria: product.categoria || product.category,
      estoque: product.estoque || product.stock,
      status: product.status || 'ativo',
      imagem_url: product.imagem_url || product.image_url,
      descricao: product.descricao || product.description
    };
    addToCart(totemProduct);
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
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-green-600 mb-1">MariaPass Totem</h1>
        <p className="text-xs sm:text-sm text-gray-600">Selecione seus produtos e faça o pagamento via QR Code</p>
        
        {/* Controles de Scanner e Categoria */}
        <div className="mt-2 sm:mt-3 flex flex-col items-center justify-center gap-3">
          <Button
            onClick={() => setShowBarcodeModal(true)}
            variant="outline"
            size="lg"
            className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-xs sm:text-sm h-8"
          >
            <ScanBarcode className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            <span className="text-blue-600 font-medium">Adicionar por Código de Barras</span>
          </Button>
          
          <div className="w-full max-w-md">
            <span className="block text-xs sm:text-sm text-gray-700 font-medium mb-2">Categorias:</span>
            <Carousel className="w-full">
              <CarouselContent className="-ml-1">
                <CarouselItem className="pl-1 basis-auto">
                  <Button
                    variant={selectedCategory === 'todas' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('todas')}
                    className="text-xs whitespace-nowrap"
                  >
                    Todas
                  </Button>
                </CarouselItem>
                {categories.map((category) => (
                  <CarouselItem key={category} className="pl-1 basis-auto">
                    <Button
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs whitespace-nowrap"
                    >
                      {category}
                    </Button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </div>
        </div>
      </div>

      {/* Barcode Modal */}
      <BarcodeModal
        open={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        onProductScanned={handleBarcodeProductScanned}
      />

      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm sm:text-base">
            {selectedCategory === 'todas' 
              ? 'Nenhum produto disponível no momento'
              : `Nenhum produto disponível na categoria "${selectedCategory}"`
            }
          </p>
        </div>
      ) : (
        /* Grid de Produtos Responsivo */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {filteredProducts.map((product) => {
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const availableStock = product.estoque - quantity;

            return (
              <div key={product.id} className="relative">
                <Card className="overflow-hidden h-full">
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
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="p-2 sm:p-3 pb-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xs sm:text-sm line-clamp-2 leading-tight">{product.nome}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs">{product.categoria}</Badge>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge 
                          variant={availableStock < 10 ? "destructive" : "secondary"}
                          className="text-[10px] sm:text-xs whitespace-nowrap"
                        >
                          {availableStock} un.
                        </Badge>
                      </div>
                    </div>
                    
                    {product.descricao && (
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2">
                        {product.descricao}
                      </p>
                    )}
                    
                    <p className="text-sm sm:text-base font-bold text-green-600 mt-1">
                      R$ {product.preco.toFixed(2)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0 p-2 sm:p-3">
                    <div className="flex items-center justify-between gap-1">
                      <Button 
                        onClick={() => addToCart(product)}
                        className="w-8 h-8 sm:w-9 sm:h-9 bg-green-600 hover:bg-green-700 text-white p-0 flex items-center justify-center flex-shrink-0"
                        disabled={availableStock <= 0}
                        size="sm"
                      >
                        {availableStock <= 0 ? (
                          <span className="text-[8px] sm:text-[10px] leading-none text-center px-1">
                            Sem
                          </span>
                        ) : (
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                      
                      {quantity > 0 && (
                        <>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">{quantity}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeFromCart(product.id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 flex items-center justify-center flex-shrink-0"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {quantity > 0 && (
                  <Badge 
                    className="absolute bg-red-500 text-white text-[10px] sm:text-xs min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white z-50"
                    variant="destructive"
                    style={{ 
                      top: '8px', 
                      right: '8px'
                    }}
                  >
                    {quantity}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Carrinho Flutuante Responsivo */}
      {cart.length > 0 && (
        <Card className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 w-64 sm:w-72 shadow-lg border-2 border-green-500 z-40">
          <CardHeader className="pb-2 p-2 sm:p-3">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
              <div className="flex items-center space-x-1">
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Carrinho</span>
              </div>
              <Badge className="text-xs">{getTotalItems()} itens</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-2 sm:p-3 pt-0">
            <div className="max-h-24 sm:max-h-32 overflow-y-auto space-y-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-1 sm:p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium text-xs">{item.nome}</span>
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      {item.quantity}x R$ {item.preco.toFixed(2)}
                    </div>
                  </div>
                  <span className="font-bold text-green-600 text-xs">
                    R$ {(item.preco * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-sm">Total:</span>
                <span className="text-green-600 text-sm sm:text-base">R$ {getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              onClick={generateOrder}
              className="w-full text-xs sm:text-sm h-8"
              size="lg"
            >
              Gerar QR Code para Pagamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code Generator */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <QRCodeGenerator 
            orderId={currentOrderId}
            amount={getTotalPrice()}
            onClose={handleQRCodeClose}
          />
        </div>
      )}

      {/* Print Simulator */}
      {showPrintSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PrintSimulator 
            orderId={currentOrderId}
            cart={cart}
            total={getTotalPrice()}
            onClose={handlePrintClose}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
