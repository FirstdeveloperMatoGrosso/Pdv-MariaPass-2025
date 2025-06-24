import React, { useState, useEffect } from 'react';
import { Copy, Check, QrCode, Barcode as BarcodeIcon, Info, Clock, CreditCard, Hash, Package, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';

interface SaleDetailsProps {
  saleId: string;
  productId: string;
  productName: string;
  paymentMethod: string;
  nsu: string;
  hash: string;
  barcode: string;
  total: number;
  date: string;
  quantity: number;
  unitPrice: number;
}

const SaleDetails: React.FC<SaleDetailsProps> = ({
  saleId,
  productId,
  productName,
  paymentMethod,
  nsu,
  hash,
  barcode,
  total,
  date,
  quantity,
  unitPrice,
}) => {
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});
  
  // Formatar a data para exibição
  const formattedDate = new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [field]: true }));
    toast.success('Copiado para a área de transferência');
    
    // Resetar o estado de copiado após 2 segundos
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  // Dados para o QR Code
  const qrCodeValue = JSON.stringify({
    id: saleId,
    productId,
    productName,
    paymentMethod,
    nsu,
    hash,
    barcode,
    total,
    date: formattedDate,
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Info className="w-4 h-4 mr-2" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="verification">
            <QrCode className="w-4 h-4 mr-2" />
            Verificação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Informações da Venda */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Informações da Venda</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Concluída
                </Badge>
              </div>
              <CardDescription className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {formattedDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">ID da Venda</span>
                  <div className="flex items-center">
                    <code className="font-mono text-sm">{saleId}</code>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(saleId, 'saleId')}
                          >
                            {copied['saleId'] ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar ID</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Produto</span>
                  <span className="text-sm font-medium">{productName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Quantidade</span>
                  <span className="text-sm font-medium">{quantity} un.</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Valor Unitário</span>
                  <span className="text-sm font-medium">{formatCurrency(unitPrice)}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagamento
                  </span>
                  <span className="text-sm font-medium">{paymentMethod}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 flex items-center">
                    <Hash className="w-4 h-4 mr-2" />
                    NSU
                  </span>
                  <div className="flex items-center">
                    <code className="font-mono text-sm">{nsu}</code>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(nsu, 'nsu')}
                          >
                            {copied['nsu'] ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar NSU</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Código do Produto
                  </span>
                  <div className="flex items-center">
                    <code className="font-mono text-sm">{productId}</code>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(productId, 'productId')}
                          >
                            {copied['productId'] ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar Código</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          {/* Códigos de Validação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Códigos de Validação
              </CardTitle>
              <CardDescription className="text-sm">
                Utilize estes códigos para verificação e identificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded border flex items-center justify-center mb-2" style={{ width: '120px', height: '120px' }}>
                    <QRCode 
                      value={qrCodeValue}
                      size={100}
                      level="H"
                      style={{ 
                        height: 'auto',
                        maxWidth: '100%',
                        width: '100%',
                        padding: '4px'
                      }}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(qrCodeValue, 'qrCode')}
                    className="flex items-center mt-2"
                  >
                    {copied['qrCode'] ? (
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copiar QR Code
                  </Button>
                </div>

                {/* Código de Barras */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded border flex items-center justify-center">
                    <div className="mb 1">
                      <Barcode
                        value={barcode || productId}
                        format="EAN13"
                        width={1.2}
                        height={40}
                        displayValue={false}
                        margin={0}
                        background="transparent"
                        lineColor="#000"
                      />
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <code className="font-mono text-xs break-all">{barcode || productId}</code>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 flex items-center"
                    onClick={() => copyToClipboard(barcode || productId, 'barcode')}
                  >
                    {copied['barcode'] ? (
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copiar Código
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hash de Verificação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Hash de Verificação
              </CardTitle>
              <CardDescription className="text-sm">
                Utilize este código para verificar a autenticidade da transação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm break-all mb-4">
                {hash}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center"
                onClick={() => copyToClipboard(hash, 'hash')}
              >
                {copied['hash'] ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copiar Hash de Verificação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaleDetails;
