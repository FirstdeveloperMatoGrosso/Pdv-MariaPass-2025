import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Archive, AlertTriangle, TrendingUp, TrendingDown, Search, Filter, RefreshCw, Plus, Minus, Edit, Check, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  const [editingEstoque, setEditingEstoque] = useState<{
    [key: string]: number;
  }>({});
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
  const {
    data: estoqueItems = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['estoque'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('produtos').select('*').order('estoque', {
        ascending: true
      });
      if (error) {
        console.error('Erro ao buscar estoque:', error);
        throw error;
      }
      return data || [];
    }
  });

  // Mutation para criar produto
  const createProductMutation = useMutation({
    mutationFn: async (productData: typeof newProduct) => {
      const {
        error
      } = await supabase.from('produtos').insert([{
        ...productData,
        status: 'ativo'
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['estoque']
      });
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
    onError: error => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  });

  // Mutation para atualizar estoque
  const updateEstoqueMutation = useMutation({
    mutationFn: async ({
      id,
      novoEstoque
    }: {
      id: string;
      novoEstoque: number;
    }) => {
      const {
        error
      } = await supabase.from('produtos').update({
        estoque: novoEstoque,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['estoque']
      });
      toast.success('Estoque atualizado com sucesso!');
      setEditingEstoque({});
    },
    onError: error => {
      console.error('Erro ao atualizar estoque:', error);
      toast.error('Erro ao atualizar estoque');
    }
  });

  const filteredItems = estoqueItems.filter((item: EstoqueItem) => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || item.codigo_barras?.includes(searchTerm);
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
  const valorTotalEstoque = estoqueItems.reduce((total: number, item: EstoqueItem) => total + item.estoque * item.preco, 0);

  const adjustEstoque = (id: string, currentEstoque: number, adjustment: number) => {
    const novoEstoque = Math.max(0, currentEstoque + adjustment);
    updateEstoqueMutation.mutate({
      id,
      novoEstoque
    });
  };

  const startEditingEstoque = (id: string, currentEstoque: number) => {
    setEditingEstoque(prev => ({
      ...prev,
      [id]: currentEstoque
    }));
  };

  const cancelEditingEstoque = (id: string) => {
    setEditingEstoque(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const setEstoqueValue = (id: string, value: number) => {
    setEditingEstoque(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const updateEstoqueFromInput = (id: string) => {
    const novoEstoque = editingEstoque[id];
    if (novoEstoque !== undefined && novoEstoque >= 0) {
      updateEstoqueMutation.mutate({
        id,
        novoEstoque
      });
    }
  };

  const getEstoqueStatus = (estoque: number) => {
    if (estoque === 0) return {
      variant: 'destructive' as const,
      text: 'Zerado'
    };
    if (estoque <= 10) return {
      variant: 'default' as const,
      text: 'Baixo'
    };
    return {
      variant: 'secondary' as const,
      text: 'Normal'
    };
  };

  const handleAddProduct = () => {
    if (!newProduct.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    createProductMutation.mutate(newProduct);
  };

  if (isLoading) {
    return <div className="p-2 sm:p-3 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estoque...</p>
        </div>
      </div>;
  }

  return <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Archive className="w-5 h-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Controle de Estoque</h1>
        </div>
        <div className="flex gap-1 w-full sm:w-auto">
          <Button onClick={() => setShowAddProduct(!showAddProduct)} className="flex items-center space-x-1 flex-1 sm:flex-none h-8 text-sm">
            <Plus className="w-3 h-3" />
            <span>Adicionar</span>
          </Button>
          <Button onClick={() => refetch()} variant="outline" className="flex items-center space-x-1 flex-1 sm:flex-none h-8 text-sm">
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddProduct && <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-sm sm:text-base">Adicionar Novo Produto</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Nome do Produto</label>
                <Input value={newProduct.nome} onChange={e => setNewProduct(prev => ({
              ...prev,
              nome: e.target.value
            }))} placeholder="Digite o nome do produto" className="h-8 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Categoria</label>
                <select value={newProduct.categoria} onChange={e => setNewProduct(prev => ({
              ...prev,
              categoria: e.target.value
            }))} className="w-full border rounded-md px-2 py-1 h-8 text-sm">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Preço (R$)</label>
                <Input type="number" step="0.01" min="0" value={newProduct.preco} onChange={e => setNewProduct(prev => ({
              ...prev,
              preco: parseFloat(e.target.value) || 0
            }))} placeholder="0.00" className="h-8 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Quantidade Inicial</label>
                <Input type="number" min="0" value={newProduct.estoque} onChange={e => setNewProduct(prev => ({
              ...prev,
              estoque: parseInt(e.target.value) || 0
            }))} placeholder="0" className="h-8 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Código de Barras (Opcional)</label>
                <Input value={newProduct.codigo_barras} onChange={e => setNewProduct(prev => ({
              ...prev,
              codigo_barras: e.target.value
            }))} placeholder="Digite o código de barras" className="h-8 text-sm" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddProduct} disabled={createProductMutation.isPending} className="w-full h-8 text-sm">
                  {createProductMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <Archive className="w-4 h-4 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total de Itens</p>
                <p className="text-lg sm:text-xl font-bold">{totalItens}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Estoque Zerado</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">{itensZerados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <TrendingDown className="w-4 h-4 text-yellow-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Estoque Baixo</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600">{itensBaixos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Valor Total</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">R$ {valorTotalEstoque.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-2 sm:p-3">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input placeholder="Buscar por nome ou código de barras..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 h-8 text-sm" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center space-x-1 flex-1">
                <Filter className="w-3 h-3 text-gray-500" />
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded-md px-2 py-1 w-full h-8 text-sm">
                  <option value="all">Todas as categorias</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-1 flex-1">
                <AlertTriangle className="w-3 h-3 text-gray-500" />
                <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} className="border rounded-md px-2 py-1 w-full h-8 text-sm">
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
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="text-sm sm:text-base">Controle de Estoque ({filteredItems.length} itens)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">Produto</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">Código</TableHead>
                  <TableHead className="h-8 text-xs">Estoque</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Status</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Valor Unit.</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Valor Total</TableHead>
                  <TableHead className="h-8 text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: EstoqueItem) => {
                const status = getEstoqueStatus(item.estoque);
                const isEditing = editingEstoque[item.id] !== undefined;
                return <TableRow key={item.id}>
                      <TableCell className="font-medium p-2">
                        <div>
                          <div className="text-xs font-semibold">{item.nome}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {item.categoria}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2">
                        <Badge variant="outline" className="text-xs">{item.categoria}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2">
                        <code className="bg-gray-100 px-1 py-1 rounded text-xs">
                          {item.codigo_barras || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="p-2">
                        {isEditing ? (
                          <div className="space-y-2 min-w-[140px]">
                            <div className="text-xs text-gray-600">
                              Atual: <span className="font-semibold text-blue-600">{item.estoque} un.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={editingEstoque[item.id]}
                                onChange={(e) => setEstoqueValue(item.id, parseInt(e.target.value) || 0)}
                                className="w-20 h-8 text-xs text-center border-blue-300 focus:border-blue-500"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-500">un.</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => updateEstoqueFromInput(item.id)}
                                className="h-7 px-2 bg-green-600 hover:bg-green-700 text-xs"
                                disabled={updateEstoqueMutation.isPending}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEditingEstoque(item.id)}
                                className="h-7 px-2 text-xs"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold min-w-[40px]">{item.estoque} un.</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2">
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 text-xs">R$ {item.preco.toFixed(2)}</TableCell>
                      <TableCell className="hidden lg:table-cell p-2 text-xs">R$ {(item.estoque * item.preco).toFixed(2)}</TableCell>
                      <TableCell className="p-2">
                        <div className="flex flex-col gap-1 min-w-[80px]">
                          {!isEditing && (
                            <>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => adjustEstoque(item.id, item.estoque, -1)}
                                  disabled={item.estoque === 0 || updateEstoqueMutation.isPending}
                                  className="h-7 w-7 p-0 border-red-300 hover:bg-red-50"
                                  title="Diminuir 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => adjustEstoque(item.id, item.estoque, 1)}
                                  disabled={updateEstoqueMutation.isPending}
                                  className="h-7 w-7 p-0 border-green-300 hover:bg-green-50"
                                  title="Aumentar 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingEstoque(item.id, item.estoque)}
                                className="h-7 px-2 border-blue-300 hover:bg-blue-50 text-xs"
                                title="Editar quantidade"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>;
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>;
};

export default Estoque;
