import pagarmeApi, { PixOrderResponse } from './pagarmeApi';
import { config } from '@/config/env';

// Interface para a resposta de pagamento PIX
interface PixPaymentResponse {
  success: boolean;
  status: string;
  orderId: string;
  order_id?: string;
  chargeId?: string;
  charge_id?: string;
  transaction_id?: string;
  qrCode?: string;
  qr_code?: string;
  qrCodeUrl?: string;
  qr_code_url?: string;
  paymentUrl?: string;
  payment_url?: string;
  expiresAt: string;
  expires_at?: string;
  amount: number;
  items: Array<{
    id: string;
    amount: number;
    description: string;
    quantity: number;
    code?: string;
  }>;
  charges?: Array<{
    id: string;
    status: string;
    amount: number;
    paid_amount: number; // Tornando obrigatório
    payment_method: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
    last_transaction: {
      id: string;
      status: string;
      amount: number;
      success: boolean;
      qr_code?: string;
      qr_code_url?: string;
      pix_url?: string;
      expires_at?: string;
      created_at: string;
      updated_at: string;
      gateway_response?: {
        code: string;
        errors: Array<{
          code: string;
          message: string;
          parameter_name?: string;
        }>;
      };
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  error?: {
    message: string;
    code?: string;
    [key: string]: any;
  };
  message?: string;
  _debug?: {
    rawResponse?: any;
    charge?: any;
    transaction?: any;
    config?: any;
    processedAt?: string;
    [key: string]: any;
  };
}

/**
 * Mapeia os status da API do Pagar.me para os status suportados pela aplicação
 */
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled';

const mapPaymentStatus = (status?: string): PaymentStatus => {
  if (!status) return 'pending';
  
  // Mapeia os status da API para os status suportados
  const statusMap: Record<string, PaymentStatus> = {
    'pending': 'pending',
    'paid': 'paid',
    'authorized': 'paid',
    'processing': 'paid',
    'failed': 'failed',
    'canceled': 'canceled',
    'refunded': 'canceled',
    'chargeback': 'failed'
  };
  
  return statusMap[status.toLowerCase()] || 'pending';
};

// Definindo os tipos manualmente para evitar problemas de importação
type PagarmeCustomerData = {
  id?: string;
  name: string;
  email: string;
  document: string;
  document_type: 'CPF' | 'CNPJ';
  type: 'individual' | 'company';
  phones: {
    mobile_phone: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
  address: {
    line_1: string;
    line_2: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  metadata?: Record<string, any>;
};

type PagarmePixPaymentData = {
  amount: number;
  customer: PagarmeCustomerData;
  orderCode: string;
  expiresIn?: number;
  items?: Array<{
    id?: string;
    amount: number;
    description: string;
    quantity: number;
    code?: string;
  }>;
};

// Definindo o tipo para o boleto
interface BoletoPaymentData {
  amount: number;
  customer: PagarmeCustomerData;
  orderCode: string;
  expiresIn?: number;
  dueDate: string;
  instructions: string;
  items?: Array<{
    id?: string;
    amount: number;
    description: string;
    quantity: number;
    code?: string;
  }>;
}

// Interface para a resposta do pagamento com boleto
// Interface para os dados da transação de boleto
export interface BoletoTransactionData {
  id: string;
  url?: string;
  barcode?: string;
  barcode_url?: string;
  due_date?: string;
  amount?: number;
  [key: string]: any; // Para propriedades adicionais que podem existir
}

export interface BoletoPaymentResponse {
  success: boolean;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'processing' | 'authorized';
  orderId: string;
  order_id?: string;
  chargeId: string;
  charge_id?: string;
  transaction_id?: string;
  barcode: string;
  boletoUrl: string;
  boleto_url?: string;
  pdfUrl: string;
  pdf_url?: string;
  dueDate: string;
  due_date?: string;
  amount: number;
  metadata?: Record<string, any>;
  _debug?: {
    rawResponse?: any;
    [key: string]: any;
  };
}

// Interface para os dados do cliente formatados para a API
type FormattedCustomerData = PagarmeCustomerData;

// Interface estendida para incluir itens do pedido
interface ExtendedPixPaymentData extends Omit<PagarmePixPaymentData, 'items'> {
  items?: Array<{
    id?: string;
    amount: number;
    description: string;
    quantity: number;
    code?: string;
  }>;
  description?: string;
}

/**
 * Formata os dados do cliente para o formato esperado pela API do Pagar.me
 * @param customer Dados do cliente a serem formatados
 * @returns Dados do cliente formatados
 */
const formatCustomerData = (customer: Partial<PagarmeCustomerData>): PagarmeCustomerData => {
  if (!customer) {
    throw new Error('Dados do cliente não fornecidos');
  }
  
  // Valida campos obrigatórios
  const requiredFields = ['name', 'email', 'document', 'document_type', 'type', 'phones', 'address'];
  const missingFields = requiredFields.filter(field => {
    const value = customer[field as keyof typeof customer];
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    throw new Error(`Campos obrigatórios não fornecidos: ${missingFields.join(', ')}`);
  }
  
  // Valida o formato do documento
  if (customer.document_type === 'CPF' && !/^\d{11}$/.test(customer.document)) {
    throw new Error('CPF inválido. Deve conter 11 dígitos numéricos.');
  }
  
  if (customer.document_type === 'CNPJ' && !/^\d{14}$/.test(customer.document)) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos numéricos.');
  }
  
  // Valida o formato do e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    throw new Error('E-mail inválido');
  }

  // Formata o documento (remove caracteres não numéricos)
  const document = (customer.document || '').replace(/\D/g, '');
  
  // Determina o tipo de documento com base no comprimento
  const documentType = document.length === 11 ? 'CPF' : 'CNPJ';
  
  // Formata os dados do cliente
  const formattedCustomer: PagarmeCustomerData = {
    // Valores padrão
    name: customer.name?.trim() || '',
    email: customer.email?.toLowerCase().trim() || '',
    document,
    document_type: customer.document_type || documentType,
    type: customer.type || 'individual',
    phones: customer.phones || {
      mobile_phone: {
        country_code: '55',
        area_code: (customer.phones?.mobile_phone?.area_code || '11').replace(/\D/g, '').substring(0, 2) || '11',
        number: (customer.phones?.mobile_phone?.number || '999999999').replace(/\D/g, '').substring(0, 9) || '999999999'
      }
    },
    address: {
      line_1: customer.address?.line_1?.trim() || 'Endereço não informado',
      line_2: customer.address?.line_2?.trim() || '',
      zip_code: (customer.address?.zip_code || '00000000').replace(/\D/g, '').substring(0, 8),
      city: customer.address?.city?.trim() || 'Cidade não informada',
      state: (customer.address?.state || 'SP').substring(0, 2).toUpperCase(),
      country: (customer.address?.country || 'BR').substring(0, 2).toUpperCase(),
    },
    metadata: {
      ...(customer.metadata || {}),
      source: 'pdv-mariapass-frontend',
      created_at: new Date().toISOString(),
      customer_id: customer.id || `temp_${Date.now()}`
    }
  };

  return formattedCustomer;
};

/**
 * Serviço para gerenciar pagamentos
 */
export const paymentService = {
  /**
   * Cria um novo pagamento via PIX
   * @param params Parâmetros do pagamento PIX
   * @returns Resposta do pagamento PIX
   */
  async createPixPayment({ 
    amount, 
    customer, 
    orderCode, 
    expiresIn = 30,
    items,
    description
  }: ExtendedPixPaymentData): Promise<PixPaymentResponse> {
    try {
      console.log('Iniciando criação de pagamento PIX...');
      
      // Valida o valor do pagamento
      const paymentAmount = Math.round(amount);
      if (paymentAmount <= 0) {
        throw new Error('O valor do pagamento deve ser maior que zero');
      }

      // Formata os dados do cliente
      console.log('Formatando dados do cliente...');
      const formattedCustomer = formatCustomerData(customer);
      console.log('Dados do cliente formatados com sucesso');

      // Prepara os itens do pedido
      console.log('Preparando itens do pedido...');
      const orderItems = (items || [{
        amount: paymentAmount,
        description: (description || `Pedido ${orderCode}`).substring(0, 100),
        quantity: 1,
        code: orderCode || `item_${Date.now()}`
      }]).map((item, index) => ({
        ...item,
        id: item.id || `item_${index}_${Date.now()}`,
        amount: Math.round(item.amount),
        quantity: Math.max(1, Math.min(item.quantity || 1, 100)),
        description: (item.description || `Item ${index + 1}`).substring(0, 100)
      }));

      console.log('Criando pedido na API do Pagar.me...');
      
      // Garante que o tempo de expiração está dentro dos limites (1 min a 1 dia)
      const paymentExpiresIn = Math.min(Math.max(1, expiresIn), 60 * 24);
      
      // Cria o pedido com pagamento PIX
      console.log('Criando pedido PIX com os seguintes dados:', {
        customer: { ...formattedCustomer, document: '***' }, // Não logar documento completo por segurança
        amount: paymentAmount,
        orderCode: orderCode || `order_${Date.now()}`,
        expiresIn: paymentExpiresIn,
        items: orderItems.map(item => ({
          ...item,
          description: item.description.substring(0, 30) + (item.description.length > 30 ? '...' : '')
        }))
      });

      let responseData: any;
      let orderResponse: any;
      
      try {
        // Tenta criar o pedido usando a API do Pagar.me
        orderResponse = await pagarmeApi.createPixOrder({
          customer: formattedCustomer,
          amount: paymentAmount / 100, // Converte para reais
          orderCode: orderCode || `order_${Date.now()}`,
          expiresIn: paymentExpiresIn,
          items: orderItems
        });
        
        responseData = orderResponse;
        console.log('Resposta da API (sucesso):', responseData);
      } catch (error: any) {
        // Tenta extrair os dados da resposta mesmo em caso de erro
        console.warn('Erro ao criar pedido PIX, tentando extrair dados úteis:', error);
        
        if (error.response) {
          // Se tivermos uma resposta de erro, tenta extrair os dados
          console.warn('Detalhes do erro da API:', {
            status: error.response.status,
            data: error.response.data
          });
          
          // Tenta extrair os dados da resposta de erro
          responseData = error.response.data || {};
          
          // Se não tivermos os dados de cobrança, tenta construir um objeto básico
          if (!responseData.charges && (responseData.qr_code || responseData.qr_code_url)) {
            responseData.charges = [{
              id: responseData.id || `charge_${Date.now()}`,
              status: 'pending',
              amount: responseData.amount || paymentAmount,
              payment_method: 'pix',
              last_transaction: {
                id: responseData.id || `trans_${Date.now()}`,
                qr_code: responseData.qr_code,
                qr_code_url: responseData.qr_code_url,
                pix_url: responseData.payment_url,
                expires_at: responseData.expires_at,
                status: 'pending',
                success: true
              }
            }];
          }
          
          // Se não tivermos um orderResponse, usamos os dados da resposta de erro
          if (!orderResponse) {
            orderResponse = {
              id: responseData.id || `order_${Date.now()}`,
              status: 'pending',
              amount: responseData.amount || paymentAmount,
              charges: responseData.charges || [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              items: orderItems,
              customer: formattedCustomer,
              payment_method: 'pix',
              code: orderCode || `order_${Date.now()}`,
              metadata: {}
            };
          }
        } else {
          console.error('Erro ao processar pagamento PIX:', error);
          throw new Error('Erro ao processar pagamento PIX. Tente novamente mais tarde.');
        }
      }

      // Verifica se a resposta contém os dados do PIX
      if (!responseData.charges || !Array.isArray(responseData.charges) || responseData.charges.length === 0) {
        console.warn('Resposta da API não contém dados de cobrança, mas continuando com os dados disponíveis:', responseData);
        
        // Tenta extrair os dados diretamente da resposta
        if (responseData.qr_code || responseData.qr_code_url) {
          responseData.charges = [{
            id: responseData.id || `charge_${Date.now()}`,
            status: 'pending',
            amount: responseData.amount || paymentAmount,
            payment_method: 'pix',
            last_transaction: {
              id: responseData.id || `trans_${Date.now()}`,
              qr_code: responseData.qr_code,
              qr_code_url: responseData.qr_code_url,
              pix_url: responseData.payment_url,
              expires_at: responseData.expires_at,
              status: 'pending',
              success: true
            }
          }];
        } else {
          throw new Error('A resposta da API não contém dados de cobrança suficientes');
        }
      }

      // Obtém os dados da cobrança
      const charge = responseData.charges?.[0];
      const transaction = charge?.last_transaction;
      
      // Verifica se a resposta contém os dados necessários
      if (!charge) {
        console.error('Nenhuma cobrança encontrada na resposta:', { responseData });
        throw new Error('Não foi possível processar o pagamento PIX: nenhuma cobrança encontrada');
      }
      
      if (!transaction) {
        console.error('Nenhuma transação encontrada na cobrança:', { charge });
        throw new Error('Não foi possível processar o pagamento PIX: transação não encontrada');
      }
      
      // Log detalhado da transação para depuração
      console.log('Dados da transação PIX recebida:', {
        transactionId: transaction.id,
        hasQrCode: !!transaction.qr_code,
        hasQrCodeUrl: !!transaction.qr_code_url,
        hasPixUrl: !!transaction.pix_url,
        transactionStatus: transaction.status,
        transactionType: transaction.transaction_type,
        paymentMethod: transaction.payment_method,
        transactionData: transaction,
        chargeStatus: charge?.status,
        chargePaymentMethod: charge?.payment_method,
        chargePaidAmount: charge?.paid_amount,
        chargeRefusedReason: charge?.last_transaction?.refused_reason,
        chargeRefusedCode: charge?.last_transaction?.refused_code,
        chargeGatewayResponse: charge?.last_transaction?.gateway_response,
        chargeAcquirerResponse: charge?.last_transaction?.acquirer_response,
        // Adiciona informações adicionais de depuração
        gatewayResponse: transaction.gateway_response,
        requestId: transaction.request_id || charge?.request_id,
        operationType: transaction.operation_type || charge?.operation_type,
        // Adiciona os primeiros 100 caracteres da resposta para análise
        rawResponsePreview: JSON.stringify(orderResponse).substring(0, 100) + '...'
      });
      
      // Verifica se a transação falhou
      if (transaction.status === 'failed' || charge?.status === 'failed' || transaction.transaction_type === 'error') {
        // Se for um erro 500 do servidor
        if (transaction.gateway_response?.code === '500' || transaction.gateway_response?.status_code === 500 ||
            charge?.last_transaction?.gateway_response?.code === '500') {
          
          const gatewayResponse = transaction.gateway_response || charge?.last_transaction?.gateway_response || {};
          
          // Tenta obter a mensagem de erro mais específica possível
          const errorDetails = gatewayResponse.errors?.[0] || 
                             charge?.last_transaction?.gateway_response?.errors?.[0] ||
                             { message: 'Erro interno do servidor' };
          
          // Log detalhado para depuração (apenas em desenvolvimento)
          if (process.env.NODE_ENV !== 'production') {
            console.error('Erro 500 do servidor Pagar.me:', {
              transactionId: transaction.id,
              chargeId: charge?.id,
              gatewayResponse,
              errorDetails
            });
          }

          // Mensagem amigável para o usuário
          let errorMessage = 'Ocorreu um erro inesperado ao processar seu pagamento. Por favor, tente novamente em alguns instantes.';
          let errorCode = '500';
          
          // Mapeia códigos de erro conhecidos para mensagens amigáveis
          const errorMessages: Record<string, string> = {
            '3000': 'Falha na autenticação com o banco emissor. Por favor, verifique os dados e tente novamente.',
            '3001': 'Transação não autorizada pelo banco emissor. Entre em contato com seu banco para mais informações.',
            '3002': 'Cartão não suporta essa operação. Por favor, utilize outro cartão ou forma de pagamento.',
            '3003': 'Transação recusada. Por favor, verifique os dados e tente novamente.',
            '3004': 'Cartão com restrição. Entre em contato com seu banco para mais informações.',
            '3005': 'Dados do cartão inválidos. Verifique as informações e tente novamente.',
            '500': 'Ocorreu um erro inesperado no processamento do pagamento. Por favor, tente novamente mais tarde.'
          };
          
          // Tenta obter o código de erro
          const errorCodeFromResponse = errorDetails.code || 
                                      gatewayResponse.code || 
                                      (typeof gatewayResponse === 'string' ? '500' : '500');
          
          errorCode = errorCodeFromResponse;
          
          // Define a mensagem de erro com base no código ou usa a mensagem da API
          errorMessage = errorMessages[errorCode] || 
                        errorDetails.message || 
                        errorDetails.description || 
                        'Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.';
          
          // Cria um erro personalizado com mais informações
          const error = new Error(errorMessage) as Error & { 
            code?: string; 
            details?: any;
            isRetryable?: boolean;
          };
          
          error.code = errorCode;
          error.isRetryable = true; // Indica que o usuário pode tentar novamente
          error.details = {
            originalError: errorDetails,
            transactionId: transaction.id,
            chargeId: charge?.id,
            isRetryable: true
          };
          
          throw error;
        }
        
        // Para outros tipos de falhas
        const refusedReason = transaction.refused_reason || 
                           charge?.last_transaction?.refused_reason ||
                           transaction.gateway_response?.message ||
                           charge?.last_transaction?.gateway_response?.message ||
                           'Motivo desconhecido';
                           
        const errorCode = transaction.refused_code || 
                         charge?.last_transaction?.refused_code ||
                         transaction.gateway_response?.code ||
                         charge?.last_transaction?.gateway_response?.code ||
                         'unknown_error';
        
        console.error('Transação PIX falhou:', {
          transactionId: transaction.id,
          chargeId: charge?.id,
          status: transaction.status,
          chargeStatus: charge?.status,
          refusedReason,
          errorCode,
          gatewayResponse: charge?.last_transaction?.gateway_response,
          acquirerResponse: charge?.last_transaction?.acquirer_response
        });
        
        // Mapeia códigos de erro comuns para mensagens amigáveis
        const errorMessages: Record<string, string> = {
          'acquirer': 'Falha na operadora de pagamento',
          'antifraud': 'Transação não aprovada pela análise de fraude',
          'internal_error': 'Erro interno no processamento do pagamento',
          'timeout': 'Tempo excedido para processar o pagamento',
          'validation_error': 'Dados de pagamento inválidos',
          'invalid_cvv': 'Código de segurança inválido',
          'insufficient_funds': 'Saldo insuficiente',
          'card_blocked': 'Cartão bloqueado',
          'expired_card': 'Cartão expirado',
          'transaction_denied': 'Transação não autorizada',
          'invalid_card': 'Cartão inválido',
          'invalid_recipient': 'Destinatário do pagamento inválido',
          'invalid_recipient_account': 'Conta do destinatário inválida',
          'invalid_recipient_bank': 'Banco do destinatário inválido',
          'invalid_recipient_type': 'Tipo de destinatário inválido',
          'invalid_sender': 'Remetente inválido',
          'invalid_sender_account': 'Conta do remetente inválida',
          'invalid_sender_bank': 'Banco do remetente inválido',
          'invalid_sender_type': 'Tipo de remetente inválido',
          'invalid_transfer': 'Transferência inválida',
          'transfer_already_processed': 'Transferência já processada',
          'transfer_not_allowed': 'Transferência não permitida',
          'transfer_not_authorized': 'Transferência não autorizada',
          'transfer_not_found': 'Transferência não encontrada',
          'transfer_not_processed': 'Transferência não processada',
          'transfer_not_supported': 'Transferência não suportada',
          'transfer_rejected': 'Transferência rejeitada',
          'transfer_reversed': 'Transferência estornada',
          'transfer_reversal_failed': 'Falha ao estornar transferência',
          'transfer_reversal_processing': 'Estorno de transferência em andamento',
          'unknown_error': 'Erro desconhecido ao processar o pagamento'
        };
        
        const friendlyMessage = errorMessages[errorCode] || 
                              refusedReason || 
                              'Não foi possível processar o pagamento PIX';
        
        throw new Error(`Pagamento não aprovado: ${friendlyMessage} (${errorCode})`);
      }
      
      // Verifica se temos pelo menos um dos campos necessários
      const hasQrCode = !!(transaction.qr_code || transaction.qr_code_url || transaction.pix_url);
      
      // Se não tiver nenhum dos campos de PIX, verifica se há uma URL de autenticação
      if (!hasQrCode) {
        // Tenta obter a URL de autenticação de outros campos possíveis
        const authUrl = transaction.authentication_url || 
                       (transaction.payment_method === 'pix' && transaction.pix_url) ||
                       (transaction.payment_method === 'pix' && transaction.qr_code_url);
        
        if (authUrl) {
          console.warn('Usando URL de autenticação como fallback:', authUrl);
          transaction.qr_code_url = authUrl;
          transaction.pix_url = authUrl;
        } else {
          // Se não tiver nenhum dado de PIX, verifica se há uma URL de pagamento
          const paymentUrl = transaction.payment_url || 
                           (transaction.charges?.[0]?.last_transaction?.payment_url);
          
          if (paymentUrl) {
            console.warn('Usando URL de pagamento como fallback:', paymentUrl);
            transaction.qr_code_url = paymentUrl;
            transaction.pix_url = paymentUrl;
          } else {
            // Se não tiver nenhum dado de PIX, verifica se há uma URL de boleto
            const boletoUrl = transaction.boleto_url || 
                             (transaction.charges?.[0]?.last_transaction?.boleto_url);
            
            if (boletoUrl) {
              console.warn('URL de boleto encontrada, mas esperava-se um PIX:', boletoUrl);
              throw new Error('Método de pagamento inválido. Foi gerado um boleto em vez de PIX.');
            } else {
              console.error('Resposta da API sem informações suficientes para PIX:', { 
                transaction,
                charge,
                orderResponse
              });
              
              // Tenta obter mais informações de debug da resposta
              const debugInfo = {
                chargeStatus: charge?.status,
                chargePaymentMethod: charge?.payment_method,
                transactionType: transaction?.transaction_type,
                transactionStatus: transaction?.status,
                availableFields: Object.keys(transaction || {})
              };
              
              console.error('Informações de depuração adicionais:', debugInfo);
              
              throw new Error('Não foi possível processar o pagamento PIX: dados incompletos na resposta da API');
            }
          }
        }
      }
      
      // Formata a resposta com os dados do PIX
      // Tenta obter os dados do PIX de vários locais possíveis na resposta
      const qrCode = transaction.qr_code || 
                    (transaction.payment_method === 'pix' && transaction.qr_code) ||
                    (transaction.charges?.[0]?.last_transaction?.qr_code);
                    
      const qrCodeUrl = transaction.qr_code_url || 
                       transaction.pix_url || 
                       (transaction.payment_method === 'pix' && transaction.qr_code_url) ||
                       (transaction.charges?.[0]?.last_transaction?.qr_code_url) ||
                       (transaction.charges?.[0]?.last_transaction?.pix_url);
                       
      const paymentUrl = transaction.payment_url || 
                        transaction.pix_url ||
                        (transaction.payment_method === 'pix' && transaction.payment_url) ||
                        (transaction.charges?.[0]?.last_transaction?.payment_url);
      
      // Verifica se temos pelo menos um identificador de transação
      const transactionId = transaction.id || 
                          transaction.transaction_id ||
                          (transaction.charges?.[0]?.id) ||
                          `pix_${Date.now()}`;
      
      // Formata a resposta final
      const response: PixPaymentResponse = {
        success: true,
        status: orderResponse.status || charge?.status || 'pending',
        orderId: orderResponse.id,
        order_id: orderResponse.id,
        chargeId: charge?.id,
        charge_id: charge?.id,
        transaction_id: transactionId,
        qrCode: qrCode || '',
        qr_code: qrCode || '',
        qrCodeUrl: qrCodeUrl || '',
        qr_code_url: qrCodeUrl || '',
        paymentUrl: paymentUrl || qrCodeUrl || '',
        payment_url: paymentUrl || qrCodeUrl || '',
        expiresAt: transaction.expires_at || 
                  (transaction.charges?.[0]?.last_transaction?.expires_at) ||
                  new Date(Date.now() + (paymentExpiresIn * 60000)).toISOString(),
        expires_at: transaction.expires_at || 
                  (transaction.charges?.[0]?.last_transaction?.expires_at) ||
                  new Date(Date.now() + (paymentExpiresIn * 60000)).toISOString(),
        amount: paymentAmount / 100, // Converte para reais
        items: orderItems.map(item => ({
          id: item.id || `item_${Date.now()}`,
          amount: item.amount,
          description: item.description,
          quantity: item.quantity,
          code: item.code || ''
        })),
        // Garante que cada charge tenha um paid_amount válido
        charges: (orderResponse.charges || []).map(charge => ({
          ...charge,
          paid_amount: charge.paid_amount || 0, // Define um valor padrão se não existir
          last_transaction: {
            ...charge.last_transaction,
            // Garante que a transação tenha os campos obrigatórios
            created_at: charge.last_transaction?.created_at || new Date().toISOString(),
            updated_at: charge.last_transaction?.updated_at || new Date().toISOString()
          }
        })) as any[], // Usamos 'as any' para evitar problemas de tipagem complexa
        _debug: process.env.NODE_ENV === 'development' ? {
          rawResponse: orderResponse,
          charge: charge,
          transaction: transaction,
          config: config.pagarme,
          processedAt: new Date().toISOString()
        } : undefined
      };

      console.log('Resposta do pagamento PIX:', response);
      return response;
    } catch (error: any) {
      console.error('Erro ao processar pagamento PIX:', error);
      
      // Trata erros específicos da API
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorMessage = errorData.message || 'Erro ao processar pagamento';
        const errorDetails = errorData.errors || [];
        
        console.error('Detalhes do erro da API:', {
          status: error.response.status,
          message: errorMessage,
          details: errorDetails
        });
        
        throw new Error(`Erro na API: ${errorMessage}${errorDetails.length ? ` (${errorDetails.join(', ')})` : ''}`);
      }
      
      // Trata erros de validação
      if (error.message?.includes('Campos obrigatórios')) {
        throw new Error(`Dados inválidos: ${error.message}`);
      }
      
      // Repassa outros erros
      throw new Error(error.message || 'Erro ao processar pagamento PIX');
    }
  },

  /**
   * Cria um novo pagamento via boleto bancário
   * @param params Parâmetros do pagamento com boleto
   * @returns Resposta do pagamento com boleto
   */
  async createBoletoPayment({ 
    amount, 
    customer, 
    orderCode, 
    dueDate,
    instructions,
    items,
    expiresIn = 3 // 3 dias por padrão
  }: BoletoPaymentData): Promise<BoletoPaymentResponse> {
    try {
      console.log('Iniciando criação de pagamento com boleto...');
      
      // Valida o valor do pagamento
      const paymentAmount = Math.round(amount);
      if (paymentAmount <= 0) {
        throw new Error('O valor do pagamento deve ser maior que zero');
      }

      // Formata os dados do cliente
      console.log('Formatando dados do cliente...');
      const formattedCustomer = formatCustomerData(customer);
      console.log('Dados do cliente formatados com sucesso');

      // Prepara os itens do pedido
      console.log('Preparando itens do pedido...');
      const orderItems = (items || [{
        amount: paymentAmount,
        description: `Pedido ${orderCode}`.substring(0, 100),
        quantity: 1,
        code: orderCode || `item_${Date.now()}`
      }]).map((item, index) => ({
        ...item,
        id: item.id || `item_${index}_${Date.now()}`,
        amount: Math.round(item.amount),
        quantity: Math.max(1, Math.min(item.quantity || 1, 100)),
        description: (item.description || `Item ${index + 1}`).substring(0, 100)
      }));

      console.log('Criando pedido na API do Pagar.me...');
      
      // Valida a data de vencimento
      const paymentDueDate = dueDate || new Date(Date.now() + (expiresIn * 24 * 60 * 60 * 1000)).toISOString();
      const minDueDate = new Date();
      minDueDate.setDate(minDueDate.getDate() + 1); // Mínimo 1 dia de validade
      
      if (new Date(paymentDueDate) < minDueDate) {
        throw new Error('A data de vencimento deve ser pelo menos 1 dia no futuro');
      }
      
      let responseData: any;
      let orderResponse: any;
      
      try {
        // Tenta criar o pedido usando a API do Pagar.me
        orderResponse = await pagarmeApi.createBoletoOrder({
          customer: formattedCustomer,
          amount: paymentAmount / 100, // Converte para reais
          orderCode: orderCode || `order_${Date.now()}`,
          dueDate: paymentDueDate,
          instructions: instructions || 'Pagar até a data de vencimento',
          items: orderItems
        });
        
        responseData = orderResponse;
        console.log('Resposta da API (sucesso):', responseData);
      } catch (error: any) {
        // Tenta extrair os dados da resposta mesmo em caso de erro
        console.warn('Erro ao criar pedido de boleto, tentando extrair dados úteis:', error);
        
        if (error.response) {
          // Se tivermos uma resposta de erro, tenta extrair os dados
          console.warn('Detalhes do erro da API:', {
            status: error.response.status,
            data: error.response.data
          });
          
          // Tenta extrair os dados da resposta de erro
          responseData = error.response.data || {};
          
          // Se não tivermos um orderResponse, usamos os dados da resposta de erro
          if (!orderResponse) {
            orderResponse = {
              id: responseData.id || `order_${Date.now()}`,
              status: 'pending',
              amount: responseData.amount || paymentAmount,
              charges: responseData.charges || [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              items: orderItems,
              customer: formattedCustomer,
              payment_method: 'boleto',
              code: orderCode || `order_${Date.now()}`,
              metadata: {}
            };
          }
        } else {
          console.error('Erro ao processar pagamento com boleto:', error);
          throw new Error('Erro ao processar pagamento com boleto. Tente novamente mais tarde.');
        }
      }

      // Verifica se a resposta contém os dados do boleto
      const charge = responseData.charges?.[0];
      if (!charge || !charge.last_transaction) {
        console.error('Resposta da API sem transação de boleto:', { orderResponse });
        throw new Error('Não foi possível processar a transação de boleto');
      }
      
      const lastTransaction = charge.last_transaction;
      
      // Valida os dados da transação
      if (!lastTransaction.barcode) {
        console.error('Resposta da API sem código de barras:', { orderResponse });
        throw new Error('Não foi possível gerar o boleto de pagamento: código de barras não encontrado');
      }

      console.log('Boleto gerado com sucesso');
      
      // Prepara a resposta de sucesso com tipos explícitos
      const paymentStatus = mapPaymentStatus(charge.status);
      
      // Extrai os dados do boleto da resposta
      const boletoData = charge.last_transaction as BoletoTransactionData;
      
      // Define a data de vencimento com fallback
      const getDueDate = (): string => {
        // Se tiver a data no boleto, usa ela
        if (boletoData.due_date) {
          return boletoData.due_date;
        }
        
        // Se tiver uma data de vencimento fornecida, formata se necessário
        if (paymentDueDate) {
          if (typeof paymentDueDate === 'string') {
            return paymentDueDate;
          }
          
          // Verifica se é um objeto Date de forma segura
          if (Object.prototype.toString.call(paymentDueDate) === '[object Date]' && !isNaN((paymentDueDate as Date).getTime())) {
            return (paymentDueDate as Date).toISOString();
          }
          
          return String(paymentDueDate);
        }
        
        // Se não tiver nenhuma data, usa 3 dias a partir de agora
        return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      };
      
      const dueDateValue = getDueDate();
      
      const response: BoletoPaymentResponse = {
        success: paymentStatus === 'paid',
        status: paymentStatus,
        orderId: String(orderResponse.id || `order_${Date.now()}`),
        order_id: String(orderResponse.id || `order_${Date.now()}`),
        chargeId: String(charge.id || `charge_${Date.now()}`),
        charge_id: String(charge.id || `charge_${Date.now()}`),
        transaction_id: String(boletoData.id || `trans_${Date.now()}`),
        barcode: String(boletoData.barcode || ''),
        boletoUrl: String(boletoData.url || ''),
        boleto_url: String(boletoData.url || ''),
        pdfUrl: String(boletoData.url || ''), // Usamos a mesma URL para PDF
        pdf_url: String(boletoData.url || ''), // Usamos a mesma URL para PDF
        dueDate: String(dueDateValue),
        due_date: String(dueDateValue),
        amount: Number(charge.amount || paymentAmount),
        metadata: {
          ...(orderResponse.metadata || {}),
          created_at: new Date().toISOString()
        },
        _debug: process.env.NODE_ENV === 'development' ? {
          rawResponse: orderResponse,
          charge: charge,
          transaction: lastTransaction,
          config: config.pagarme,
          processedAt: new Date().toISOString()
        } : undefined
      };

      console.log('Resposta do pagamento com boleto:', response);
      return response;
    } catch (error: any) {
      console.error('Erro ao processar pagamento com boleto:', error);
      
      // Trata erros específicos da API
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorMessage = errorData.message || 'Erro ao processar pagamento';
        const errorDetails = errorData.errors || [];
        
        console.error('Detalhes do erro da API:', {
          status: error.response.status,
          message: errorMessage,
          details: errorDetails
        });
        
        throw new Error(`Erro na API: ${errorMessage}${errorDetails.length ? ` (${errorDetails.join(', ')})` : ''}`);
      }
      
      // Trata erros de validação
      if (error.message?.includes('Campos obrigatórios')) {
        throw new Error(`Dados inválidos: ${error.message}`);
      }
      
      // Repassa outros erros
      throw new Error(error.message || 'Erro ao processar pagamento com boleto');
    }
  }
};

export default paymentService;
