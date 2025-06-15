
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Copy,
  Clock,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PagSeguroPixProps {
  valor: number;
  recargaId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const PagSeguroPix: React.FC<PagSeguroPixProps> = ({ 
  valor, 
  recargaId, 
  onPaymentSuccess, 
  onCancel 
}) => {
  const [pixData, setPixData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'generating' | 'waiting' | 'expired' | 'paid'>('generating');

  const generatePagSeguroPix = async () => {
    try {
      console.log('🏦 Gerando PIX PagBank para valor:', valor);
      
      // Chamar Edge Function para gerar PIX PagSeguro
      const { data, error } = await supabase.functions.invoke('generate-pagseguro-pix', {
        body: {
          valor: valor,
          recargaId: recargaId,
          description: `Recarga de pulseira - R$ ${valor.toFixed(2)}`
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw new Error(error.message || 'Erro ao gerar PIX PagSeguro');
      }

      if (!data) {
        throw new Error('Resposta vazia da Edge Function');
      }

      console.log('✅ PIX PagSeguro gerado:', data);
      
      // Salvar transação no banco
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      const { data: transacaoData, error: transacaoError } = await supabase
        .from('transacoes_pix')
        .insert({
          recarga_id: recargaId,
          qr_code: data.qr_code,
          chave_pix: 'pagseguro_pix',
          valor: valor,
          expira_em: expiresAt.toISOString(),
          status: 'aguardando'
        })
        .select()
        .single();
      
      if (transacaoError) throw transacaoError;
      
      setPixData({
        ...transacaoData,
        pagseguro_id: data.pagseguro_id,
        qr_image: data.qr_image
      });
      
      setTimeLeft(15 * 60); // 15 minutos
      setStatus('waiting');
      
      toast.success('PIX PagSeguro gerado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar PIX PagSeguro:', error);
      toast.error('Erro ao gerar PIX PagSeguro: ' + error.message);
      setStatus('expired');
    }
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success('Código PIX copiado para área de transferência!');
    }
  };

  const checkPagSeguroPayment = async () => {
    if (!pixData?.pagseguro_id) return;
    
    try {
      // Verificar status via Edge Function
      const { data, error } = await supabase.functions.invoke('check-pagseguro-payment', {
        body: {
          pagseguro_id: pixData.pagseguro_id,
          transaction_id: pixData.id
        }
      });
      
      if (error) {
        console.error('Erro ao verificar pagamento:', error);
        return;
      }
      
      if (data?.status === 'paid') {
        setStatus('paid');
        toast.success('💰 Pagamento PIX confirmado via PagSeguro!');
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Erro ao verificar pagamento PagSeguro:', error);
    }
  };

  useEffect(() => {
    generatePagSeguroPix();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && status === 'waiting') {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && status === 'waiting') {
      setStatus('expired');
    }
  }, [timeLeft, status]);

  useEffect(() => {
    if (status === 'waiting') {
      const interval = setInterval(checkPagSeguroPayment, 3000);
      return () => clearInterval(interval);
    }
  }, [status, pixData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'generating':
        return { color: 'bg-blue-100 text-blue-800', text: 'Gerando PIX PagSeguro...' };
      case 'waiting':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Aguardando Pagamento' };
      case 'expired':
        return { color: 'bg-red-100 text-red-800', text: 'Expirado' };
      case 'paid':
        return { color: 'bg-green-100 text-green-800', text: 'Pago via PagSeguro' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Desconhecido' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="w-full max-w-md mx-auto border-2 border-orange-200">
      <CardHeader className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2 text-base">
            <QrCode className="w-5 h-5 text-orange-600" />
            <span>PIX PagSeguro</span>
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

          {status === 'waiting' && (
            <>
              <div className="bg-white p-4 border-2 border-orange-200 rounded-lg">
                {pixData?.qr_image ? (
                  <img 
                    src={pixData.qr_image} 
                    alt="QR Code PIX PagSeguro" 
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Código PIX Copia e Cola:</p>
                <div className="bg-orange-50 p-2 rounded border text-xs break-all">
                  {pixData?.qr_code}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyPixCode}
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar Código PIX
                </Button>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Expira em: {formatTime(timeLeft)}</span>
              </div>
            </>
          )}

          {status === 'expired' && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">O PIX PagSeguro expirou</p>
              <Button 
                onClick={generatePagSeguroPix}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Gerar Novo PIX
              </Button>
            </div>
          )}

          {status === 'paid' && (
            <div className="space-y-3">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <p className="text-green-600 font-semibold">Pagamento Confirmado via PagSeguro!</p>
              <p className="text-sm text-gray-600">Processando recarga...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PagSeguroPix;
