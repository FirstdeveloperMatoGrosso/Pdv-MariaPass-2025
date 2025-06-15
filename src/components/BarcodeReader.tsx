
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Scan,
  Camera,
  Keyboard,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeReaderProps {
  onCodeRead: (code: string) => void;
  placeholder?: string;
  title?: string;
}

const BarcodeReader: React.FC<BarcodeReaderProps> = ({ 
  onCodeRead, 
  placeholder = "Código da pulseira",
  title = "Leitura de Pulseira"
}) => {
  const [inputMethod, setInputMethod] = useState<'manual' | 'camera' | 'scanner'>('manual');
  const [code, setCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleManualInput = () => {
    if (code.trim()) {
      onCodeRead(code.trim());
      setCode('');
      toast.success('Código lido com sucesso!');
    } else {
      toast.error('Digite um código válido');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualInput();
    }
  };

  const simulateBarcodeScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const simulatedCode = `PUL${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      setCode(simulatedCode);
      onCodeRead(simulatedCode);
      setIsScanning(false);
      toast.success('Código escaneado com sucesso!');
    }, 2000);
  };

  const connectScanner = () => {
    setIsConnected(!isConnected);
    toast.success(isConnected ? 'Scanner desconectado' : 'Scanner conectado');
  };

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-blue-600" />
            <span>{title}</span>
          </div>
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className="flex items-center space-x-1"
          >
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-3">
          {/* Métodos de entrada */}
          <div className="flex gap-2">
            <Button
              variant={inputMethod === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMethod('manual')}
              className="flex-1"
            >
              <Keyboard className="w-4 h-4 mr-1" />
              Manual
            </Button>
            <Button
              variant={inputMethod === 'camera' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMethod('camera')}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-1" />
              Câmera
            </Button>
            <Button
              variant={inputMethod === 'scanner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMethod('scanner')}
              className="flex-1"
            >
              <Scan className="w-4 h-4 mr-1" />
              Scanner
            </Button>
          </div>

          {/* Entrada manual */}
          {inputMethod === 'manual' && (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleManualInput}>
                <CheckCircle className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Scanner por câmera */}
          {inputMethod === 'camera' && (
            <div className="text-center space-y-2">
              <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Posicione o código na câmera</p>
                </div>
              </div>
              <Button onClick={simulateBarcodeScan} disabled={isScanning} className="w-full">
                {isScanning ? 'Escaneando...' : 'Iniciar Scanner'}
              </Button>
            </div>
          )}

          {/* Scanner com fio/sem fio */}
          {inputMethod === 'scanner' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">Status do Scanner:</span>
                <Button size="sm" variant="outline" onClick={connectScanner}>
                  {isConnected ? 'Desconectar' : 'Conectar'}
                </Button>
              </div>
              
              {isConnected ? (
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700">Scanner pronto. Aponte para o código.</p>
                </div>
              ) : (
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-700">Conecte o scanner para começar a leitura.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeReader;
