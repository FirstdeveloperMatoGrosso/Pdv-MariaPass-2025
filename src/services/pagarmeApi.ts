import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders, AxiosError } from 'axios';
import { config } from '../config/env';

// Type declarations
export interface CustomerData {
  id?: string;
  name: string;
  email: string;
  document: string;
  type: 'individual' | 'company';
  document_type: 'CPF' | 'CNPJ';
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
  [key: string]: any;
}

export interface PixPaymentData {
  amount: number;
  customer: CustomerData;
  orderCode: string;
  expiresIn?: number;
}

export interface BoletoPaymentData {
  amount: number;
  customer: CustomerData;
  orderCode: string;
  expiresIn?: number;
  dueDate: string;
  instructions: string;
}

// Interface para resposta de pedido PIX
export interface PixOrderResponse {
  // Identificadores
  id: string;
  orderId: string;
  chargeId?: string;
  transaction_id?: string;
  
  // Status do pedido
  status: string;
  
  // Dados de pagamento
  amount: number;
  qrCode: string;
  qr_code?: string;
  qrCodeUrl: string;
  qr_code_url?: string;
  paymentUrl: string;
  payment_url?: string;
  expiresAt: string;
  expires_at?: string;
  
  // Itens do pedido
  items?: Array<{
    id: string;
    amount: number;
    description: string;
    quantity: number;
    code?: string;
    [key: string]: any;
  }>;
  
