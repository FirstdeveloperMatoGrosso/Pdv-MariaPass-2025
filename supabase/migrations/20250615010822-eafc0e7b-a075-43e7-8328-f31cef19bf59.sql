
-- Criar tabela para transações PIX
CREATE TABLE public.transacoes_pix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recarga_id UUID REFERENCES public.recargas_pulseiras(id),
  qr_code TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  pago_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.transacoes_pix ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações
CREATE POLICY "Permitir todas as operações em transações PIX"
  ON public.transacoes_pix
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar índices para melhor performance
CREATE INDEX idx_transacoes_pix_status ON public.transacoes_pix(status);
CREATE INDEX idx_transacoes_pix_recarga_id ON public.transacoes_pix(recarga_id);

-- Inserir configuração PIX no sistema
INSERT INTO public.configuracoes_sistema (categoria, chave, valor, descricao) VALUES
('pix', 'chave_pix', '"exemplo@email.com"', 'Chave PIX para recebimento'),
('pix', 'nome_recebedor', '"Maria Pass Sistema"', 'Nome do recebedor PIX'),
('pix', 'cidade_recebedor', '"São Paulo"', 'Cidade do recebedor PIX'),
('pix', 'expiracao_minutos', '15', 'Tempo de expiração do PIX em minutos');
