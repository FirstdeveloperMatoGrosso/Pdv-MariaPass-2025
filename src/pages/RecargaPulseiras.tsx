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
import PulseiraReader from '@/components/PulseiraReader';
import PixPayment from '@/components/PixPayment';
import PaymentProviderSelector from '@/components/PaymentProviderSelector';

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
  status: string;
  tipo: string;
  cliente_nome: string;
  cliente_documento: string;
}

const RecargaPulseiras: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedPulseira, setSelectedPulseira] = useState<Pulseira | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [currentRecargaId, setCurrentRecargaId] = useState('');
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

  // Mutation para fazer recarga com PIX
  const rechargeMutation = useMutation({
    mutationFn: async ({ pulseiraId, valor }: { pulseiraId: string; valor: number }) => {
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
      const { data: recarga, error: recargaError } = await supabase
        .from('recargas_pulseiras')
        .insert({
          pulseira_id: pulseiraId,
          valor,
          saldo_anterior: saldoAnterior,
          saldo_novo: saldoNovo,
          tipo_pagamento: 'pix',
          responsavel: 'Sistema'
        })
        .select()
        .single();
      
      if (recargaError) throw recargaError;
      
      return recarga;
    },
    onSuccess: (recarga) => {
      setCurrentRecargaId(recarga.id);
      setShowPixPayment(true);
    },
    onError: (error) => {
      console.error('Erro ao fazer recarga:', error);
      toast.error('Erro ao iniciar recarga');
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
    
    if (selectedPulseira.status !== 'ativa') {
      toast.error('Só é possível recarregar pulseiras ativas');
      return;
    }
    
    const valor = parseFloat(rechargeAmount);
    if (valor <= 0) {
      toast.error('Valor da recarga deve ser maior que zero');
      return;
    }
    
    rechargeMutation.mutate({
      pulseiraId: selectedPulseira.id,
      valor
    });
  };

  const handlePixPayment = (recargaId: string) => {
    console.log('💳 Iniciando pagamento PIX para recarga:', recargaId);
    setCurrentRecargaId(recargaId);
    setShowPaymentSelector(true);
  };

  const handlePaymentSuccess = () => {
    console.log('✅ Pagamento PIX concluído com sucesso');
    setShowPixPayment(false);
    setShowPaymentSelector(false);
    setCurrentRecargaId('');
    
    // Invalidar queries para atualizar os dados
    queryClient.invalidateQueries({ queryKey: ['recargas-pulseiras'] });
    queryClient.invalidateQueries({ queryKey: ['pulseiras'] });
    
    toast.success('Recarga realizada com sucesso!');
  };

  const handlePaymentCancel = () => {
    console.log('❌ Pagamento PIX cancelado');
    setShowPixPayment(false);
    setShowPaymentSelector(false);
    setCurrentRecargaId('');
  };

  const totalRecargas = recargas.length;
  const valorTotalRecargas = recargas.reduce((acc: number, r: PulseiraRecarga) => acc + r.valor, 0);
  const recargasHoje = recargas.filter((r: PulseiraRecarga) => 
    new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;
  const pulseirasAtivas = pulseiras.length;

  if (loadingRecargas || loadingPulseiras) {
    return (
      <div className="p-2 sm:p-3 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando recargas...</p>
        </div>
      </div>
    );
  }

  if (showPixPayment) {
    return (
      <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Pagamento PIX</h1>
          </div>
        </div>
        
        <PixPayment
          valor={parseFloat(rechargeAmount)}
          recargaId={currentRecargaId}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <CreditCard className="w-5 h-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Recarga de Pulseiras</h1>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Total de Recargas</p>
                <p className="text-sm sm:text-lg font-bold">{totalRecargas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Valor Total</p>
                <p className="text-sm sm:text-lg font-bold text-green-600">R$ {valorTotalRecargas.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Recargas Hoje</p>
                <p className="text-sm sm:text-lg font-bold text-orange-600">{recargasHoje}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-purple-600" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Pulseiras Ativas</p>
                <p className="text-sm sm:text-lg font-bold text-purple-600">{pulseirasAtivas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leitura de Pulseira com histórico */}
      <PulseiraReader 
        onPulseiraSelected={(pulseira) => setSelectedPulseira(pulseira)}
      />

      {/* Nova Recarga */}
      {selectedPulseira && (
        <Card>
          <CardHeader className="p-2 sm:p-3">
            <CardTitle className="flex items-center space-x-1 text-sm sm:text-base">
              <Zap className="w-4 h-4" />
              <span>Nova Recarga</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">Pulseira Selecionada:</p>
                <p className="text-sm font-medium">
                  {selectedPulseira.codigo} - {selectedPulseira.cliente_nome}
                </p>
                <p className="text-xs text-green-600">
                  Saldo atual: R$ {selectedPulseira.saldo.toFixed(2)}
                </p>
              </div>
              <Input
                type="number"
                placeholder="Valor da recarga"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="flex-1 sm:max-w-[150px] h-8 text-sm"
                min="0"
                step="0.01"
              />
              <Button 
                onClick={handleRecharge}
                disabled={rechargeMutation.isPending || selectedPulseira.status !== 'ativa'}
                className="flex items-center space-x-1 w-full sm:w-auto h-8 text-sm px-3"
              >
                <Plus className="w-3 h-3" />
                <span>Recarregar com PIX</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-2 sm:p-3">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                placeholder="Buscar por código da pulseira, cliente ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            <div className="flex items-center space-x-1">
              <Filter className="w-3 h-3 text-gray-500" />
              <select 
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="border rounded-md px-2 py-1 text-sm flex-1"
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
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="text-sm sm:text-base">Histórico de Recargas ({filteredRecargas.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px] h-8 text-xs">Pulseira</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Cliente</TableHead>
                  <TableHead className="h-8 text-xs">Valor</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">Saldo Anterior</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">Saldo Novo</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Pagamento</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Responsável</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecargas.map((recarga: PulseiraRecarga) => (
                  <TableRow key={recarga.id}>
                    <TableCell className="font-medium p-2">
                      <div>
                        <div className="text-xs font-semibold">{recarga.pulseiras?.codigo}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {recarga.pulseiras?.cliente_nome}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-2 text-xs">{recarga.pulseiras?.cliente_nome}</TableCell>
                    <TableCell className="p-2">
                      <span className="text-xs font-semibold text-green-600">
                        R$ {recarga.valor.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 text-xs">
                      R$ {recarga.saldo_anterior.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 text-xs">
                      R$ {recarga.saldo_novo.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-2">
                      <Badge variant="outline" className="text-xs">{getPaymentLabel(recarga.tipo_pagamento)}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-2 text-xs">{recarga.responsavel}</TableCell>
                    <TableCell className="hidden lg:table-cell p-2 text-xs">
                      {new Date(recarga.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Provider Selector Modal */}
      {showPaymentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PaymentProviderSelector
            valor={parseFloat(rechargeAmount) || 0}
            recargaId={currentRecargaId}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}

      {/* PIX Payment Modal (mantido para compatibilidade) */}
      {showPixPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PixPayment
            valor={parseFloat(rechargeAmount) || 0}
            recargaId={currentRecargaId}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}
    </div>
  );
};

export default RecargaPulseiras;
