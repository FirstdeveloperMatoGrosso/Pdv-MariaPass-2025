
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Wifi, WifiOff, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface BarcodeScannerProps {
  onProductScanned: (product: Product) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onProductScanned }) => {
  const [manualCode, setManualCode] = useState('');
  const [isWirelessConnected, setIsWirelessConnected] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');

  // Simulação de produtos do banco de dados
  const productDatabase: Product[] = [
    { id: '1', name: 'Suco Natural', price: 10.00, barcode: '7891234567890' },
    { id: '2', name: 'Pão de Queijo', price: 5.00, barcode: '7891234567891' },
    { id: '3', name: 'Sanduíche Natural', price: 15.00, barcode: '7891234567892' },
    { id: '4', name: 'Água Mineral', price: 3.00, barcode: '7891234567893' },
    { id: '5', name: 'Café Expresso', price: 8.00, barcode: '7891234567894' },
    { id: '6', name: 'Croissant', price: 12.00, barcode: '7891234567895' },
  ];

  // Simula scanner com fio - escuta eventos de teclado
  useEffect(() => {
    let scannedCode = '';
    let scanTimeout: NodeJS.Timeout;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignora se estiver digitando em um input
      if (event.target instanceof HTMLInputElement) return;

      if (event.key === 'Enter') {
        if (scannedCode.length > 0) {
          processBarcodeInput(scannedCode);
          scannedCode = '';
        }
      } else if (event.key.length === 1) {
        scannedCode += event.key;
        
        // Reset do timeout para detectar fim da leitura
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          if (scannedCode.length > 0) {
            processBarcodeInput(scannedCode);
            scannedCode = '';
          }
        }, 100);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      clearTimeout(scanTimeout);
    };
  }, []);

  // Simula scanner sem fio Bluetooth
  useEffect(() => {
    if (isWirelessConnected) {
      const interval = setInterval(() => {
        // Simula recebimento aleatório de código de barras
        if (Math.random() > 0.98) {
          const randomProduct = productDatabase[Math.floor(Math.random() * productDatabase.length)];
          processBarcodeInput(randomProduct.barcode);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isWirelessConnected]);

  const processBarcodeInput = (barcode: string) => {
    setLastScannedCode(barcode);
    
    // Procura produto no banco de dados
    const product = productDatabase.find(p => p.barcode === barcode);
    
    if (product) {
      // Som de sucesso
      playBeep(800, 100);
      onProductScanned(product);
      toast.success(`Produto escaneado: ${product.name}`);
    } else {
      // Som de erro
      playBeep(300, 200);
      toast.error(`Produto não encontrado para código: ${barcode}`);
    }
  };

  const playBeep = (frequency: number, duration: number) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  };

  const handleManualInput = () => {
    if (manualCode.trim()) {
      processBarcodeInput(manualCode.trim());
      setManualCode('');
    }
  };

  const toggleWirelessConnection = () => {
    setIsWirelessConnected(!isWirelessConnected);
    if (!isWirelessConnected) {
      toast.success('Scanner sem fio conectado');
    } else {
      toast.info('Scanner sem fio desconectado');
    }
  };

  return (
    <Card className="bg-white shadow-lg border-2 border-gray-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardTitle className="flex items-center space-x-2">
          <ScanBarcode className="w-5 h-5 text-green-600" />
          <span>Scanner de Código de Barras</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        
        {/* Status do Scanner */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Scanner com Fio: Ativo</span>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${isWirelessConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              Scanner Sem Fio: {isWirelessConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Controles */}
        <div className="space-y-3">
          <Button
            onClick={toggleWirelessConnection}
            variant={isWirelessConnected ? "destructive" : "default"}
            className="w-full"
          >
            {isWirelessConnected ? <WifiOff className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
            {isWirelessConnected ? 'Desconectar Scanner Sem Fio' : 'Conectar Scanner Sem Fio'}
          </Button>

          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Digite código de barras manualmente"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
              className="flex-1"
            />
            <Button onClick={handleManualInput} variant="outline">
              <ScanBarcode className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Último código escaneado */}
        {lastScannedCode && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Último código: {lastScannedCode}
              </span>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Scanner com fio: Aponte para o código de barras e aguarde o bip</p>
          <p>• Scanner sem fio: Conecte via Bluetooth e escaneie produtos</p>
          <p>• Manual: Digite o código e pressione Enter ou clique no botão</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;
