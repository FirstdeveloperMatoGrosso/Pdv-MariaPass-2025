
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Plus,
  Gift,
  Calendar,
  DollarSign,
  Users,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  Clock
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

interface Voucher {
  id: string;
  code: string;
  type: 'discount' | 'freeItem' | 'cashback';
  value: number;
  description: string;
  status: 'active' | 'used' | 'expired';
  validUntil: string;
  usageCount: number;
  maxUsage: number;
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
}

const Vouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: '1',
      code: 'DESCONTO10',
      type: 'discount',
      value: 10,
      description: '10% de desconto em qualquer pedido',
      status: 'active',
      validUntil: '2024-12-31',
      usageCount: 5,
      maxUsage: 100,
      createdAt: '2024-06-01 10:00:00'
    },
    {
      id: '2',
      code: 'CAFEGRATIS',
      type: 'freeItem',
      value: 8.00,
      description: 'Café expresso grátis',
      status: 'used',
      validUntil: '2024-06-30',
      usageCount: 1,
      maxUsage: 1,
      createdAt: '2024-06-10 14:30:00',
      usedBy: 'João Silva',
      usedAt: '2024-06-14 09:15:00'
    },
    {
      id: '3',
      code: 'CASHBACK5',
      type: 'cashback',
      value: 5.00,
      description: 'R$ 5,00 de cashback',
      status: 'expired',
      validUntil: '2024-06-13',
      usageCount: 0,
      maxUsage: 50,
      createdAt: '2024-05-15 16:20:00'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [newVoucher, setNewVoucher] = useState({
    code: '',
    type: 'discount' as const,
    value: 0,
    description: '',
    validUntil: '',
    maxUsage: 1
  });

  const voucherTypes = ['discount', 'freeItem', 'cashback'];

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || voucher.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || voucher.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'used':
        return <Badge className="bg-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Usado</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'discount':
        return <Badge className="bg-purple-600"><DollarSign className="w-3 h-3 mr-1" />Desconto</Badge>;
      case 'freeItem':
        return <Badge className="bg-green-600"><Gift className="w-3 h-3 mr-1" />Item Grátis</Badge>;
      case 'cashback':
        return <Badge className="bg-blue-600"><DollarSign className="w-3 h-3 mr-1" />Cashback</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createVoucher = () => {
    if (!newVoucher.code || !newVoucher.description || !newVoucher.validUntil) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const voucher: Voucher = {
      id: Date.now().toString(),
      code: newVoucher.code,
      type: newVoucher.type,
      value: newVoucher.value,
      description: newVoucher.description,
      status: 'active',
      validUntil: newVoucher.validUntil,
      usageCount: 0,
      maxUsage: newVoucher.maxUsage,
      createdAt: new Date().toLocaleString('pt-BR')
    };

    setVouchers(prev => [...prev, voucher]);
    setNewVoucher({
      code: '',
      type: 'discount',
      value: 0,
      description: '',
      validUntil: '',
      maxUsage: 1
    });
    toast.success('Voucher criado com sucesso!');
  };

  const deactivateVoucher = (id: string) => {
    setVouchers(prev => prev.map(voucher =>
      voucher.id === id ? { ...voucher, status: 'expired' as const } : voucher
    ));
    toast.success('Voucher desativado!');
  };

  const activeVouchers = vouchers.filter(v => v.status === 'active').length;
  const usedVouchers = vouchers.filter(v => v.status === 'used').length;
  const expiredVouchers = vouchers.filter(v => v.status === 'expired').length;
  const totalUsage = vouchers.reduce((acc, v) => acc + v.usageCount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Ticket className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Vouchers</h1>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Vouchers Ativos</p>
                <p className="text-2xl font-bold text-green-600">{activeVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Utilizados</p>
                <p className="text-2xl font-bold text-blue-600">{usedVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Expirados</p>
                <p className="text-2xl font-bold text-red-600">{expiredVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Usos</p>
                <p className="text-2xl font-bold">{totalUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar Novo Voucher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Criar Novo Voucher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Código do voucher"
                value={newVoucher.code}
                onChange={(e) => setNewVoucher(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              />
              <Button
                variant="outline"
                onClick={() => setNewVoucher(prev => ({ ...prev, code: generateVoucherCode() }))}
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            <select 
              value={newVoucher.type}
              onChange={(e) => setNewVoucher(prev => ({ ...prev, type: e.target.value as any }))}
              className="border rounded-md px-3 py-2"
            >
              <option value="discount">Desconto (%)</option>
              <option value="freeItem">Item Grátis</option>
              <option value="cashback">Cashback (R$)</option>
            </select>
            <Input
              placeholder={newVoucher.type === 'discount' ? "Valor (%)" : "Valor (R$)"}
              type="number"
              value={newVoucher.value}
              onChange={(e) => setNewVoucher(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              placeholder="Descrição"
              value={newVoucher.description}
              onChange={(e) => setNewVoucher(prev => ({ ...prev, description: e.target.value }))}
            />
            <Input
              placeholder="Válido até"
              type="date"
              value={newVoucher.validUntil}
              onChange={(e) => setNewVoucher(prev => ({ ...prev, validUntil: e.target.value }))}
            />
            <Input
              placeholder="Máximo de usos"
              type="number"
              value={newVoucher.maxUsage}
              onChange={(e) => setNewVoucher(prev => ({ ...prev, maxUsage: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="mt-4">
            <Button onClick={createVoucher}>
              Criar Voucher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">Todos os tipos</option>
              <option value="discount">Desconto</option>
              <option value="freeItem">Item Grátis</option>
              <option value="cashback">Cashback</option>
            </select>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="used">Usado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vouchers */}
      <Card>
        <CardHeader>
          <CardTitle>Vouchers Cadastrados ({filteredVouchers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Válido até</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {voucher.code}
                    </code>
                  </TableCell>
                  <TableCell>{getTypeBadge(voucher.type)}</TableCell>
                  <TableCell>
                    {voucher.type === 'discount' ? `${voucher.value}%` : `R$ ${voucher.value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>{voucher.description}</TableCell>
                  <TableCell>{getStatusBadge(voucher.status)}</TableCell>
                  <TableCell>{voucher.validUntil}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {voucher.usageCount} / {voucher.maxUsage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{voucher.createdAt}</TableCell>
                  <TableCell>
                    {voucher.status === 'active' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deactivateVoucher(voucher.id)}
                      >
                        Desativar
                      </Button>
                    )}
                    {voucher.usedBy && (
                      <div className="text-xs text-gray-500 mt-1">
                        Usado por: {voucher.usedBy}
                      </div>
                    )}
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

export default Vouchers;
