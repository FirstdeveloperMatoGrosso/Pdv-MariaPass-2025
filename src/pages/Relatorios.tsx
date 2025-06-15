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
import ExportModal from '@/components/ExportModal';

const Relatorios: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Dados simulados
  const salesData = {
    today: { total: 1250.50, orders: 23, avgTicket: 54.37 },
    week: { total: 8750.25, orders: 156, avgTicket: 56.09 },
    month: { total: 35200.75, orders: 672, avgTicket: 52.38 }
  };

  const topProducts = [
    { name: 'Suco Natural Laranja', quantity: 45, revenue: 450.00 },
    { name: 'Sanduíche Natural Frango', quantity: 28, revenue: 420.00 },
    { name: 'Café Expresso Premium', quantity: 52, revenue: 416.00 },
    { name: 'Pão de Queijo Tradicional', quantity: 67, revenue: 335.00 },
    { name: 'Água Mineral 500ml', quantity: 89, revenue: 267.00 }
  ];

  const recentOrders = [
    { id: 'PED-001', time: '14:32', items: 3, total: 28.50, status: 'Concluído' },
    { id: 'PED-002', time: '14:28', items: 2, total: 18.00, status: 'Concluído' },
    { id: 'PED-003', time: '14:25', items: 5, total: 67.50, status: 'Concluído' },
    { id: 'PED-004', time: '14:20', items: 1, total: 8.00, status: 'Cancelado' },
    { id: 'PED-005', time: '14:18', items: 4, total: 42.00, status: 'Concluído' }
  ];

  const currentData = salesData[selectedPeriod as keyof typeof salesData];

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      default: return period;
    }
  };

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
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
          <Button 
            variant="outline" 
            className="flex items-center space-x-1 h-8 text-sm px-2"
            onClick={() => setExportModalOpen(true)}
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
              R$ {currentData.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% em relação ao período anterior
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
              {currentData.orders}
            </div>
            <p className="text-xs text-muted-foreground">
              +8.2% em relação ao período anterior
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
              R$ {currentData.avgTicket.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +3.8% em relação ao período anterior
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
                  {topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium p-2 text-xs">{product.name}</TableCell>
                      <TableCell className="p-2">
                        <Badge variant="secondary" className="text-xs">{product.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-green-600 font-bold p-2 text-xs">
                        R$ {product.revenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Recentes */}
        <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="text-sm sm:text-base">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Pedido</TableHead>
                    <TableHead className="hidden sm:table-cell h-8 text-xs">Hora</TableHead>
                    <TableHead className="h-8 text-xs">Itens</TableHead>
                    <TableHead className="h-8 text-xs">Total</TableHead>
                    <TableHead className="h-8 text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="p-2">
                        <code className="bg-gray-100 px-1 py-1 rounded text-xs">
                          {order.id}
                        </code>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2 text-xs">{order.time}</TableCell>
                      <TableCell className="p-2 text-xs">{order.items}</TableCell>
                      <TableCell className="font-bold p-2 text-xs">
                        R$ {order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge 
                          variant={order.status === 'Concluído' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        reportData={currentData}
        period={getPeriodLabel(selectedPeriod)}
      />
    </div>
  );
};

export default Relatorios;
