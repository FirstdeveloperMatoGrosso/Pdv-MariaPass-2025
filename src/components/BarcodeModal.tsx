
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BarcodeScanner from './BarcodeScanner';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface BarcodeModalProps {
  open: boolean;
  onClose: () => void;
  onProductScanned?: (product: Product) => void;
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({ open, onClose, onProductScanned }) => {
  const [lastProduct, setLastProduct] = useState<Product | null>(null);

  function handleProduct(product: Product) {
    setLastProduct(product);
    if (onProductScanned) {
      onProductScanned(product);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leitura de Código de Barras</DialogTitle>
        </DialogHeader>
        <BarcodeScanner onProductScanned={handleProduct} />
        {lastProduct && (
          <div className="mt-4 p-3 border rounded bg-green-50 flex flex-col gap-2">
            <span className="font-bold text-green-700">Produto lido:</span>
            <div className="flex flex-col gap-1">
              <span>Nome: <b>{lastProduct.name}</b></span>
              <span>Preço: <Badge>R$ {lastProduct.price.toFixed(2)}</Badge></span>
              <span>Código de barras: <code className="bg-gray-100 px-2">{lastProduct.barcode}</code></span>
            </div>
            <DialogClose asChild>
              <Button variant="secondary" className="mt-2">Fechar</Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeModal;
