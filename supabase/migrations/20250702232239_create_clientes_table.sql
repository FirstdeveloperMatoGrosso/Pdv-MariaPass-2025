-- Create clients table
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  documento VARCHAR(20) NOT NULL,
  telefone VARCHAR(20),
  tipo VARCHAR(2) NOT NULL CHECK (tipo IN ('PF', 'PJ')),
  endereco JSONB,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que não haverá documentos duplicados
  CONSTRAINT unique_documento UNIQUE (documento)
);

-- Cria índice para melhorar buscas
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON public.clientes (documento);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes (nome);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON public.clientes (tipo);

-- Comentários para documentação
COMMENT ON TABLE public.clientes IS 'Tabela de clientes e empresas';
COMMENT ON COLUMN public.clientes.nome IS 'Nome do cliente ou razão social';
COMMENT ON COLUMN public.clientes.email IS 'E-mail de contato';
COMMENT ON COLUMN public.clientes.documento IS 'CPF ou CNPJ sem formatação';
COMMENT ON COLUMN public.clientes.telefone IS 'Telefone de contato';
COMMENT ON COLUMN public.clientes.tipo IS 'Tipo de cliente: PF para Pessoa Física, PJ para Pessoa Jurídica';
COMMENT ON COLUMN public.clientes.endereco IS 'Dados de endereço em formato JSON';
COMMENT ON COLUMN public.clientes.ativo IS 'Indica se o cliente está ativo';

-- Cria função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger apenas se ele não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at') THEN
    CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Adiciona permissões para o usuário anônimo do Supabase (se estiver usando RLS)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (ajuste conforme necessário)
CREATE POLICY "Permitir leitura de clientes para usuários autenticados"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção de clientes para usuários autenticados"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização de clientes para usuários autenticados"
ON public.clientes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de clientes para usuários autenticados"
ON public.clientes
FOR DELETE
TO authenticated
USING (true);
