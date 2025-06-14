
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

const Relatorios: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Relatórios e Análises</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {currentData.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% em relação ao período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Realizados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentData.orders}
            </div>
            <p className="text-xs text-muted-foreground">
              +8.2% em relação ao período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {currentData.avgTicket.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +3.8% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-green-600 font-bold">
                      R$ {product.revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pedidos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {order.id}
                      </code>
                    </TableCell>
                    <TableCell>{order.time}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell className="font-bold">
                      R$ {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === 'Concluído' ? 'default' : 'destructive'}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
