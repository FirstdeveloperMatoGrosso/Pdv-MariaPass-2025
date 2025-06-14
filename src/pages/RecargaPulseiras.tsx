
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Search,
  Filter,
  Plus,
  Zap,
  Users,
  DollarSign,
  Activity,
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PulseiraRecarga {
  id: string;
  pulseira_id: string;
  valor: number;
  saldo_anterior: number;
  saldo_novo: number;
  tipo_pagamento: string;
  terminal_id: string;
  responsavel: string;
  observacoes: string;
  created_at: string;
  pulseiras?: {
    codigo: string;
    cliente_nome: string;
    saldo: number;
    status: string;
  };
}

interface Pulseira {
  id: string;
  codigo: string;
  saldo: number;
  status: 'ativa' | 'inativa' | 'bloqueada';
  tipo: string;
  cliente_nome: string;
  cliente_documento: string;
}

const RecargaPulseiras: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedPulseira, setSelectedPulseira] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const queryClient = useQueryClient();

  // Buscar recargas do Supabase
  const { data: recargas = [], isLoading: loadingRecargas } = useQuery({
    queryKey: ['recargas_pulseiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recargas_pulseiras')
        .select(`
          *,
          pulseiras (
            codigo,
            cliente_nome,
            saldo,
            status
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar recargas:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Buscar pulseiras ativas para recarga
  const { data: pulseiras = [], isLoading: loadingPulseiras } = useQuery({
    queryKey: ['pulseiras_ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pulseiras')
        .select('*')
        .eq('status', 'ativa')
        .order('codigo');
      
      if (error) {
        console.error('Erro ao buscar pulseiras:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Mutation para fazer recarga
  const rechargeMutation = useMutation({
    mutationFn: async ({ pulseiraId, valor, tipoPagamento }: { pulseiraId: string; valor: number; tipoPagamento: string }) => {
      // Buscar pulseira atual
      const { data: pulseira, error: pulseiraError } = await supabase
        .from('pulseiras')
        .select('saldo')
        .eq('id', pulseiraId)
        .single();
      
      if (pulseiraError) throw pulseiraError;
      
      const saldoAnterior = pulseira.saldo;
      const saldoNovo = saldoAnterior + valor;
      
      // Inserir recarga
      const { error: recargaError } = await supabase
        .from('recargas_pulseiras')
        .insert({
          pulseira_id: pulseiraId,
          valor,
          saldo_anterior: saldoAnterior,
          saldo_novo: saldoNovo,
          tipo_pagamento: tipoPagamento,
          responsavel: 'Admin'
        });
      
      if (recargaError) throw recargaError;
      
      // Atualizar saldo da pulseira
      const { error: updateError } = await supabase
        .from('pulseiras')
        .update({ saldo: saldoNovo, updated_at: new Date().toISOString() })
        .eq('id', pulseiraId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recargas_pulseiras'] });
      queryClient.invalidateQueries({ queryKey: ['pulseiras_ativas'] });
      toast.success('Recarga realizada com sucesso!');
      setSelectedPulseira('');
      setRechargeAmount('');
    },
    onError: (error) => {
      console.error('Erro ao fazer recarga:', error);
      toast.error('Erro ao realizar recarga');
    },
  });

  const paymentTypes = ['cartao_credito', 'cartao_debito', 'pix', 'dinheiro'];

  const filteredRecargas = recargas.filter((recarga: PulseiraRecarga) => {
    const matchesSearch = recarga.pulseiras?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recarga.pulseiras?.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recarga.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = selectedPayment === 'all' || recarga.tipo_pagamento === selectedPayment;
    return matchesSearch && matchesPayment;
  });

  const getPaymentLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'pix': 'PIX',
      'dinheiro': 'Dinheiro'
    };
    return labels[tipo] || tipo;
  };

  const handleRecharge = () => {
    if (!selectedPulseira || !rechargeAmount) {
      toast.error('Selecione uma pulseira e informe o valor da recarga');
      return;
    }
    
    const valor = parseFloat(rechargeAmount);
    if (valor <= 0) {
      toast.error('Valor da recarga deve ser maior que zero');
      return;
    }
    
    rechargeMutation.mutate({
      pulseiraId: selectedPulseira,
      valor,
      tipoPagamento: 'cartao_credito'
    });
  };

  const totalRecargas = recargas.length;
  const valorTotalRecargas = recargas.reduce((acc: number, r: PulseiraRecarga) => acc + r.valor, 0);
  const recargasHoje = recargas.filter((r: PulseiraRecarga) => 
    new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;
  const pulseirasAtivas = pulseiras.length;

  if (loadingRecargas || loadingPulseiras) {
    return (
      <div className="p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando recargas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-green-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Recarga de Pulseiras</h1>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total de Recargas</p>
                <p className="text-lg sm:text-2xl font-bold">{totalRecargas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Valor Total</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">R$ {valorTotalRecargas.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Recargas Hoje</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{recargasHoje}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Pulseiras Ativas</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{pulseirasAtivas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nova Recarga */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Zap className="w-5 h-5" />
            <span>Nova Recarga</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select 
              value={selectedPulseira}
              onChange={(e) => setSelectedPulseira(e.target.value)}
              className="border rounded-md px-3 py-2 flex-1"
            >
              <option value="">Selecione uma pulseira</option>
              {pulseiras.map((pulseira: Pulseira) => (
                <option key={pulseira.id} value={pulseira.id}>
                  {pulseira.codigo} - {pulseira.cliente_nome} (Saldo: R$ {pulseira.saldo.toFixed(2)})
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Valor da recarga"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              className="flex-1 sm:max-w-[200px]"
              min="0"
              step="0.01"
            />
            <Button 
              onClick={handleRecharge}
              disabled={rechargeMutation.isPending}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Recarregar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código da pulseira, cliente ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="border rounded-md px-3 py-2 flex-1"
              >
                <option value="all">Todos os tipos de pagamento</option>
                {paymentTypes.map(type => (
                  <option key={type} value={type}>{getPaymentLabel(type)}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Recargas */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Histórico de Recargas ({filteredRecargas.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Pulseira</TableHead>
                  <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Saldo Anterior</TableHead>
                  <TableHead className="hidden md:table-cell">Saldo Novo</TableHead>
                  <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                  <TableHead className="hidden sm:table-cell">Responsável</TableHead>
                  <TableHead className="hidden lg:table-cell">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecargas.map((recarga: PulseiraRecarga) => (
                  <TableRow key={recarga.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{recarga.pulseiras?.codigo}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {recarga.pulseiras?.cliente_nome}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{recarga.pulseiras?.cliente_nome}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        R$ {recarga.valor.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      R$ {recarga.saldo_anterior.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      R$ {recarga.saldo_novo.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">{getPaymentLabel(recarga.tipo_pagamento)}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{recarga.responsavel}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {new Date(recarga.created_at).toLocaleString('pt-BR')}
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

export default RecargaPulseiras;
