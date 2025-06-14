
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Wifi, WifiOff, Volume2, CheckCircle, AlertCircle, History } from 'lucide-react';
import { toast } from 'sonner';
import ScannerConfig from './ScannerConfig';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface BarcodeScannerProps {
  onProductScanned: (product: Product) => void;
}

interface ScanHistory {
  barcode: string;
  timestamp: Date;
  success: boolean;
  productName?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onProductScanned }) => {
  const [manualCode, setManualCode] = useState('');
  const [isWirelessConnected, setIsWirelessConnected] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const lastScanTime = useRef<number>(0);
  const scanBuffer = useRef<string>('');
  
  const [config, setConfig] = useState({
    autoScan: true,
    soundEnabled: true,
    scanDelay: 300,
    duplicateFilter: true
  });

  // Base de dados de produtos expandida
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

  // Scanner com fio melhorado com buffer
  useEffect(() => {
    let scanTimeout: NodeJS.Timeout;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement && event.target.id === 'manual-barcode') return;
      
      const currentTime = Date.now();
      
      if (event.key === 'Enter') {
        if (scanBuffer.current.length > 5) {
          if (!config.duplicateFilter || currentTime - lastScanTime.current > config.scanDelay) {
            processBarcodeInput(scanBuffer.current, 'Leitor com Fio');
            lastScanTime.current = currentTime;
          }
        }
        scanBuffer.current = '';
      } else if (event.key.length === 1 && /[0-9]/.test(event.key)) {
        scanBuffer.current += event.key;
        setIsScanning(true);
        
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          if (scanBuffer.current.length > 5) {
            if (!config.duplicateFilter || currentTime - lastScanTime.current > config.scanDelay) {
              processBarcodeInput(scanBuffer.current, 'Leitor com Fio');
              lastScanTime.current = currentTime;
            }
          }
          scanBuffer.current = '';
          setIsScanning(false);
        }, config.scanDelay);
      }
    };

    if (config.autoScan) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(scanTimeout);
    };
  }, [config]);

  // Scanner sem fio simulado
  useEffect(() => {
    if (isWirelessConnected && config.autoScan) {
      const interval = setInterval(() => {
        if (Math.random() > 0.985) {
          const randomProduct = productDatabase[Math.floor(Math.random() * productDatabase.length)];
          processBarcodeInput(randomProduct.barcode, 'Scanner Bluetooth');
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isWirelessConnected, config.autoScan]);

  const processBarcodeInput = (barcode: string, source: string) => {
    setLastScannedCode(barcode);
    setIsScanning(false);
    
    const product = productDatabase.find(p => p.barcode === barcode);
    const scanRecord: ScanHistory = {
      barcode,
      timestamp: new Date(),
      success: !!product,
      productName: product?.name
    };
    
    setScanHistory(prev => [scanRecord, ...prev.slice(0, 4)]);
    
    if (product) {
      if (config.soundEnabled) playBeep(800, 150);
      onProductScanned(product);
      toast.success(`✅ ${product.name} - ${source}`, {
        description: `R$ ${product.price.toFixed(2)} adicionado ao carrinho`
      });
    } else {
      if (config.soundEnabled) playBeep(300, 300);
      toast.error(`❌ Produto não encontrado - ${source}`, {
        description: `Código: ${barcode}`
      });
    }
  };

  const playBeep = (frequency: number, duration: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('Audio não disponível');
    }
  };

  const handleManualInput = () => {
    if (manualCode.trim().length >= 6) {
      processBarcodeInput(manualCode.trim(), 'Entrada Manual');
      setManualCode('');
    } else {
      toast.error('Código de barras deve ter pelo menos 6 dígitos');
    }
  };

  const toggleWirelessConnection = () => {
    setIsWirelessConnected(!isWirelessConnected);
    if (!isWirelessConnected) {
      toast.success('📡 Scanner Bluetooth conectado');
    } else {
      toast.info('📡 Scanner Bluetooth desconectado');
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    toast.info('Histórico limpo');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ScanBarcode className="w-5 h-5 text-green-600" />
              <span>Scanner de Código de Barras</span>
            </div>
            {isScanning && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Escaneando...</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Status dos Scanners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center space-x-2 p-4 rounded-lg transition-colors ${
              config.autoScan ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                config.autoScan ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">Scanner com Fio</span>
              <span className="text-xs text-gray-500">
                {config.autoScan ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            <div className={`flex items-center space-x-2 p-4 rounded-lg transition-colors ${
              isWirelessConnected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                isWirelessConnected ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">Scanner Bluetooth</span>
              <span className="text-xs text-gray-500">
                {isWirelessConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-4">
            <Button
              onClick={toggleWirelessConnection}
              variant={isWirelessConnected ? "destructive" : "default"}
              className="w-full"
              size="lg"
            >
              {isWirelessConnected ? <WifiOff className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
              {isWirelessConnected ? 'Desconectar Scanner Bluetooth' : 'Conectar Scanner Bluetooth'}
            </Button>

            <div className="flex space-x-2">
              <Input
                id="manual-barcode"
                type="text"
                placeholder="Digite código de barras (mín. 6 dígitos)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
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

          {/* Último código escaneado */}
          {lastScannedCode && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Último código: {lastScannedCode}
                  </span>
                </div>
                <span className="text-xs text-blue-600">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* Histórico de escaneamentos */}
          {scanHistory.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <History className="w-4 h-4" />
                  <span>Últimos Escaneamentos</span>
                </h4>
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Limpar
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {scanHistory.map((scan, index) => (
                  <div key={index} className={`flex items-center justify-between p-2 rounded text-xs ${
                    scan.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {scan.success ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span className="font-mono">{scan.barcode}</span>
                      {scan.productName && (
                        <span className="text-gray-600">- {scan.productName}</span>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações do Scanner */}
      <ScannerConfig config={config} onConfigChange={setConfig} />
    </div>
  );
};

export default BarcodeScanner;
