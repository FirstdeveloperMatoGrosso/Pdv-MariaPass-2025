
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, 
  Check, 
  X, 
  Calculator,
  ArrowLeft
} from 'lucide-react';

interface CashPaymentProps {
  valor: number;
  recargaId: string;
  onPaymentSuccess: (paymentData?: { method: string; nsu?: string }) => void;
  onCancel: () => void;
}

const CashPayment: React.FC<CashPaymentProps> = ({ 
  valor, 
  recargaId, 
  onPaymentSuccess, 
  onCancel 
}) => {
  const [valorRecebido, setValorRecebido] = useState('');
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);

  const valorRecebidoNum = parseFloat(valorRecebido) || 0;
  const troco = valorRecebidoNum - valor;
  const valorSuficiente = valorRecebidoNum >= valor;

  const handleConfirmarPagamento = () => {
    if (!valorSuficiente) {
      return;
    }
    
    const nsu = `CASH${Date.now().toString().slice(-8)}`;
    
    console.log('💵 Pagamento em dinheiro confirmado:', {
      pedido: recargaId,
      valor_total: valor,
      valor_recebido: valorRecebidoNum,
      troco: troco,
      nsu: nsu
    });
    
    setPagamentoConfirmado(true);
    
    // Simular um pequeno delay para dar feedback visual
    setTimeout(() => {
      onPaymentSuccess({ method: 'Dinheiro', nsu });
    }, 1500);
  };

  if (pagamentoConfirmado) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="p-3 bg-green-50">
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <Check className="w-5 h-5" />
            <span>Pagamento Confirmado</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <div className="space-y-3">
            <div className="text-2xl">✅</div>
            <p className="text-sm">Pagamento em dinheiro recebido com sucesso!</p>
            
            <div className="bg-gray-50 p-3 rounded-lg text-left text-sm">
              <p><strong>Valor Total:</strong> R$ {valor.toFixed(2)}</p>
              <p><strong>Valor Recebido:</strong> R$ {valorRecebidoNum.toFixed(2)}</p>
              {troco > 0 && (
                <p className="text-orange-600"><strong>Troco:</strong> R$ {troco.toFixed(2)}</p>
              )}
            </div>
            
            <p className="text-xs text-gray-600">
              Processando impressão do comprovante...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Banknote className="w-5 h-5 text-green-600" />
            <span>Pagamento em Dinheiro</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-4">
          <div className="text-center bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Valor Total do Pedido</p>
            <p className="text-2xl font-bold text-blue-600">R$ {valor.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Pedido: {recargaId}</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Valor Recebido do Cliente
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                type="number"
                placeholder="0,00"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                className="pl-10 text-lg font-semibold"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
          </div>
          
          {valorRecebido && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Valor Total:</span>
                <span className="font-semibold">R$ {valor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Valor Recebido:</span>
                <span className="font-semibold">R$ {valorRecebidoNum.toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-sm font-bold">
                <span>Troco:</span>
                <span className={troco >= 0 ? 'text-green-600' : 'text-red-600'}>
                  R$ {Math.max(0, troco).toFixed(2)}
                </span>
              </div>
              
              {!valorSuficiente && valorRecebido && (
                <div className="text-xs text-red-600 mt-2">
                  ⚠️ Valor insuficiente. Faltam R$ {Math.abs(troco).toFixed(2)}
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            
            <Button 
              onClick={handleConfirmarPagamento}
              disabled={!valorSuficiente}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirmar
            </Button>
          </div>
          
          {valorSuficiente && troco > 0 && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Troco a devolver: R$ {troco.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CashPayment;
