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
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    );
  };

  const getStockBadge = (estoque: number) => {
    if (estoque === 0) {
      return <Badge variant="destructive">Sem estoque</Badge>;
    } else if (estoque <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800">Estoque baixo</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Em estoque</Badge>;
  };

  const handleCategorySuccess = () => {
    fetchProdutos();
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Produtos</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <CategoryForm onSuccess={handleCategorySuccess} />
          <ProductForm onSuccess={fetchProdutos} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Produtos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtos.filter(p => p.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Produtos Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtos.filter(p => p.status === 'inativo').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <CardTitle>Lista de Produtos</CardTitle>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, categoria ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagem</TableHead>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[120px]">Categoria</TableHead>
                  <TableHead className="min-w-[100px]">Preço</TableHead>
                  <TableHead className="min-w-[120px]">Estoque</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Código</TableHead>
                  <TableHead className="text-right min-w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Carregando produtos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'Nenhum produto encontrado com os critérios de busca.' : 'Nenhum produto cadastrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="p-2">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {produto.imagem_url ? (
                            <img
                              src={produto.imagem_url}
                              alt={produto.nome}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                          <div className="w-full h-full items-center justify-center hidden">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{produto.nome}</div>
                      </TableCell>
                      <TableCell>{produto.categoria}</TableCell>
                      <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium">{produto.estoque}</span>
                          {getStockBadge(produto.estoque)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(produto.status)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block max-w-[100px] truncate">
                          {produto.codigo_barras || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(produto)}
                            className="p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelamentoProduct(produto)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteProduct(produto)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
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
