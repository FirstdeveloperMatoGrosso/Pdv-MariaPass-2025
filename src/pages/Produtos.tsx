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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Produtos</h1>
        </div>
        <div className="flex gap-2">
          <CategoryForm onSuccess={handleCategorySuccess} />
          <ProductForm onSuccess={fetchProdutos} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtos.filter(p => p.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Inativos</CardTitle>
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
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Produtos</CardTitle>
            <div className="relative w-72">
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
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Carregando produtos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'Nenhum produto encontrado com os critérios de busca.' : 'Nenhum produto cadastrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{produto.nome}</div>
                          {produto.imagem_url && (
                            <div className="text-xs text-gray-500">Com imagem</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{produto.categoria}</TableCell>
                      <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{produto.estoque}</span>
                          {getStockBadge(produto.estoque)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(produto.status)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {produto.codigo_barras || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(produto)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelamentoProduct(produto)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteProduct(produto)}
                            className="text-red-600 hover:text-red-700"
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
