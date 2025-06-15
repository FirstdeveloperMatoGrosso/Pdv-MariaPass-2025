
-- Corrigir definitivamente o erro de coluna ambígua na função salvar_produtos_vendidos
CREATE OR REPLACE FUNCTION public.salvar_produtos_vendidos(
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  periodo_tipo TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_relatorio_id UUID;
  produto_record RECORD;
  posicao INTEGER := 1;
BEGIN
  -- Criar ou atualizar relatório
  INSERT INTO public.relatorios_vendas (
    data_relatorio, 
    periodo, 
    faturamento_total, 
    pedidos_realizados, 
    ticket_medio
  )
  SELECT 
    CURRENT_DATE,
    periodo_tipo,
    COALESCE(SUM(vp.valor_total), 0),
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(vp.valor_total), 0) / COUNT(*) ELSE 0 END
  FROM vendas_pulseiras vp
  WHERE vp.data_venda >= data_inicio AND vp.data_venda < data_fim
  ON CONFLICT (data_relatorio, periodo) 
  DO UPDATE SET 
    faturamento_total = EXCLUDED.faturamento_total,
    pedidos_realizados = EXCLUDED.pedidos_realizados,
    ticket_medio = EXCLUDED.ticket_medio,
    updated_at = now()
  RETURNING id INTO current_relatorio_id;

  -- Limpar produtos vendidos anteriores para este período usando o alias correto
  DELETE FROM public.produtos_mais_vendidos 
  WHERE produtos_mais_vendidos.relatorio_id = current_relatorio_id;

  -- Inserir produtos vendidos atualizados
  FOR produto_record IN
    SELECT 
      p.id as produto_id,
      p.nome as nome_produto,
      SUM(vp.quantidade)::INTEGER as quantidade_vendida,
      SUM(vp.valor_total) as receita_gerada
    FROM vendas_pulseiras vp
    JOIN produtos p ON p.id = vp.produto_id
    WHERE vp.data_venda >= data_inicio 
      AND vp.data_venda < data_fim
      AND vp.produto_id IS NOT NULL
    GROUP BY p.id, p.nome
    ORDER BY SUM(vp.quantidade) DESC, SUM(vp.valor_total) DESC
  LOOP
    INSERT INTO public.produtos_mais_vendidos (
      relatorio_id,
      produto_id,
      nome_produto,
      quantidade_vendida,
      receita_gerada,
      posicao_ranking
    ) VALUES (
      current_relatorio_id,
      produto_record.produto_id,
      produto_record.nome_produto,
      produto_record.quantidade_vendida,
      produto_record.receita_gerada,
      posicao
    );
    
    posicao := posicao + 1;
  END LOOP;
END;
$$;
