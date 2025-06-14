
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Watch, 
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  Nfc,
  Search,
  History,
  CheckCircle,
  AlertCircle,
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

interface Bracelet {
  id: string;
  code: string;
  customerName: string;
  balance: number;
  status: 'active' | 'blocked' | 'inactive';
  lastUsed: string;
  totalRecharges: number;
  totalSpent: number;
  createdAt: string;
}

interface RechargeTransaction {
  id: string;
  braceletCode: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'pix';
  timestamp: string;
  operator: string;
  status: 'completed' | 'pending' | 'failed';
}

const RecargaPulseiras: React.FC = () => {
  const [bracelets, setBracelets] = useState<Bracelet[]>([
    {
      id: '1',
      code: 'PUL001',
      customerName: 'João Silva',
      balance: 25.50,
      status: 'active',
      lastUsed: '2024-06-14 10:30:00',
      totalRecharges: 180.00,
      totalSpent: 154.50,
      createdAt: '2024-05-15 14:20:00'
    },
    {
      id: '2',
      code: 'PUL002',
      customerName: 'Maria Santos',
      balance: 0.00,
      status: 'inactive',
      lastUsed: '2024-06-10 16:45:00',
      totalRecharges: 95.00,
      totalSpent: 95.00,
      createdAt: '2024-06-01 09:15:00'
    },
    {
      id: '3',
      code: 'PUL003',
      customerName: 'Pedro Costa',
      balance: 15.75,
      status: 'blocked',
      lastUsed: '2024-06-13 11:20:00',
      totalRecharges: 120.00,
      totalSpent: 104.25,
      createdAt: '2024-05-20 16:30:00'
    }
  ]);

  const [transactions, setTransactions] = useState<RechargeTransaction[]>([
    {
      id: '1',
      braceletCode: 'PUL001',
      amount: 20.00,
      paymentMethod: 'card',
      timestamp: '2024-06-14 09:15:00',
      operator: 'Sistema',
      status: 'completed'
    },
    {
      id: '2',
      braceletCode: 'PUL002',
      amount: 15.00,
      paymentMethod: 'cash',
      timestamp: '2024-06-13 14:30:00',
      operator: 'Operador',
      status: 'completed'
    },
    {
      id: '3',
      braceletCode: 'PUL003',
      amount: 10.00,
      paymentMethod: 'pix',
      timestamp: '2024-06-12 16:45:00',
      operator: 'Sistema',
      status: 'failed'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [rechargeForm, setRechargeForm] = useState({
    braceletCode: '',
    amount: 0,
    paymentMethod: 'cash' as const
  });

  const filteredBracelets = bracelets.filter(bracelet => {
    const matchesSearch = bracelet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bracelet.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || bracelet.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Ativa</Badge>;
      case 'blocked':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Bloqueada</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Inativa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge className="bg-green-600"><DollarSign className="w-3 h-3 mr-1" />Dinheiro</Badge>;
      case 'card':
        return <Badge className="bg-blue-600"><CreditCard className="w-3 h-3 mr-1" />Cartão</Badge>;
      case 'pix':
        return <Badge className="bg-purple-600"><Nfc className="w-3 h-3 mr-1" />PIX</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const processRecharge = () => {
    if (!rechargeForm.braceletCode || rechargeForm.amount <= 0) {
      toast.error('Preencha todos os campos corretamente!');
      return;
    }

    const bracelet = bracelets.find(b => b.code === rechargeForm.braceletCode);
    if (!bracelet) {
      toast.error('Pulseira não encontrada!');
      return;
    }

    if (bracelet.status === 'blocked') {
      toast.error('Pulseira bloqueada! Não é possível recarregar.');
      return;
    }

    // Atualizar saldo da pulseira
    setBracelets(prev => prev.map(b => 
      b.code === rechargeForm.braceletCode 
        ? { 
            ...b, 
            balance: b.balance + rechargeForm.amount,
            totalRecharges: b.totalRecharges + rechargeForm.amount,
            status: 'active' as const,
            lastUsed: new Date().toLocaleString('pt-BR')
          }
        : b
    ));

    // Adicionar transação
    const newTransaction: RechargeTransaction = {
      id: Date.now().toString(),
      braceletCode: rechargeForm.braceletCode,
      amount: rechargeForm.amount,
      paymentMethod: rechargeForm.paymentMethod,
      timestamp: new Date().toLocaleString('pt-BR'),
      operator: 'Sistema',
      status: 'completed'
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setRechargeForm({ braceletCode: '', amount: 0, paymentMethod: 'cash' });
    toast.success(`Recarga de R$ ${rechargeForm.amount.toFixed(2)} realizada com sucesso!`);
  };

  const toggleBraceletStatus = (id: string) => {
    setBracelets(prev => prev.map(bracelet => {
      if (bracelet.id === id) {
        const newStatus = bracelet.status === 'active' ? 'blocked' : 'active';
        return { ...bracelet, status: newStatus };
      }
      return bracelet;
    }));
    toast.success('Status da pulseira atualizado!');
  };

  const activeBracelets = bracelets.filter(b => b.status === 'active').length;
  const totalBalance = bracelets.reduce((acc, b) => acc + b.balance, 0);
  const totalRecharges = bracelets.reduce((acc, b) => acc + b.totalRecharges, 0);
  const todayTransactions = transactions.filter(t => 
    t.timestamp.startsWith(new Date().toLocaleDateString('pt-BR'))
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Watch className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Recarga de Pulseiras</h1>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Watch className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Pulseiras Ativas</p>
                <p className="text-2xl font-bold">{activeBracelets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Saldo Total</p>
                <p className="text-2xl font-bold">R$ {totalBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Recarregado</p>
                <p className="text-2xl font-bold">R$ {totalRecharges.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Recargas Hoje</p>
                <p className="text-2xl font-bold">{todayTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Recarga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Nova Recarga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Código da pulseira"
              value={rechargeForm.braceletCode}
              onChange={(e) => setRechargeForm(prev => ({ ...prev, braceletCode: e.target.value.toUpperCase() }))}
            />
            <Input
              placeholder="Valor da recarga"
              type="number"
              step="0.01"
              value={rechargeForm.amount}
              onChange={(e) => setRechargeForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            />
            <select 
              value={rechargeForm.paymentMethod}
              onChange={(e) => setRechargeForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              className="border rounded-md px-3 py-2"
            >
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
              <option value="pix">PIX</option>
            </select>
            <Button onClick={processRecharge} className="bg-green-600 hover:bg-green-700">
              Processar Recarga
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
                  placeholder="Buscar por código ou nome do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativa</option>
              <option value="blocked">Bloqueada</option>
              <option value="inactive">Inativa</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pulseiras */}
      <Card>
        <CardHeader>
          <CardTitle>Pulseiras Cadastradas ({filteredBracelets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Saldo Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead>Total Recarregado</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBracelets.map((bracelet) => (
                <TableRow key={bracelet.id}>
                  <TableCell className="font-medium">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {bracelet.code}
                    </code>
                  </TableCell>
                  <TableCell>{bracelet.customerName}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    R$ {bracelet.balance.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(bracelet.status)}</TableCell>
                  <TableCell className="text-sm">{bracelet.lastUsed}</TableCell>
                  <TableCell>R$ {bracelet.totalRecharges.toFixed(2)}</TableCell>
                  <TableCell>R$ {bracelet.totalSpent.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{bracelet.createdAt}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={bracelet.status === 'active' ? "destructive" : "default"}
                      onClick={() => toggleBraceletStatus(bracelet.id)}
                    >
                      {bracelet.status === 'active' ? 'Bloquear' : 'Ativar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Histórico de Recargas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pulseira</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {transaction.braceletCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getPaymentMethodBadge(transaction.paymentMethod)}</TableCell>
                  <TableCell className="text-sm">{transaction.timestamp}</TableCell>
                  <TableCell>{transaction.operator}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === 'completed' ? "default" : "destructive"}>
                      {transaction.status === 'completed' ? 'Concluída' : 'Falhou'}
                    </Badge>
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

export default RecargaPulseiras;
