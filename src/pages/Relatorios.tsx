
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
      <div className="p-2 sm:p-3">
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
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
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
            className="border rounded-md px-2 py-1 text-sm"
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
            variant="outline" 
            className="flex items-center space-x-1 h-8 text-sm px-2"
            onClick={() => setExportModalOpen(true)}
            disabled={loading}
          >
            <Download className="w-3 h-3" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-green-600">
              {loading ? '...' : formatCurrency(dados?.faturamentoTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `+${dados?.crescimentoPercentual || 0}% em relação ao período anterior`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Pedidos Realizados</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-blue-600">
              {loading ? '...' : dados?.pedidosRealizados || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : '+8.2% em relação ao período anterior'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-purple-600">
              {loading ? '...' : formatCurrency(dados?.ticketMedio || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : '+3.8% em relação ao período anterior'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-sm sm:text-base">Produtos Mais Vendidos</CardTitle>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-xs">Produto</TableHead>
                      <TableHead className="h-8 text-xs">Qtd</TableHead>
                      <TableHead className="h-8 text-xs">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosMaisVendidos.map((produto, index) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium p-2 text-xs">{produto.nome}</TableCell>
                        <TableCell className="p-2">
                          <Badge variant="secondary" className="text-xs">{produto.quantidade}</Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-bold p-2 text-xs">
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
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-sm sm:text-base">Vendas Recentes</CardTitle>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-xs">Código</TableHead>
                      <TableHead className="hidden sm:table-cell h-8 text-xs">Hora</TableHead>
                      <TableHead className="h-8 text-xs">Itens</TableHead>
                      <TableHead className="h-8 text-xs">Total</TableHead>
                      <TableHead className="h-8 text-xs">Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosRecentes.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="p-2">
                          <code className="bg-gray-100 px-1 py-1 rounded text-xs">
                            {pedido.numeroAutorizacao}
                          </code>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell p-2 text-xs">
                          {formatTime(pedido.dataVenda)}
                        </TableCell>
                        <TableCell className="p-2 text-xs">{pedido.quantidade}</TableCell>
                        <TableCell className="font-bold p-2 text-xs">
                          {formatCurrency(pedido.valorTotal)}
                        </TableCell>
                        <TableCell className="p-2">
                          <Badge 
                            variant="outline"
                            className="text-xs"
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
        <GraficoVendas
          dados={dadosGraficoVendas}
          tipo="bar"
          titulo="Receita por Produto Mais Vendido"
          corPrimaria="#10b981"
        />
      )}

      {/* Lista Completa de Produtos Vendidos */}
      <Card>
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="text-sm sm:text-base">Todos os Produtos Vendidos</CardTitle>
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
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Produto</TableHead>
                    <TableHead className="h-8 text-xs">Quantidade</TableHead>
                    <TableHead className="h-8 text-xs">Preço Médio</TableHead>
                    <TableHead className="h-8 text-xs">Receita Total</TableHead>
                    <TableHead className="h-8 text-xs">Participação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosMaisVendidos.map((produto, index) => {
                    const precoMedio = produto.quantidade > 0 ? produto.receita / produto.quantidade : 0;
                    const receitaTotal = dados?.faturamentoTotal || 0;
                    const participacao = receitaTotal > 0 ? (produto.receita / receitaTotal) * 100 : 0;
                    
                    return (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium p-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs px-1 py-0"
                            >
                              #{index + 1}
                            </Badge>
                            <span>{produto.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 text-xs">
                          <Badge variant="secondary" className="text-xs">
                            {produto.quantidade}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2 text-xs text-blue-600">
                          {formatCurrency(precoMedio)}
                        </TableCell>
                        <TableCell className="text-green-600 font-bold p-2 text-xs">
                          {formatCurrency(produto.receita)}
                        </TableCell>
                        <TableCell className="p-2 text-xs">
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
