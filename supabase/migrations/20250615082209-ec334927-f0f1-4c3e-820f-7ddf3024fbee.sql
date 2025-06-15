
-- Criar tabela de impressões se não existir
CREATE TABLE IF NOT EXISTS public.impressoes_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id TEXT NOT NULL,
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  tipo TEXT NOT NULL DEFAULT 'comprovante',
  impressora TEXT NOT NULL DEFAULT 'Impressora Principal',
  status TEXT NOT NULL DEFAULT 'concluido',
  paginas INTEGER NOT NULL DEFAULT 1,
  copias INTEGER NOT NULL DEFAULT 1,
  usuario TEXT NOT NULL,
  data_impressao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_impressoes_vendas_pedido_id ON public.impressoes_vendas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_impressoes_vendas_data ON public.impressoes_vendas(data_impressao);
CREATE INDEX IF NOT EXISTS idx_impressoes_vendas_status ON public.impressoes_vendas(status);
