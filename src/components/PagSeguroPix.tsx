
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
  const { getConfigValue } = useSystemConfig('pagseguro');

  const generatePagSeguroPix = async () => {
    try {
      console.log('🏦 Gerando PIX PagSeguro para valor:', valor);
      
      const apiKey = getConfigValue('api_key') || 'DEMO_API_KEY';
      const isSandbox = getConfigValue('sandbox') || true;
      const expiracaoMinutos = getConfigValue('expiracao_minutos') || 15;
      
      const baseUrl = isSandbox 
        ? 'https://sandbox.api.pagseguro.com'
        : 'https://api.pagseguro.com';
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiracaoMinutos);
      
      // Payload para PagSeguro PIX
      const pixPayload = {
        reference_id: `recarga_${recargaId}`,
        description: `Recarga de pulseira - R$ ${valor.toFixed(2)}`,
        amount: {
          value: Math.round(valor * 100), // PagSeguro trabalha com centavos
          currency: 'BRL'
        },
        payment_method: {
          type: 'PIX',
          pix: {
            expiration_date: expiresAt.toISOString()
          }
        },
        notification_urls: [
          `${window.location.origin}/webhook/pagseguro`
        ]
      };
      
      console.log('📤 Enviando request para PagSeguro:', pixPayload);
      
      // Simulação de resposta do PagSeguro para desenvolvimento
      const mockResponse = {
        id: `PIX_${Date.now()}`,
        reference_id: pixPayload.reference_id,
        status: 'WAITING',
        amount: pixPayload.amount,
        qr_codes: [{
          id: `QR_${Date.now()}`,
          text: generateBRCode(valor),
          links: [{
            media: 'image/png',
            href: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateBRCode(valor))}`
          }]
        }],
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      };
      
      // Em produção, substituir por chamada real à API
      /*
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pixPayload)
      });
      
      if (!response.ok) {
        throw new Error(`Erro PagSeguro: ${response.status}`);
      }
      
      const mockResponse = await response.json();
      */
      
      // Salvar transação no banco
      const { data, error } = await supabase
        .from('transacoes_pix')
        .insert({
          recarga_id: recargaId,
          qr_code: mockResponse.qr_codes[0].text,
          chave_pix: 'pagseguro_pix',
          valor: valor,
          expira_em: expiresAt.toISOString(),
          status: 'aguardando'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setPixData({
        ...data,
        pagseguro_id: mockResponse.id,
        qr_image: mockResponse.qr_codes[0].links[0].href
      });
      
      setTimeLeft(expiracaoMinutos * 60);
      setStatus('waiting');
      
      console.log('✅ PIX PagSeguro gerado com sucesso:', mockResponse);
      toast.success('PIX PagSeguro gerado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar PIX PagSeguro:', error);
      toast.error('Erro ao gerar PIX PagSeguro: ' + error.message);
      setStatus('expired');
    }
  };

  const generateBRCode = (valor: number) => {
    // Geração simplificada de BR Code para desenvolvimento
    const timestamp = Date.now().toString().slice(-8);
    return `00020126580014br.gov.bcb.pix0136${timestamp}5204000053039865802BR5925Maria Pass Sistema PagSeg6009SAO PAULO62070503***6304${timestamp}`;
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
      // Verificar status no banco de dados local
      const { data, error } = await supabase
        .from('transacoes_pix')
        .select('status, pago_em')
        .eq('id', pixData.id)
        .single();
      
      if (error) throw error;
      
      if (data.status === 'pago') {
        setStatus('paid');
        toast.success('💰 Pagamento PIX confirmado via PagSeguro!');
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
      
      // Em produção, também consultar API do PagSeguro
      /*
      const apiKey = getConfigValue('api_key');
      const isSandbox = getConfigValue('sandbox') || true;
      const baseUrl = isSandbox 
        ? 'https://sandbox.api.pagseguro.com'
        : 'https://api.pagseguro.com';
      
      const response = await fetch(`${baseUrl}/orders/${pixData.pagseguro_id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      const orderData = await response.json();
      
      if (orderData.status === 'PAID') {
        // Atualizar status no banco local
        await supabase
          .from('transacoes_pix')
          .update({ 
            status: 'pago',
            pago_em: new Date().toISOString()
          })
          .eq('id', pixData.id);
        
        setStatus('paid');
        toast.success('💰 Pagamento confirmado via PagSeguro!');
        setTimeout(onPaymentSuccess, 2000);
      }
      */
      
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
