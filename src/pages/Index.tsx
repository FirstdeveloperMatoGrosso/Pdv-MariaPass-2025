
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        .order('nome')
        .limit(5);
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao carregar produtos: ' + error.message);
        throw error;
      }
      
      console.log('Produtos carregados para totem:', data);
      return data as TotemProduct[];
    },
  });

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
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar produtos: {error.message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-600 mb-2">MariaPass Totem</h1>
        <p className="text-gray-600">Selecione seus produtos e faça o pagamento via QR Code</p>
        
        {/* Botão Scanner */}
        <div className="mt-4">
          <Button
            onClick={() => setShowBarcodeModal(true)}
            variant="outline"
            size="lg"
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <ScanBarcode className="w-5 h-5 text-blue-600" />
            <span className="text-blue-600 font-medium">Adicionar por Código de Barras</span>
          </Button>
        </div>
      </div>

      {/* Barcode Modal */}
      <BarcodeModal
        open={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        onProductScanned={handleBarcodeProductScanned}
      />

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum produto disponível no momento</p>
        </div>
      ) : (
        /* Grid de Produtos - 5 produtos lado a lado */
        <div className="grid grid-cols-5 gap-4 max-w-full overflow-x-auto">
          {products.map((product) => {
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const availableStock = product.estoque - quantity;

            return (
              <div key={product.id} className="relative min-w-0 flex-shrink-0">
                <Card className="overflow-hidden">
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
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm line-clamp-2 leading-tight">{product.nome}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">{product.categoria}</Badge>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge 
                          variant={availableStock < 10 ? "destructive" : "secondary"}
                          className="text-xs whitespace-nowrap"
                        >
                          {availableStock} un.
                        </Badge>
                      </div>
                    </div>
                    
                    {product.descricao && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {product.descricao}
                      </p>
                    )}
                    
                    <p className="text-lg font-bold text-green-600 mt-2">
                      R$ {product.preco.toFixed(2)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button 
                        onClick={() => addToCart(product)}
                        className="flex-1 text-xs h-6 bg-green-600 hover:bg-green-700 text-white px-2"
                        disabled={availableStock <= 0}
                        size="sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {availableStock <= 0 ? 'Sem Estoque' : 'Adicionar'}
                      </Button>
                      
                      {quantity > 0 && (
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeFromCart(product.id)}
                            className="h-6 w-6 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Badge variant="secondary" className="text-xs">{quantity}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {quantity > 0 && (
                  <Badge 
                    className="absolute bg-red-500 text-white text-xs min-w-[24px] h-6 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white z-50"
                    variant="destructive"
                    style={{ 
                      top: '60%', 
                      right: '-8px'
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

      {/* Carrinho Flutuante */}
      {cart.length > 0 && (
        <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-green-500 z-40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Carrinho</span>
              </div>
              <Badge>{getTotalItems()} itens</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-40 overflow-y-auto space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{item.nome}</span>
                    <div className="text-xs text-gray-500">
                      {item.quantity}x R$ {item.preco.toFixed(2)}
                    </div>
                  </div>
                  <span className="font-bold text-green-600">
                    R$ {(item.preco * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Total:</span>
                <span className="text-green-600 text-lg">R$ {getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              onClick={generateOrder}
              className="w-full"
              size="lg"
            >
              Gerar QR Code para Pagamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code Generator */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <QRCodeGenerator 
            orderId={currentOrderId}
            amount={getTotalPrice()}
            onClose={handleQRCodeClose}
          />
        </div>
      )}

      {/* Print Simulator */}
      {showPrintSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
