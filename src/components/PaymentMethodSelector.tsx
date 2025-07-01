
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, X, Banknote } from 'lucide-react';

interface PaymentMethodSelectorProps {
  onSelectMethod: (method: 'pix' | 'dinheiro') => void;
  onCancel: () => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
  onSelectMethod, 
  onCancel 
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2 text-base">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Escolha o Método de Pagamento</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-3">
          <Button 
            onClick={() => onSelectMethod('dinheiro')} 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            💵 Pagamento em Dinheiro
          </Button>
          
          <Button 
            onClick={() => onSelectMethod('pix')} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            💰 PAGAMENTO VIA PIX
          </Button>
          
          {/* Botão para futura implementação de outros métodos de pagamento */}
          <Button 
            variant="outline"
            className="w-full opacity-50 cursor-not-allowed"
            disabled
          >
            🟢 Outros métodos em breve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
