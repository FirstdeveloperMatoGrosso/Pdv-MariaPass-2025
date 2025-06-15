
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Building,
  ArrowLeft
} from 'lucide-react';
import PixPayment from './PixPayment';
import PagSeguroPix from './PagSeguroPix';

interface PaymentProviderSelectorProps {
  valor: number;
  recargaId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const PaymentProviderSelector: React.FC<PaymentProviderSelectorProps> = ({ 
  valor, 
  recargaId, 
  onPaymentSuccess, 
  onCancel 
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'pagseguro' | 'default' | null>(null);

  const providers = [
    {
      id: 'pagseguro' as const,
      name: 'PagSeguro',
      description: 'PIX via PagSeguro',
      icon: Building,
      color: 'bg-orange-500 hover:bg-orange-600',
      badge: 'Recomendado'
    },
    {
      id: 'default' as const,
      name: 'PIX Simples',
      description: 'PIX tradicional',
      icon: CreditCard,
      color: 'bg-blue-500 hover:bg-blue-600',
      badge: 'Básico'
    }
  ];

  if (selectedProvider === 'pagseguro') {
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
        <PagSeguroPix 
          valor={valor}
          recargaId={recargaId}
          onPaymentSuccess={onPaymentSuccess}
          onCancel={onCancel}
        />
      </div>
    );
  }

  if (selectedProvider === 'default') {
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
          onPaymentSuccess={onPaymentSuccess}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="p-3">
        <CardTitle className="text-center text-base">
          Escolha o método de pagamento PIX
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
