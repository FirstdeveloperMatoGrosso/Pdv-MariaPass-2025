import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  TrendingUp,
  Eye,
  Package,
  Copy,
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ImpressaoVenda {
  id: string;
  pedido_id: string;
  produto_nome: string;
  quantidade: number;
  tipo: string;
  impressora: string;
  status: string;
  data_impressao: string;
  paginas: number;
  copias: number;
  usuario: string;
  created_at: string;
}

const ImpressoesVendas: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedImpressao, setSelectedImpressao] = useState<ImpressaoVenda | null>(null);
  const [showReimpressaoAlert, setShowReimpressaoAlert] = useState(false);
  const queryClient = useQueryClient();

  // Buscar impressões da nova tabela
  const { data: impressoes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['impressoes-vendas'],
    queryFn: async () => {
      console.log('🔍 Buscando impressões de vendas...');
      
      const { data, error } = await supabase
        .from('impressoes_vendas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar impressões:', error);
        throw error;
      }
      
      console.log('✅ Impressões encontradas:', data?.length || 0);
      return data || [];
    },
  });

  // Mutation para teste de impressão
  const testPrintMutation = useMutation({
    mutationFn: async () => {
      const testId = `TESTE-${Date.now()}`;
      console.log('🖨️ Enviando teste de impressão com ID:', testId);
      
      const impressaoData = {
        pedido_id: testId,
        produto_nome: 'Produto de Teste',
        quantidade: 1,
        tipo: 'teste',
        impressora: 'Impressora Principal',
        status: 'concluido',
        paginas: 1,
        copias: 1,
        usuario: 'Sistema Teste',
        data_impressao: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('impressoes_vendas')
        .insert(impressaoData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao inserir teste:', error);
        throw error;
      }
      
      console.log('✅ Teste de impressão inserido:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['impressoes-vendas'] });
      toast.success(`✅ Teste de impressão enviado! ID: ${data.pedido_id}`);
    },
    onError: (error) => {
      console.error('💥 Erro ao enviar teste:', error);
      toast.error('❌ Erro ao enviar teste de impressão');
    },
  });

  // Mutation para reimpressão
  const reimprimirMutation = useMutation({
    mutationFn: async (impressao: ImpressaoVenda) => {
      console.log('🔄 Criando reimpressão para:', impressao.produto_nome);
      
      const novaImpressao = {
        pedido_id: `REIMP-${Date.now()}-${impressao.pedido_id}`,
        produto_nome: impressao.produto_nome,
        quantidade: impressao.quantidade,
        tipo: 'reimpressao',
        impressora: impressao.impressora,
        status: 'concluido',
        paginas: impressao.paginas,
        copias: impressao.copias,
        usuario: `Reimpressão - ${impressao.usuario}`,
        data_impressao: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('impressoes_vendas')
        .insert(novaImpressao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['impressoes-vendas'] });
      toast.success(`✅ Ficha reimpresa com sucesso! ${data.produto_nome}`);
      setShowReimpressaoAlert(true);
      setTimeout(() => setShowReimpressaoAlert(false), 5000);
    },
    onError: (error) => {
      console.error('❌ Erro na reimpressão:', error);
      toast.error('❌ Erro ao reimprimir ficha');
    },
  });

  const filteredImpressoes = impressoes.filter((impressao: ImpressaoVenda) => {
    const matchesSearch = impressao.pedido_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         impressao.produto_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         impressao.usuario?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || impressao.status === selectedStatus;
    return matchesSearch && matchesStatus;
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

  const getTypeBadge = (type: string) => {
    const colors = {
      comprovante: 'bg-blue-50 text-blue-700 border-blue-200',
      reimpressao: 'bg-orange-50 text-orange-700 border-orange-200',
      teste: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    
    const typeLabel = {
      comprovante: 'Ficha Original',
      reimpressao: 'Reimpressão',
      teste: 'Teste'
    };
    
    return (
      <Badge variant="outline" className={`${colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700'} text-xs`}>
        {typeLabel[type as keyof typeof typeLabel] || type}
      </Badge>
    );
  };

  const totalImpressoes = impressoes.length;
  const concluidas = impressoes.filter((i: ImpressaoVenda) => i.status === 'concluido').length;
  const falharam = impressoes.filter((i: ImpressaoVenda) => i.status === 'falhou').length;
  const pendentes = impressoes.filter((i: ImpressaoVenda) => i.status === 'pendente').length;
  const reimpressoes = impressoes.filter((i: ImpressaoVenda) => i.tipo === 'reimpressao').length;
  const taxaSucesso = totalImpressoes > 0 ? ((concluidas / totalImpressoes) * 100).toFixed(1) : '0';

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
    <div className="pl-4 pr-4 sm:pl-6 sm:pr-6 space-y-1 sm:space-y-2">
      {/* Alerta de Reimpressão */}
      {showReimpressaoAlert && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Reimpressão Realizada</AlertTitle>
          <AlertDescription className="text-orange-700">
            A ficha foi reimpresa com sucesso. Verifique se saiu corretamente na impressora.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col space-y-1 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center space-x-1">
          <Printer className="w-4 h-4 text-blue-600" />
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Impressões de Vendas</h1>
        </div>
        <div className="flex space-x-1">
          <Button 
            onClick={() => testPrintMutation.mutate()} 
            className="flex items-center justify-center space-x-1 h-7 text-xs"
            disabled={testPrintMutation.isPending}
            variant="outline"
          >
            <Printer className="w-3 h-3" />
            <span>{testPrintMutation.isPending ? 'Enviando...' : 'Teste'}</span>
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-1 sm:gap-2">
        <Card>
          <CardContent className="p-1 sm:p-2">
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Total</p>
                <p className="text-sm sm:text-base font-bold">{totalImpressoes}</p>
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
                <p className="text-sm sm:text-base font-bold text-green-600">{concluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1 sm:p-2">
            <div className="flex items-center space-x-1">
              <Copy className="w-3 h-3 text-orange-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Reimpressões</p>
                <p className="text-sm sm:text-base font-bold text-orange-600">{reimpressoes}</p>
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
                <p className="text-sm sm:text-base font-bold text-red-600">{falharam}</p>
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
                <p className="text-sm sm:text-base font-bold text-yellow-600">{pendentes}</p>
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
                <p className="text-sm sm:text-base font-bold text-purple-600">{taxaSucesso}%</p>
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
                placeholder="Buscar por ID, produto ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
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
        </CardContent>
      </Card>

      {/* Tabela de Impressões */}
      <Card>
        <CardHeader className="p-1 sm:p-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <CardTitle className="text-xs sm:text-sm font-semibold text-gray-800">
              Histórico de Impressões - Fichas de Produtos
            </CardTitle>
            <Badge variant="outline" className="text-xs px-1 py-0 w-fit">
              {filteredImpressoes.length} {filteredImpressoes.length === 1 ? 'resultado' : 'resultados'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-6 text-xs">Pedido ID</TableHead>
                  <TableHead className="h-6 text-xs">Produto/Ficha</TableHead>
                  <TableHead className="h-6 text-xs">Qtd</TableHead>
                  <TableHead className="h-6 text-xs">Tipo</TableHead>
                  <TableHead className="h-6 text-xs">Status</TableHead>
                  <TableHead className="hidden sm:table-cell h-6 text-xs">Data</TableHead>
                  <TableHead className="h-6 text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImpressoes.map((impressao: ImpressaoVenda) => (
                  <TableRow key={impressao.id}>
                    <TableCell className="font-medium p-1">
                      <div className="text-xs font-semibold text-blue-700">
                        {impressao.pedido_id || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">{impressao.usuario}</div>
                    </TableCell>
                    <TableCell className="p-1">
                      <div className="flex items-center space-x-1">
                        <Package className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium">{impressao.produto_nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-1 text-center">
                      <Badge variant="outline" className="text-xs">{impressao.quantidade}</Badge>
                    </TableCell>
                    <TableCell className="p-1">
                      {getTypeBadge(impressao.tipo)}
                    </TableCell>
                    <TableCell className="p-1">{getStatusBadge(impressao.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell p-1 text-xs">
                      {new Date(impressao.data_impressao).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="p-1">
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedImpressao(impressao)}
                              className="h-5 w-5 p-0"
                              title="Ver detalhes"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-sm">Detalhes da Impressão</DialogTitle>
                            </DialogHeader>
                            {selectedImpressao && (
                              <div className="space-y-2 text-xs">
                                <div><strong>ID:</strong> {selectedImpressao.pedido_id || 'N/A'}</div>
                                <div><strong>Produto:</strong> {selectedImpressao.produto_nome}</div>
                                <div><strong>Quantidade:</strong> {selectedImpressao.quantidade}</div>
                                <div><strong>Tipo:</strong> {selectedImpressao.tipo}</div>
                                <div><strong>Impressora:</strong> {selectedImpressao.impressora}</div>
                                <div><strong>Status:</strong> {selectedImpressao.status}</div>
                                <div><strong>Páginas:</strong> {selectedImpressao.paginas}</div>
                                <div><strong>Cópias:</strong> {selectedImpressao.copias}</div>
                                <div><strong>Usuário:</strong> {selectedImpressao.usuario}</div>
                                <div><strong>Data:</strong> {new Date(selectedImpressao.data_impressao).toLocaleString('pt-BR')}</div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reimprimirMutation.mutate(impressao)}
                          disabled={reimprimirMutation.isPending}
                          className="h-5 w-5 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                          title="Reimprimir Ficha"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredImpressoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      <div className="space-y-1">
                        <FileText className="w-4 h-4 text-gray-400 mx-auto" />
                        <p className="text-gray-500 text-xs">Nenhuma impressão encontrada</p>
                        <p className="text-xs text-gray-400">Faça uma venda para ver as impressões aqui</p>
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

export default ImpressoesVendas;
