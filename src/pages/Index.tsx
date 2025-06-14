
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeGenerator from '../components/QRCodeGenerator';
import PrintSimulator from '../components/PrintSimulator';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface CartItem extends Product {
  quantity: number;
}

const Index: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPrintSimulator, setShowPrintSimulator] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');

  // Base de produtos disponíveis
  const products: Product[] = [
    { id: '1', name: 'Suco Natural Laranja', price: 10.00, barcode: '7891234567890' },
    { id: '2', name: 'Pão de Queijo Tradicional', price: 5.00, barcode: '7891234567891' },
    { id: '3', name: 'Sanduíche Natural Frango', price: 15.00, barcode: '7891234567892' },
    { id: '4', name: 'Água Mineral 500ml', price: 3.00, barcode: '7891234567893' },
    { id: '5', name: 'Café Expresso Premium', price: 8.00, barcode: '7891234567894' },
    { id: '6', name: 'Croissant Integral', price: 12.00, barcode: '7891234567895' },
  ];

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    
    toast.success(`${product.name} adicionado ao carrinho!`);
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
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
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

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-600 mb-2">MariaPass Totem</h1>
        <p className="text-gray-600">Selecione seus produtos e faça o pagamento via QR Code</p>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const cartItem = cart.find(item => item.id === product.id);
          const quantity = cartItem?.quantity || 0;

          return (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-xl font-bold text-green-600">
                  R$ {product.price.toFixed(2)}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Button 
                    onClick={() => addToCart(product)}
                    className="flex-1 mr-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                  
                  {quantity > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeFromCart(product.id)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Badge variant="secondary">{quantity}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {quantity > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-red-500"
                  variant="destructive"
                >
                  {quantity}
                </Badge>
              )}
            </Card>
          );
        })}
      </div>

      {/* Carrinho Flutuante */}
      {cart.length > 0 && (
        <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-green-500">
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
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span>{item.name}</span>
                <div className="flex items-center space-x-2">
                  <span>{item.quantity}x</span>
                  <span className="font-bold">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Total:</span>
                <span className="text-green-600">R$ {getTotalPrice().toFixed(2)}</span>
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
