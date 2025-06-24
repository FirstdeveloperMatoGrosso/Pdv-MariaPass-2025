
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScanBarcode, Keyboard, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { TotemProduct } from '@/types';

// Interface para o produto de exemplo (usado apenas para demonstração)
interface DemoProduct {
  id: string;
  nome: string;
  preco: number;
  codigo_barras: string;
  categoria: string;
  estoque: number;
  status: string;
}

interface SimpleBarcodeInputProps {
  onProductScanned: (product: TotemProduct) => void;
}

const SimpleBarcodeInput: React.FC<SimpleBarcodeInputProps> = ({ onProductScanned }) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const lastScanTime = useRef<number>(0);
  const scanBuffer = useRef<string>('');
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Base de produtos de exemplo (apenas para demonstração)
  const productDatabase: DemoProduct[] = [
    { 
      id: '1', 
      nome: 'Suco Natural Laranja', 
      preco: 10.00, 
      codigo_barras: '7891234567890',
      categoria: 'Bebidas',
      estoque: 100,
      status: 'ativo'
    },
    { 
      id: '2', 
      nome: 'Pão de Queijo Tradicional', 
      preco: 5.00, 
      codigo_barras: '7891234567891',
      categoria: 'Salgados',
      estoque: 50,
      status: 'ativo'
    },
    // Adicione mais produtos de exemplo conforme necessário
  ];

  // Efeito para limpar o status após um tempo
  useEffect(() => {
    if (scanStatus === 'success' || scanStatus === 'error') {
      const timer = setTimeout(() => {
        setScanStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scanStatus]);

  // Scanner automático para leitor com fio
  useEffect(() => {
    let scanTimeout: NodeJS.Timeout;
    let processing = false;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignora se está digitando no input manual
      if (event.target instanceof HTMLInputElement && event.target.id === 'manual-barcode-input') {
        return;
      }
      
      const currentTime = Date.now();
      
      // Reseta o status quando começa uma nova leitura
      if (event.key.length === 1 && /[0-9]/.test(event.key)) {
        if (scanBuffer.current === '') {
          setScanStatus('scanning');
        }
        scanBuffer.current += event.key;
        setIsScanning(true);
        
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          if (scanBuffer.current.length >= 6 && !processing) {
            if (currentTime - lastScanTime.current > 300) {
              processing = true;
              processBarcodeInput(scanBuffer.current);
              lastScanTime.current = currentTime;
            }
          } else if (scanBuffer.current.length > 0) {
            // Código muito curto
            setScanStatus('error');
            toast({
              title: 'Código inválido',
              description: 'O código de barras deve ter pelo menos 6 dígitos',
              variant: 'destructive',
            });
            scanBuffer.current = '';
          }
          setIsScanning(false);
          processing = false;
        }, 300);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(scanTimeout);
    };
  }, [toast]);

  const processBarcodeInput = useCallback(async (barcode: string) => {
    try {
      // Simula uma busca assíncrona
      const product = productDatabase.find(p => p.codigo_barras === barcode);
      
      if (product) {
        setScanStatus('success');
        
        // Converte o produto de exemplo para o formato TotemProduct
        const totemProduct: TotemProduct = {
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        onProductScanned(totemProduct);
        
        // Mantém o buffer por um curto período para permitir processamento
        setTimeout(() => {
          scanBuffer.current = '';
        }, 1000);
      } else {
        setScanStatus('error');
        toast({
          title: 'Produto não encontrado',
          description: `Nenhum produto encontrado com o código: ${barcode}`,
          variant: 'destructive',
        });
        scanBuffer.current = '';
      }
    } catch (error) {
      console.error('Erro ao processar código de barras:', error);
      setScanStatus('error');
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar o código de barras',
        variant: 'destructive',
      });
      scanBuffer.current = '';
    }
  }, [productDatabase, onProductScanned, toast]);

  const handleManualInput = async () => {
    const code = manualCode.trim();
    if (code.length >= 6) {
      setScanStatus('scanning');
      await processBarcodeInput(code);
      setManualCode('');
      // Foca no input novamente para próxima leitura
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      setScanStatus('error');
      toast({
        title: 'Código inválido',
        description: 'O código deve ter pelo menos 6 dígitos',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualInput();
    }
  };

  const getStatusClass = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'border-blue-500 bg-blue-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning':
        return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Keyboard className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'Processando código...';
      case 'success':
        return 'Código lido com sucesso!';
      case 'error':
        return 'Erro ao ler código';
      default:
        return 'Pronto para leitura';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status do scanner */}
      <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${getStatusClass()} transition-colors duration-300`}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        <div className="text-xs text-gray-500">
          {scanBuffer.current ? `Código: ${scanBuffer.current}` : 'Aguardando...'}
        </div>
      </div>

      {/* Input manual */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          <Keyboard className="w-4 h-4" />
          <span>Digite o código de barras manualmente:</span>
        </label>
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            id="manual-barcode-input"
            type="text"
            inputMode="numeric"
            placeholder="Digite o código (mín. 6 dígitos)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
            className="flex-1"
            maxLength={20}
            autoFocus
          />
          <Button 
            onClick={handleManualInput} 
            variant="outline"
            disabled={manualCode.length < 6}
            className="shrink-0"
          >
            <ScanBarcode className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border">
        <div className="space-y-1">
          <p className="flex items-start">
            <span className="inline-block w-5 text-gray-500">1.</span>
            <span>Aponte o leitor para o código de barras do produto</span>
          </p>
          <p className="flex items-start">
            <span className="inline-block w-5 text-gray-500">2.</span>
            <span>Ou digite o código manualmente no campo acima</span>
          </p>
          <p className="flex items-start">
            <span className="inline-block w-5 text-gray-500">3.</span>
            <span>O produto será adicionado automaticamente</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleBarcodeInput;
