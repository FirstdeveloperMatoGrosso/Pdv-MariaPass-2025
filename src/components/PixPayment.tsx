
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
import { useSystemConfig } from '@/hooks/useSystemConfig';

interface PixPaymentProps {
  valor: number;
  recargaId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const PixPayment: React.FC<PixPaymentProps> = ({ 
  valor, 
  recargaId, 
  onPaymentSuccess, 
  onCancel 
}) => {
  const [pixData, setPixData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'generating' | 'waiting' | 'expired' | 'paid'>('generating');
  const { getConfigValue } = useSystemConfig('pix');

  const generatePixCode = async () => {
    try {
      const chavePix = getConfigValue('chave_pix') || 'exemplo@email.com';
      const nomeRecebedor = getConfigValue('nome_recebedor') || 'Maria Pass Sistema';
      const cidadeRecebedor = getConfigValue('cidade_recebedor') || 'São Paulo';
      const expiracaoMinutos = getConfigValue('expiracao_minutos') || 15;
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiracaoMinutos);
      
      // Gerar código PIX simples (em produção seria uma integração real)
      const pixCode = generateBRCode(chavePix, nomeRecebedor, cidadeRecebedor, valor);
      
      const { data, error } = await supabase
        .from('transacoes_pix')
        .insert({
          recarga_id: recargaId,
          qr_code: pixCode,
          chave_pix: chavePix,
          valor: valor,
          expira_em: expiresAt.toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setPixData(data);
      setTimeLeft(expiracaoMinutos * 60); // em segundos
      setStatus('waiting');
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar código PIX');
    }
  };

  const generateBRCode = (chave: string, nome: string, cidade: string, valor: number) => {
    // Simulação de geração de BR Code (em produção usar biblioteca específica)
    return `00020126${chave.length.toString().padStart(2, '0')}${chave}5204000053039865802BR5913${nome}6009${cidade}62070503***6304`;
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success('Código PIX copiado!');
    }
  };

  const checkPaymentStatus = async () => {
    if (!pixData?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('transacoes_pix')
        .select('status, pago_em')
        .eq('id', pixData.id)
        .single();
      
      if (error) throw error;
      
      if (data.status === 'pago') {
        setStatus('paid');
        toast.success('Pagamento confirmado!');
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    }
  };

  useEffect(() => {
    generatePixCode();
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
      const interval = setInterval(checkPaymentStatus, 5000);
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

          {status === 'waiting' && (
            <>
              <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
                <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Código PIX Copia e Cola:</p>
                <div className="bg-gray-50 p-2 rounded border text-xs break-all">
                  {pixData?.qr_code}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyPixCode}
                  className="w-full"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar Código
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
              <p className="text-sm text-red-600">O código PIX expirou</p>
              <Button 
                onClick={generatePixCode}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
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