  // Dados da cobrança
  charges?: Array<{
    id: string;
    status: string;
    amount: number;
    paid_amount?: number;
    payment_method: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
    last_transaction: {
      id: string;
      transaction_type: string;
      gateway_id: string;
      amount: number;
      status: string;
      success: boolean;
      url?: string;
      pdf?: string;
      line?: string;
      qr_code?: string;
      qr_code_url?: string;
      pix_url?: string;
      expires_at: string;
      created_at: string;
      updated_at: string;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  
  // Metadados e informações adicionais
  customer?: any;
  metadata?: Record<string, any>;
  
  // Depuração
  _debug?: {
    rawResponse?: any;
    [key: string]: any;
  };
  
  // Índice de assinatura para permitir outras propriedades
  [key: string]: any;
}

export interface BoletoOrderResponse {
  id: string;
  code: string;
  status: string;
  amount: number;
  customer: CustomerData;
  payment_method: string;
  metadata?: Record<string, any>;
  boleto: {
    url?: string;
    barcode?: string;
    barcode_url?: string;
    due_date: string;
    instructions: string;
  };
  charges?: Array<{
    id: string;
    status: string;
    amount: number;
    last_transaction?: {
      id?: string;
      url?: string;
      barcode?: string;
      barcode_url?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Extend Axios configuration to include API key
declare module 'axios' {
  interface AxiosRequestConfig {
    pagarmeApiKey?: string;
  }
}

// Interface for Pagar.me API errors
interface PagarmeApiError {
  message: string;
  errors?: Array<{ message: string }>;
  [key: string]: any;
}

// Create Axios instance with default configuration
// Função para codificar em base64 (compatível com Node.js e navegador)
const base64Encode = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  return Buffer.from(str).toString('base64');
};

// Configura o cliente HTTP para a API do Pagar.me
// Usando o proxy do Vite para evitar problemas de CORS
const api = axios.create({
  baseURL: '/api/pagarme', // Usando o proxy configurado no vite.config.ts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
});

// Não adicionamos o header de autorização aqui, pois será adicionado pelo proxy
// Isso evita que a chave da API seja exposta no cliente

// Add request interceptor para adicionar a chave de API
api.interceptors.request.use(
  (config) => {
    try {
      const apiKey = config.pagarmeApiKey || config.params?.api_key;
      
      if (!apiKey) {
        console.warn('Nenhuma chave de API fornecida na requisição');
      } else {
        // Adiciona a chave de API como parâmetro de consulta
        config.params = {
          ...config.params,
          api_key: apiKey,
        };
        
        // Adiciona o cabeçalho de autorização
        const authHeader = `Basic ${base64Encode(`${apiKey}:`)}`;
        
        // Garante que config.headers existe e está no formato correto
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        } else if (!(config.headers instanceof AxiosHeaders)) {
          // Se for um objeto simples, converte para AxiosHeaders
          config.headers = new AxiosHeaders(config.headers);
        }
        
        // Adiciona os headers necessários
        config.headers.set('Authorization', authHeader);
        config.headers.set('Content-Type', 'application/json');
        config.headers.set('Accept', 'application/json');
        
        console.log('Enviando requisição para:', {
          url: config.url,
          method: config.method,
          headers: {
            ...config.headers,
            'Authorization': '***', // Não logar o token real
          },
          params: config.params,
          data: config.data ? JSON.parse(config.data) : undefined
        });
      }
      
      return config;
      
    } catch (error) {
      console.error('Erro no interceptor de requisição:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Erro no interceptor de requisição (onRejected):', error);
    return Promise.reject(error);
  }
);

// Add response interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log('Resposta recebida:', {
      url: response.config.url,
      status: response.status,
      method: response.config.method,
      data: response.data
    });
    return response;
  },
  (error) => {
    const errorInfo: any = {
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: {
          ...error.config?.headers,
          authorization: error.config?.headers?.authorization ? '***' : undefined
        },
        data: error.config?.data ? JSON.parse(error.config.data) : undefined
      }
    };

    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status fora do range 2xx
      errorInfo.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      };
      
      console.error('Erro na resposta da API:', errorInfo);
      
      // Melhorar mensagem de erro com base no status
      if (error.response.status === 401) {
        error.message = 'Não autorizado. Verifique sua chave de API.';
      } else if (error.response.status === 403) {
        error.message = 'Acesso negado. Verifique as permissões da sua conta.';
      } else if (error.response.status === 404) {
        error.message = 'Recurso não encontrado.';
      } else if (error.response.status >= 500) {
        error.message = 'Erro interno no servidor. Tente novamente mais tarde.';
      }
      
      // Adicionar mensagem de erro da API, se disponível
      if (error.response.data?.message) {
        error.message += ` Detalhes: ${error.response.data.message}`;
      } else if (error.response.data?.errors?.[0]?.message) {
        error.message += ` Detalhes: ${error.response.data.errors[0].message}`;
      }
      
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      errorInfo.request = {
        status: error.request.status,
        responseText: error.request.responseText,
        responseURL: error.request.responseURL
      };
      console.error('Sem resposta do servidor:', errorInfo);
      error.message = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error('Erro ao configurar a requisição:', errorInfo);
      error.message = `Erro ao configurar a requisição: ${error.message}`;
    }
    
    // Adicionar informações adicionais ao erro
    error.details = errorInfo;
    
    return Promise.reject(error);
  }
);

// Helper function to validate customer data
function validateCustomerData(customer: CustomerData): void {
  if (!customer.name || !customer.email || !customer.document || !customer.phones?.mobile_phone) {
    throw new Error('Incomplete customer data');
  }

  if (!customer.address) {
    throw new Error('Customer address is required');
  }

  const requiredAddressFields = ['line_1', 'zip_code', 'city', 'state', 'country'] as const;
  for (const field of requiredAddressFields) {
    if (!customer.address[field]) {
      throw new Error(`Required address field not provided: ${field}`);
    }
  }
}

