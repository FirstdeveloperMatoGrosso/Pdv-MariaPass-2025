
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package,
  Barcode,
  DollarSign,
  Archive,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Product {
  id: string;
  nome: string;
  preco: number;
  codigo_barras: string | null;
  categoria: string;
  estoque: number;
  status: string;
  created_at: string;
  updated_at: string;
  imagem_url: string | null;
}

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  isOpen, 
  onClose 
}) => {
  if (!product) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'ativo': 'bg-green-100 text-green-800',
      'inativo': 'bg-red-100 text-red-800',
      'descontinuado': 'bg-gray-100 text-gray-800'
    };
    
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Detalhes do Produto</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Imagem e informações básicas */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-shrink-0">
              {product.imagem_url ? (
                <img 
                  src={product.imagem_url} 
                  alt={product.nome}
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{product.nome}</h3>
                <p className="text-sm text-gray-600">ID: {product.id}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusBadge(product.status)}>
                  {product.status.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {product.categoria}
                </Badge>
              </div>
            </div>
          </div>

          {/* Informações detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Preço</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(product.preco)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Archive className="w-4 h-4" />
                  <span>Estoque</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {product.estoque} un.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Código de barras */}
          {product.codigo_barras && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Barcode className="w-4 h-4" />
                  <span>Código de Barras</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-lg">
                  {product.codigo_barras}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Criado em</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  {formatDate(product.created_at)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Atualizado em</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  {formatDate(product.updated_at)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
