
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, X } from 'lucide-react';

interface QRCodeGeneratorProps {
  orderId: string;
  amount: number;
  onClose: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ orderId, amount, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Simula geração do QR Code
    setTimeout(() => {
      const deeplink = `stone://payment?amount=${Math.round(amount * 100)}&transactionId=${orderId}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deeplink)}`;
      setQrCodeUrl(qrUrl);
      setIsLoading(false);
    }, 1500);
  }, [orderId, amount]);

  return (
    <Card className="bg-white shadow-xl border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span>QR Code para Pagamento</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-gray-600">Gerando QR Code...</p>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <img 
                src={qrCodeUrl} 
                alt="QR Code para pagamento" 
                className="w-64 h-64 mx-auto"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Pedido: #{orderId}</p>
              <p className="text-lg font-semibold">Total: R$ {amount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                Escaneie o QR Code com o app Stone para pagar
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-orange-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Aguardando pagamento...</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
