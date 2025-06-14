import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, QrCode, Printer, Coffee, Cookie, Sandwich } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import PrintSimulator from '@/components/PrintSimulator';
import BarcodeScanner from '@/components/BarcodeScanner';

interface Product {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [orderId, setOrderId] = useState('');

  const products: Product[] = [
    { id: '1', name: 'Suco Natural', price: 10.00, icon: <Coffee className="w-8 h-8" />, category: 'Bebidas' },
    { id: '2', name: 'Pão de Queijo', price: 5.00, icon: <Cookie className="w-8 h-8" />, category: 'Lanches' },
    { id: '3', name: 'Sanduíche Natural', price: 15.00, icon: <Sandwich className="w-8 h-8" />, category: 'Lanches' },
    { id: '4', name: 'Água Mineral', price: 3.00, icon: <Coffee className="w-8 h-8" />, category: 'Bebidas' },
    { id: '5', name: 'Café Expresso', price: 8.00, icon: <Coffee className="w-8 h-8" />, category: 'Bebidas' },
    { id: '6', name: 'Croissant', price: 12.00, icon: <Cookie className="w-8 h-8" />, category: 'Lanches' },
  ];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleProductScanned = (scannedProduct: any) => {
    // Converte produto escaneado para o formato esperado
    const product: Product = {
      id: scannedProduct.id,
      name: scannedProduct.name,
      price: scannedProduct.price,
      icon: <Coffee className="w-8 h-8" />,
      category: 'Escaneado'
    };
    addToCart(product);
  };

  const handleGenerateQR = () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho primeiro!');
      return;
    }
    
    const newOrderId = Math.random().toString(36).substr(2, 9).toUpperCase();
    setOrderId(newOrderId);
    setShowQR(true);
    toast.success('QR Code gerado! Aguardando pagamento...');
    
    // Simula detecção de pagamento após 5 segundos
    setTimeout(() => {
      setShowQR(false);
      setShowPrint(true);
      toast.success('Pagamento confirmado! Imprimindo ficha...');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">MariaPass Totem</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <ShoppingCart className="w-8 h-8" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {getTotalItems()}
                </Badge>
              )}
            </div>
            <span className="text-xl font-semibold">
              R$ {getTotalPrice().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Barcode Scanner */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Scanner de Produtos</h2>
              <BarcodeScanner onProductScanned={handleProductScanned} />
            </div>

            {/* Manual Product Selection */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Seleção Manual de Produtos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map(product => (
                  <Card key={product.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg text-blue-600">
                            {product.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {cart.find(item => item.id === product.id) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(product.id)}
                                className="w-8 h-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="mx-2 font-semibold">
                                {cart.find(item => item.id === product.id)?.quantity || 0}
                              </span>
                            </>
                          )}
                          <Button
                            onClick={() => addToCart(product)}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Cart and Actions */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Resumo do Pedido</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Carrinho vazio</p>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                        </div>
                        <span className="font-semibold">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">R$ {getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
                
                <Button
                  onClick={handleGenerateQR}
                  disabled={cart.length === 0}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  size="lg"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Gerar QR Code
                </Button>
              </CardContent>
            </Card>

            {/* QR Code Display */}
            {showQR && (
              <QRCodeGenerator 
                orderId={orderId}
                amount={getTotalPrice()}
                onClose={() => setShowQR(false)}
              />
            )}

            {/* Print Simulator */}
            {showPrint && (
              <PrintSimulator 
                orderId={orderId}
                cart={cart}
                total={getTotalPrice()}
                onClose={() => {
                  setShowPrint(false);
                  setCart([]);
                  setOrderId('');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
