import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package,
  Barcode as BarcodeIcon,
  DollarSign,
  Archive,
  Calendar,
  Image as ImageIcon,
  Tag,
  Info,
  Plus,
  Minus,
  ShoppingCart,
  ScanBarcode,
  QrCode,
  CheckCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ValidationCodes from './ValidationCodes';
import Barcode from 'react-barcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { TotemProduct, TotemCartItem } from '@/types';

interface ProductDetailsModalProps {
  product: TotemProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: TotemProduct) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartItems?: TotemCartItem[];
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  isOpen, 
  onClose,
  onAddToCart = () => {},
  onRemoveFromCart = () => {},
  cartItems = []
}) => {
  console.log('[ProductDetailsModal] Iniciando renderização do modal', { 
    isOpen, 
    hasProduct: !!product,
    productId: product?.id,
    productName: product?.nome
  });
  
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  // Mover a verificação de product para depois dos hooks
  if (!product) {
    console.log('[ProductDetailsModal] Nenhum produto fornecido, não renderizando');
    return null;
  }
  
  const cartItem = cartItems.find(item => item.id === product.id);
  const cartQuantity = cartItem?.quantity || 0;

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; class: string }> = {
      'ativo': { text: 'Ativo', class: 'bg-green-100 text-green-800 border-green-200' },
      'inativo': { text: 'Inativo', class: 'bg-red-100 text-red-800 border-red-200' },
      'descontinuado': { text: 'Descontinuado', class: 'bg-amber-100 text-amber-800 border-amber-200' },
      'promocao': { text: 'Promoção', class: 'bg-purple-100 text-purple-800 border-purple-200' },
      'esgotado': { text: 'Esgotado', class: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { text: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    return statusInfo;
  };

  const validationData = React.useMemo(() => ({
    saleId: `SALE-${Date.now()}`,
    productId: product.id,
    productName: product.nome,
    unitPrice: product.preco,
    quantity: cartItem?.quantity || 1,
    paymentMethod: 'Pulseira', // Valor padrão, pode ser substituído pelo método de pagamento real
    nsu: `NSU${Date.now().toString().slice(-8)}`,
    hash: `HASH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    barcode: product.codigo_barras || product.id.padEnd(13, '0').substring(0, 13),
    date: new Date().toISOString(),
  }), [product, cartItem]);

  const handleAddToCart = () => {
    onAddToCart(product);
    toast({
      title: 'Produto adicionado',
      description: `${product.nome} foi adicionado ao carrinho`,
    });
  };
  
  const handleRemoveFromCart = () => {
    onRemoveFromCart(product.id);
  };
  
  // Rolar para o topo quando o modal for aberto
  useEffect(() => {
    if (isOpen && dialogContentRef.current) {
      dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen, product?.id]);

  const statusInfo = getStatusBadge(product.status);
  const isOutOfStock = product.estoque <= 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-lg">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Detalhes do Produto</span>
            </DialogTitle>
            <Badge variant="outline" className={statusInfo.class}>
              {statusInfo.text}
            </Badge>
          </div>
          <DialogDescription className="text-sm">
            Visualizando informações detalhadas do produto
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6" ref={dialogContentRef}>
          <Tabs defaultValue="detalhes" className="w-full">
            <div className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalhes">
                  <Info className="w-4 h-4 mr-2" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="validacao">
                  <ScanBarcode className="w-4 h-4 mr-2" />
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
                  
                  {/* Ações rápidas */}
                  <div className="mt-4 space-y-2">
                    <Button 
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                    
                    {cartQuantity > 0 && (
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded-md">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={handleRemoveFromCart}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium">{cartQuantity} no carrinho</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={handleAddToCart}
                          disabled={isOutOfStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
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
                          {isOutOfStock ? 'ESGOTADO' : `${product.estoque} un.`}
                        </div>
                        {cartQuantity > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {cartQuantity} un. no seu carrinho
                          </p>
                        )}
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
              
              <ValidationCodes
                {...validationData}
                title=""
                className="max-w-md mx-auto"
              />
            </TabsContent>
          </Tabs>

          {/* Rodapé com ações */}
          <div className="border-t bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {cartQuantity > 0 ? `Adicionar mais (${cartQuantity})` : 'Adicionar ao Carrinho'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
