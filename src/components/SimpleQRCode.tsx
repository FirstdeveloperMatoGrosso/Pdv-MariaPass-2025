
import React from 'react';

interface SimpleQRCodeProps {
  text: string;
  size?: number;
}

const SimpleQRCode: React.FC<SimpleQRCodeProps> = ({ text, size = 100 }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  
  return (
    <img 
      src={qrUrl} 
      alt="QR Code de validação" 
      className="mx-auto"
      style={{ width: size, height: size }}
    />
  );
};

export default SimpleQRCode;
