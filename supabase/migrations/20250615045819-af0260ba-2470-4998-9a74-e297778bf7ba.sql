
-- Criar tabela para relatórios de vendas consolidados
CREATE TABLE public.relatorios_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_relatorio DATE NOT NULL,
  periodo TEXT NOT NULL CHECK (periodo IN ('dia', 'semana', 'mes')),
  faturamento_total NUMERIC NOT NULL DEFAULT 0,
  pedidos_realizados INTEGER NOT NULL DEFAULT 0,
  ticket_medio NUMERIC NOT NULL DEFAULT 0,
  crescimento_percentual NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para produtos mais vendidos por período
CREATE TABLE public.produtos_mais_vendidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios_vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  nome_produto TEXT NOT NULL,
  quantidade_vendida INTEGER NOT NULL DEFAULT 0,
  receita_gerada NUMERIC NOT NULL DEFAULT 0,
  posicao_ranking INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_relatorios_vendas_data ON public.relatorios_vendas(data_relatorio);
CREATE INDEX idx_relatorios_vendas_periodo ON public.relatorios_vendas(periodo);
CREATE INDEX idx_produtos_mais_vendidos_relatorio ON public.produtos_mais_vendidos(relatorio_id);

-- Habilitar RLS
ALTER TABLE public.relatorios_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_mais_vendidos ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir todas as operações (sistema interno)
CREATE POLICY "Permitir todas as operações em relatórios de vendas"
  ON public.relatorios_vendas
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir todas as operações em produtos mais vendidos"
  ON public.produtos_mais_vendidos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para calcular dados do relatório baseado nas vendas
CREATE OR REPLACE FUNCTION calcular_relatorio_vendas(
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  faturamento_total NUMERIC,
  pedidos_realizados BIGINT,
  ticket_medio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(vp.valor_total), 0) as faturamento_total,
    COUNT(*) as pedidos_realizados,
    CASE 
      WHEN COUNT(*) > 0 THEN COALESCE(SUM(vp.valor_total), 0) / COUNT(*)
      ELSE 0
    END as ticket_medio
  FROM vendas_pulseiras vp
  WHERE vp.data_venda >= data_inicio 
    AND vp.data_venda <= data_fim;
END;
$$ LANGUAGE plpgsql;

-- Função para obter produtos mais vendidos
CREATE OR REPLACE FUNCTION obter_produtos_mais_vendidos(
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  limite INTEGER DEFAULT 5
)
RETURNS TABLE (
  produto_id UUID,
  nome_produto TEXT,
  quantidade_vendida BIGINT,
  receita_gerada NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as produto_id,
    p.nome as nome_produto,
    SUM(vp.quantidade)::BIGINT as quantidade_vendida,
    SUM(vp.valor_total) as receita_gerada
  FROM vendas_pulseiras vp
  JOIN produtos p ON p.id = vp.produto_id
  WHERE vp.data_venda >= data_inicio 
    AND vp.data_venda <= data_fim
  GROUP BY p.id, p.nome
  ORDER BY quantidade_vendida DESC, receita_gerada DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- Inserir alguns dados de exemplo para teste
INSERT INTO public.relatorios_vendas (data_relatorio, periodo, faturamento_total, pedidos_realizados, ticket_medio, crescimento_percentual) VALUES
(CURRENT_DATE, 'dia', 1250.50, 23, 54.37, 12.5),
(CURRENT_DATE - INTERVAL '1 day', 'dia', 1100.25, 21, 52.39, 8.2),
(CURRENT_DATE - INTERVAL '7 days', 'semana', 8750.25, 156, 56.09, 15.3);
