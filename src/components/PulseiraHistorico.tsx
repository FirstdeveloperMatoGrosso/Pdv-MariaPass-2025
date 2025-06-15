
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Hash,
  DollarSign
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PulseiraHistoricoProps {
  pulseiraId: string;
  codigoPulseira: string;
}

interface VendaHistorico {
  id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: string;
  numero_autorizacao: string | null;
  nsu: string | null;
  bandeira: string | null;
  data_venda: string;
  produtos?: {
    nome: string;
    codigo_barras: string | null;
  };
  terminais?: {
    nome: string;
    localizacao: string;
  };
}

const PulseiraHistorico: React.FC<PulseiraHistoricoProps> = ({ pulseiraId, codigoPulseira }) => {
  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['historico_vendas', pulseiraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_pulseiras')
        .select(`
          *,
          produtos (
            nome,
            codigo_barras
          ),
          terminais (
            nome,
            localizacao
          )
        `)
        .eq('pulseira_id', pulseiraId)
        .order('data_venda', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar histórico:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!pulseiraId,
  });

  const getPaymentIcon = (forma: string) => {
    switch (forma) {
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="w-3 h-3" />;
      case 'debito_pulseira':
        return <DollarSign className="w-3 h-3" />;
      default:
        return <Hash className="w-3 h-3" />;
    }
  };

  const getPaymentLabel = (forma: string) => {
    const labels: { [key: string]: string } = {
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'debito_pulseira': 'Débito Pulseira',
      'pix': 'PIX',
      'dinheiro': 'Dinheiro'
    };
    return labels[forma] || forma;
  };

  const getBandeiraColor = (bandeira: string | null) => {
    if (!bandeira) return 'bg-gray-100 text-gray-800';
    switch (bandeira.toLowerCase()) {
      case 'visa': return 'bg-blue-100 text-blue-800';
      case 'mastercard': return 'bg-red-100 text-red-800';
      case 'elo': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-base">Carregando histórico...</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <ShoppingCart className="w-5 h-5 text-green-600" />
          <span>Histórico de Compras - {codigoPulseira}</span>
          <Badge variant="outline">{vendas.length} transações</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {vendas.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Nenhuma compra realizada com esta pulseira</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] h-8 text-xs">Produto</TableHead>
                  <TableHead className="h-8 text-xs">Qtd</TableHead>
                  <TableHead className="h-8 text-xs">Valor</TableHead>
                  <TableHead className="hidden sm:table-cell h-8 text-xs">Pagamento</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">NSU</TableHead>
                  <TableHead className="hidden md:table-cell h-8 text-xs">Autorização</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Bandeira</TableHead>
                  <TableHead className="hidden lg:table-cell h-8 text-xs">Terminal</TableHead>
                  <TableHead className="hidden xl:table-cell h-8 text-xs">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((venda: VendaHistorico) => (
                  <TableRow key={venda.id}>
                    <TableCell className="p-2">
                      <div>
                        <div className="text-xs font-semibold">
                          {venda.produtos?.nome || 'Produto não encontrado'}
                        </div>
                        {venda.produtos?.codigo_barras && (
                          <div className="text-xs text-gray-500">
                            {venda.produtos.codigo_barras}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 text-xs">{venda.quantidade}</TableCell>
                    <TableCell className="p-2">
                      <div className="text-xs">
                        <div className="font-semibold text-green-600">
                          R$ {venda.valor_total.toFixed(2)}
                        </div>
                        <div className="text-gray-500">
                          Unit: R$ {venda.valor_unitario.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-2">
                      <div className="flex items-center space-x-1">
                        {getPaymentIcon(venda.forma_pagamento)}
                        <span className="text-xs">{getPaymentLabel(venda.forma_pagamento)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 text-xs">
                      {venda.nsu || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 text-xs">
                      {venda.numero_autorizacao || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-2">
                      {venda.bandeira ? (
                        <Badge className={getBandeiraColor(venda.bandeira)}>
                          {venda.bandeira.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-2">
                      <div className="text-xs">
                        <div className="font-medium">{venda.terminais?.nome || 'Terminal não encontrado'}</div>
                        <div className="text-gray-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{venda.terminais?.localizacao || 'Local não informado'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell p-2">
                      <div className="text-xs">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(venda.data_venda).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PulseiraHistorico;
