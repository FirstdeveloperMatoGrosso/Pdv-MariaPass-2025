
-- Criar tabela para histórico de vendas detalhado
CREATE TABLE public.vendas_pulseiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pulseira_id UUID REFERENCES public.pulseiras(id),
  produto_id UUID REFERENCES public.produtos(id),
  terminal_id UUID REFERENCES public.terminais(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  forma_pagamento TEXT NOT NULL,
  numero_autorizacao TEXT,
  nsu TEXT,
  bandeira TEXT,
  data_venda TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vendas_pulseiras ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações
CREATE POLICY "Permitir todas as operações em vendas de pulseiras"
  ON public.vendas_pulseiras
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar índices para melhor performance
CREATE INDEX idx_vendas_pulseiras_pulseira_id ON public.vendas_pulseiras(pulseira_id);
CREATE INDEX idx_vendas_pulseiras_data_venda ON public.vendas_pulseiras(data_venda);
CREATE INDEX idx_vendas_pulseiras_terminal_id ON public.vendas_pulseiras(terminal_id);

-- Inserir dados de exemplo para vendas
INSERT INTO public.vendas_pulseiras (pulseira_id, produto_id, terminal_id, quantidade, valor_unitario, valor_total, forma_pagamento, numero_autorizacao, nsu, bandeira, data_venda) VALUES
((SELECT id FROM public.pulseiras WHERE codigo = 'PUL001' LIMIT 1), (SELECT id FROM public.produtos LIMIT 1), (SELECT id FROM public.terminais LIMIT 1), 2, 15.50, 31.00, 'cartao_credito', '123456789', 'NSU001234', 'visa', now() - interval '2 hours'),
((SELECT id FROM public.pulseiras WHERE codigo = 'PUL001' LIMIT 1), (SELECT id FROM public.produtos LIMIT 1), (SELECT id FROM public.terminais LIMIT 1), 1, 8.00, 8.00, 'debito_pulseira', NULL, 'NSU001235', NULL, now() - interval '1 hour'),
((SELECT id FROM public.pulseiras WHERE codigo = 'PUL002' LIMIT 1), (SELECT id FROM public.produtos LIMIT 1), (SELECT id FROM public.terminais LIMIT 1), 3, 12.00, 36.00, 'cartao_debito', '987654321', 'NSU001236', 'mastercard', now() - interval '30 minutes');
