
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
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

  function handleClose() {
    setLastProduct(null); // Limpa para próxima leitura
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="text-blue-800">Leitura de Produto (Código de Barras)</span>
          </DialogTitle>
          <DialogDescription>
            {!lastProduct
              ? <span className="text-sm text-gray-800">Aponte o leitor para o <b>código de barras</b> do produto ou digite manualmente.<br />Após leitura, os dados aparecerão abaixo.</span>
              : <span className="text-green-800">Produto lido com sucesso! Confira os detalhes e clique em Fechar para adicionar outro produto.</span>
            }
          </DialogDescription>
        </DialogHeader>
        <div>
          <BarcodeScanner onProductScanned={handleProduct} />
        </div>
        {!lastProduct && (
          <div className="mt-4 p-3 border border-dashed rounded bg-yellow-50 text-yellow-900 flex flex-col gap-2 text-center animate-pulse">
            <span className="font-bold text-yellow-700">Aguardando leitura do código de barras...</span>
            <span className="text-xs">Use o leitor ou digite e pressione Enter.</span>
          </div>
        )}
        {lastProduct && (
          <div className="mt-4 p-3 border rounded bg-green-50 flex flex-col gap-2 animate-fade-in">
            <span className="font-bold text-green-700">Produto encontrado:</span>
            <div className="flex flex-col gap-1">
              <span>Nome: <b>{lastProduct.name}</b></span>
              <span>Preço: <Badge>R$ {lastProduct.price.toFixed(2)}</Badge></span>
              <span>Código de barras: <code className="bg-gray-100 px-2">{lastProduct.barcode}</code></span>
            </div>
            <DialogClose asChild>
              <Button variant="secondary" className="mt-2" onClick={handleClose}>
                Fechar
              </Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeModal;
