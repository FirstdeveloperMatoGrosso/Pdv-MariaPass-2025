
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
  Minus
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

interface EstoqueItem {
  id: string;
  nome: string;
  categoria: string;
  estoque: number;
  codigo_barras: string;
  preco: number;
  status: 'ativo' | 'inativo';
}

const Estoque: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all'); // all, baixo, zerado
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
    },
    onError: (error) => {
      console.error('Erro ao atualizar estoque:', error);
      toast.error('Erro ao atualizar estoque');
    },
  });

  const filteredItems = estoqueItems.filter(item => {
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
  const itensZerados = estoqueItems.filter(item => item.estoque === 0).length;
  const itensBaixos = estoqueItems.filter(item => item.estoque > 0 && item.estoque <= 10).length;
  const valorTotalEstoque = estoqueItems.reduce((total, item) => total + (item.estoque * item.preco), 0);

  const adjustEstoque = (id: string, currentEstoque: number, adjustment: number) => {
    const novoEstoque = Math.max(0, currentEstoque + adjustment);
    updateEstoqueMutation.mutate({ id, novoEstoque });
  };

  const getEstoqueStatus = (estoque: number) => {
    if (estoque === 0) return { variant: 'destructive' as const, text: 'Zerado' };
    if (estoque <= 10) return { variant: 'default' as const, text: 'Baixo' };
    return { variant: 'secondary' as const, text: 'Normal' };
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Archive className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
        </div>
        <Button 
          onClick={() => refetch()}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Archive className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold">{totalItens}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Estoque Zerado</p>
                <p className="text-2xl font-bold text-red-600">{itensZerados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">{itensBaixos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">R$ {valorTotalEstoque.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <select 
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">Todos os status</option>
                <option value="zerado">Estoque zerado</option>
                <option value="baixo">Estoque baixo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque ({filteredItems.length} itens)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Unitário</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const status = getEstoqueStatus(item.estoque);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {item.codigo_barras}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-semibold">{item.estoque} un.</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {item.preco.toFixed(2)}</TableCell>
                    <TableCell>R$ {(item.estoque * item.preco).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => adjustEstoque(item.id, item.estoque, -1)}
                          disabled={item.estoque === 0 || updateEstoqueMutation.isPending}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => adjustEstoque(item.id, item.estoque, 1)}
                          disabled={updateEstoqueMutation.isPending}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estoque;
