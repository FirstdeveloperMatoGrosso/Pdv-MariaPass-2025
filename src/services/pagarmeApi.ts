import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
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

// Add request interceptor para log
api.interceptors.request.use(
  (config) => {
    console.log('Enviando requisição para:', config.url);
    return config;
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log('Resposta recebida:', response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status fora do range 2xx
      console.error('Erro na resposta:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor:', error.request);
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error('Erro ao configurar a requisição:', error.message);
    }
    
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
  // Find customer by email
  async findCustomerByEmail(email: string) {
    try {
      const response = await api.get(`/customers?email=${encodeURIComponent(email)}`, {
        pagarmeApiKey: config.pagarme.apiKey,
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding customer by email:', error);
      throw error;
    }
  },

  // Create a new customer
  async createCustomer(customerData: Omit<CustomerData, 'metadata'>) {
    try {
      validateCustomerData(customerData as CustomerData);

      const response = await api.post(
        '/customers',
        {
          ...customerData,
          code: customerData.document.replace(/\D/g, ''), // Remove non-numeric characters
        },
        {
          pagarmeApiKey: config.pagarme.apiKey,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
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
          amount: Math.round(amount * 100), // Converte para centavos
          description: 'Produto ou serviço',
          quantity: 1,
          code: orderCode || `item_${Date.now()}`,
        },
      ];

      // Prepara o payload da requisição exatamente como na imagem
      const payload = {
        items: orderItems.map(item => ({
          amount: Math.round(item.amount * 100), // Garante que está em centavos
          description: item.description.substring(0, 100), // Limita o tamanho da descrição
          quantity: Math.max(1, Math.min(item.quantity || 1, 100)), // Valida a quantidade
          code: item.code || `item_${Date.now()}`
        })),
        customer: {
          name: customer.name,
          email: customer.email,
          document: customer.document,
          type: customer.type || 'individual',
          document_type: customer.document_type || (customer.document?.length === 11 ? 'CPF' : 'CNPJ'),
          phones: {
            mobile_phone: customer.phones?.mobile_phone || {
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
              // Usa apenas expires_in (em segundos) - a API irá calcular a data de expiração
              expires_in: Math.min(Math.max(60, expiresIn), 86400), // Entre 1 min e 24h
              // A API irá calcular o expires_at automaticamente com base no expires_in
              additional_information: [
                {
                  name: 'Pedido',
                  value: orderCode,
                },
              ],
            },
          },
        ],
        // Adiciona metadados como na imagem
        metadata: {
          order_id: orderCode,
          custom_id: `custom_${Date.now()}`,
          // Adiciona metadados adicionais do cliente
          customer_id: customer.id || `temp_${Date.now()}`,
          source: 'pdv-mariapass',
          created_at: new Date().toISOString()
        }
      };

      console.log('Enviando requisição para criar pedido PIX...');
      
      // Faz a requisição para a API do Pagar.me
      const response = await api.post('/orders', payload);
      
      console.log('Resposta da API:', response.data);

      // Verifica se a resposta contém os dados do PIX
      if (!response.data.charges || !Array.isArray(response.data.charges) || response.data.charges.length === 0) {
        throw new Error('A resposta da API não contém dados de cobrança');
      }

      const charge = response.data.charges[0];
      const transaction = charge.last_transaction;
      
      if (!transaction) {
        throw new Error('Transação PIX não encontrada na resposta da API');
      }

      // Formata a resposta com os dados do PIX seguindo o formato da imagem
      const pixResponse: PixOrderResponse = {
        // Identificadores
        id: response.data.id,
        orderId: response.data.id,
        chargeId: charge.id,
        charge_id: charge.id,
        transaction_id: transaction.id,
        
        // Status e valores
        status: charge.status || 'pending',
        amount: charge.amount ? charge.amount / 100 : amount, // Converte de volta para reais
        
        // Dados do PIX - agora acessando os campos corretos da resposta
        qrCode: transaction.qr_code || '',
        qr_code: transaction.qr_code || '',
        qrCodeUrl: transaction.qr_code_url || '',
        qr_code_url: transaction.qr_code_url || '',
        paymentUrl: transaction.pix_url || '',
        payment_url: transaction.pix_url || '',
        expiresAt: transaction.expires_at || new Date(Date.now() + (expiresIn * 1000)).toISOString(),
        expires_at: transaction.expires_at || new Date(Date.now() + (expiresIn * 1000)).toISOString(),
        
        // Itens do pedido (garantindo que tenham IDs)
        items: orderItems.map(item => ({
          ...item,
          id: item.id || `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        })),
        
        // Dados da cobrança
        charges: [{
          ...charge,
          last_transaction: {
            ...transaction,
            // Garante que os campos estejam presentes mesmo que vazios
            qr_code: transaction.qr_code || '',
            qr_code_url: transaction.qr_code_url || '',
            pix_url: transaction.pix_url || '',
            expires_at: transaction.expires_at || new Date(Date.now() + (expiresIn * 1000)).toISOString(),
          }
        }],
        
        // Metadados
        metadata: {
          ...(response.data.metadata || {}),
          order_id: orderCode,
          created_at: new Date().toISOString(),
          source: 'pdv-mariapass',
        },
        
        // Depuração (apenas em desenvolvimento)
        _debug: process.env.NODE_ENV === 'development' ? {
          rawResponse: response.data,
          requestPayload: payload
        } : undefined
      };
      
      console.log('Pedido PIX criado com sucesso:', pixResponse);
      return pixResponse;
    } catch (error) {
      console.error('Erro ao criar pedido PIX:', error);
      
      // Melhora as mensagens de erro
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<PagarmeApiError>;
        const errorMessage = axiosError.response?.data?.message || 
                           axiosError.response?.data?.errors?.[0]?.message || 
                           axiosError.message;
        
        console.error('Error details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
        });
        
        throw new Error(`Error creating PIX order: ${errorMessage}`);
      } else if (error instanceof Error) {
        console.error('Unexpected error processing PIX payment:', error);
        throw new Error(`Unexpected error: ${error.message}`);
      } else {
        console.error('Unknown error processing PIX payment:', error);
        throw new Error('An unknown error occurred while processing the PIX payment');
      }
    }
  },

  /**
   * Create a boleto payment order
   * @param orderParams Order and payment data
   * @returns Generated boleto data
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
    try {
      const { customer, amount, orderCode, dueDate, instructions, items = [] } = orderParams;

      // Validate customer data
      validateCustomerData(customer);

      // Find or create customer
      let customerId = customer.id;
      if (!customerId) {
        const existingCustomer = await this.findCustomerByEmail(customer.email);
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const newCustomer = await this.createCustomer(customer);
          customerId = newCustomer.id;
        }
      }

      // Prepare order items
      const orderItems = items.length > 0 ? items : [
        {
          amount,
          description: 'Product or service',
          quantity: 1,
        },
      ];

      // Build request payload
      const payload = {
        customer_id: customerId,
        items: orderItems,
        payments: [
          {
            payment_method: 'boleto',
            boleto: {
              due_date: dueDate,
              instructions: instructions,
              customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                type: customer.type,
                address: customer.address,
                phones: customer.phones,
              },
            },
          },
        ],
      };

      // Make API request to create order
      const response = await api.post('/orders', payload, {
        pagarmeApiKey: config.pagarme.apiKey,
      });

      // Check if response contains boleto data
      if (!response.data.charges || response.data.charges.length === 0) {
        throw new Error('API response does not contain charge data');
      }

      const charge = response.data.charges[0];
      const boletoData = charge.last_transaction;

      if (!boletoData) {
        throw new Error('Boleto data not found in API response');
      }

      // Format response to expected format
      return {
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
    } catch (error) {
      console.error('Error generating boleto:', error);
      
      // Improve error handling with more descriptive messages
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<PagarmeApiError>;
        const errorMessage = axiosError.response?.data?.message || 
                           axiosError.response?.data?.errors?.[0]?.message || 
                           axiosError.message;
        
        console.error('Error details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
        });
        
        throw new Error(`Error generating boleto: ${errorMessage}`);
      } else if (error instanceof Error) {
        console.error('Error processing boleto:', error);
        throw new Error(`Error processing boleto: ${error.message}`);
      } else {
        console.error('Unknown error processing boleto:', error);
        throw new Error('An unexpected error occurred while processing the boleto');
      }
    }
  }
};

export default pagarmeApi;
