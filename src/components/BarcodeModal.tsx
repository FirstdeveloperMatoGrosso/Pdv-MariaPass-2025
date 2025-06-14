
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SimpleBarcodeInput from './SimpleBarcodeInput';
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
    setLastProduct(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="text-blue-800">Adicionar Produto por Código de Barras</span>
          </DialogTitle>
          <DialogDescription>
            {!lastProduct
              ? <span className="text-sm text-gray-600">Use o leitor de código de barras ou digite manualmente o código do produto.</span>
              : <span className="text-green-700">✅ Produto adicionado com sucesso! Você pode fechar o modal ou adicionar outro produto.</span>
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <SimpleBarcodeInput onProductScanned={handleProduct} />
        </div>

        {!lastProduct && (
          <div className="mt-4 p-3 border border-dashed rounded bg-blue-50 text-blue-800 text-center">
            <span className="font-medium">⏳ Aguardando leitura do código...</span>
          </div>
        )}

        {lastProduct && (
          <div className="mt-4 p-4 border rounded bg-green-50 animate-fade-in">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-green-700">✅ Produto encontrado:</span>
              <div className="space-y-1 text-sm">
                <div><strong>Nome:</strong> {lastProduct.name}</div>
                <div><strong>Preço:</strong> <Badge variant="secondary">R$ {lastProduct.price.toFixed(2)}</Badge></div>
                <div><strong>Código:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{lastProduct.barcode}</code></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleClose}>
            {lastProduct ? 'Fechar' : 'Cancelar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeModal;
