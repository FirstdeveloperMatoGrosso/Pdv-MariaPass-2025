
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  ArrowLeft,
  Banknote,
  FileText
} from 'lucide-react';
import PixPayment from './PixPayment';
import CashPayment from './CashPayment';
import BoletoPayment from './BoletoPayment';
import { CustomerData, PaymentMethod, PaymentResponse } from '@/types/payment';

interface PaymentProviderSelectorProps {
  valor: number;
  recargaId: string;
  onPaymentSuccess: (response: PaymentResponse) => void;
  onCancel: () => void;
  customer?: CustomerData;
}

// Cliente padrão para pagamentos PIX
const DEFAULT_CUSTOMER: CustomerData = {
  name: 'Cliente PDV',
  email: 'cliente@pdv.com',
  document: '00000000000', // CPF genérico
  document_type: 'CPF',
  type: 'individual',
  phones: {
    mobile_phone: {
      country_code: '55',
      area_code: '11',
      number: '999999999',
    },
  },
  address: {
    line_1: 'Rua do Cliente, 123',
    line_2: 'Sala 1 - Centro',
    zip_code: '01001000',
    city: 'São Paulo',
    state: 'SP',
    country: 'BR'
  },
  metadata: {
    source: 'pdv-mariapass',
  },
};

const PaymentProviderSelector: React.FC<PaymentProviderSelectorProps> = ({ 
  valor, 
  recargaId, 
  onPaymentSuccess, 
  onCancel,
  customer = DEFAULT_CUSTOMER // Usa o cliente padrão se não for fornecido
}) => {
  const [selectedProvider, setSelectedProvider] = useState<PaymentMethod | null>(null);

  const providers = [
    {
      id: 'dinheiro' as const,
      name: 'Dinheiro',
      description: 'Pagamento em espécie',
      icon: Banknote,
      color: 'bg-green-500 hover:bg-green-600',
      badge: 'Imediato'
    },
    {
      id: 'pix' as const,
      name: 'PIX',
      description: 'PIX tradicional',
      icon: CreditCard,
      color: 'bg-blue-500 hover:bg-blue-600',
      badge: 'Rápido'
    },
    {
      id: 'boleto' as const,
      name: 'Boleto',
      description: 'Boleto bancário',
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600',
      badge: 'Até 3 dias úteis'
    }
  ];

  const createSuccessResponse = (method: PaymentMethod, additionalData: Partial<PaymentResponse> = {}): PaymentResponse => ({
    success: true,
    status: 'paid',
    method,
    amount: valor,
    orderId: recargaId,
    ...additionalData
  });

  if (selectedProvider === 'dinheiro') {
    return (
      <div className="space-y-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedProvider(null)}
          className="flex items-center space-x-1 text-sm"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Voltar à seleção</span>
        </Button>
        <CashPayment 
          valor={valor}
          recargaId={recargaId}
          onPaymentSuccess={() => onPaymentSuccess(createSuccessResponse('dinheiro'))}
          onCancel={onCancel}
        />
      </div>
    );
  }

  if (selectedProvider === 'pix') {
    return (
      <div className="space-y-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedProvider(null)}
          className="flex items-center space-x-1 text-sm"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Voltar à seleção</span>
        </Button>
        <PixPayment 
          valor={valor}
          recargaId={recargaId}
          customer={customer}
          onPaymentSuccess={(response) => onPaymentSuccess(
            createSuccessResponse('pix', response as Partial<PaymentResponse>)
          )}
          onCancel={onCancel}
        />
      </div>
    );
  }

  if (selectedProvider === 'boleto') {
    return (
      <div className="space-y-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedProvider(null)}
          className="flex items-center space-x-1 text-sm"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Voltar à seleção</span>
        </Button>
        <BoletoPayment 
          valor={valor}
          recargaId={recargaId}
          customer={customer}
          onPaymentSuccess={(response) => onPaymentSuccess(
            createSuccessResponse('boleto', response as Partial<PaymentResponse>)
          )}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="p-3">
        <CardTitle className="text-center text-base">
          Escolha o método de pagamento
        </CardTitle>
        <p className="text-center text-sm text-gray-600">
          Valor: <span className="font-bold text-green-600">R$ {valor.toFixed(2)}</span>
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-3">
          {providers.map((provider) => {
            const IconComponent = provider.icon;
            return (
              <Button
                key={provider.id}
                variant="outline"
                className="w-full h-auto p-4 flex items-center justify-between hover:border-2"
                onClick={() => setSelectedProvider(provider.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${provider.color} text-white`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {provider.badge}
                </Badge>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="w-full text-sm"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentProviderSelector;
