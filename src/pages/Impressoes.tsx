
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PrintJob {
  id: string;
  pedido_id: string;
  tipo: string;
  impressora: string;
  status: string;
  data_impressao: string;
  paginas: number;
  copias: number;
  usuario: string;
}

const Impressoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const queryClient = useQueryClient();

  const printers = ['Impressora Principal', 'Impressora Vouchers', 'Impressora Backup'];

  // Buscar impressões do Supabase
  const { data: printJobs = [], isLoading } = useQuery({
    queryKey: ['impressoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('impressoes')
        .select('*')
        .order('data_impressao', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar impressões:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Mutation para reenviar impressão
  const retryPrintMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('impressoes')
        .update({ status: 'pendente' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impressoes'] });
      toast.success('Reimpressão solicitada!');
    },
    onError: (error) => {
      console.error('Erro ao reenviar impressão:', error);
      toast.error('Erro ao reenviar impressão');
    },
  });

  // Mutation para teste de impressão
  const testPrintMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('impressoes')
        .insert({
          pedido_id: 'TEST-' + Date.now(),
          tipo: 'comprovante',
          impressora: 'Impressora Principal',
          status: 'pendente',
          paginas: 1,
          copias: 1,
          usuario: 'Admin'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impressoes'] });
      toast.success('Impressão de teste enviada!');
    },
    onError: (error) => {
      console.error('Erro ao enviar teste:', error);
      toast.error('Erro ao enviar teste de impressão');
    },
  });

  const filteredJobs = printJobs.filter((job: PrintJob) => {
    const matchesSearch = job.pedido_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrinter = selectedPrinter === 'all' || job.impressora === selectedPrinter;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    return matchesSearch && matchesPrinter && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'imprimindo':
        return <Badge className="bg-blue-600"><Printer className="w-3 h-3 mr-1" />Imprimindo</Badge>;
      case 'concluido':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'falhou':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comprovante': return 'Comprovante';
      case 'voucher': return 'Voucher';
      case 'relatorio': return 'Relatório';
      case 'ticket': return 'Ticket';
      default: return type;
    }
  };

  const retryPrint = (jobId: string) => {
    retryPrintMutation.mutate(jobId);
  };

  const testPrint = () => {
    testPrintMutation.mutate();
  };

  const totalJobs = printJobs.length;
  const completedJobs = printJobs.filter((j: PrintJob) => j.status === 'concluido').length;
  const failedJobs = printJobs.filter((j: PrintJob) => j.status === 'falhou').length;
  const pendingJobs = printJobs.filter((j: PrintJob) => j.status === 'pendente').length;

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando impressões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Printer className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Controle de Impressões</h1>
        </div>
        <Button 
          onClick={testPrint} 
          className="flex items-center space-x-2 w-full sm:w-auto"
          disabled={testPrintMutation.isPending}
        >
          <Printer className="w-4 h-4" />
          <span>Teste de Impressão</span>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total de Impressões</p>
                <p className="text-lg sm:text-2xl font-bold">{totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Concluídas</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{completedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Falharam</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{failedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{pendingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por ID do pedido ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <select 
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="border rounded-md px-3 py-2 flex-1"
              >
                <option value="all">Todas as impressoras</option>
                {printers.map(printer => (
                  <option key={printer} value={printer}>{printer}</option>
                ))}
              </select>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-md px-3 py-2 flex-1"
              >
                <option value="all">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="imprimindo">Imprimindo</option>
                <option value="concluido">Concluído</option>
                <option value="falhou">Falhou</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Impressões */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Histórico de Impressões ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">ID / Pedido</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Impressora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Data/Hora</TableHead>
                  <TableHead className="hidden md:table-cell">Páginas</TableHead>
                  <TableHead className="hidden md:table-cell">Cópias</TableHead>
                  <TableHead className="hidden sm:table-cell">Usuário</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job: PrintJob) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.pedido_id}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{getTypeLabel(job.tipo)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{job.impressora}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {new Date(job.data_impressao).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{job.paginas}</TableCell>
                    <TableCell className="hidden md:table-cell">{job.copias}</TableCell>
                    <TableCell className="hidden sm:table-cell">{job.usuario}</TableCell>
                    <TableCell>
                      {job.status === 'falhou' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryPrint(job.id)}
                          disabled={retryPrintMutation.isPending}
                          className="flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden sm:inline">Reimprimir</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Impressoes;
