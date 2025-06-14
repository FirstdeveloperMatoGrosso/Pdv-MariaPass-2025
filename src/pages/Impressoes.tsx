
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Search,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw
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

interface PrintJob {
  id: string;
  orderId: string;
  type: 'receipt' | 'voucher' | 'report' | 'ticket';
  printer: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  timestamp: string;
  pages: number;
  copies: number;
  user: string;
}

const Impressoes: React.FC = () => {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([
    {
      id: '1',
      orderId: 'ORD-001',
      type: 'receipt',
      printer: 'Impressora Principal',
      status: 'completed',
      timestamp: '2024-06-14 10:30:15',
      pages: 1,
      copies: 1,
      user: 'Sistema'
    },
    {
      id: '2',
      orderId: 'ORD-002',
      type: 'voucher',
      printer: 'Impressora Vouchers',
      status: 'failed',
      timestamp: '2024-06-14 10:25:30',
      pages: 1,
      copies: 1,
      user: 'Operador'
    },
    {
      id: '3',
      orderId: 'REP-001',
      type: 'report',
      printer: 'Impressora Principal',
      status: 'printing',
      timestamp: '2024-06-14 10:20:45',
      pages: 3,
      copies: 2,
      user: 'Admin'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const printers = ['Impressora Principal', 'Impressora Vouchers', 'Impressora Backup'];

  const filteredJobs = printJobs.filter(job => {
    const matchesSearch = job.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrinter = selectedPrinter === 'all' || job.printer === selectedPrinter;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    return matchesSearch && matchesPrinter && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'printing':
        return <Badge className="bg-blue-600"><Printer className="w-3 h-3 mr-1" />Imprimindo</Badge>;
      case 'completed':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'receipt': return 'Comprovante';
      case 'voucher': return 'Voucher';
      case 'report': return 'Relatório';
      case 'ticket': return 'Ticket';
      default: return type;
    }
  };

  const retryPrint = (jobId: string) => {
    setPrintJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, status: 'pending' as const } : job
    ));
    toast.success('Reimpressão solicitada!');
  };

  const testPrint = () => {
    const newJob: PrintJob = {
      id: Date.now().toString(),
      orderId: 'TEST-' + Date.now(),
      type: 'receipt',
      printer: 'Impressora Principal',
      status: 'pending',
      timestamp: new Date().toLocaleString('pt-BR'),
      pages: 1,
      copies: 1,
      user: 'Admin'
    };

    setPrintJobs(prev => [newJob, ...prev]);
    toast.success('Impressão de teste enviada!');
  };

  const totalJobs = printJobs.length;
  const completedJobs = printJobs.filter(j => j.status === 'completed').length;
  const failedJobs = printJobs.filter(j => j.status === 'failed').length;
  const pendingJobs = printJobs.filter(j => j.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Printer className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Controle de Impressões</h1>
        </div>
        <Button onClick={testPrint} className="flex items-center space-x-2">
          <Printer className="w-4 h-4" />
          <span>Teste de Impressão</span>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Impressões</p>
                <p className="text-2xl font-bold">{totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Falharam</p>
                <p className="text-2xl font-bold text-red-600">{failedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por ID do pedido ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">Todas as impressoras</option>
              {printers.map(printer => (
                <option key={printer} value={printer}>{printer}</option>
              ))}
            </select>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="printing">Imprimindo</option>
              <option value="completed">Concluído</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Impressões */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Impressões ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Pedido</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Impressora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Páginas</TableHead>
                <TableHead>Cópias</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.orderId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(job.type)}</Badge>
                  </TableCell>
                  <TableCell>{job.printer}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="text-sm">{job.timestamp}</TableCell>
                  <TableCell>{job.pages}</TableCell>
                  <TableCell>{job.copies}</TableCell>
                  <TableCell>{job.user}</TableCell>
                  <TableCell>
                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryPrint(job.id)}
                        className="flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reimprimir</span>
                      </Button>
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

export default Impressoes;
