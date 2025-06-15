
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Check, X, FileText, Package } from 'lucide-react';

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  quantity: number;
}

interface PrintSimulatorProps {
  orderId: string;
  cart: CartItem[];
  total: number;
  onClose: () => void;
}

const PrintSimulator: React.FC<PrintSimulatorProps> = ({ orderId, cart, total, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printComplete, setPrintComplete] = useState(false);
  const [printMode, setPrintMode] = useState<'consolidated' | 'individual' | null>(null);
  const [currentPrintingItem, setCurrentPrintingItem] = useState<number>(0);

  useEffect(() => {
    if (isPrinting && printMode) {
      const totalItems = printMode === 'individual' ? cart.length : 1;
      const timer = setTimeout(() => {
        if (currentPrintingItem < totalItems - 1) {
          setCurrentPrintingItem(prev => prev + 1);
        } else {
          setIsPrinting(false);
          setPrintComplete(true);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPrinting, printMode, currentPrintingItem, cart.length]);

  const handlePrintMode = (mode: 'consolidated' | 'individual') => {
    setPrintMode(mode);
    setIsPrinting(true);
    setCurrentPrintingItem(0);
  };

  const currentDate = new Date().toLocaleString('pt-BR');

  const renderIndividualFicha = (item: CartItem, index: number) => (
    <div key={item.id} className="bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-lg font-mono text-sm mb-4">
      <div className="text-center space-y-2 border-b border-gray-300 pb-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-xl">
          MP
        </div>
        <h3 className="font-bold text-lg">MARIAPASS</h3>
        <p className="text-xs text-gray-600">Ficha Individual de Produto</p>
      </div>
      
      <div className="space-y-1">
        <p><strong>Ficha:</strong> #{orderId}-{index + 1}</p>
        <p><strong>Data:</strong> {currentDate}</p>
        <hr className="my-2 border-gray-400" />
        
        <div className="text-center py-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-bold text-lg">{item.nome}</p>
            <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
            <p className="font-semibold text-green-600">R$ {(item.preco * item.quantity).toFixed(2)}</p>
          </div>
        </div>
        
        <div className="text-center mt-4 pt-2 border-t border-gray-300">
          <p className="text-xs">Obrigado pela preferência!</p>
          <p className="text-xs">Retire este item no balcão</p>
        </div>
      </div>
    </div>
  );

  const renderConsolidatedFicha = () => (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-lg font-mono text-sm">
      <div className="text-center space-y-2 border-b border-gray-300 pb-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-xl">
          MP
        </div>
        <h3 className="font-bold text-lg">MARIAPASS</h3>
        <p className="text-xs text-gray-600">Sistema de Pedidos</p>
      </div>
      
      <div className="space-y-1">
        <p><strong>Ficha:</strong> #{orderId}</p>
        <p><strong>Data:</strong> {currentDate}</p>
        <hr className="my-2 border-gray-400" />
        
        {cart.map(item => (
          <div key={item.id} className="flex justify-between">
            <span>{item.quantity}x {item.nome}</span>
            <span>R$ {(item.preco * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        
        <hr className="my-2 border-gray-400" />
        <div className="flex justify-between font-bold">
          <span>TOTAL:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        
        <div className="text-center mt-4 pt-2 border-t border-gray-300">
          <p className="text-xs">Obrigado pela preferência!</p>
          <p className="text-xs">Retire seu pedido no balcão</p>
        </div>
      </div>
    </div>
  );

  if (!printMode) {
    return (
      <Card className="bg-white shadow-xl border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-green-600" />
              <span>Modo de Impressão</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-center text-gray-600 mb-6">
              Escolha como deseja imprimir as fichas dos produtos:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => handlePrintMode('consolidated')}
                className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-500 hover:bg-blue-600"
              >
                <FileText className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Ficha Consolidada</div>
                  <div className="text-xs opacity-90">Todos os produtos em uma ficha</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => handlePrintMode('individual')}
                className="h-24 flex flex-col items-center justify-center space-y-2 bg-green-500 hover:bg-green-600"
              >
                <Package className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Fichas Individuais</div>
                  <div className="text-xs opacity-90">Uma ficha para cada produto</div>
                </div>
              </Button>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-600">
              <p><strong>Resumo do pedido:</strong></p>
              <p>• {cart.length} produtos diferentes</p>
              <p>• Total de itens: {cart.reduce((acc, item) => acc + item.quantity, 0)}</p>
              <p>• Valor total: R$ {total.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-xl border-2 border-green-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-green-600" />
            <span>Impressão das Fichas</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isPrinting ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Printer className="w-8 h-8 animate-pulse text-green-600" />
              <span className="text-lg">
                {printMode === 'individual' 
                  ? `Imprimindo ficha ${currentPrintingItem + 1} de ${cart.length}...`
                  : 'Imprimindo ficha consolidada...'
                }
              </span>
            </div>
            
            {printMode === 'individual' && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-blue-800">
                  {cart[currentPrintingItem]?.nome}
                </p>
                <p className="text-sm text-blue-600">
                  Quantidade: {cart[currentPrintingItem]?.quantity}
                </p>
              </div>
            )}
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: printMode === 'individual' 
                    ? `${((currentPrintingItem + 1) / cart.length) * 100}%`
                    : '66%'
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {printComplete && (
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                <Check className="w-6 h-6" />
                <span className="font-semibold">
                  {printMode === 'individual' 
                    ? `${cart.length} fichas impressas com sucesso!`
                    : 'Ficha consolidada impressa com sucesso!'
                  }
                </span>
              </div>
            )}
            
            {/* Simulação das fichas impressas */}
            <div className="max-h-96 overflow-y-auto space-y-4">
              {printMode === 'individual' 
                ? cart.map((item, index) => renderIndividualFicha(item, index))
                : renderConsolidatedFicha()
              }
            </div>

            <Button 
              onClick={onClose} 
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              Novo Pedido
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrintSimulator;
