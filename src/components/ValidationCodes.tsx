import React from 'react';
import Barcode from 'react-barcode';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Componente de fallback para o QRCode
const QRCodeFallback = () => (
  <div className="w-[120px] h-[120px] bg-gray-200 animate-pulse rounded" />
);

// Componente de QRCode que só é carregado no cliente
const DynamicQRCode = React.memo(({ value, size = 120 }: { value: string; size?: number }) => {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <QRCodeFallback />;
  }
  
  const QRCode = React.lazy(() => import('react-qr-code'));
  
  return (
    <React.Suspense fallback={<QRCodeFallback />}>
      <QRCode 
        value={value}
        size={size}
        level="H"
        style={{ 
          height: 'auto', 
          maxWidth: '100%', 
          width: '100%',
          backgroundColor: 'white',
          padding: '8px',
        }}
        viewBox={`0 0 ${size} ${size}`}
      />
    </React.Suspense>
  );
});

DynamicQRCode.displayName = 'DynamicQRCode';

export interface ValidationCodesProps {
  /** ID da venda */
  saleId: string;
  /** ID do produto */
  productId: string;
  /** Nome do produto */
  productName: string;
  /** Preço unitário do produto */
  unitPrice: number;
  /** Quantidade do produto */
  quantity: number;
  /** Forma de pagamento */
  paymentMethod: string;
  /** Número Sequencial Único (NSU) */
  nsu: string;
  /** Hash de validação */
  hash: string;
  /** Código de barras EAN-13 */
  barcode: string;
  /** Data e hora da venda */
  date: string;
  /** Título da seção */
  title?: string;
  /** Se verdadeiro, exibe informações adicionais de depuração */
  debug?: boolean;
  /** Classe CSS personalizada para o container */
  className?: string;
}

/**
 * Componente para exibição padronizada de códigos de validação (QR Code e Código de Barras)
 * seguindo as normas da ABNT e boas práticas de UX.
 */
const ValidationCodes: React.FC<ValidationCodesProps> = ({
  saleId,
  productId,
  productName,
  unitPrice,
  quantity,
  paymentMethod,
  nsu,
  hash,
  barcode,
  date,
  title = 'Comprovante de Validação',
  debug = false,
  className = '',
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  // Formata a data para exibição
  const formattedDate = React.useMemo(() => {
    try {
      return new Date(date).toLocaleString('pt-BR');
    } catch (error) {
      return date;
    }
  }, [date]);

  // Calcula o valor total
  const total = React.useMemo(
    () => (unitPrice * quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    [unitPrice, quantity]
  );

  // Gera o valor para o QR Code
  const qrCodeValue = React.useMemo(
    () =>
      JSON.stringify(
        {
          id: saleId,
          productId,
          productName,
          unitPrice,
          quantity,
          total: unitPrice * quantity,
          paymentMethod,
          nsu,
          hash,
          barcode,
          date: formattedDate,
        },
        null,
        2
      ),
    [saleId, productId, productName, unitPrice, quantity, paymentMethod, nsu, hash, barcode, formattedDate]
  );

  // Função para copiar o código de barras
  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcode);
    setCopied(true);
    toast({
      title: 'Código copiado!',
      description: 'O código de barras foi copiado para a área de transferência.',
      duration: 2000,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  // Função para copiar o hash de validação
  const handleCopyHash = () => {
    navigator.clipboard.writeText(hash);
    toast({
      title: 'Hash copiado!',
      description: 'O hash de validação foi copiado para a área de transferência.',
      duration: 2000,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-center">{title}</h3>}
      
      {/* Informações da Venda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Informações do Produto</span>
            <Badge variant="outline" className="text-xs">
              {saleId}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Produto:</span>
            <span className="font-medium text-right">{productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ID do Produto:</span>
            <span className="font-mono">{productId || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Quantidade:</span>
            <span className="font-medium">{quantity}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Preço Unitário:</span>
            <span className="font-medium">
              {unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1 mt-1">
            <span>Total:</span>
            <span className="text-green-600">{total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Forma de Pagamento:</span>
            <span className="font-medium">{paymentMethod || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">NSU:</span>
            <span className="font-mono">{nsu || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data/Hora:</span>
            <span className="text-right">{formattedDate || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* QR Code de Validação */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">QR Code de Validação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-3 rounded border flex items-center justify-center mb-2">
            <DynamicQRCode value={qrCodeValue} size={160} />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Hash de Validação:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs p-1 text-blue-600 hover:text-blue-800"
                onClick={handleCopyHash}
              >
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
              {hash || 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Código de Barras EAN-13 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex justify-between items-center">
            <span>Código de Barras EAN-13</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-blue-600 hover:text-blue-800"
              onClick={handleCopyBarcode}
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-3 rounded border w-full flex justify-center">
            <Barcode
              value={barcode || saleId}
              format="EAN13"
              width={1.5}
              height={60}
              margin={0}
              displayValue={false}
              background="transparent"
              lineColor="#000"
            />
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs font-mono break-all">{barcode || saleId}</p>
            <p className="text-[10px] text-gray-500 mt-1">Escaneie o código para validação</p>
          </div>
        </CardContent>
      </Card>

      {/* Seção de depuração - visível apenas quando debug=true */}
      {debug && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Dados de Depuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-white p-2 rounded border border-yellow-200 overflow-x-auto">
              {JSON.stringify(
                {
                  saleId,
                  productId,
                  productName,
                  unitPrice,
                  quantity,
                  total: unitPrice * quantity,
                  paymentMethod,
                  nsu,
                  hash,
                  barcode,
                  date: formattedDate,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default React.memo(ValidationCodes);
