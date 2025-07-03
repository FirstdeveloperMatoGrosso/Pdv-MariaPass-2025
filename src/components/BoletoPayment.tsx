import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Copy, 
  Clock, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Loader2, 
  ExternalLink,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';
import type { CustomerData, BoletoPaymentResponse } from '@/types/payment';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoletoPaymentProps {
  valor: number;
  recargaId: string;
  customer: CustomerData;
  onPaymentSuccess: (paymentMethod: 'boleto') => void;
  onCancel: () => void;
}

const BoletoPayment: React.FC<BoletoPaymentProps> = ({ 
  valor, 
  recargaId,
  customer,
  onPaymentSuccess, 
  onCancel 
}) => {
  interface BoletoData {
    barcode: string;
    boletoUrl: string;
    pdfUrl: string;
    dueDate: string;
    instructions: string;
    chargeId?: string;
    charge_id?: string;
    orderId?: string;
    order_id?: string;
    transaction_id?: string;
    status?: string;
    amount?: number;
    created_at?: string;
    updated_at?: string;
    paid_at?: string | null;
    error?: {
      message: string;
      code?: string;
      details?: Array<{ message: string; [key: string]: any }>;
      [key: string]: any;
    };
    message?: string;
  }

  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'generating' | 'waiting' | 'expired' | 'paid' | 'error'>('generating');
  const [isLoading, setIsLoading] = useState(false);

  // Função para formatar a data de vencimento
  const formatDueDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data de vencimento:', error);
      return 'Data inválida';
    }
  };

  // Função para copiar o código de barras para a área de transferência
  const copyBarcodeToClipboard = () => {
    if (!boletoData?.barcode) return;
    
    navigator.clipboard.writeText(boletoData.barcode)
      .then(() => {
        toast.success('Código de barras copiado para a área de transferência!');
      })
      .catch((error) => {
        console.error('Erro ao copiar código de barras:', error);
        toast.error('Não foi possível copiar o código de barras');
      });
  };

  // Função para abrir o boleto em uma nova aba
  const openBoletoInNewTab = () => {
    if (!boletoData?.boletoUrl) return;
    
    window.open(boletoData.boletoUrl, '_blank', 'noopener,noreferrer');
  };

  // Função para baixar o boleto em PDF
  const downloadBoletoPdf = () => {
    if (!boletoData?.pdfUrl) {
      toast.error('URL do boleto não disponível para download');
      return;
    }
    
    const link = document.createElement('a');
    link.href = boletoData.pdfUrl;
    link.download = `boleto-${recargaId}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para gerar o boleto
  const generateBoleto = useCallback(async () => {
    setIsLoading(true);
    setStatus('generating');
    
    try {
      // Formata os dados do cliente para o formato esperado pela API
      const formattedCustomer = {
        ...customer,
        // Garante que os campos obrigatórios estejam presentes
        name: customer.name || 'Cliente não identificado',
        email: customer.email || '',
        document: (customer.document || '').replace(/\D/g, ''), // Remove formatação
        document_type: customer.document_type || 'CPF',
        type: customer.type || 'individual',
        phones: customer.phones || {
          mobile_phone: {
            country_code: '55',
            area_code: '11',
            number: '999999999'
          }
        },
        address: {
          line_1: customer.address?.line_1 || 'Rua do Cliente',
          line_2: customer.address?.line_2 || '',
          zip_code: (customer.address?.zip_code || '00000000').replace(/\D/g, ''),
          city: customer.address?.city || 'São Paulo',
          state: customer.address?.state || 'SP',
          country: customer.address?.country || 'BR'
        },
        metadata: {
          ...(customer.metadata || {}),
          recargaId,
          source: 'pdv-mariapass',
          created_at: new Date().toISOString()
        },
        code: customer.code || `CUST_${Date.now()}`
      };

      // Valida os campos obrigatórios
      if (!formattedCustomer.document) {
        throw new Error('CPF/CNPJ do cliente é obrigatório');
      }

      if (!formattedCustomer.email) {
        throw new Error('E-mail do cliente é obrigatório');
      }

      console.log('Dados do cliente formatados:', formattedCustomer);

      // Gera um ID único para o pedido
      const generateOrderId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `ORDER_${timestamp}_${random}`;
      };

      // Define a data de vencimento para 3 dias a partir de agora
      const dueDate = addDays(new Date(), 3).toISOString();

      // Prepara os dados do pagamento com boleto
      const boletoPaymentData = {
        amount: Math.round(valor * 100), // Converte para centavos e arredonda
        customer: formattedCustomer,
        orderCode: generateOrderId(),
        dueDate: dueDate,
        instructions: 'Pagar até a data de vencimento',
        items: [{
          amount: Math.round(valor * 100),
          description: `Venda de Produto #${recargaId}`,
          quantity: 1
        }]
      };

      console.log('Dados do pagamento com boleto:', boletoPaymentData);

      const response = await paymentService.createBoletoPayment(boletoPaymentData) as BoletoPaymentResponse;
      
      console.log('Resposta do pagamento com boleto:', response);

      // Extrai os dados do boleto da resposta
      const extractedBoletoData: BoletoData = {
        barcode: response.barcode,
        boletoUrl: response.boletoUrl || response.boleto_url || '',
        pdfUrl: response.pdfUrl || response.pdf_url || '',
        dueDate: response.dueDate || response.due_date || dueDate,
        instructions: response.instructions || 'Pagar até a data de vencimento',
        chargeId: response.chargeId || response.charge_id,
        orderId: response.orderId || response.order_id,
        transaction_id: response.transaction_id,
        status: response.status,
        amount: response.amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(response.error && { error: response.error }),
        ...(response.message && { message: response.message })
      };

      setBoletoData(extractedBoletoData);
      setStatus('waiting');
      
      // Define o tempo restante para expiração (3 dias a partir de agora)
      const expirationDate = new Date(extractedBoletoData.dueDate);
      const now = new Date();
      const timeDiff = expirationDate.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setStatus('expired');
      } else {
        setTimeLeft(Math.ceil(timeDiff / 1000)); // Converte para segundos
      }
      
      return extractedBoletoData;
      
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error);
      
      const errorMessage = error?.response?.data?.message || 
                         error?.message || 
                         'Erro ao gerar o boleto. Por favor, tente novamente.';
      
      toast.error(errorMessage);
      
      setStatus('error');
      
      // Adiciona os detalhes do erro ao estado para exibição
      setBoletoData({
        barcode: '',
        boletoUrl: '',
        pdfUrl: '',
        dueDate: new Date().toISOString(),
        instructions: '',
        error: {
          message: errorMessage,
          code: error?.response?.data?.code || 'UNKNOWN_ERROR',
          details: error?.response?.data?.errors || []
        }
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [valor, recargaId, customer]);

  // Efeito para gerar o boleto quando o componente for montado
  useEffect(() => {
    generateBoleto();
  }, [generateBoleto]);

  // Efeito para atualizar o contador de tempo restante
  useEffect(() => {
    if (status !== 'waiting') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTimeLeft => {
        if (prevTimeLeft <= 1) {
          clearInterval(timer);
          setStatus('expired');
          return 0;
        }
        return prevTimeLeft - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status]);

  // Função para formatar o tempo restante
  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Renderiza o status atual
  const renderStatus = () => {
    switch (status) {
      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-medium">Gerando boleto...</p>
            <p className="text-sm text-muted-foreground mt-2">Aguarde um momento enquanto preparamos seu boleto.</p>
          </div>
        );
        
      case 'waiting':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Tempo restante para pagamento:</span>
                </div>
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                  {formatTimeLeft(timeLeft)}
                </Badge>
              </div>
              
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Data de vencimento: {formatDueDate(boletoData?.dueDate || '')}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Código de Barras</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyBarcodeToClipboard}
                  disabled={!boletoData?.barcode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm overflow-x-auto">
                {boletoData?.barcode || 'Carregando código de barras...'}
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={openBoletoInNewTab}
                  disabled={!boletoData?.boletoUrl}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visualizar Boleto
                </Button>
                
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={downloadBoletoPdf}
                  disabled={!boletoData?.pdfUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Boleto (PDF)
                </Button>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                Instruções de Pagamento
              </h3>
              <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc pl-5 space-y-1">
                <li>Pague até a data de vencimento</li>
                <li>O pagamento pode levar até 3 dias úteis para ser confirmado</li>
                <li>Após o pagamento, seu pedido será processado automaticamente</li>
              </ul>
            </div>
          </div>
        );
        
      case 'paid':
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Pagamento Aprovado!</h3>
            <p className="text-muted-foreground mb-6">Seu pagamento foi confirmado com sucesso.</p>
            <Button onClick={() => onPaymentSuccess('boleto')}>
              Concluir
            </Button>
          </div>
        );
        
      case 'expired':
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-3 mb-4">
              <Clock className="h-12 w-12 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">Boleto Expirado</h3>
            <p className="text-muted-foreground mb-4">O prazo para pagamento deste boleto expirou.</p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onCancel}>
                Voltar
              </Button>
              <Button onClick={generateBoleto} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gerar Novo Boleto
                  </>
                )}
              </Button>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 mb-4">
              <X className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Erro ao Gerar Boleto</h3>
            <p className="text-muted-foreground mb-2">
              {boletoData?.error?.message || 'Ocorreu um erro ao tentar gerar o boleto.'}
            </p>
            {boletoData?.error?.details?.length > 0 && (
              <div className="text-sm text-red-500 dark:text-red-400 text-left w-full mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                <ul className="list-disc pl-5 space-y-1">
                  {boletoData.error.details.map((detail: any, index: number) => (
                    <li key={index}>{detail.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={onCancel}>
                Voltar
              </Button>
              <Button onClick={generateBoleto} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tentando novamente...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                  </>
                )}
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Pagamento com Boleto</CardTitle>
            <CardDescription>
              Valor: <span className="font-bold text-green-600">R$ {valor.toFixed(2)}</span>
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderStatus()}
      </CardContent>
    </Card>
  );
};

export default BoletoPayment;
