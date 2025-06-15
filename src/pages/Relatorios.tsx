
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ExportModal from '@/components/ExportModal';
import GraficoVendas from '@/components/GraficoVendas';
import { useRelatorioDados } from '@/hooks/useRelatorioDados';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Relatorios: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { 
    dados, 
    produtosMaisVendidos, 
    pedidosRecentes, 
    loading, 
    error, 
    refetch 
  } = useRelatorioDados(selectedPeriod);

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      default: return period;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: ptBR });
    } catch {
      return '--:--';
    }
  };

  // Dados para gráficos
  const dadosGraficoVendas = produtosMaisVendidos.map(produto => ({
    nome: produto.nome.length > 15 ? produto.nome.substring(0, 15) + '...' : produto.nome,
    valor: produto.receita,
    periodo: selectedPeriod
  }));

  if (error) {
    return (
      <div className="min-h-screen p-2 sm:p-4 pb-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refetch} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 pb-8 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Relatórios e Análises</h1>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3 text-gray-500" />
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'month')}
            className="border rounded-md px-2 py-1 text-sm h-8"
            disabled={loading}
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
          <Button 
            variant="outline" 
            className="flex items-center space-x-1 h-8 text-sm px-2"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          <Button 
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 h-8 text-sm px-3"
            onClick={() => setExportModalOpen(true)}
            disabled={loading}
          >
            <Download className="w-3 h-3" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* Estatísticas Compactas */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-green-700">Faturamento Total</p>
                <p className="text-base font-bold text-green-900">
                  {loading ? '...' : formatCurrency(dados?.faturamentoTotal || 0)}
                </p>
              </div>
              <div className="p-1 bg-green-200 rounded">
                <DollarSign className="w-3 h-3 text-green-700" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {loading ? '...' : `+${dados?.crescimentoPercentual || 0}% período anterior`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-blue-700">Pedidos Realizados</p>
                <p className="text-base font-bold text-blue-900">
                  {loading ? '...' : dados?.pedidosRealizados || 0}
                </p>
              </div>
              <div className="p-1 bg-blue-200 rounded">
                <Package className="w-3 h-3 text-blue-700" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {loading ? '...' : '+8.2% período anterior'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0">
                <p className="text-xs font-medium text-purple-700">Ticket Médio</p>
                <p className="text-base font-bold text-purple-900">
                  {loading ? '...' : formatCurrency(dados?.ticketMedio || 0)}
                </p>
              </div>
              <div className="p-1 bg-purple-200 rounded">
                <TrendingUp className="w-3 h-3 text-purple-700" />
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {loading ? '...' : '+3.8% período anterior'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Produtos Mais Vendidos</CardTitle>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {produtosMaisVendidos.length} produtos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Carregando produtos...</p>
              </div>
            ) : produtosMaisVendidos.length === 0 ? (
              <div className="p-4 text-center">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum produto vendido no período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="h-6 text-xs">Produto</TableHead>
                      <TableHead className="h-6 text-xs">Qtd</TableHead>
                      <TableHead className="h-6 text-xs">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosMaisVendidos.map((produto, index) => (
                      <TableRow key={produto.id} className="h-8">
                        <TableCell className="font-medium p-1 text-xs">{produto.nome}</TableCell>
                        <TableCell className="p-1">
                          <Badge variant="secondary" className="text-xs px-1 py-0">{produto.quantidade}</Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-bold p-1 text-xs">
                          {formatCurrency(produto.receita)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos Recentes */}
        <Card>
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Vendas Recentes</CardTitle>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {pedidosRecentes.length} vendas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Carregando vendas...</p>
              </div>
            ) : pedidosRecentes.length === 0 ? (
              <div className="p-4 text-center">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma venda no período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="h-6 text-xs">Código</TableHead>
                      <TableHead className="hidden sm:table-cell h-6 text-xs">Hora</TableHead>
                      <TableHead className="h-6 text-xs">Itens</TableHead>
                      <TableHead className="h-6 text-xs">Total</TableHead>
                      <TableHead className="h-6 text-xs">Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosRecentes.map((pedido) => (
                      <TableRow key={pedido.id} className="h-8">
                        <TableCell className="p-1">
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                            {pedido.numeroAutorizacao}
                          </code>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell p-1 text-xs">
                          {formatTime(pedido.dataVenda)}
                        </TableCell>
                        <TableCell className="p-1 text-xs">{pedido.quantidade}</TableCell>
                        <TableCell className="font-bold p-1 text-xs">
                          {formatCurrency(pedido.valorTotal)}
                        </TableCell>
                        <TableCell className="p-1">
                          <Badge 
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {pedido.formaPagamento}
                          </Badge>
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

      {/* Gráfico de Vendas por Produto */}
      {!loading && dadosGraficoVendas.length > 0 && (
        <div className="mb-4">
          <GraficoVendas
            dados={dadosGraficoVendas}
            tipo="bar"
            titulo="Receita por Produto Mais Vendido"
            corPrimaria="#10b981"
          />
        </div>
      )}

      {/* Lista Completa de Produtos Vendidos */}
      <Card className="mb-8">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800">Todos os Produtos Vendidos</CardTitle>
            <Badge variant="outline" className="text-xs px-1 py-0">
              Análise detalhada
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando produtos...</p>
            </div>
          ) : produtosMaisVendidos.length === 0 ? (
            <div className="p-4 text-center">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum produto vendido no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto mb-4">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="h-6 text-xs">Produto</TableHead>
                    <TableHead className="h-6 text-xs">Quantidade</TableHead>
                    <TableHead className="h-6 text-xs">Preço Médio</TableHead>
                    <TableHead className="h-6 text-xs">Receita Total</TableHead>
                    <TableHead className="h-6 text-xs">Participação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosMaisVendidos.map((produto, index) => {
                    const precoMedio = produto.quantidade > 0 ? produto.receita / produto.quantidade : 0;
                    const receitaTotal = dados?.faturamentoTotal || 0;
                    const participacao = receitaTotal > 0 ? (produto.receita / receitaTotal) * 100 : 0;
                    
                    return (
                      <TableRow key={produto.id} className="h-8">
                        <TableCell className="font-medium p-1 text-xs">
                          <div className="flex items-center space-x-1">
                            <Badge 
                              variant="outline" 
                              className="text-xs px-1 py-0"
                            >
                              #{index + 1}
                            </Badge>
                            <span>{produto.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-1 text-xs">
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {produto.quantidade}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-1 text-xs text-blue-600">
                          {formatCurrency(precoMedio)}
                        </TableCell>
                        <TableCell className="text-green-600 font-bold p-1 text-xs">
                          {formatCurrency(produto.receita)}
                        </TableCell>
                        <TableCell className="p-1 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${Math.min(participacao, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {participacao.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        reportData={dados || { total: 0, orders: 0, avgTicket: 0 }}
        period={getPeriodLabel(selectedPeriod)}
      />
    </div>
  );
};

export default Relatorios;
