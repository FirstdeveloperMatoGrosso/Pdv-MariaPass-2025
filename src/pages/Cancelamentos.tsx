import React, { useState, useEffect } from 'react';
import { ComprovanteDialog } from '@/components/ComprovanteDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  XCircle, 
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCancelamentos } from '@/hooks/useCancelamentos';

const Cancelamentos: React.FC = () => {
  const { 
    cancelamentos, 
    loading, 
    error, 
    criarCancelamento, 
    atualizarStatusCancelamento,
    refetch 
  } = useCancelamentos();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newCancellation, setNewCancellation] = useState({
    numero_pedido: '',
    motivo: '',
    valor_cancelado: '',
    observacoes: ''
  });
  const [processando, setProcessando] = React.useState<string | null>(null);
  const [comprovanteAberto, setComprovanteAberto] = useState(false);
  const [comprovanteSelecionado, setComprovanteSelecionado] = useState<any>(null);

  const filteredCancellations = cancelamentos.filter(cancel =>
    (cancel.numero_pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cancel.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (id: string, newStatus: boolean) => {
    try {
      setProcessando(id);
      await atualizarStatusCancelamento(id, newStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    } finally {
      setProcessando(null);
    }
  };

  const handleNewCancellation = async () => {
    if (!newCancellation.numero_pedido || !newCancellation.motivo) {
      return;
    }

    try {
      await criarCancelamento({
        numero_pedido: newCancellation.numero_pedido,
        motivo: newCancellation.motivo,
        valor_cancelado: newCancellation.valor_cancelado ? Number(newCancellation.valor_cancelado) : 0,
        observacoes: newCancellation.observacoes || undefined
      });
      
      setNewCancellation({ 
        numero_pedido: '', 
        motivo: '', 
        valor_cancelado: '', 
        observacoes: '' 
      });
    } catch (error) {
      console.error('Erro ao criar cancelamento:', error);
    }
  };

  const getStatusBadge = (aprovado: boolean | null) => {
    if (aprovado === null || aprovado === false) {
      return <Badge variant="secondary" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>;
    } else {
      return <Badge className="bg-green-600 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="mt-2 text-sm text-gray-600">Carregando cancelamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-600 mx-auto" />
          <p className="mt-2 text-red-600 text-sm">Erro: {error}</p>
          <Button className="mt-2" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pr-6 w-full max-w-[calc(100vw-56px)] overflow-x-auto">
      <div className="space-y-4 min-w-[800px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <XCircle className="w-5 h-5 text-red-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Cancelamentos</h1>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pendentes</p>
                <p className="text-lg sm:text-xl font-bold">
                  {cancelamentos.filter(c => !c.aprovado).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Aprovados</p>
                <p className="text-lg sm:text-xl font-bold">
                  {cancelamentos.filter(c => c.aprovado).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
                <p className="text-lg sm:text-xl font-bold">{cancelamentos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Reembolsado</p>
                <p className="text-lg sm:text-xl font-bold">
                  R$ {cancelamentos
                    .filter(c => c.aprovado)
                    .reduce((acc, c) => acc + Number(c.valor_cancelado), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novo Cancelamento */}
      <Card className="w-full">
        <CardHeader className="p-3">
          <CardTitle className="text-base">Solicitar Cancelamento</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pr-2 sm:gap-3">
            <Input
              placeholder="ID do Pedido"
              value={newCancellation.numero_pedido}
              onChange={(e) => setNewCancellation(prev => ({ ...prev, numero_pedido: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Motivo do cancelamento"
              value={newCancellation.motivo}
              onChange={(e) => setNewCancellation(prev => ({ ...prev, motivo: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Valor (R$)"
              type="number"
              step="0.01"
              value={newCancellation.valor_cancelado}
              onChange={(e) => setNewCancellation(prev => ({ ...prev, valor_cancelado: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Observações"
              value={newCancellation.observacoes}
              onChange={(e) => setNewCancellation(prev => ({ ...prev, observacoes: e.target.value }))}
              className="h-8 text-sm"
            />
            <Button onClick={handleNewCancellation} className="h-8 text-sm">
              Solicitar Cancelamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-2 sm:p-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Buscar por ID do pedido ou nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cancelamentos */}
      <Card className="w-full">
        <CardHeader className="p-3">
          <CardTitle className="text-base">
            Histórico de Cancelamentos ({filteredCancellations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">ID Pedido</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">Valor</TableHead>
                  <TableHead className="h-8 text-xs">Motivo</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Data</TableHead>
                  <TableHead className="h-8 text-xs">Status</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Operador</TableHead>
                  <TableHead className="h-8 text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCancellations.map((cancelamento) => (
                  <TableRow key={cancelamento.id}>
                    <TableCell className="font-medium p-2">
                      <div>
                        <div className="text-xs font-semibold">{cancelamento.numero_pedido}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {cancelamento.cliente_nome}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-2 text-xs">
                      {cancelamento.cliente_nome}
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 text-xs">
                      R$ {Number(cancelamento.valor_cancelado).toFixed(2)}
                    </TableCell>
                    <TableCell className="p-2 text-xs">{cancelamento.motivo}</TableCell>
                    <TableCell className="hidden lg:table-cell p-2 text-xs">
                      {new Date(cancelamento.data_cancelamento).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="p-2">{getStatusBadge(cancelamento.aprovado)}</TableCell>
                    <TableCell className="hidden sm:table-cell p-2 text-xs">
                      {cancelamento.operador}
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex space-x-1">
                        {!cancelamento.aprovado ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-6 text-xs px-2"
                            onClick={() => handleStatusChange(cancelamento.id, true)}
                            disabled={processando === cancelamento.id}
                          >
                            {processando === cancelamento.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Aprovar'
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                              setComprovanteSelecionado(cancelamento);
                              setComprovanteAberto(true);
                            }}
                          >
                            Ver Comprovante
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCancellations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-4 text-sm text-gray-500">
                      Nenhum cancelamento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo do Comprovante */}
      {comprovanteSelecionado && (
        <ComprovanteDialog
          isOpen={comprovanteAberto}
          onClose={() => {
            setComprovanteAberto(false);
            setComprovanteSelecionado(null);
          }}
          data={comprovanteSelecionado}
        />
      )}
      </div>
    </div>
  );
};

export default Cancelamentos;
