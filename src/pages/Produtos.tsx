
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Package,
  Search,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProductForm from '@/components/ProductForm';

interface Product {
  id: string;
  nome: string;
  preco: number;
  codigo_barras: string;
  categoria: string;
  estoque: number;
  status: string;
  imagem_url?: string;
  created_at: string;
  updated_at: string;
}

const Produtos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  const categories = ['Bebidas', 'Salgados', 'Sanduíches', 'Doces', 'Outros'];

  // Buscar produtos do Supabase
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      console.log('Buscando produtos do Supabase...');
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao carregar produtos: ' + error.message);
        throw error;
      }
      
      console.log('Produtos carregados:', data);
      return data as Product[];
    },
  });

  // Mutation para deletar produto
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deletando produto:', id);
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar produto:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao remover produto: ' + error.message);
    },
  });

  // Mutation para atualizar status do produto
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.log('Atualizando status do produto:', id, status);
      const { error } = await supabase
        .from('produtos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Status do produto atualizado!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.codigo_barras && product.codigo_barras.includes(searchTerm));
    const matchesCategory = selectedCategory === 'all' || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const toggleProductStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-sm">Erro ao carregar produtos: {error.message}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['produtos'] })}
            className="mt-2"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Package className="w-5 h-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Gestão de Produtos</h1>
        </div>
        <ProductForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['produtos'] })} />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-2 sm:p-3">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                placeholder="Buscar por nome ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            <div className="flex items-center space-x-1">
              <Filter className="w-3 h-3 text-gray-500" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-md px-2 py-1 text-sm flex-1"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug info */}
      <div className="text-xs text-gray-500">
        Total de produtos carregados: {products.length} | Filtrados: {filteredProducts.length}
      </div>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="text-sm sm:text-base">Produtos Cadastrados ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">
                {products.length === 0 
                  ? 'Nenhum produto encontrado no banco de dados.'
                  : 'Nenhum produto encontrado com os filtros aplicados.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Imagem</TableHead>
                    <TableHead className="h-8 text-xs">Nome</TableHead>
                    <TableHead className="hidden sm:table-cell h-8 text-xs">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell h-8 text-xs">Código</TableHead>
                    <TableHead className="h-8 text-xs">Preço</TableHead>
                    <TableHead className="hidden lg:table-cell h-8 text-xs">Estoque</TableHead>
                    <TableHead className="hidden sm:table-cell h-8 text-xs">Status</TableHead>
                    <TableHead className="h-8 text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="p-2">
                        {product.imagem_url ? (
                          <img 
                            src={product.imagem_url} 
                            alt={product.nome}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-md border"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-md flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium p-2">
                        <div>
                          <div className="text-xs font-semibold">{product.nome}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {product.categoria} - R$ {product.preco.toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2">
                        <Badge variant="outline" className="text-xs">{product.categoria}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2">
                        <code className="bg-gray-100 px-1 py-1 rounded text-xs">
                          {product.codigo_barras || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="p-2 text-xs font-semibold">R$ {product.preco.toFixed(2)}</TableCell>
                      <TableCell className="hidden lg:table-cell p-2">
                        <Badge 
                          variant={product.estoque < 10 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {product.estoque} un.
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2">
                        <Badge 
                          variant={product.status === 'ativo' ? "default" : "secondary"}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleProductStatus(product.id, product.status)}
                        >
                          {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleteProductMutation.isPending}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Produtos;
