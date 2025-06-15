
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
  RotateCcw,
  Filter,
  TrendingUp,
  Eye
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  created_at: string;
}

const Impressoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const queryClient = useQueryClient();

  const printers = ['Impressora Principal', 'Impressora Vouchers', 'Impressora Backup'];

  // Buscar impressões do Supabase
  const { data: printJobs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['impressoes'],
    queryFn: async () => {
      console.log('Buscando impressões realizadas...');
      
      const { data, error } = await supabase
        .from('impressoes')
        .select('*')
        .order('data_impressao', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar impressões:', error);
        throw error;
      }
      
      console.log('Impressões encontradas:', data?.length || 0);
      return data || [];
    },
  });

  // Mutation para reenviar impressão
  const retryPrintMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Reenviando impressão:', id);
      
      const { error } = await supabase
        .from('impressoes')
        .update({ 
          status: 'pendente',
          data_impressao: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['impressoes'] });
      toast.success('Reimpressão solicitada com sucesso!');
      console.log('Reimpressão solicitada para ID:', data.id);
    },
    onError: (error) => {
      console.error('Erro ao reenviar impressão:', error);
      toast.error('Erro ao solicitar reimpressão');
    },
  });

  // Mutation para teste de impressão
  const testPrintMutation = useMutation({
    mutationFn: async () => {
      const testId = 'TEST-' + Date.now();
      console.log('Enviando teste de impressão:', testId);
      
      const { data, error } = await supabase
        .from('impressoes')
        .insert({
          pedido_id: testId,
          tipo: 'comprovante',
          impressora: 'Impressora Principal',
          status: 'pendente',
          paginas: 1,
          copias: 1,
          usuario: 'Sistema'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao inserir teste:', error);
        throw error;
      }
      
      console.log('Teste de impressão inserido:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['impressoes'] });
      toast.success(`Teste de impressão enviado! ID: ${data.pedido_id}`);
      console.log('Teste de impressão criado com sucesso:', data);
    },
    onError: (error) => {
      console.error('Erro ao enviar teste:', error);
      toast.error('Erro ao enviar teste de impressão: ' + error.message);
    },
  });

  const filteredJobs = printJobs.filter((job: PrintJob) => {
    const matchesSearch = job.pedido_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.usuario?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrinter = selectedPrinter === 'all' || job.impressora === selectedPrinter;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    return matchesSearch && matchesPrinter && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary" className="text-xs"><Clock className="w-2 h-2 mr-1" />Pendente</Badge>;
      case 'imprimindo':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs"><Printer className="w-2 h-2 mr-1" />Imprimindo</Badge>;
      case 'concluido':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs"><CheckCircle className="w-2 h-2 mr-1" />Concluído</Badge>;
      case 'falhou':
        return <Badge variant="destructive" className="text-xs"><XCircle className="w-2 h-2 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
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

  const getTypeBadge = (type: string) => {
    const colors = {
      comprovante: 'bg-blue-50 text-blue-700 border-blue-200',
      voucher: 'bg-purple-50 text-purple-700 border-purple-200',
      relatorio: 'bg-orange-50 text-orange-700 border-orange-200',
      ticket: 'bg-green-50 text-green-700 border-green-200'
    };
    
    return (
      <Badge variant="outline" className={`${colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700'} text-xs`}>
        {getTypeLabel(type)}
      </Badge>
    );
  };

  const retryPrint = (jobId: string) => {
    console.log('Solicitando reimpressão para:', jobId);
    retryPrintMutation.mutate(jobId);
  };

  const testPrint = () => {
    console.log('Iniciando teste de impressão...');
    testPrintMutation.mutate();
  };

  const totalJobs = printJobs.length;
  const completedJobs = printJobs.filter((j: PrintJob) => j.status === 'concluido').length;
  const failedJobs = printJobs.filter((j: PrintJob) => j.status === 'falhou').length;
  const pendingJobs = printJobs.filter((j: PrintJob) => j.status === 'pendente').length;
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0';

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Erro ao carregar impressões: {error.message}</p>
            <Button onClick={() => refetch()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-1 sm:p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-xs text-gray-600">Carregando impressões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-2 space-y-1 sm:space-y-2">
      {/* Header */}
      <div className="flex flex-col space-y-1 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center space-x-1">
          <Printer className="w-4 h-4 text-blue-600" />
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Controle de Impressões</h1>
        </div>
        <Button 
          onClick={testPrint} 
          className="flex items-center justify-center space-x-1 h-7 text-xs"
          disabled={testPrintMutation.isPending}
        >
          <Printer className="w-3 h-3" />
          <span>{testPrintMutation.isPending ? 'Enviando...' : 'Teste de Impressão'}</span>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-1 sm:gap-2">
        <Card>
          <CardContent className="p-1 sm:p-2">
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Total</p>
                <p className="text-sm sm:text-base font-bold">{totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1 sm:p-2">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Concluídas</p>
                <p className="text-sm sm:text-base font-bold text-green-600">{completedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1 sm:p-2">
            <div className="flex items-center space-x-1">
              <XCircle className="w-3 h-3 text-red-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Falharam</p>
                <p className="text-sm sm:text-base font-bold text-red-600">{failedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1 sm:p-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-yellow-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Pendentes</p>
                <p className="text-sm sm:text-base font-bold text-yellow-600">{pendingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1 sm:p-2">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-purple-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Taxa Sucesso</p>
                <p className="text-sm sm:text-base font-bold text-purple-600">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-1 sm:p-2">
          <div className="space-y-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                placeholder="Buscar por ID do pedido ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Impressora</label>
                <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Todas as impressoras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as impressoras</SelectItem>
                    {printers.map(printer => (
                      <SelectItem key={printer} value={printer}>{printer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="imprimindo">Imprimindo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="falhou">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Impressões */}
      <Card>
        <CardHeader className="p-1 sm:p-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <CardTitle className="text-xs sm:text-sm font-semibold text-gray-800">
              Histórico de Impressões
            </CardTitle>
            <Badge variant="outline" className="text-xs px-1 py-0 w-fit">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'resultado' : 'resultados'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-6 text-xs">ID / Pedido</TableHead>
                  <TableHead className="h-6 text-xs">Tipo</TableHead>
                  <TableHead className="h-6 text-xs">Status</TableHead>
                  <TableHead className="hidden sm:table-cell h-6 text-xs">Data/Hora</TableHead>
                  <TableHead className="h-6 text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job: PrintJob) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium p-1">
                      <div>
                        <div className="text-xs font-semibold">{job.pedido_id}</div>
                        <div className="text-xs text-gray-500">{job.usuario}</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-1">
                      {getTypeBadge(job.tipo)}
                    </TableCell>
                    <TableCell className="p-1">{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell p-1 text-xs">
                      {new Date(job.data_impressao).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="p-1">
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedJob(job)}
                              className="h-5 w-5 p-0"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-sm">Detalhes da Impressão</DialogTitle>
                            </DialogHeader>
                            {selectedJob && (
                              <div className="space-y-2 text-xs">
                                <div><strong>ID:</strong> {selectedJob.pedido_id}</div>
                                <div><strong>Tipo:</strong> {getTypeLabel(selectedJob.tipo)}</div>
                                <div><strong>Impressora:</strong> {selectedJob.impressora}</div>
                                <div><strong>Status:</strong> {selectedJob.status}</div>
                                <div><strong>Páginas:</strong> {selectedJob.paginas}</div>
                                <div><strong>Cópias:</strong> {selectedJob.copias}</div>
                                <div><strong>Usuário:</strong> {selectedJob.usuario}</div>
                                <div><strong>Data:</strong> {new Date(selectedJob.data_impressao).toLocaleString('pt-BR')}</div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryPrint(job.id)}
                          disabled={retryPrintMutation.isPending}
                          className="h-5 w-5 p-0"
                          title="Reimprimir"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <div className="space-y-1">
                        <FileText className="w-4 h-4 text-gray-400 mx-auto" />
                        <p className="text-gray-500 text-xs">Nenhuma impressão encontrada</p>
                        <p className="text-xs text-gray-400">Tente ajustar os filtros de pesquisa</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Impressoes;
