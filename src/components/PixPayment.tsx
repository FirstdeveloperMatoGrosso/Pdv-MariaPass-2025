
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Copy,
  Clock,
  CheckCircle,
  X,
  RefreshCw,
  Loader2,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';
import type { CustomerData } from '@/types/payment';
import type { PixPaymentResponse } from '@/types/payment';

interface PixPaymentProps {
  valor: number;
  recargaId: string;
  customer: CustomerData;
  onPaymentSuccess: (paymentMethod: 'pix' | 'dinheiro') => void;
  onCancel: () => void;
}

const PixPayment: React.FC<PixPaymentProps> = ({ 
  valor, 
  recargaId,
  customer,
  onPaymentSuccess, 
  onCancel 
}) => {
  interface PixData {
    qrCode: string;
    qrCodeUrl: string;
    paymentUrl?: string;
    expiresAt: string;
    code: string;
    chargeId?: string;
    charge_id?: string;
    orderId?: string;
    order_id?: string;
    transaction_id?: string;
    status?: string;
    amount?: number;
    paid_amount?: number;
    created_at?: string;
    updated_at?: string;
    paid_at?: string | null;
    charges?: any[];
    _debug?: any;
    error?: {
      message: string;
      code?: string;
      [key: string]: any;
    };
    message?: string;
  }

  const [pixData, setPixData] = useState<PixData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'generating' | 'waiting' | 'expired' | 'paid' | 'error'>('generating');
  const [isLoading, setIsLoading] = useState(false);

  const generatePixCode = useCallback(async () => {
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

      // Prepara os dados do pagamento PIX
      const pixPaymentData = {
        amount: Math.round(valor * 100), // Converte para centavos e arredonda
        customer: formattedCustomer,
        orderCode: generateOrderId(),
        expiresIn: 30, // 30 minutos para expirar
        description: `Venda de Produto #${recargaId}`
      };

      console.log('Dados do pagamento PIX:', pixPaymentData);

      const response = await paymentService.createPixPayment(pixPaymentData);
      
      // Debug: Log da resposta completa
      console.log('Resposta completa do PIX:', JSON.stringify(response, null, 2));

      // Log detalhado da resposta para depuração
      console.log('Resposta do pagamento PIX recebida:', {
        hasQrCode: !!(response as any)?.qrCode || !!(response as any)?.qr_code,
        hasQrCodeUrl: !!(response as any)?.qrCodeUrl || !!(response as any)?.qr_code_url,
        hasPaymentUrl: !!(response as any)?.paymentUrl || !!(response as any)?.payment_url,
        hasTransactionId: !!(response as any)?.transaction_id,
        hasChargeId: !!(response as any)?.chargeId || !!(response as any)?.charge_id,
        hasOrderId: !!(response as any)?.orderId || !!(response as any)?.order_id,
        status: (response as any)?.status,
        // Verifica se existem cobranças na resposta
        hasCharges: Array.isArray((response as any)?.charges) && (response as any).charges.length > 0,
        // Verifica se existe uma transação na primeira cobrança
        hasTransaction: Array.isArray((response as any)?.charges) && 
                       (response as any).charges[0]?.last_transaction,
        // Lista todas as chaves da resposta para depuração
        responseKeys: Object.keys(response || {})
      });
      
      // Se houver cobranças, loga os dados da primeira cobrança
      if (Array.isArray((response as any)?.charges) && (response as any).charges.length > 0) {
        console.log('Dados da primeira cobrança:', {
          status: (response as any).charges[0]?.status,
          paymentMethod: (response as any).charges[0]?.payment_method,
          lastTransaction: (response as any).charges[0]?.last_transaction,
          transactionKeys: (response as any).charges[0]?.last_transaction ? 
            Object.keys((response as any).charges[0].last_transaction) : 'Nenhuma transação'
        });
      }

      // Função para extrair dados do PIX de diferentes locais da resposta
      const extractPixData = (data: any): PixData => {
        try {
          console.log('Iniciando extração de dados do PIX da resposta:', {
            dataKeys: data ? Object.keys(data) : [],
            hasCharges: Array.isArray(data?.charges) && data.charges.length > 0,
            hasTransaction: data?.charges?.[0]?.last_transaction,
            hasDirectPixData: !!(data?.qr_code || data?.qr_code_url || data?.pix_url)
          });

          // Tenta obter os dados da transação PIX de diferentes locais da resposta
          const transaction = data?.charges?.[0]?.last_transaction || data?.last_transaction || {};
          const charge = data?.charges?.[0] || data?.charge || {};
          
          // Log detalhado para depuração
          console.log('Dados de transação encontrados:', {
            transactionKeys: transaction ? Object.keys(transaction) : [],
            chargeKeys: charge ? Object.keys(charge) : [],
            hasQrCode: !!(transaction?.qr_code || data?.qr_code),
            hasQrCodeUrl: !!(transaction?.qr_code_url || data?.qr_code_url),
            hasPixUrl: !!(transaction?.pix_url || data?.pix_url || data?.payment_url)
          });
          
          // Tenta obter o QR Code de diferentes locais (priorizando a resposta mais específica)
          const qrCode = transaction?.qr_code || 
                        data?.qr_code || 
                        data?.qrCode ||
                        '';
          
          // Tenta obter a URL do QR Code de diferentes locais
          const qrCodeUrl = transaction?.qr_code_url || 
                           data?.qr_code_url || 
                           data?.qrCodeUrl ||
                           '';
          
          // Tenta obter a URL de pagamento de diferentes locais
          const paymentUrl = transaction?.pix_url || 
                           data?.pix_url || 
                           data?.payment_url ||
                           data?.paymentUrl ||
                           qrCodeUrl;
          
          // Tenta obter a data de expiração de diferentes locais
          const expiresAt = transaction?.expires_at || 
                          data?.expires_at || 
                          data?.expiresAt ||
                          new Date(Date.now() + 30 * 60000).toISOString();
          
          // Tenta obter o ID da transação de diferentes locais
          const transactionId = transaction?.id || 
                              data?.transaction_id || 
                              data?.transactionId ||
                              `PIX-${Date.now()}`;
          
          // Tenta obter o ID da cobrança de diferentes locais
          const chargeId = charge?.id || 
                         data?.charge_id || 
                         data?.chargeId ||
                         '';
          
          // Tenta obter o ID do pedido de diferentes locais
          const orderId = data?.order_id || 
                         data?.orderId || 
                         data?.id ||
                         '';
          
          // Tenta obter o status do pagamento
          const status = transaction?.status || 
                        charge?.status || 
                        data?.status ||
                        'pending';
          
          // Tenta obter o valor do pagamento
          const amount = transaction?.amount || 
                       charge?.amount || 
                       data?.amount ||
                       0;
          
          // Tenta obter o valor pago
          const paidAmount = transaction?.paid_amount || 
                           charge?.paid_amount || 
                           data?.paid_amount ||
                           0;
          
          // Cria o objeto de resposta
          const pixData: PixData = {
            qrCode,
            qrCodeUrl,
            paymentUrl,
            expiresAt,
            code: qrCode || transactionId,
            chargeId,
            charge_id: chargeId,
            orderId,
            order_id: orderId,
            transaction_id: transactionId,
            status,
            amount,
            paid_amount: paidAmount,
            created_at: transaction?.created_at || charge?.created_at || new Date().toISOString(),
            updated_at: transaction?.updated_at || charge?.updated_at || new Date().toISOString(),
            charges: data?.charges || [],
            // Inclui mensagem de erro se houver
            ...(data?.error && { error: typeof data.error === 'string' ? { message: data.error } : data.error }),
            // Inclui mensagem se houver
            ...(data?.message && { message: data.message })
          };
          
          console.log('Dados do PIX extraídos com sucesso:', {
            hasQrCode: !!pixData.qrCode,
            hasQrCodeUrl: !!pixData.qrCodeUrl,
            hasPaymentUrl: !!pixData.paymentUrl,
            expiresAt: pixData.expiresAt,
            status: pixData.status
          });
          
          return pixData;
          
        } catch (error) {
          console.error('Erro ao extrair dados do PIX:', error);
          
          // Retorna um objeto de erro formatado
          return {
            qrCode: '',
            qrCodeUrl: '',
            paymentUrl: '',
            expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
            code: `ERROR-${Date.now()}`,
            chargeId: '',
            charge_id: '',
            orderId: '',
            order_id: '',
            transaction_id: `ERROR-${Date.now()}`,
            status: 'error',
            amount: 0,
            paid_amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            charges: [],
            error: {
              message: error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento PIX',
              code: 'PIX_EXTRACTION_ERROR'
            }
          };
        }
      };
      
      // Extrai os dados do PIX da resposta
      const newPixData: PixData = extractPixData(response);
      
      // Log dos dados extraídos
      console.log('Dados extraídos do PIX:', {
        hasQrCode: !!newPixData.qrCode,
        qrCodeLength: newPixData.qrCode?.length,
        hasQrCodeUrl: !!newPixData.qrCodeUrl,
        hasPaymentUrl: !!newPixData.paymentUrl,
        code: newPixData.code,
        transactionId: newPixData.transaction_id,
        chargeId: newPixData.chargeId,
        orderId: newPixData.orderId
      });
      
      // Verifica se temos os dados mínimos necessários
      if (!newPixData.qrCode && !newPixData.qrCodeUrl && !newPixData.paymentUrl) {
        console.error('Dados do PIX incompletos:', {
          hasQrCode: !!newPixData.qrCode,
          hasQrCodeUrl: !!newPixData.qrCodeUrl,
          hasPaymentUrl: !!newPixData.paymentUrl,
          code: newPixData.code,
          response: JSON.stringify(response, null, 2)
        });
        
        // Tenta obter mais informações de erro da resposta
        const errorMessage = response?.error?.message || 
                           response?.message || 
                           'Não foi possível gerar o código PIX. Por favor, tente novamente.';
        
        throw new Error(`Erro ao gerar PIX: ${errorMessage}`);
      }
      
      // Log dos dados do PIX que serão usados
      console.log('Dados do PIX processados:', {
        hasQrCode: !!newPixData.qrCode,
        qrCodeLength: newPixData.qrCode?.length,
        hasQrCodeUrl: !!newPixData.qrCodeUrl,
        hasPaymentUrl: !!newPixData.paymentUrl,
        code: newPixData.code,
        expiresAt: newPixData.expiresAt
      });
      
      setPixData(newPixData);
      
      // Calcular tempo restante em segundos
      const expiresAt = new Date(response.expiresAt);
      const now = new Date();
      const diffInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      
      setTimeLeft(Math.max(0, diffInSeconds));
      setStatus('waiting');
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // Mensagem de erro padrão
      let errorMessage = 'Erro ao gerar código PIX. Tente novamente.';
      
      // Se o erro tiver uma mensagem específica, usa ela
      if (error.message && error.message !== 'Error') {
        errorMessage = error.message;
      }
      // Se for um erro de servidor (500)
      else if (error.code === '500' || error.details?.originalError?.code === '500') {
        errorMessage = 'Ocorreu um erro inesperado no processamento do pagamento. Por favor, tente novamente em alguns instantes.';
      }
      
      // Exibe a mensagem de erro para o usuário
      toast.error(errorMessage, {
        duration: 3000, // Reduzido para 3 segundos
        position: 'top-center',
        style: {
          maxWidth: '90%',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center'
        }
      });
      
      // Define o status com base no tipo de erro
      if (error.code === '500' || error.details?.isRetryable !== false) {
        setStatus('error'); // Estado de erro, mas pode tentar novamente
      } else {
        setStatus('expired');
      }
    } finally {
      setIsLoading(false);
    }
  }, [valor, recargaId, customer]);

  const copyPixCode = () => {
    if (!pixData) {
      console.error('Nenhum dado PIX disponível para copiar');
      toast.error('Nenhum código PIX disponível para copiar', { duration: 2000 });
      return;
    }
    
    // Tenta copiar o código PIX, se disponível
    if (pixData.code) {
      navigator.clipboard.writeText(pixData.code)
        .then(() => {
          toast.success('Código PIX copiado!', { duration: 2000 });
        })
        .catch(err => {
          console.error('Erro ao copiar código PIX:', err);
          toast.error('Não foi possível copiar o código PIX', { duration: 2000 });
        });
    } 
    // Se não tiver código, mas tiver URL do PIX, copia a URL
    else if (pixData.qrCodeUrl) {
      navigator.clipboard.writeText(pixData.qrCodeUrl)
        .then(() => {
          toast.success('URL do PIX copiada!', { duration: 2000 });
        })
        .catch(err => {
          console.error('Erro ao copiar URL do PIX:', err);
          toast.error('Não foi possível copiar a URL do PIX', { duration: 2000 });
        });
    } else {
      console.error('Nenhum código ou URL PIX disponível para copiar');
      toast.error('Nenhum dado PIX disponível para copiar', { duration: 2000 });
    }
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!pixData) return;
    
    try {
      // Verifica se temos um chargeId para verificar o status
      const chargeId = pixData.chargeId || pixData.charge_id;
      
      if (!chargeId) {
        console.error('ID da cobrança não encontrado');
        return;
      }

      // Em um ambiente real, você faria uma chamada para a API do Pagar.me
      // para verificar o status do pagamento usando o chargeId
      // Exemplo: const response = await api.get(`/charges/${chargeId}`);
      
      // Para fins de demonstração, vamos simular uma verificação de status
      // Em produção, substitua este bloco por uma chamada real à API
      const response = await new Promise<{ status: string; paid_amount?: number }>((resolve) => {
        // Simula um atraso de rede
        setTimeout(() => {
          // Simula uma resposta da API com 80% de chance de sucesso
          const isPaid = Math.random() < 0.8;
          
          if (isPaid) {
            resolve({
              status: 'paid',
              paid_amount: valor * 100 // Valor em centavos
            });
          } else {
            // Se não estiver pago ainda, retorna pending
            resolve({
              status: 'pending'
            });
          }
        }, 2000); // Simula um atraso de rede de 2 segundos
      });

      // Atualiza o status com base na resposta
      if (response.status === 'paid') {
        setStatus('paid');
        toast.success('Pagamento confirmado!', { duration: 2000 });
        
        // Chama o callback de sucesso após um pequeno atraso
        setTimeout(() => {
          onPaymentSuccess('pix');
        }, 2000);
      } else if (response.status === 'failed' || response.status === 'canceled') {
        // Se o pagamento falhou ou foi cancelado, atualiza o status
        setStatus('expired');
        toast.error('O pagamento falhou ou foi cancelado. Por favor, tente novamente.', { duration: 3000 });
      }
      // Se o status for 'pending', não fazemos nada e esperamos a próxima verificação
      
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      toast.error('Erro ao verificar o status do pagamento. Tente novamente.', { duration: 3000 });
    }
  }, [pixData, valor, onPaymentSuccess]);

  const handleRefresh = () => {
    generatePixCode();
  };

  useEffect(() => {
    generatePixCode();
  }, [generatePixCode]);

  // Efeito para atualizar o contador de tempo e verificar o status do pagamento
  useEffect(() => {
    if (status !== 'waiting' || !pixData) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTimeLeft = Math.max(0, prev - 1);
        if (newTimeLeft <= 0) {
          setStatus('expired');
          return 0;
        }
        return newTimeLeft;
      });
    }, 1000);

    const checkStatusInterval = setInterval(() => {
      if (pixData.chargeId || pixData.charge_id) {
        checkPaymentStatus().catch(console.error);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(checkStatusInterval);
    };
  }, [status, pixData, checkPaymentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'generating':
        return { color: 'bg-blue-100 text-blue-800', text: 'Gerando PIX...' };
      case 'waiting':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Aguardando Pagamento' };
      case 'expired':
        return { color: 'bg-red-100 text-red-800', text: 'Expirado' };
      case 'paid':
        return { color: 'bg-green-100 text-green-800', text: 'Pago' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Desconhecido' };
    }
  };

  const statusInfo = getStatusInfo();

  // Mostrar loading enquanto gera o PIX
  if (isLoading || status === 'generating') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2 text-base">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>Pagamento PIX</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">Gerando código PIX...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2 text-base">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span>Pagamento PIX</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">R$ {valor.toFixed(2)}</p>
            <Badge className={statusInfo.color}>{statusInfo.text}</Badge>
          </div>

          {status === 'waiting' && pixData && (
            <>
              <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
                {pixData.qrCodeUrl ? (
                  <img 
                    src={pixData.qrCodeUrl} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {pixData.code ? (
                  <>
                    <p className="text-sm text-gray-600">Código PIX Copia e Cola:</p>
                    <div className="bg-gray-50 p-3 rounded border text-xs break-all font-mono">
                      {pixData.code}
                    </div>
                    <div className="flex flex-col space-y-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyPixCode}
                        className="w-full"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar Código
                      </Button>
                      
                      {pixData.qrCodeUrl && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(pixData.qrCodeUrl, '_blank')}
                            className="w-full"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Abrir PIX
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              // Abre o QR Code em uma nova janela
                              const qrWindow = window.open('', '_blank');
                              if (qrWindow) {
                                qrWindow.document.write(`
                                  <html>
                                    <head>
                                      <title>QR Code PIX</title>
                                      <style>
                                        body { 
                                          display: flex; 
                                          justify-content: center; 
                                          align-items: center; 
                                          height: 100vh; 
                                          margin: 0; 
                                          background-color: #f8fafc;
                                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                                        }
                                        .container { 
                                          text-align: center; 
                                          padding: 2rem;
                                        }
                                        .amount { 
                                          font-size: 1.5rem; 
                                          font-weight: bold; 
                                          margin-bottom: 1rem;
                                          color: #1e293b;
                                        }
                                        .qr-code { 
                                          max-width: 300px; 
                                          margin: 0 auto 1.5rem; 
                                          border: 1px solid #e2e8f0;
                                          border-radius: 0.5rem;
                                          padding: 1rem;
                                          background: white;
                                          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                        }
                                        .qr-code img { 
                                          width: 100%; 
                                          height: auto; 
                                          display: block;
                                        }
                                        .expiry { 
                                          color: #64748b; 
                                          margin-top: 1rem;
                                          font-size: 0.875rem;
                                        }
                                      </style>
                                    </head>
                                    <body>
                                      <div class="container">
                                        <div class="amount">R$ ${valor.toFixed(2)}</div>
                                        <div class="qr-code">
                                          <img src="${pixData.qrCodeUrl}" alt="QR Code PIX" />
                                        </div>
                                        <div class="expiry">
                                          Expira em: ${formatTime(timeLeft)}
                                        </div>
                                      </div>
                                    </body>
                                  </html>
                                `);
                                qrWindow.document.close();
                              }
                            }}
                            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Maximize2 className="w-3 h-3 mr-1" />
                            Ver QR Code
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : pixData.qrCodeUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Link para pagamento PIX:</p>
                    <div className="bg-gray-50 p-3 rounded border text-xs break-all font-mono text-blue-600">
                      {pixData.qrCodeUrl}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyPixCode}
                      className="w-full"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar Link
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      Não foi possível gerar o código PIX. Por favor, tente novamente.
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefresh}
                      className="mt-2 text-yellow-700 hover:bg-yellow-100"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Tentar novamente
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Expira em: {formatTime(timeLeft)}</span>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Atualizar
                </Button>
              </div>
            </>
          )}

          {status === 'expired' && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">O código PIX expirou</p>
              <Button 
                onClick={handleRefresh}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Gerar Novo PIX
              </Button>
            </div>
          )}

          {status === 'paid' && (
            <div className="space-y-3">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <p className="text-green-600 font-semibold">Pagamento Confirmado!</p>
              <p className="text-sm text-gray-600">Processando recarga...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PixPayment;
