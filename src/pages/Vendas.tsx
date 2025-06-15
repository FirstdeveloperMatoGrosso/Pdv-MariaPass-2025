
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Search,
  Package,
  DollarSign
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

interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem_url?: string;
  codigo_barras?: string;
}

interface ItemVenda {
  produto: Produto;
  quantidade: number;
  subtotal: number;
}

const Vendas: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [busca, setBusca] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const total = itensVenda.reduce((acc, item) => acc + item.subtotal, 0);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    if (busca.trim()) {
      const filtrados = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        produto.codigo_barras?.includes(busca)
      );
      setProdutosFiltrados(filtrados);
    } else {
      setProdutosFiltrados([]);
    }
  }, [busca, produtos]);

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('status', 'ativo')
        .gt('estoque', 0);

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      });
    }
  };

  const adicionarItem = (produto: Produto) => {
    const itemExistente = itensVenda.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade < produto.estoque) {
        setItensVenda(itens => 
          itens.map(item => 
            item.produto.id === produto.id
              ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * produto.preco }
              : item
          )
        );
      } else {
        toast({
          title: "Estoque insuficiente",
          description: "Não há estoque suficiente para este produto",
          variant: "destructive",
        });
      }
    } else {
      setItensVenda(itens => [...itens, {
        produto,
        quantidade: 1,
        subtotal: produto.preco
      }]);
    }
    setBusca('');
    setProdutosFiltrados([]);
  };

  const removerItem = (produtoId: string) => {
    setItensVenda(itens => itens.filter(item => item.produto.id !== produtoId));
  };

  const alterarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(produtoId);
      return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    if (novaQuantidade > produto.estoque) {
      toast({
        title: "Estoque insuficiente",
        description: "Quantidade maior que o estoque disponível",
        variant: "destructive",
      });
      return;
    }

    setItensVenda(itens =>
      itens.map(item =>
        item.produto.id === produtoId
          ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.produto.preco }
          : item
      )
    );
  };

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à venda",
        variant: "destructive",
      });
      return;
    }

    if (!formaPagamento) {
      toast({
        title: "Erro",
        description: "Selecione a forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Inserir vendas individuais para cada item
      for (const item of itensVenda) {
        const { error } = await supabase
          .from('vendas_pulseiras')
          .insert({
            produto_id: item.produto.id,
            quantidade: item.quantidade,
            valor_unitario: item.produto.preco,
            valor_total: item.subtotal,
            forma_pagamento: formaPagamento,
            numero_autorizacao: `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          });

        if (error) throw error;

        // Atualizar estoque
        const { error: estoqueError } = await supabase
          .from('produtos')
          .update({ 
            estoque: item.produto.estoque - item.quantidade 
          })
          .eq('id', item.produto.id);

        if (estoqueError) throw estoqueError;
      }

      toast({
        title: "Sucesso",
        description: `Venda finalizada! Total: R$ ${total.toFixed(2)}`,
      });

      // Limpar venda
      setItensVenda([]);
      setFormaPagamento('');
      carregarProdutos(); // Recarregar para atualizar estoque

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar venda",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <ShoppingCart className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Nova Venda</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Busca de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Buscar Produtos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Digite o nome do produto ou código de barras..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full"
              />
              
              {produtosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                  {produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                      onClick={() => adicionarItem(produto)}
                    >
                      <div className="flex items-center space-x-3">
                        {produto.imagem_url && (
                          <img 
                            src={produto.imagem_url} 
                            alt={produto.nome}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{produto.nome}</h4>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(produto.preco)} • Estoque: {produto.estoque}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Venda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Resumo da Venda</span>
              </div>
              <Badge variant="outline">
                {itensVenda.length} {itensVenda.length === 1 ? 'item' : 'itens'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(total)}
              </p>
              <p className="text-sm text-gray-600">Total da venda</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="pulseira">Pulseira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={finalizarVenda}
              disabled={loading || itensVenda.length === 0}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Finalizando...' : 'Finalizar Venda'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Itens da Venda */}
      {itensVenda.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Itens da Venda</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itensVenda.map((item) => (
                <div key={item.produto.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  {item.produto.imagem_url && (
                    <img 
                      src={item.produto.imagem_url} 
                      alt={item.produto.nome}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{item.produto.nome}</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.produto.preco)} cada
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <span className="w-12 text-center font-medium">
                      {item.quantidade}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(item.subtotal)}</p>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removerItem(item.produto.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Vendas;
