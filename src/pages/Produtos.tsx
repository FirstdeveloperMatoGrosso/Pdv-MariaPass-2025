import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProductForm from '@/components/ProductForm';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import ProductEditForm from '@/components/ProductEditForm';
import CategoryForm from '@/components/CategoryForm';
import { TotemProduct } from '@/types';
import SystemAlert from '@/components/SystemAlert';

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

interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

const Produtos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TotemProduct | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading, error } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: "Produto excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCategorySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['categorias'] });
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
  };

  const handleProductSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
    toast({ title: "Produto criado com sucesso!" });
  };

  const filteredProducts = produtos.filter((product: Product) => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todas' || product.categoria === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'ativo': 'bg-green-100 text-green-800',
      'inativo': 'bg-red-100 text-red-800',
      'descontinuado': 'bg-gray-100 text-gray-800'
    };
    
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const [showEditAlert, setShowEditAlert] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setShowEditAlert(true);
  };

  const handleConfirmEdit = () => {
    setShowEditAlert(false);
    if (!currentProduct) return;
    
    try {
      const productToEdit: TotemProduct = {
        ...currentProduct,
        descricao: (currentProduct as any).descricao || '',
        imagem_url: currentProduct.imagem_url || null,
        tipo_venda: (currentProduct as any).tipo_venda || 'unidade',
        unidades_por_caixa: (currentProduct as any).unidades_por_caixa || null,
        estoque_atual: currentProduct.estoque // Adicionando estoque_atual com o valor de estoque
      } as TotemProduct;
      setSelectedProduct(productToEdit);
      setShowEditForm(true);
    } catch (error) {
      console.error('Erro ao abrir edição:', error);
      setErrorMessage('Erro ao abrir o formulário de edição. Tente novamente mais tarde.');
      setShowErrorAlert(true);
    }
  };

  const handleProductUpdated = () => {
    toast({
      title: 'Sucesso',
      description: 'Produto atualizado com sucesso!',
      variant: 'default',
    });
    setShowEditForm(false);
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteMutation.mutate(id);
    }
  };

  const [showDetailsAlert, setShowDetailsAlert] = useState(false);
  const [currentProductDetails, setCurrentProductDetails] = useState<Product | null>(null);

  const handleViewDetails = (product: Product) => {
    setCurrentProductDetails(product);
    setShowDetailsAlert(true);
  };

  const renderProductDetails = (product: Product) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">ID</p>
          <p className="text-sm">{product.id}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Preço</p>
          <p className="text-sm">R$ {product.preco.toFixed(2)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Categoria</p>
          <p className="text-sm">{product.categoria}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Estoque</p>
          <p className="text-sm">{product.estoque} unidades</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Status</p>
          <Badge 
            variant={product.status === 'ativo' ? 'default' : 'secondary'}
            className={cn(
              'text-xs',
              product.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            )}
          >
            {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Código de Barras</p>
          <p className="text-sm">{product.codigo_barras || 'Não informado'}</p>
        </div>
      </div>
      <div className="pt-4 border-t">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Data de Criação</p>
          <p className="text-sm">{new Date(product.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium text-gray-500">Última Atualização</p>
          <p className="text-sm">{new Date(product.updated_at).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );

  const handleFormClose = () => {
    setShowForm(false);
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Erro ao carregar produtos: {error.message}</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pl-4 pr-4 sm:pl-6 sm:pr-6 space-y-1 sm:space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Produtos</h1>
        </div>
        <div className="flex gap-1 w-full sm:w-auto">
          <Button asChild size="sm" className="h-7 text-xs">
            <CategoryForm onSuccess={handleCategorySuccess} />
          </Button>
          <ProductForm onSuccess={handleProductSuccess} />
        </div>
      </div>

      {/* Filters */}
      <Card className="border shadow-sm">
        <CardHeader className="p-2 pb-0">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2">
            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  placeholder="Nome ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 sm:pl-8 h-7 sm:h-8 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-medium">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-7 sm:h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="todas-categorias" value="todas">Todas as categorias</SelectItem>
                  {categorias.map((categoria: Categoria) => (
                    <SelectItem key={`categoria-${categoria.id}`} value={categoria.nome}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 sm:h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="todos-status" value="todos">Todos os status</SelectItem>
                  <SelectItem key="status-ativo" value="ativo">Ativo</SelectItem>
                  <SelectItem key="status-inativo" value="inativo">Inativo</SelectItem>
                  <SelectItem key="status-descontinuado" value="descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid - Cards responsivos */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
        {isLoading ? (
          Array.from({ length: 16 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-2">
                <div className="h-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
              <div className="aspect-square bg-gray-50 flex items-center justify-center h-16 sm:h-20 md:h-24">
                {product.imagem_url ? (
                  <img 
                    src={product.imagem_url} 
                    alt={product.nome}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
              </div>
              
              <CardContent className="p-2 flex-1 flex flex-col">
                <div className="space-y-1 flex-1">
                  <div className="min-h-[40px]">
                    <h3 className="font-semibold text-xs xs:text-[11px] sm:text-xs truncate" title={product.nome}>
                      {product.nome}
                    </h3>
                    <p className="text-[10px] xs:text-xs text-gray-600 truncate">
                      {product.categoria}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs xs:text-sm font-bold text-green-600 whitespace-nowrap">
                      {formatCurrency(product.preco)}
                    </div>
                    <Badge className={`text-[10px] xs:text-xs px-1 py-0 ${getStatusBadge(product.status)}`}>
                      {product.status}
                    </Badge>
                  </div>
                  
                  <div className="text-[10px] xs:text-xs text-gray-600">
                    Estoque: {product.estoque}
                  </div>
                </div>
                
                <div className="flex space-x-1 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(product)}
                    className="flex-1 text-xs h-6 px-1 min-w-0"
                    title="Ver detalhes"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="h-6 px-1 min-w-0"
                    title="Editar"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-700 h-6 px-1 min-w-0"
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Log de depuração do estado do modal de detalhes */}
      {(() => {
        console.log('[Produtos] Estado do modal de detalhes:', { 
          showDetails, 
          hasSelectedProduct: !!selectedProduct,
          selectedProductId: selectedProduct?.id,
          selectedProductName: selectedProduct?.nome
        });
        return null;
      })()}
      
      {/* Modal de detalhes do produto */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={showDetails}
          onClose={() => {
            console.log('[Produtos] Fechando modal de detalhes');
            setShowDetails(false);
          }}
        />
      )}

      {/* System Alerts */}
      {showEditAlert && currentProduct && (
        <SystemAlert
          type="info"
          title={`EDITANDO PRODUTO`}
          message={`Nome: ${currentProduct.nome}\nID: ${currentProduct.id}\nPreço: R$ ${currentProduct.preco.toFixed(2)}`}
          actions={[
            {
              label: 'Cancelar',
              onClick: () => setShowEditAlert(false),
              variant: 'outline'
            },
            {
              label: 'Continuar',
              onClick: handleConfirmEdit,
              variant: 'default'
            }
          ]}
        />
      )}

      {showErrorAlert && (
        <SystemAlert
          type="error"
          title="Erro"
          message={errorMessage}
          onClose={() => setShowErrorAlert(false)}
        />
      )}

      {showDetailsAlert && currentProductDetails && (
        <SystemAlert
          type="info"
          title={currentProductDetails.nome}
          message={renderProductDetails(currentProductDetails)}
          imageUrl={currentProductDetails.imagem_url || undefined}
          onClose={() => setShowDetailsAlert(false)}
          size="lg"
          actions={[
            {
              label: 'Fechar',
              onClick: () => setShowDetailsAlert(false),
              variant: 'outline'
            },
            {
              label: 'Editar',
              onClick: () => {
                setShowDetailsAlert(false);
                setCurrentProduct(currentProductDetails);
                setShowEditAlert(true);
              },
              variant: 'default'
            }
          ]}
        />
      )}

      {/* Product Edit Form Modal */}
      {selectedProduct && (
        <ProductEditForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          product={selectedProduct}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
};

export default Produtos;
