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
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Evita fechar ao clicar em elementos dentro do modal
          if (dialogContentRef.current && dialogContentRef.current.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-lg">
              <Package className="h-5 w-5" />
              <span>Detalhes do Produto</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Visualizando informações detalhadas do produto
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
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
              <div className="flex flex-col md:flex-row gap-6">
                {/* Imagem do produto */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                  <div className="relative aspect-square bg-gray-50 rounded-lg border-2 border-gray-100 overflow-hidden shadow-sm">
                    {product.imagem_url ? (
                      <img 
                        src={product.imagem_url} 
                        alt={product.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                        <span className="bg-white/90 text-red-600 text-xs font-bold px-2 py-1 rounded-full shadow">
                          ESGOTADO
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informações principais */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.nome}</h1>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Tag className="w-4 h-4 mr-1 text-blue-500" />
                      <span>Categoria: </span>
                      <Badge variant="outline" className="ml-1">
                        {product.categoria}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Info className="w-4 h-4 mr-1 text-blue-500" />
                      <span>ID: </span>
                      <code className="ml-1 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {product.id}
                      </code>
                    </div>
                  </div>
                  
                  {/* Preço e estoque */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2 px-4">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                          Preço
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(product.preco)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className={isOutOfStock ? 'border-red-200 bg-red-50' : ''}>
                      <CardHeader className="pb-2 px-4">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                          <Package className="w-4 h-4 mr-2 text-blue-500" />
                          Estoque disponível
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : 'text-blue-600'}`}>
                          {isOutOfStock ? 'ESGOTADO' : `${availableStock} un.`}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Seção de código de barras */}
              {product.codigo_barras && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <BarcodeIcon className="w-4 h-4 mr-2 text-blue-500" />
                    Código de Barras
                  </h3>
                  <Card className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        <div className="bg-white p-4 rounded-lg border">
                          <Barcode 
                            value={product.codigo_barras} 
                            format="CODE128" 
                            height={60} 
                            width={1.2} 
                            displayValue={false} 
                            margin={0}
                            background="transparent"
                          />
                        </div>
                        <div className="mt-3 px-4 py-2 bg-gray-50 rounded-md">
                          <code className="font-mono text-sm text-gray-800">
                            {product.codigo_barras}
                          </code>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Padrão: CODE128 • {product.codigo_barras.length} dígitos
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Metadados */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-500" />
                  Informações Adicionais
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        Cadastrado em
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="text-sm text-gray-700">
                        {formatDate(product.created_at)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        Última atualização
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="text-sm text-gray-700">
                        {formatDate(product.updated_at)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Aba de Validação */}
            <TabsContent value="validacao" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-800">Comprovante de Validação</h3>
                    <p className="text-sm text-blue-700">
                      Este comprovante contém os códigos de validação do produto. Use o QR Code ou o Código de Barras para validar a autenticidade.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Rodapé com ações */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
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
