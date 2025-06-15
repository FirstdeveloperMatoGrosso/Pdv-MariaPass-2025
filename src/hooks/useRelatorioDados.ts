
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
      
      // Buscar dados consolidados de vendas
      const { data: dadosVendas, error: errorVendas } = await supabase
        .rpc('calcular_relatorio_vendas', {
          data_inicio: inicio,
          data_fim: fim
        });

      if (errorVendas) {
        console.error('Erro ao buscar dados de vendas:', errorVendas);
        throw errorVendas;
      }

      // Buscar produtos mais vendidos
      const { data: produtosVendidos, error: errorProdutos } = await supabase
        .rpc('obter_produtos_mais_vendidos', {
          data_inicio: inicio,
          data_fim: fim,
          limite: 5
        });

      if (errorProdutos) {
        console.error('Erro ao buscar produtos mais vendidos:', errorProdutos);
        throw errorProdutos;
      }

      // Buscar pedidos recentes
      const { data: pedidos, error: errorPedidos } = await supabase
        .from('vendas_pulseiras')
        .select(`
          id,
          numero_autorizacao,
          data_venda,
          quantidade,
          valor_total,
          forma_pagamento
        `)
        .gte('data_venda', inicio)
        .lte('data_venda', fim)
        .order('data_venda', { ascending: false })
        .limit(5);

      if (errorPedidos) {
        console.error('Erro ao buscar pedidos recentes:', errorPedidos);
        throw errorPedidos;
      }

      // Processar dados
      const dadosProcessados = dadosVendas?.[0] || {
        faturamento_total: 0,
        pedidos_realizados: 0,
        ticket_medio: 0
      };

      setDados({
        faturamentoTotal: Number(dadosProcessados.faturamento_total) || 0,
        pedidosRealizados: Number(dadosProcessados.pedidos_realizados) || 0,
        ticketMedio: Number(dadosProcessados.ticket_medio) || 0,
        crescimentoPercentual: 12.5 // Temporário - seria calculado comparando com período anterior
      });

      setProdutosMaisVendidos(
        (produtosVendidos || []).map((p: any) => ({
          id: p.produto_id,
          nome: p.nome_produto,
          quantidade: Number(p.quantidade_vendida) || 0,
          receita: Number(p.receita_gerada) || 0
        }))
      );

      setPedidosRecentes(
        (pedidos || []).map((p: any) => ({
          id: p.id,
          numeroAutorizacao: p.numero_autorizacao || `VEN-${p.id.slice(0, 6)}`,
          dataVenda: p.data_venda,
          quantidade: p.quantidade || 1,
          valorTotal: Number(p.valor_total) || 0,
          formaPagamento: p.forma_pagamento || 'Pulseira'
        }))
      );

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
