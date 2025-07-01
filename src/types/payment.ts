export interface CustomerData {
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
    line_2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  metadata?: Record<string, any>;
  code?: string;
}

export interface PixPaymentData {
  amount: number;
  customer: CustomerData;
  orderCode: string;
  expiresIn?: number; // minutos
}

export interface OrderItem {
  id?: string;
  amount: number;
  description: string;
  quantity: number;
  code?: string;
}

export interface PixPaymentResponse {
  // Basic response
  success: boolean;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  
  // Order information
  orderId: string;
  order_id?: string;
  
  // Charge information
  chargeId: string;
  charge_id?: string;
  
  // Transaction information
  transaction_id?: string;
  
  // Payment details
  qrCode: string;
  qr_code?: string;
  qrCodeUrl: string;
  qr_code_url?: string;
  paymentUrl?: string;
  payment_url?: string;
  expiresAt: string;
  expires_at?: string;
  amount: number;
  
  // Items
  items: OrderItem[];
  
  // Metadata
  metadata?: Record<string, any>;
  // Debug information (optional)
  _debug?: {
    rawResponse?: any;
    [key: string]: any;
  };
}

export interface PaymentStatusResponse {
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  paidAmount: number;
  paidAt: string | null;
}
