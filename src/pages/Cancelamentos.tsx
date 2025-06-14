
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  XCircle, 
  Search,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle
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

interface Cancellation {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  operator: string;
}

const Cancelamentos: React.FC = () => {
  const [cancellations, setCancellations] = useState<Cancellation[]>([
    {
      id: '1',
      orderId: 'ORD-001',
      customerName: 'João Silva',
      amount: 25.50,
      reason: 'Produto com defeito',
      date: '2024-06-14 10:30',
      status: 'pending',
      operator: 'Admin'
    },
    {
      id: '2',
      orderId: 'ORD-002',
      customerName: 'Maria Santos',
      amount: 15.00,
      reason: 'Cancelamento por engano',
      date: '2024-06-14 09:15',
      status: 'approved',
      operator: 'Admin'
    },
    {
      id: '3',
      orderId: 'ORD-003',
      customerName: 'Pedro Costa',
      amount: 32.75,
      reason: 'Demora na entrega',
      date: '2024-06-13 16:45',
      status: 'rejected',
      operator: 'Supervisor'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [newCancellation, setNewCancellation] = useState({
    orderId: '',
    reason: ''
  });

  const filteredCancellations = cancellations.filter(cancel =>
    cancel.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cancel.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (id: string, newStatus: 'approved' | 'rejected') => {
    setCancellations(prev => prev.map(cancel =>
      cancel.id === id ? { ...cancel, status: newStatus } : cancel
    ));
    toast.success(`Cancelamento ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
  };

  const handleNewCancellation = () => {
    if (!newCancellation.orderId || !newCancellation.reason) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const newCancel: Cancellation = {
      id: Date.now().toString(),
      orderId: newCancellation.orderId,
      customerName: 'Cliente Totem',
      amount: 0,
      reason: newCancellation.reason,
      date: new Date().toLocaleString('pt-BR'),
      status: 'pending',
      operator: 'Sistema'
    };

    setCancellations(prev => [newCancel, ...prev]);
    setNewCancellation({ orderId: '', reason: '' });
    toast.success('Solicitação de cancelamento criada!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <XCircle className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-800">Cancelamentos</h1>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">{cancellations.filter(c => c.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold">{cancellations.filter(c => c.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rejeitados</p>
                <p className="text-2xl font-bold">{cancellations.filter(c => c.status === 'rejected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Reembolsado</p>
                <p className="text-2xl font-bold">R$ {cancellations.filter(c => c.status === 'approved').reduce((acc, c) => acc + c.amount, 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novo Cancelamento */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Cancelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="ID do Pedido"
              value={newCancellation.orderId}
              onChange={(e) => setNewCancellation(prev => ({ ...prev, orderId: e.target.value }))}
            />
            <Input
              placeholder="Motivo do cancelamento"
              value={newCancellation.reason}
              onChange={(e) => setNewCancellation(prev => ({ ...prev, reason: e.target.value }))}
            />
            <Button onClick={handleNewCancellation}>
              Solicitar Cancelamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por ID do pedido ou nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cancelamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cancelamentos ({filteredCancellations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCancellations.map((cancellation) => (
                <TableRow key={cancellation.id}>
                  <TableCell className="font-medium">{cancellation.orderId}</TableCell>
                  <TableCell>{cancellation.customerName}</TableCell>
                  <TableCell>R$ {cancellation.amount.toFixed(2)}</TableCell>
                  <TableCell>{cancellation.reason}</TableCell>
                  <TableCell>{cancellation.date}</TableCell>
                  <TableCell>{getStatusBadge(cancellation.status)}</TableCell>
                  <TableCell>{cancellation.operator}</TableCell>
                  <TableCell>
                    {cancellation.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(cancellation.id, 'approved')}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(cancellation.id, 'rejected')}
                        >
                          Rejeitar
                        </Button>
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

export default Cancelamentos;
