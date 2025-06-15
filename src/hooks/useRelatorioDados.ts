
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
      
      console.log('=== BUSCANDO DADOS DE RELATÓRIO ===');
      console.log('Período:', periodo);
      console.log('Data início:', inicio);
      console.log('Data fim:', fim);

      // Tentar salvar produtos vendidos usando a função SQL corrigida
      try {
        const { error: errorSalvar } = await supabase.rpc('salvar_produtos_vendidos', {
          data_inicio: inicio,
          data_fim: fim,
          periodo_tipo: periodo === 'today' ? 'dia' : periodo === 'week' ? 'semana' : 'mes'
        });

        if (errorSalvar) {
          console.warn('Aviso ao salvar produtos vendidos:', errorSalvar);
          // Não falhar aqui, continuar com busca direta
        } else {
          console.log('Produtos vendidos salvos com sucesso!');
        }
      } catch (salvarError) {
        console.warn('Erro ao tentar salvar produtos, continuando com busca direta:', salvarError);
      }

      // Buscar dados do relatório usando a função SQL
      const { data: dadosRelatorio, error: errorRelatorio } = await supabase.rpc('calcular_relatorio_vendas', {
        data_inicio: inicio,
        data_fim: fim
      });

      if (errorRelatorio) {
        console.error('Erro ao calcular relatório:', errorRelatorio);
        throw errorRelatorio;
      }

      console.log('Dados do relatório:', dadosRelatorio);

      // Buscar produtos mais vendidos salvos na tabela
      const { data: produtosSalvos, error: errorProdutos } = await supabase
        .from('produtos_mais_vendidos')
        .select(`
          id,
          nome_produto,
          quantidade_vendida,
          receita_gerada,
          posicao_ranking
        `)
        .order('posicao_ranking', { ascending: true });

      if (errorProdutos) {
        console.warn('Erro ao buscar produtos salvos, buscando diretamente:', errorProdutos);
        
        // Fallback: buscar diretamente das vendas se tabela salva falhar
        const { data: produtosDiretos, error: errorDiretos } = await supabase
          .from('vendas_pulseiras')
          .select(`
            produto_id,
            quantidade,
            valor_total,
            produtos:produto_id (
              id,
              nome
            )
          `)
          .gte('data_venda', inicio)
          .lt('data_venda', fim)
          .not('produto_id', 'is', null);

        if (errorDiretos) {
          console.error('Erro ao buscar produtos diretamente:', errorDiretos);
        } else {
          console.log('Produtos encontrados diretamente:', produtosDiretos);
          // Processar dados diretos
          const produtosAgrupados = produtosDiretos?.reduce((acc: any, venda: any) => {
            if (venda.produtos && venda.produtos.id) {
              const produtoId = venda.produtos.id;
              if (!acc[produtoId]) {
                acc[produtoId] = {
                  id: produtoId,
                  nome: venda.produtos.nome,
                  quantidade: 0,
                  receita: 0
                };
              }
              acc[produtoId].quantidade += Number(venda.quantidade) || 0;
              acc[produtoId].receita += Number(venda.valor_total) || 0;
            }
            return acc;
          }, {}) || {};

          const produtosArray = Object.values(produtosAgrupados) as ProdutoMaisVendido[];
          setProdutosMaisVendidos(produtosArray.sort((a: any, b: any) => b.quantidade - a.quantidade));
        }
      } else {
        console.log('Produtos mais vendidos salvos:', produtosSalvos);
        const produtosProcessados = produtosSalvos?.map(produto => ({
          id: produto.id,
          nome: produto.nome_produto,
          quantidade: produto.quantidade_vendida,
          receita: Number(produto.receita_gerada)
        })) || [];
        setProdutosMaisVendidos(produtosProcessados);
      }

      // Buscar vendas recentes para pedidos
      const { data: vendasRecentes, error: errorVendas } = await supabase
        .from('vendas_pulseiras')
        .select(`
          id,
          quantidade,
          valor_total,
          forma_pagamento,
          numero_autorizacao,
          data_venda
        `)
        .gte('data_venda', inicio)
        .lt('data_venda', fim)
        .order('data_venda', { ascending: false })
        .limit(15);

      if (errorVendas) {
        console.error('Erro ao buscar vendas recentes:', errorVendas);
      } else {
        console.log('Vendas recentes encontradas:', vendasRecentes?.length || 0);
        const pedidosProcessados = vendasRecentes?.map(venda => ({
          id: venda.id,
          numeroAutorizacao: venda.numero_autorizacao || `VEN-${venda.id.slice(0, 8)}`,
          dataVenda: venda.data_venda,
          quantidade: Number(venda.quantidade) || 1,
          valorTotal: Number(venda.valor_total) || 0,
          formaPagamento: venda.forma_pagamento || 'Não informado'
        })) || [];
        setPedidosRecentes(pedidosProcessados);
      }

      // Processar dados do relatório
      const dadosProcessados = dadosRelatorio?.[0] || {
        faturamento_total: 0,
        pedidos_realizados: 0,
        ticket_medio: 0
      };

      setDados({
        faturamentoTotal: Number(dadosProcessados.faturamento_total),
        pedidosRealizados: Number(dadosProcessados.pedidos_realizados),
        ticketMedio: Number(dadosProcessados.ticket_medio),
        crescimentoPercentual: 12.5
      });

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
          setTimeout(() => buscarDados(), 1000);
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
