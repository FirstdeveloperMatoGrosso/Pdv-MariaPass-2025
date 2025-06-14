
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Archive, 
  Plus, 
  Minus,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Search
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

interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  category: string;
  lastUpdate: string;
  cost: number;
}

const Estoque: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: '1',
      name: 'Suco Natural Laranja',
      currentStock: 25,
      minStock: 10,
      maxStock: 50,
      category: 'Bebidas',
      lastUpdate: '2024-06-14 10:30',
      cost: 5.00
    },
    {
      id: '2',
      name: 'Pão de Queijo Tradicional',
      currentStock: 5,
      minStock: 15,
      maxStock: 40,
      category: 'Salgados',
      lastUpdate: '2024-06-14 09:15',
      cost: 2.50
    },
    {
      id: '3',
      name: 'Água Mineral 500ml',
      currentStock: 50,
      minStock: 20,
      maxStock: 100,
      category: 'Bebidas',
      lastUpdate: '2024-06-14 08:00',
      cost: 1.50
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['Bebidas', 'Salgados', 'Sanduíches', 'Doces', 'Outros'];

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const updateStock = (id: string, change: number) => {
    setStockItems(prev => prev.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.currentStock + change);
        return {
          ...item,
          currentStock: newStock,
          lastUpdate: new Date().toLocaleString('pt-BR')
        };
      }
      return item;
    }));
    toast.success(`Estoque ${change > 0 ? 'adicionado' : 'removido'} com sucesso!`);
  };

  const getStockStatus = (item: StockItem) => {
    if (item.currentStock <= item.minStock) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Baixo</Badge>;
    } else if (item.currentStock >= item.maxStock) {
      return <Badge className="bg-orange-600"><Package className="w-3 h-3 mr-1" />Alto</Badge>;
    } else {
      return <Badge className="bg-green-600"><Package className="w-3 h-3 mr-1" />Normal</Badge>;
    }
  };

  const lowStockItems = stockItems.filter(item => item.currentStock <= item.minStock);
  const totalValue = stockItems.reduce((acc, item) => acc + (item.currentStock * item.cost), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Archive className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold">{stockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Alertas</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Estoque Baixo */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="destructive">
                    {item.currentStock} / {item.minStock} min
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
        </CardContent>
      </Card>

      {/* Tabela de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Min / Max</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Custo Unit.</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-lg font-semibold">{item.currentStock}</TableCell>
                  <TableCell>{item.minStock} / {item.maxStock}</TableCell>
                  <TableCell>{getStockStatus(item)}</TableCell>
                  <TableCell>R$ {item.cost.toFixed(2)}</TableCell>
                  <TableCell>R$ {(item.currentStock * item.cost).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{item.lastUpdate}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStock(item.id, -1)}
                        disabled={item.currentStock === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStock(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estoque;
