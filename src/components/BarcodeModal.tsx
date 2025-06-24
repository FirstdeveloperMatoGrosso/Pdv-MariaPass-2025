
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SimpleBarcodeInput from './SimpleBarcodeInput';
import { Badge } from '@/components/ui/badge';
import { ScanBarcode, CheckCircle, ScanLine, X } from 'lucide-react';
import { TotemProduct, TotemCartItem } from '@/types';
import ProductDetailsModal from './ProductDetailsModal';

interface BarcodeModalProps {
  open: boolean;
  onClose: () => void;
  onProductScanned?: (product: TotemProduct) => void;
  onAddToCart?: (product: TotemProduct) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartItems?: TotemCartItem[];
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({ 
  open, 
  onClose, 
  onProductScanned,
  onAddToCart = () => {},
  onRemoveFromCart = () => {},
  cartItems = []
}) => {
  const [lastProduct, setLastProduct] = useState<TotemProduct | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  useEffect(() => {
    if (lastProduct) {
      setShowProductDetails(true);
    }
  }, [lastProduct]);

  function handleProduct(product: TotemProduct) {
    setLastProduct(product);
    if (onProductScanned) {
      onProductScanned(product);
    }
    // Não fecha o modal automaticamente
  }

  function handleClose() {
    setLastProduct(null);
    onClose();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">Leitor de Código de Barras</span>
            </DialogTitle>
            <DialogDescription>
              {!lastProduct ? (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Aponte o leitor para o código de barras do produto</p>
                  <p>• Ou digite o código manualmente no campo abaixo</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded-md">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Produto escaneado com sucesso! Visualizando detalhes...</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <SimpleBarcodeInput onProductScanned={handleProduct} />
          </div>

          {!lastProduct && (
            <div className="mt-2 p-3 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <ScanLine className="w-5 h-5 animate-pulse" />
                <span className="font-medium">Pronto para escanear</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Posicione o código de barras na frente do leitor</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              {lastProduct ? 'Fechar' : 'Cancelar'}
            </Button>
            {lastProduct && (
              <Button 
                variant="default"
                onClick={() => {
                  setLastProduct(null);
                  // Foca no input de código de barras para próxima leitura
                  const input = document.getElementById('manual-barcode-input') as HTMLInputElement;
                  if (input) {
                    input.focus();
                  }
                }}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <ScanBarcode className="w-4 h-4" />
                Novo Código
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do produto */}
      {lastProduct && (
        <ProductDetailsModal
          product={lastProduct}
          isOpen={showProductDetails}
          onClose={() => setShowProductDetails(false)}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
          cartItems={cartItems}
        />
      )}
    </>
  );
};

export default BarcodeModal;
