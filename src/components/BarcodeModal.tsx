
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from '@/components/ui/dialog';
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
          <DialogDescription>
            {lastProduct
              ? "Produto lido com sucesso. Confirme os detalhes."
              : "Aponte o leitor para o código de barras do produto ou digite manualmente abaixo para adicionar ao carrinho."}
          </DialogDescription>
        </DialogHeader>
        <div>
          <BarcodeScanner onProductScanned={handleProduct} />
        </div>
        {!lastProduct && (
          <div className="mt-4 p-3 border border-dashed rounded bg-yellow-50 text-yellow-900 flex flex-col gap-2 text-center animate-pulse">
            <span className="font-bold text-yellow-700">Aguardando leitura do código de barras...</span>
            <span className="text-xs">Utilize o leitor ou digite o código manualmente e pressione enter ou o botão ao lado.</span>
          </div>
        )}
        {lastProduct && (
          <div className="mt-4 p-3 border rounded bg-green-50 flex flex-col gap-2 animate-fade-in">
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

