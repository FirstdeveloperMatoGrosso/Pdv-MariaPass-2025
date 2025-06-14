
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScanBarcode, Keyboard } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface SimpleBarcodeInputProps {
  onProductScanned: (product: Product) => void;
}

const SimpleBarcodeInput: React.FC<SimpleBarcodeInputProps> = ({ onProductScanned }) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const lastScanTime = useRef<number>(0);
  const scanBuffer = useRef<string>('');
  
  // Base de produtos disponíveis
  const productDatabase: Product[] = [
    { id: '1', name: 'Suco Natural Laranja', price: 10.00, barcode: '7891234567890' },
    { id: '2', name: 'Pão de Queijo Tradicional', price: 5.00, barcode: '7891234567891' },
    { id: '3', name: 'Sanduíche Natural Frango', price: 15.00, barcode: '7891234567892' },
    { id: '4', name: 'Água Mineral 500ml', price: 3.00, barcode: '7891234567893' },
    { id: '5', name: 'Café Expresso Premium', price: 8.00, barcode: '7891234567894' },
    { id: '6', name: 'Croissant Integral', price: 12.00, barcode: '7891234567895' },
    { id: '7', name: 'Suco Natural Maçã', price: 10.00, barcode: '7891234567896' },
    { id: '8', name: 'Refrigerante Cola 350ml', price: 6.00, barcode: '7891234567897' },
    { id: '9', name: 'Bolo de Chocolate', price: 18.00, barcode: '7891234567898' },
    { id: '10', name: 'Salada de Frutas', price: 14.00, barcode: '7891234567899' },
  ];

  // Scanner automático para leitor com fio
  useEffect(() => {
    let scanTimeout: NodeJS.Timeout;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignora se está digitando no input manual
      if (event.target instanceof HTMLInputElement && event.target.id === 'manual-barcode-input') return;
      
      const currentTime = Date.now();
      
      if (event.key === 'Enter') {
        if (scanBuffer.current.length > 5) {
          if (currentTime - lastScanTime.current > 300) {
            processBarcodeInput(scanBuffer.current);
            lastScanTime.current = currentTime;
          }
        }
        scanBuffer.current = '';
        setIsScanning(false);
      } else if (event.key.length === 1 && /[0-9]/.test(event.key)) {
        scanBuffer.current += event.key;
        setIsScanning(true);
        
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          if (scanBuffer.current.length > 5) {
            if (currentTime - lastScanTime.current > 300) {
              processBarcodeInput(scanBuffer.current);
              lastScanTime.current = currentTime;
            }
          }
          scanBuffer.current = '';
          setIsScanning(false);
        }, 300);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(scanTimeout);
    };
  }, []);

  const processBarcodeInput = (barcode: string) => {
    const product = productDatabase.find(p => p.barcode === barcode);
    
    if (product) {
      onProductScanned(product);
    }
  };

  const handleManualInput = () => {
    if (manualCode.trim().length >= 6) {
      processBarcodeInput(manualCode.trim());
      setManualCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualInput();
    }
  };

  return (
    <div className="space-y-4">
      {/* Indicador de escaneamento */}
      {isScanning && (
        <div className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Escaneando código de barras...</span>
        </div>
      )}

      {/* Input manual */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          <Keyboard className="w-4 h-4" />
          <span>Digite o código de barras manualmente:</span>
        </label>
        <div className="flex space-x-2">
          <Input
            id="manual-barcode-input"
            type="text"
            placeholder="Digite o código (mín. 6 dígitos)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={handleKeyPress}
            className="flex-1"
            maxLength={20}
          />
          <Button 
            onClick={handleManualInput} 
            variant="outline"
            disabled={manualCode.length < 6}
          >
            <ScanBarcode className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <p><strong>Leitor automático:</strong> Aponte o leitor para o código de barras do produto</p>
        <p><strong>Digite manual:</strong> Insira o código e pressione Enter ou clique no botão</p>
      </div>
    </div>
  );
};

export default SimpleBarcodeInput;
