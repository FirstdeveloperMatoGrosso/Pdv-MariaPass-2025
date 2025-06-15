
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Search,
  Calendar,
  Filter,
  Download,
  Eye
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
import { useQuery } from '@tanstack/react-query';

interface VendaRealizada {
  id: string;
  data_venda: string;
  numero_autorizacao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: string;
  produto_nome?: string;
  produto_imagem?: string;
  nsu?: string;
  bandeira?: string;
}

const Vendas: React.FC = () => {
  const [filtroData, setFiltroData] = useState('hoje');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('todas');
  const [busca, setBusca] = useState('');
  const { toast } = useToast();

  // Buscar vendas realizadas
  const { data: vendas = [], isLoading, error, refetch } = useQuery({
    queryKey: ['vendas-realizadas', filtroData, filtroFormaPagamento, busca],
    queryFn: async () => {
      console.log('Buscando vendas realizadas...');
      
      let dataInicio = new Date();
      let dataFim = new Date();
      
      // Configurar filtros de data
      switch (filtroData) {
        case 'hoje':
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'semana':
          dataInicio.setDate(dataInicio.getDate() - 7);
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'mes':
          dataInicio.setDate(1);
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'todos':
          dataInicio = new Date('2020-01-01');
          dataFim.setHours(23, 59, 59, 999);
          break;
      }

      let query = supabase
        .from('vendas_pulseiras')
        .select(`
          id,
          data_venda,
          numero_autorizacao,
          quantidade,
          valor_unitario,
          valor_total,
          forma_pagamento,
          nsu,
          bandeira,
          produtos:produto_id (
            nome,
            imagem_url
          )
        `)
        .gte('data_venda', dataInicio.toISOString())
        .lte('data_venda', dataFim.toISOString())
        .order('data_venda', { ascending: false });

      // Filtrar por forma de pagamento
      if (filtroFormaPagamento !== 'todas') {
        query = query.eq('forma_pagamento', filtroFormaPagamento);
      }

      // Filtrar por busca (número de autorização ou nome do produto)
      if (busca.trim()) {
        query = query.or(`numero_autorizacao.ilike.%${busca}%,produtos.nome.ilike.%${busca}%`);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        throw error;
      }

      console.log('Vendas encontradas:', data?.length || 0);

      return data?.map(venda => ({
        id: venda.id,
        data_venda: venda.data_venda,
        numero_autorizacao: venda.numero_autorizacao || `VEN-${venda.id.slice(0, 8)}`,
        quantidade: Number(venda.quantidade) || 1,
        valor_unitario: Number(venda.valor_unitario) || 0,
        valor_total: Number(venda.valor_total) || 0,
        forma_pagamento: venda.forma_pagamento || 'Não informado',
        produto_nome: venda.produtos?.nome || 'Produto não identificado',
        produto_imagem: venda.produtos?.imagem_url,
        nsu: venda.nsu,
        bandeira: venda.bandeira
      })) || [];
    },
  });

  // Calcular totais
  const totalVendas = vendas.length;
  const faturamentoTotal = vendas.reduce((acc, venda) => acc + venda.valor_total, 0);
  const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getFormaPagamentoBadge = (forma: string) => {
    const cores = {
      'dinheiro': 'bg-green-100 text-green-800',
      'cartao_credito': 'bg-blue-100 text-blue-800',
      'cartao_debito': 'bg-purple-100 text-purple-800',
      'pix': 'bg-orange-100 text-orange-800',
      'pulseira': 'bg-pink-100 text-pink-800'
    };
    
    return cores[forma as keyof typeof cores] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Erro ao carregar vendas: {error.message}</p>
            <Button onClick={() => refetch()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Vendas Realizadas</h1>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(faturamentoTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(ticketMedio)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={filtroData} onValueChange={setFiltroData}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="todos">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="pulseira">Pulseira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Número da venda ou produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando vendas...</p>
            </div>
          ) : vendas.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma venda encontrada para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendas.map((venda) => (
                <div key={venda.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {venda.produto_imagem && (
                        <img 
                          src={venda.produto_imagem} 
                          alt={venda.produto_nome}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      )}
                      
                      <div>
                        <h4 className="font-medium">{venda.produto_nome}</h4>
                        <p className="text-sm text-gray-600">
                          Venda: {venda.numero_autorizacao}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(venda.data_venda)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getFormaPagamentoBadge(venda.forma_pagamento)}>
                          {venda.forma_pagamento.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {venda.bandeira && (
                          <Badge variant="outline" className="text-xs">
                            {venda.bandeira}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm">
                          Qtd: {venda.quantidade} x {formatCurrency(venda.valor_unitario)}
                        </p>
                        <p className="font-bold text-green-600">
                          Total: {formatCurrency(venda.valor_total)}
                        </p>
                      </div>
                      
                      {venda.nsu && (
                        <p className="text-xs text-gray-500 mt-1">
                          NSU: {venda.nsu}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vendas;
