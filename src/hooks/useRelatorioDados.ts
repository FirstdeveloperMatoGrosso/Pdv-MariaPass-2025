
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
    
    switch (periodo) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          inicio: today.toISOString(),
          fim: tomorrow.toISOString()
        };
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(now);
        weekEnd.setHours(23, 59, 59, 999);
        return {
          inicio: weekStart.toISOString(),
          fim: weekEnd.toISOString()
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(now);
        monthEnd.setHours(23, 59, 59, 999);
        return {
          inicio: monthStart.toISOString(),
          fim: monthEnd.toISOString()
        };
      default:
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const defaultEnd = new Date(defaultStart);
        defaultEnd.setDate(defaultEnd.getDate() + 1);
        return {
          inicio: defaultStart.toISOString(),
          fim: defaultEnd.toISOString()
        };
    }
  };

  const buscarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { inicio, fim } = getDateRange();
      
      console.log('=== BUSCANDO RELATÓRIOS (ATUALIZADO) ===');
      console.log('Período:', periodo);
      console.log('Data início:', inicio);
      console.log('Data fim:', fim);

      // Buscar todas as vendas com produtos - usando uma consulta mais específica
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
          produtos!vendas_pulseiras_produto_id_fkey(
            id,
            nome
          )
        `)
        .gte('data_venda', inicio)
        .lt('data_venda', fim)
        .not('produto_id', 'is', null)
        .order('data_venda', { ascending: false });

      if (errorVendasDiretas) {
        console.error('Erro ao buscar vendas diretas:', errorVendasDiretas);
        throw errorVendasDiretas;
      }

      console.log('Total de vendas encontradas:', vendasDiretas?.length || 0);
      console.log('Vendas brutas:', vendasDiretas);
      
      // Se não encontrou vendas no período, buscar algumas vendas recentes para debug
      if (!vendasDiretas || vendasDiretas.length === 0) {
        console.log('Nenhuma venda encontrada para o período especificado');
        
        // Debug: buscar vendas mais recentes
        const { data: vendasRecentes } = await supabase
          .from('vendas_pulseiras')
          .select(`
            id, 
            data_venda, 
            valor_total,
            produtos!vendas_pulseiras_produto_id_fkey(nome)
          `)
          .not('produto_id', 'is', null)
          .order('data_venda', { ascending: false })
          .limit(10);
        
        console.log('Últimas 10 vendas na tabela:', vendasRecentes);
      }

      // Calcular dados consolidados
      const faturamentoTotal = vendasDiretas?.reduce((total, venda) => {
        const valor = Number(venda.valor_total) || 0;
        return total + valor;
      }, 0) || 0;
      
      const pedidosRealizados = vendasDiretas?.length || 0;
      const ticketMedio = pedidosRealizados > 0 ? faturamentoTotal / pedidosRealizados : 0;

      console.log('Dados calculados:');
      console.log('- Faturamento total:', faturamentoTotal);
      console.log('- Pedidos realizados:', pedidosRealizados);
      console.log('- Ticket médio:', ticketMedio);

      // Agrupar produtos mais vendidos - com verificação mais robusta
      const produtosGrouped = vendasDiretas?.reduce((acc: any, venda: any) => {
        if (!venda.produto_id || !venda.produtos) {
          console.warn('Venda sem produto válido:', venda);
          return acc;
        }

        const produtoId = venda.produto_id;
        const nomeProduto = venda.produtos?.nome || `Produto ${produtoId}`;
        
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
        .sort((a: any, b: any) => b.quantidade - a.quantidade);

      console.log('Produtos mais vendidos:', produtosMaisVendidosArray);

      // Processar pedidos recentes com mais detalhes
      const pedidosRecentesProcessados = (vendasDiretas || []).slice(0, 15).map((venda: any) => ({
        id: venda.id,
        numeroAutorizacao: venda.numero_autorizacao || `VEN-${venda.id.slice(0, 8)}`,
        dataVenda: venda.data_venda,
        quantidade: Number(venda.quantidade) || 1,
        valorTotal: Number(venda.valor_total) || 0,
        formaPagamento: venda.forma_pagamento || 'Pulseira'
      }));

      console.log('Pedidos recentes processados:', pedidosRecentesProcessados);

      // Atualizar estados
      setDados({
        faturamentoTotal,
        pedidosRealizados,
        ticketMedio,
        crescimentoPercentual: 12.5
      });

      setProdutosMaisVendidos(produtosMaisVendidosArray as ProdutoMaisVendido[]);
      setPedidosRecentes(pedidosRecentesProcessados);

      console.log('=== DADOS FINAIS ATUALIZADOS ===');

    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    console.log('Hook useRelatorioDados iniciado para período:', periodo);
    
    // Buscar dados iniciais
    buscarDados();

    // Configurar subscription para mudanças na tabela vendas_pulseiras
    const channel = supabase
      .channel('vendas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas_pulseiras'
        },
        (payload) => {
          console.log('Mudança detectada na tabela vendas_pulseiras:', payload);
          // Recarregar dados quando houver mudanças
          setTimeout(() => buscarDados(), 1000); // Small delay to ensure data is committed
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
