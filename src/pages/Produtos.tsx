
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProductForm from '@/components/ProductForm';
import ProductEditForm from '@/components/ProductEditForm';
import CategoryForm from '@/components/CategoryForm';
import { CancelamentoModal } from '@/components/CancelamentoModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  status: string;
  codigo_barras?: string;
  imagem_url?: string;
  created_at: string;
  updated_at: string;
}

const Produtos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Produto | null>(null);
  const [cancelamentoProduct, setCancelamentoProduct] = useState<Produto | null>(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao carregar produtos.');
        return;
      }

      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', deleteProduct.id);

      if (error) {
        console.error('Erro ao deletar produto:', error);
        toast.error('Erro ao deletar produto.');
        return;
      }

      setProdutos(produtos.filter(p => p.id !== deleteProduct.id));
      setDeleteProduct(null);
      toast.success('Produto deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao deletar produto.');
    }
  };

  const filteredProducts = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (produto.codigo_barras && produto.codigo_barras.includes(searchTerm))
  );

  const getStatusBadge = (status: string) => {
    return status === 'ativo' ? (
      <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">Ativo</Badge>
    ) : (
      <Badge variant="secondary" className="text-xs px-1 py-0">Inativo</Badge>
    );
  };

  const getStockBadge = (estoque: number) => {
    if (estoque === 0) {
      return <Badge variant="destructive" className="text-xs px-1 py-0">Sem estoque</Badge>;
    } else if (estoque <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1 py-0">Estoque baixo</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 text-xs px-1 py-0">Em estoque</Badge>;
  };

  const handleCategorySuccess = () => {
    fetchProdutos();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Package className="w-5 h-5" />
          <h1 className="text-lg sm:text-xl font-bold">Produtos</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
          <CategoryForm onSuccess={handleCategorySuccess} />
          <ProductForm onSuccess={fetchProdutos} />
        </div>
      </div>

      {/* Estatísticas Compactas */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-blue-700">Total</p>
                <p className="text-base font-bold text-blue-900">{produtos.length}</p>
              </div>
              <div className="p-1 bg-blue-200 rounded">
                <Package className="w-3 h-3 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-green-700">Ativos</p>
                <p className="text-base font-bold text-green-900">
                  {produtos.filter(p => p.status === 'ativo').length}
                </p>
              </div>
              <div className="p-1 bg-green-200 rounded">
                <Package className="w-3 h-3 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-red-700">Inativos</p>
                <p className="text-base font-bold text-red-900">
                  {produtos.filter(p => p.status === 'inativo').length}
                </p>
              </div>
              <div className="p-1 bg-red-200 rounded">
                <Package className="w-3 h-3 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Compactos */}
      <Card>
        <CardHeader className="pb-1 p-2 sm:p-3">
          <CardTitle className="flex items-center text-sm font-semibold text-gray-800">
            <Search className="w-3 h-3 mr-1 text-gray-600" />
            Pesquisar Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-2 sm:p-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Buscar por nome, categoria ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos Compacta */}
      <Card>
        <CardHeader className="pb-1 p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800">
              Lista de Produtos
            </CardTitle>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 w-12 text-xs h-7">Img</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[120px] text-xs h-7">Nome</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden sm:table-cell text-xs h-7">Categoria</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-xs h-7">Preço</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-xs h-7">Estoque</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden md:table-cell text-xs h-7">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden lg:table-cell text-xs h-7">Código</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center text-xs h-7">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Carregando produtos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <div className="space-y-1">
                        <Package className="w-5 h-5 text-gray-400 mx-auto" />
                        <p className="text-xs">
                          {searchTerm ? 'Nenhum produto encontrado com os critérios de busca.' : 'Nenhum produto cadastrado.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((produto) => (
                    <TableRow key={produto.id} className="hover:bg-gray-50 transition-colors h-8">
                      <TableCell className="p-1">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          {produto.imagem_url ? (
                            <img
                              src={produto.imagem_url}
                              alt={produto.nome}
                              className="w-full h-full object-cover"
                              onError={handleImageError}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                          <div className="w-full h-full items-center justify-center hidden">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-1 p-2">
                        <div className="space-y-0">
                          <div className="font-medium text-xs">{produto.nome}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{produto.categoria}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs py-1 p-2">{produto.categoria}</TableCell>
                      <TableCell className="text-xs py-1 p-2">R$ {produto.preco.toFixed(2)}</TableCell>
                      <TableCell className="py-1 p-2">
                        <div className="flex flex-col space-y-0">
                          <span className="text-xs font-medium">{produto.estoque}</span>
                          {getStockBadge(produto.estoque)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-1 p-2">{getStatusBadge(produto.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell py-1 p-2">
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono max-w-[80px] block truncate">
                          {produto.codigo_barras || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="py-1 p-2">
                        <div className="flex items-center justify-center space-x-0.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(produto)}
                            className="h-5 w-5 p-0"
                            title="Editar produto"
                          >
                            <Edit className="w-2 h-2" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelamentoProduct(produto)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-5 w-5 p-0"
                            title="Cancelar produto"
                          >
                            <XCircle className="w-2 h-2" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteProduct(produto)}
                            className="text-red-600 hover:text-red-700 h-5 w-5 p-0"
                            title="Deletar produto"
                          >
                            <Trash2 className="w-2 h-2" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProductEditForm
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onProductUpdated={() => {
          setEditingProduct(null);
          fetchProdutos();
        }}
      />

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja deletar o produto "
              {deleteProduct?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProduct(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancelamento Modal */}
      <CancelamentoModal
        isOpen={!!cancelamentoProduct}
        onClose={() => setCancelamentoProduct(null)}
        produto={cancelamentoProduct}
      />
    </div>
  );
};

export default Produtos;
