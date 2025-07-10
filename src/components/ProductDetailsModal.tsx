import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package,
  Barcode as BarcodeIcon,
  DollarSign,
  Archive,
  Image as ImageIcon,
  Tag,
  Info,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Barcode from 'react-barcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { TotemProduct } from '@/types';

interface ProductDetailsModalProps {
  product: TotemProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: any) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartItems?: Array<{ id: string; quantity: number }>;
}

interface ProductDetailsModalContentProps extends Omit<ProductDetailsModalProps, 'product'> {
  product: TotemProduct; // Garante que product não seja null aqui
}

const ProductDetailsModalContent: React.FC<ProductDetailsModalContentProps> = ({ 
  product, 
  isOpen,
  onClose,
  onAddToCart,
  onRemoveFromCart,
  cartItems
}) => {
  // Hooks do React podem ser usados aqui com segurança
  const modalRef = useRef<HTMLDivElement>(null);

  // Restante do conteúdo do modal...
  console.log('[ProductDetailsModal] Iniciando renderização do modal', { 
    hasProduct: true,
    productId: product.id,
    productName: product.nome
  });
  
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const availableStock = product.estoque_atual || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Data inválida' 
        : date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função auxiliar para obter o status formatado
  const statusInfo = (() => {
    const statusMap: { [key: string]: { text: string; class: string } } = {
      ativo: { text: 'Ativo', class: 'bg-green-100 text-green-800' },
      inativo: { text: 'Inativo', class: 'bg-red-100 text-red-800' },
      esgotado: { text: 'Esgotado', class: 'bg-gray-100 text-gray-800' },
    };
    return statusMap[product.status] || { text: 'Desconhecido', class: 'bg-gray-100 text-gray-800' };
  })();

  const isOutOfStock = availableStock <= 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={dialogContentRef}
        className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden"
        onPointerDownOutside={(e) => {
          // Evita fechar ao clicar em elementos dentro do modal
          if (dialogContentRef.current && dialogContentRef.current.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="border-b px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-base">
              <Package className="h-4 w-4" />
              <span>Detalhes do Produto</span>
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col max-h-[calc(95vh-130px)]">
          <div className="p-4 overflow-y-auto">
          <Tabs defaultValue="detalhes" className="w-full">
            <div className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalhes">
                  <Info className="w-4 h-4 mr-2" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="validacao">
                  <BarcodeIcon className="w-4 h-4 mr-2" />
                  Validação
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="space-y-6">
              {/* Cabeçalho com imagem e informações principais */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Imagem do produto */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    {product.imagem_url ? (
                      <div className="aspect-square flex items-center justify-center">
                        <img 
                          src={product.imagem_url} 
                          alt={product.nome}
                          className="max-w-full max-h-full object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <ImageIcon className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1">
                        <span className="text-xs font-bold text-red-600">
                          ESGOTADO
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informações principais */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">{product.nome}</h1>
                    <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-2">
                      <div className="flex items-center bg-gray-100 rounded-full px-2 py-0.5">
                        <Tag className="w-3 h-3 mr-1 text-blue-500" />
                        <span>{product.categoria}</span>
                      </div>
                      <div className="flex items-center">
                        <Info className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="text-xs">ID: {product.id}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preço e estoque */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white border rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1 flex items-center">
                        <DollarSign className="w-3 h-3 mr-1 text-green-500" />
                        Preço
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(product.preco)}
                      </div>
                    </div>
                    
                    <div className={`bg-white border rounded-lg p-3 ${isOutOfStock ? 'border-red-200 bg-red-50' : ''}`}>
                      <div className="text-xs text-gray-500 mb-1 flex items-center">
                        <Package className="w-3 h-3 mr-1 text-blue-500" />
                        Estoque
                      </div>
                      <div className={`text-xl font-bold ${isOutOfStock ? 'text-red-600' : 'text-blue-600'}`}>
                        {isOutOfStock ? 'ESGOTADO' : `${availableStock} un.`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de código de barras */}
              {product.codigo_barras && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <BarcodeIcon className="w-3 h-3 mr-1.5 text-blue-500" />
                    Código de Barras
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-2 rounded border">
                        <Barcode 
                          value={product.codigo_barras} 
                          format="CODE128" 
                          height={40} 
                          width={1} 
                          displayValue={false} 
                          margin={0}
                          background="transparent"
                        />
                      </div>
                      <div className="mt-2 px-3 py-1.5 bg-white rounded border text-xs">
                        {product.codigo_barras}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 text-center">
                        Padrão: CODE128 • {product.codigo_barras.length} dígitos
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadados */}
              <div className="mt-4">
                <h3 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                  <Info className="w-3 h-3 mr-1.5 text-blue-500" />
                  Informações Adicionais
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-blue-500" />
                      Cadastrado em
                    </div>
                    <div className="text-xs text-gray-700">
                      {formatDate(product.created_at)}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-blue-500" />
                      Última atualização
                    </div>
                    <div className="text-xs text-gray-700">
                      {formatDate(product.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Aba de Validação */}
            <TabsContent value="validacao" className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
                <div className="flex items-start">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-800 text-sm">Comprovante de Validação</h3>
                    <p className="text-xs text-blue-700">
                      Use o QR Code ou o Código de Barras para validar a autenticidade do produto.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          </div>
          
          {/* Rodapé com ações */}
          <div className="border-t bg-gray-50 px-4 py-3 mt-auto">
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-8"
                onClick={onClose}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = (props) => {
  // Verificação do produto antes de qualquer hook
  if (!props.product) {
    console.log('[ProductDetailsModal] Nenhum produto fornecido, não renderizando');
    return null;
  }

  // Se chegou aqui, temos certeza que product não é null
  return (
    <ProductDetailsModalContent 
      isOpen={props.isOpen}
      onClose={props.onClose}
      product={props.product}
      onAddToCart={props.onAddToCart}
      onRemoveFromCart={props.onRemoveFromCart}
      cartItems={props.cartItems}
    />
  );
};

export default ProductDetailsModal;
