
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DadosRelatorio {
  faturamentoTotal: number;
  pedidosRealizados: number;
  ticketMedio: number;
  crescimentoPercentual: number;
}

interface ProdutoMaisVendido {
  id: string;
  nome: string;
  quantidade: number;
  receita: number;
}

interface PedidoRecente {
  id: string;
  numeroAutorizacao: string;
  dataVenda: string;
  quantidade: number;
  valorTotal: number;
  formaPagamento: string;
}

export const useRelatorioDados = (periodo: 'today' | 'week' | 'month') => {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (periodo) {
      case 'today':
        return {
          inicio: today.toISOString(),
          fim: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          inicio: weekStart.toISOString(),
          fim: now.toISOString()
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          inicio: monthStart.toISOString(),
          fim: now.toISOString()
        };
      default:
        return {
          inicio: today.toISOString(),
          fim: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
    }
  };

  const buscarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { inicio, fim } = getDateRange();
      
      console.log('Buscando dados de vendas para período:', { inicio, fim, periodo });

      // Buscar todas as vendas da tabela vendas_pulseiras
      const { data: vendasDiretas, error: errorVendasDiretas } = await supabase
        .from('vendas_pulseiras')
        .select(`
          id,
          produto_id,
          quantidade,
          valor_unitario,
          valor_total,
          forma_pagamento,
          numero_autorizacao,
          data_venda,
          produtos!inner(
            id,
            nome
          )
        `)
        .gte('data_venda', inicio)
        .lte('data_venda', fim)
        .order('data_venda', { ascending: false });

      if (errorVendasDiretas) {
        console.error('Erro ao buscar vendas diretas:', errorVendasDiretas);
        throw errorVendasDiretas;
      }

      console.log('Vendas encontradas para período:', vendasDiretas?.length || 0);
      console.log('Vendas detalhadas:', vendasDiretas);

      if (!vendasDiretas || vendasDiretas.length === 0) {
        console.log('Nenhuma venda encontrada para o período especificado');
        
        // Verificar se existem vendas na tabela (para debug)
        const { data: todasVendas, error: errorTodasVendas } = await supabase
          .from('vendas_pulseiras')
          .select('id, data_venda')
          .order('data_venda', { ascending: false })
          .limit(10);
        
        if (!errorTodasVendas) {
          console.log('Últimas 10 vendas na tabela:', todasVendas);
        }
      }

      // Calcular dados consolidados
      const faturamentoTotal = vendasDiretas?.reduce((total, venda) => total + (Number(venda.valor_total) || 0), 0) || 0;
      const pedidosRealizados = vendasDiretas?.length || 0;
      const ticketMedio = pedidosRealizados > 0 ? faturamentoTotal / pedidosRealizados : 0;

      // Agrupar produtos mais vendidos
      const produtosGrouped = vendasDiretas?.reduce((acc: any, venda: any) => {
        const produtoId = venda.produto_id;
        const nomeProduto = venda.produtos?.nome || 'Produto sem nome';
        
        if (!acc[produtoId]) {
          acc[produtoId] = {
            id: produtoId,
            nome: nomeProduto,
            quantidade: 0,
            receita: 0
          };
        }
        
        acc[produtoId].quantidade += Number(venda.quantidade) || 0;
        acc[produtoId].receita += Number(venda.valor_total) || 0;
        
        return acc;
      }, {}) || {};

      const produtosMaisVendidosArray = Object.values(produtosGrouped)
        .sort((a: any, b: any) => b.quantidade - a.quantidade)
        .slice(0, 10);

      // Processar pedidos recentes
      const pedidosRecentesProcessados = (vendasDiretas || []).slice(0, 10).map((venda: any) => ({
        id: venda.id,
        numeroAutorizacao: venda.numero_autorizacao || `VEN-${venda.id.slice(0, 6)}`,
        dataVenda: venda.data_venda,
        quantidade: Number(venda.quantidade) || 1,
        valorTotal: Number(venda.valor_total) || 0,
        formaPagamento: venda.forma_pagamento || 'Pulseira'
      }));

      setDados({
        faturamentoTotal,
        pedidosRealizados,
        ticketMedio,
        crescimentoPercentual: 12.5
      });

      setProdutosMaisVendidos(produtosMaisVendidosArray as ProdutoMaisVendido[]);
      setPedidosRecentes(pedidosRecentesProcessados);

      console.log('Dados processados para relatórios:', {
        faturamentoTotal,
        pedidosRealizados,
        ticketMedio,
        produtosMaisVendidos: produtosMaisVendidosArray.length,
        pedidosRecentes: pedidosRecentesProcessados.length
      });

    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, [periodo]);

  return {
    dados,
    produtosMaisVendidos,
    pedidosRecentes,
    loading,
    error,
    refetch: buscarDados
  };
};
