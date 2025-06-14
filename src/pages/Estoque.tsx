
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Archive, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Minus,
  Edit
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

// Using the actual Supabase type instead of custom interface
type EstoqueItem = {
  id: string;
  nome: string;
  categoria: string;
  estoque: number;
  codigo_barras: string | null;
  preco: number;
  status: string;
  created_at: string;
  updated_at: string;
};

const Estoque: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');
  const [editingEstoque, setEditingEstoque] = useState<{[key: string]: number}>({});
  const [newProduct, setNewProduct] = useState({
    nome: '',
    categoria: 'Bebidas',
    preco: 0,
    estoque: 0,
    codigo_barras: ''
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const queryClient = useQueryClient();

  const categories = ['Bebidas', 'Salgados', 'Sanduíches', 'Doces', 'Outros'];

  // Buscar produtos para controle de estoque
  const { data: estoqueItems = [], isLoading, refetch } = useQuery({
    queryKey: ['estoque'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('estoque', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar estoque:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Mutation para criar produto
  const createProductMutation = useMutation({
    mutationFn: async (productData: typeof newProduct) => {
      const { error } = await supabase
        .from('produtos')
        .insert([{
          ...productData,
          status: 'ativo'
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      toast.success('Produto adicionado com sucesso!');
      setNewProduct({
        nome: '',
        categoria: 'Bebidas',
        preco: 0,
        estoque: 0,
        codigo_barras: ''
      });
      setShowAddProduct(false);
    },
    onError: (error) => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao adicionar produto');
    },
  });

  // Mutation para atualizar estoque
  const updateEstoqueMutation = useMutation({
    mutationFn: async ({ id, novoEstoque }: { id: string; novoEstoque: number }) => {
      const { error } = await supabase
        .from('produtos')
        .update({ estoque: novoEstoque, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      toast.success('Estoque atualizado com sucesso!');
      setEditingEstoque({});
    },
    onError: (error) => {
      console.error('Erro ao atualizar estoque:', error);
      toast.error('Erro ao atualizar estoque');
    },
  });

  const filteredItems = estoqueItems.filter((item: EstoqueItem) => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codigo_barras?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
    
    let matchesAlert = true;
    if (alertFilter === 'baixo') {
      matchesAlert = item.estoque > 0 && item.estoque <= 10;
    } else if (alertFilter === 'zerado') {
      matchesAlert = item.estoque === 0;
    }
    
    return matchesSearch && matchesCategory && matchesAlert;
  });

  const totalItens = estoqueItems.length;
  const itensZerados = estoqueItems.filter((item: EstoqueItem) => item.estoque === 0).length;
  const itensBaixos = estoqueItems.filter((item: EstoqueItem) => item.estoque > 0 && item.estoque <= 10).length;
  const valorTotalEstoque = estoqueItems.reduce((total: number, item: EstoqueItem) => total + (item.estoque * item.preco), 0);

  const adjustEstoque = (id: string, currentEstoque: number, adjustment: number) => {
    const novoEstoque = Math.max(0, currentEstoque + adjustment);
    updateEstoqueMutation.mutate({ id, novoEstoque });
  };

  const setEstoqueValue = (id: string, value: number) => {
    setEditingEstoque(prev => ({ ...prev, [id]: value }));
  };

  const updateEstoqueFromInput = (id: string) => {
    const novoEstoque = editingEstoque[id];
    if (novoEstoque !== undefined && novoEstoque >= 0) {
      updateEstoqueMutation.mutate({ id, novoEstoque });
    }
  };

  const getEstoqueStatus = (estoque: number) => {
    if (estoque === 0) return { variant: 'destructive' as const, text: 'Zerado' };
    if (estoque <= 10) return { variant: 'default' as const, text: 'Baixo' };
    return { variant: 'secondary' as const, text: 'Normal' };
  };

  const handleAddProduct = () => {
    if (!newProduct.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    createProductMutation.mutate(newProduct);
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Archive className="w-6 h-6 text-green-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Controle de Estoque</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="flex items-center space-x-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </Button>
          <Button 
            onClick={() => refetch()}
            variant="outline"
            className="flex items-center space-x-2 flex-1 sm:flex-none"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddProduct && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle>Adicionar Novo Produto</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Produto</label>
                <Input
                  value={newProduct.nome}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome do produto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select 
                  value={newProduct.categoria}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preço (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.preco}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantidade Inicial</label>
                <Input
                  type="number"
                  min="0"
                  value={newProduct.estoque}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, estoque: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Código de Barras (Opcional)</label>
                <Input
                  value={newProduct.codigo_barras}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, codigo_barras: e.target.value }))}
                  placeholder="Digite o código de barras"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddProduct}
                  disabled={createProductMutation.isPending}
                  className="w-full"
                >
                  {createProductMutation.isPending ? 'Adicionando...' : 'Adicionar Produto'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Archive className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total de Itens</p>
                <p className="text-lg sm:text-2xl font-bold">{totalItens}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 sm:w-8 h-6 sm:h-8 text-red-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Estoque Zerado</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{itensZerados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-6 sm:w-8 h-6 sm:h-8 text-yellow-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Estoque Baixo</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{itensBaixos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Valor Total</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">R$ {valorTotalEstoque.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Filter className="w-4 h-4 text-gray-500" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2 flex-1">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <select 
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="all">Todos os status</option>
                  <option value="zerado">Estoque zerado</option>
                  <option value="baixo">Estoque baixo</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Estoque */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Controle de Estoque ({filteredItems.length} itens)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Produto</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Código</TableHead>
                  <TableHead className="min-w-[100px]">Estoque</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Valor Unit.</TableHead>
                  <TableHead className="hidden lg:table-cell">Valor Total</TableHead>
                  <TableHead className="min-w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: EstoqueItem) => {
                  const status = getEstoqueStatus(item.estoque);
                  const isEditing = editingEstoque[item.id] !== undefined;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{item.nome}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {item.categoria}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{item.categoria}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {item.codigo_barras || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <Input
                              type="number"
                              min="0"
                              value={editingEstoque[item.id]}
                              onChange={(e) => setEstoqueValue(item.id, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => updateEstoqueFromInput(item.id)}
                              className="h-8 px-2"
                            >
                              ✓
                            </Button>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold">{item.estoque} un.</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={status.variant}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">R$ {item.preco.toFixed(2)}</TableCell>
                      <TableCell className="hidden lg:table-cell">R$ {(item.estoque * item.preco).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {!isEditing && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => adjustEstoque(item.id, item.estoque, -1)}
                                disabled={item.estoque === 0 || updateEstoqueMutation.isPending}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => adjustEstoque(item.id, item.estoque, 1)}
                                disabled={updateEstoqueMutation.isPending}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEstoqueValue(item.id, item.estoque)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estoque;