// Payment service
const pagarmeApi = {
  /**
   * Busca um cliente por e-mail na API do Pagar.me
   * @param email E-mail do cliente a ser buscado
   * @returns Dados do cliente ou null se não encontrado
   */
  async findCustomerByEmail(email: string) {
    if (!email || typeof email !== 'string') {
      throw new Error('E-mail inválido para busca de cliente');
    }

    console.log(`[Pagar.me] Buscando cliente por e-mail: ${email}`);
    
    try {
      const url = `/customers?email=${encodeURIComponent(email)}`;
      
      console.log('[Pagar.me] Enviando requisição para:', url);
      
      const response = await api.get(url, {
        pagarmeApiKey: config.pagarme.apiKey,
        params: {
          _t: Date.now(),
          email: encodeURIComponent(email)
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Accept': 'application/json'
        }
      });
      
      const hasData = response.data?.data?.length > 0;
      
      console.log(`[Pagar.me] Resposta da busca por cliente (${response.status}):`, {
        hasData,
        customerId: hasData ? response.data.data[0].id : 'não encontrado'
      });
      
      // Retorna o primeiro cliente encontrado ou null se não houver resultados
      return hasData ? response.data.data[0] : null;
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      
      // Log detalhado do erro
      console.error('[Pagar.me] Erro ao buscar cliente:', {
        email,
        status: error.response?.status,
        message: errorMessage,
        url: error.config?.url,
        method: error.config?.method,
        responseData: error.response?.data
      });
      
      // Se for um erro 404 (não encontrado), retorna null
      if (error.response?.status === 404) {
        console.log('[Pagar.me] Cliente não encontrado (404)');
        return null;
      }
      
      // Se for um erro 500, tenta extrair mais informações
      if (error.response?.status === 500) {
        const errorDetails = error.response?.data?.errors?.[0]?.message || 
                           error.response?.data?.message || 
                           'Erro interno no servidor';
        throw new Error(`Falha na busca do cliente: ${errorDetails}`);
      }
      
      // Para outros erros, lança uma exceção com a mensagem de erro
      throw new Error(`Erro ao buscar cliente: ${errorMessage}`);
    }
  },

  /**
   * Cria um novo cliente na API do Pagar.me
   * @param customerData Dados do cliente a ser criado
   * @returns Dados do cliente criado
   */
  async createCustomer(customerData: Omit<CustomerData, 'metadata'>) {
    console.log('Iniciando criação de cliente...');
    
    // Declare customerPayload in the function scope so it's available in catch block
    let customerPayload;
    
    try {
      // Validar dados do cliente
      if (!customerData.name || !customerData.email || !customerData.document) {
        throw new Error('Nome, e-mail e documento são obrigatórios');
      }

      customerPayload = {
        name: customerData.name.trim(),
        email: customerData.email.trim().toLowerCase(),
        document: customerData.document.replace(/\D/g, ''), // Remove caracteres não numéricos
        document_type: customerData.document.replace(/\D/g, '').length <= 11 ? 'CPF' : 'CNPJ',
        type: customerData.type || 'individual',
        address: {
          ...customerData.address,
          zip_code: customerData.address.zip_code.replace(/\D/g, ''),
          line_1: (customerData.address.line_1 || 'Não informado').trim(),
          line_2: (customerData.address.line_2 || '').trim(),
          city: (customerData.address.city || 'São Paulo').trim(),
          state: (customerData.address.state || 'SP').trim().substring(0, 2).toUpperCase(),
          country: 'BR'
        },
        phones: customerData.phones || {
          mobile_phone: {
            country_code: '55', // Código do Brasil
            area_code: '11', // Código de área padrão
            number: '999999999' // Número padrão
          }
        },
        metadata: {
          created_via: 'pdv-mariapass',
          created_at: new Date().toISOString()
        }
      };

      console.log('[Pagar.me] Payload para criação de cliente:', JSON.stringify(customerPayload, null, 2));
      console.log('[Pagar.me] Enviando requisição para API...');

      const response = await api.post(
        '/customers',
        customerPayload,
        {
          pagarmeApiKey: config.pagarme.apiKey,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          validateStatus: (status) => status < 500 // Não rejeitar para códigos 4xx
        }
      );

      console.log('[Pagar.me] Resposta da API (status:', response.status, '):', response.data);

      if (response.status >= 400) {
        const errorMessage = response.data?.message || 
                          response.data?.errors?.[0]?.message || 
                          `Erro ${response.status} ao criar cliente`;
                           response.data?.errors?.[0]?.message || 
                           `Erro ${response.status} ao criar cliente`;
        
        console.error('Erro na API do Pagar.me:', {
          status: response.status,
          message: errorMessage,
          errors: response.data?.errors,
          requestData: customerPayload
        });
        
        throw new Error(`Erro ao criar cliente: ${errorMessage}`);
      }

      console.log('Cliente criado com sucesso:', response.data.id);
      return response.data;
      
    } catch (error: any) {
      console.error('Erro ao criar cliente:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        request: error.config?.data ? JSON.parse(error.config.data) : null
      });
      
      if (error.response?.data) {
        const apiError = error.response.data;
        const errorMessage = apiError.message || 
                           apiError.errors?.[0]?.message || 
                           'Erro ao processar a requisição';
        
        // Log detalhado do erro
        const errorDetails = [
          apiError.message,
          ...(apiError.errors || []).map((e: any) => e.message)
        ].filter(Boolean);
        
        const errorContext = {
          status: error.response.status,
          error: errorMessage,
          validationErrors: apiError.errors,
          requestData: customerPayload || 'Não disponível',
          errorDetails: errorDetails
        };
        
        console.error('Detalhes do erro da API:', errorContext);
        
        throw new Error(`Erro ao criar cliente: ${errorDetails.join('. ')}`);
      }
      
      throw new Error(`Erro ao processar criação de cliente: ${error.message}`);
    }
  },

  /**
   * Create a PIX payment order
   * @param orderData Order data
   * @returns Generated PIX data
   */
  /**
   * Cria um novo pedido com pagamento PIX
   * @param orderData Dados do pedido e pagamento
   * @returns Dados do PIX gerado
   */
  async createPixOrder(orderData: {
    customer: CustomerData;
    amount: number;
    orderCode: string;
    expiresIn?: number;
    items?: Array<{
      id?: string;
      amount: number;
      description: string;
      quantity: number;
      code?: string;
    }>;
  }): Promise<PixOrderResponse> {
    try {
      const { customer, amount, orderCode, expiresIn = 1800, items = [] } = orderData;
      
      console.log('Iniciando criação de pedido PIX...');
      console.log('Dados do pedido:', { amount, orderCode, expiresIn });

      // Valida os dados do cliente
      validateCustomerData(customer);

      // Prepara os itens do pedido
      const orderItems = items.length > 0 ? items : [
        {
          id: `item_${Date.now()}`,
          amount: Math.round(amount * 100), // Converte para centavos
          description: 'Produto ou serviço',
          quantity: 1,
          code: orderCode || `item_${Date.now()}`,
        },
      ];

      // Prepara o payload da requisição
      const payload = {
        items: orderItems.map(item => ({
          id: item.id || `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          amount: Math.round(item.amount * 100), // Garante que está em centavos
          description: (item.description || '').substring(0, 100), // Limita o tamanho da descrição
          quantity: Math.max(1, Math.min(item.quantity || 1, 100)), // Valida a quantidade
          code: item.code || `item_${Date.now()}`
        })),
        customer: {
          name: customer.name,
          email: customer.email,
          document: customer.document,
          type: customer.type || 'individual',
          document_type: customer.document_type || (customer.document?.length === 11 ? 'CPF' : 'CNPJ'),
          phones: customer.phones || {
            mobile_phone: {
              country_code: '55',
              area_code: '11',
              number: '999999999'
            }
          },
          address: customer.address || {
            line_1: 'Rua Exemplo',
            zip_code: '01310940',
            city: 'São Paulo',
            state: 'SP',
            country: 'BR'
          }
        },
        payments: [
          {
            payment_method: 'pix',
            pix: {
              expires_in: Math.min(Math.max(60, expiresIn), 86400), // Entre 1 min e 24h
              additional_information: [
                {
                  name: 'Pedido',
                  value: orderCode,
                },
              ],
            },
          },
        ],
        metadata: {
          order_id: orderCode,
          custom_id: `custom_${Date.now()}`,
          customer_id: customer.id || `temp_${Date.now()}`,
          source: 'pdv-mariapass',
          created_at: new Date().toISOString()
        }
      };

      console.log('Enviando requisição para criar pedido PIX...');
      console.log('Payload da requisição:', JSON.stringify(payload, null, 2));
      
      // Faz a requisição para a API do Pagar.me
      const response = await api.post('/orders', payload);
      
      console.log('Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      // Processa a resposta da API
      if (!response.data) {
        throw new Error('Resposta da API vazia ou inválida');
      }

      // Extrai os dados da cobrança e transação
      const charge = response.data.charges?.[0];
      if (!charge) {
        throw new Error('Nenhuma cobrança encontrada na resposta da API');
      }

      const transaction = charge.last_transaction;
      if (!transaction) {
        throw new Error('Nenhuma transação PIX encontrada na resposta da API');
      }

      // Formata a resposta final
      const pixResponse: PixOrderResponse = {
        id: response.data.id,
        orderId: response.data.id,
        chargeId: charge.id,
        charge_id: charge.id,
        transaction_id: transaction.id,
        status: charge.status || 'pending',
        amount: charge.amount ? charge.amount / 100 : amount,
        qrCode: transaction.qr_code || '',
        qr_code: transaction.qr_code || '',
        qrCodeUrl: transaction.qr_code_url || '',
        qr_code_url: transaction.qr_code_url || '',
        paymentUrl: transaction.pix_url || '',
        payment_url: transaction.pix_url || '',
        expiresAt: transaction.expires_at || new Date(Date.now() + (expiresIn * 1000)).toISOString(),
        expires_at: transaction.expires_at || new Date(Date.now() + (expiresIn * 1000)).toISOString(),
        items: orderItems.map(item => ({
          ...item,
          id: item.id || `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        })),
        charges: [{
          ...charge,
          last_transaction: {
            ...transaction,
            qr_code: transaction.qr_code || '',
            qr_code_url: transaction.qr_code_url || '',
            pix_url: transaction.pix_url || '',
            expires_at: transaction.expires_at || new Date(Date.now() + (expiresIn * 1000)).toISOString()
          }
        }],
        customer: response.data.customer,
        metadata: response.data.metadata,
        _debug: {
          rawResponse: response.data
        }
      };
      
      console.log('Resposta formatada do PIX:', JSON.stringify(pixResponse, null, 2));
      return pixResponse;
    } catch (error: any) {
      console.error('Erro ao criar pedido PIX:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        },
        stack: error.stack
      });
      
      if (error.response) {
        // Erro da API do Pagar.me
        const errorMessage = error.response.data?.message || 'Erro desconhecido da API do Pagar.me';
        const errorDetails = error.response.data?.errors?.[0]?.message || '';
        throw new Error(`Erro ao processar pagamento PIX: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        throw new Error('Não foi possível se conectar ao servidor de pagamentos. Verifique sua conexão e tente novamente.');
      } else if (error instanceof Error) {
        console.error('Erro inesperado ao processar pagamento PIX:', error);
        throw new Error(`Erro inesperado: ${error.message}`);
      } else {
        console.error('Erro desconhecido ao processar pagamento PIX:', error);
        throw new Error('Ocorreu um erro desconhecido ao processar o pagamento PIX');
      }
    }
  },

  /**
   * Create a boleto payment order
   * @param orderParams Order and payment data
   * @returns Generated boleto data
   */
  /**
   * Cria um novo pedido com pagamento por boleto
   * @param orderParams Dados do pedido e pagamento
   * @returns Dados do boleto gerado
   * @throws {Error} Em caso de erro na criação do boleto
   */
  /**
   * Cria um novo pedido com pagamento por boleto
   * @param orderParams Dados do pedido e pagamento
   * @returns Dados do boleto gerado
   * @throws {Error} Em caso de erro na criação do boleto
   */
  async createBoletoOrder(orderParams: {
    customer: CustomerData;
    amount: number;
    orderCode: string;
    dueDate: string;
    instructions: string;
    items?: Array<{
      id?: string;
      amount: number;
      description: string;
      quantity: number;
      code?: string;
    }>;
  }): Promise<BoletoOrderResponse> {
    console.log('[Pagar.me] Iniciando criação de pedido de boleto...');
    
    // Validar parâmetros iniciais
    if (!orderParams || typeof orderParams !== 'object') {
      throw new Error('Parâmetros de pedido inválidos');
    }
    
    const { customer, amount, orderCode, dueDate, instructions, items = [] } = orderParams;
    
    // Validar dados obrigatórios
    if (!customer) throw new Error('Dados do cliente são obrigatórios');
    if (!amount || amount <= 0) throw new Error('Valor do pedido deve ser maior que zero');
    if (!dueDate) throw new Error('Data de vencimento é obrigatória');
    if (!instructions) throw new Error('Instruções de pagamento são obrigatórias');
    
    try {
      // Validar dados do cliente
      console.log('[Pagar.me] Validando dados do cliente...');
      validateCustomerData(customer);
      
      // Validar itens do pedido
      if (items && items.length > 0) {
        for (const [index, item] of items.entries()) {
          if (!item.description || !item.amount || item.amount <= 0) {
            throw new Error(`Item ${index + 1} inválido: descrição e valor são obrigatórios`);
          }
        }
      }
      
      // Validar data de vencimento
      console.log('[Pagar.me] Validando data de vencimento...');
      const minDueDate = new Date();
      minDueDate.setDate(minDueDate.getDate() + 1);
      minDueDate.setHours(0, 0, 0, 0); // Zerar hora para comparar apenas a data
      
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        throw new Error('Data de vencimento inválida');
      }
      
      dueDateObj.setHours(0, 0, 0, 0); // Zerar hora para comparar apenas a data
      
      if (dueDateObj < minDueDate) {
        throw new Error('A data de vencimento deve ser pelo menos 1 dia no futuro');
      }
      
      // Formatar data para o padrão YYYY-MM-DD
      const formattedDueDate = dueDateObj.toISOString().split('T')[0];
      
      // Preparar itens do pedido
      const orderItems = items.length > 0 ? items : [
        {
          amount: Math.round(amount * 100), // Converter para centavos
          description: 'Produto/Serviço',
          quantity: 1,
          code: orderCode || `item_${Date.now()}`
        },
      ];
      
      // Preparar dados do cliente para o payload
      const customerPayload = {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        document: customer.document.replace(/\D/g, ''), // Remove caracteres não numéricos
        document_type: customer.document.replace(/\D/g, '').length <= 11 ? 'CPF' : 'CNPJ',
        type: 'individual',
        address: {
          ...customer.address,
          zip_code: customer.address.zip_code.replace(/\D/g, ''),
          line_1: (customer.address.line_1 || 'Não informado').trim(),
          line_2: (customer.address.line_2 || '').trim(),
          city: (customer.address.city || 'São Paulo').trim(),
          state: (customer.address.state || 'SP').trim().substring(0, 2).toUpperCase(),
          country: 'BR'
        },
        phones: customer.phones || {
          mobile_phone: {
            country_code: '55',
            area_code: '11',
            number: '999999999'
          }
        }
      };
      
      // Validar dados formatados
      if (!customerPayload.document || customerPayload.document.length < 11) {
        throw new Error('Documento do cliente inválido');
      }
      
      // Construir payload final
      const payload = {
        customer: customerPayload,
        code: orderCode || `order_${Date.now()}`,
        items: orderItems.map(item => ({
          amount: Math.round(item.amount), // Já deve estar em centavos
          description: (item.description || 'Produto/Serviço').substring(0, 100),
          quantity: item.quantity || 1,
          code: item.code || `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        })),
        payments: [
          {
            payment_method: 'boleto',
            boleto: {
              due_date: formattedDueDate,
              instructions: (instructions || 'Pagar até a data de vencimento').substring(0, 255),
              type: 'DM', // Duplicata Mercantil
              document_number: `BOL${Date.now()}`
            }
          }
        ],
        metadata: {
          platform: 'pdv-mariapass',
          created_at: new Date().toISOString(),
          order_code: orderCode
        }
      };
      
      // Validar payload
      if (!payload.payments[0].boleto.due_date) {
        throw new Error('Data de vencimento é obrigatória');
      }

      console.log('Enviando requisição para API do Pagar.me...');
      console.log('Endpoint:', '/orders');
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Fazer requisição para a API
      const response = await api.post('/orders', payload, {
        pagarmeApiKey: config.pagarme.apiKey,
      }).catch(error => {
        console.error('Erro na requisição para API do Pagar.me:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers ? {
              ...error.config.headers,
              authorization: error.config.headers.authorization ? '***' : undefined
            } : undefined,
            data: error.config?.data
          }
        });
        throw error;
      });

      console.log('Resposta da API recebida:', {
        status: response.status,
        data: response.data
      });

      // Verificar se a resposta contém dados de cobrança
      if (!response.data.charges || response.data.charges.length === 0) {
        console.error('Resposta da API não contém dados de cobrança:', response.data);
        throw new Error('A resposta da API não contém dados de cobrança');
      }

      const charge = response.data.charges[0];
      const boletoData = charge.last_transaction;

      if (!boletoData) {
        console.error('Dados do boleto não encontrados na resposta:', response.data);
        throw new Error('Dados do boleto não encontrados na resposta da API');
      }

      console.log('Boleto gerado com sucesso:', {
        boletoId: boletoData.id,
        barcode: boletoData.barcode,
        dueDate: boletoData.due_date || dueDate,
        amount: charge.amount / 100 // Converter de centavos para reais
      });

      // Formatar resposta no formato esperado
      const responseData = {
        id: charge.id,
        code: response.data.code,
        status: charge.status,
        amount: charge.amount,
        customer: customer,
        payment_method: 'boleto',
        boleto: {
          url: boletoData.url,
          barcode: boletoData.barcode,
          barcode_url: boletoData.barcode_url,
          due_date: boletoData.due_date || dueDate,
          instructions: boletoData.instructions || instructions,
        },
        charges: response.data.charges,
      };

      return responseData;
    } catch (error) {
      console.error('Erro ao gerar boleto:', error);
      
      // Melhorar tratamento de erros com mensagens mais descritivas
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<PagarmeApiError>;
        const errorMessage = axiosError.response?.data?.message || 
                           (axiosError.response?.data as any)?.errors?.[0]?.message || 
                           axiosError.message;
        
        const errorDetails = {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          requestData: axiosError.config?.data ? JSON.parse(axiosError.config.data) : undefined,
          responseData: axiosError.response?.data,
          responseHeaders: axiosError.response?.headers,
        };
        
        console.error('Detalhes do erro:', errorDetails);
        
        // Mensagens de erro mais amigáveis
        let userMessage = 'Erro ao gerar boleto';
        if (axiosError.response?.status === 401) {
          userMessage = 'Falha na autenticação com o gateway de pagamento';
        } else if (axiosError.response?.status === 400) {
          userMessage = 'Dados inválidos para geração do boleto';
        } else if (axiosError.response?.status === 500) {
          userMessage = 'Erro interno no servidor de pagamentos';
        }
        
        throw new Error(`${userMessage}: ${errorMessage}`);
      } else if (error instanceof Error) {
        console.error('Erro ao processar boleto:', error);
        throw new Error(`Erro ao processar boleto: ${error.message}`);
      } else {
        console.error('Erro desconhecido ao processar boleto:', error);
        throw new Error('Ocorreu um erro inesperado ao processar o boleto');
      }
    }
  }
};

export default pagarmeApi;
