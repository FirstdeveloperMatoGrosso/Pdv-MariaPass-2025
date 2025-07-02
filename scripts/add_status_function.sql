-- Função para verificar se uma coluna existe
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar a coluna status
CREATE OR REPLACE FUNCTION add_status_column_to_vendas_pulseiras()
RETURNS void AS $$
BEGIN
  -- Adiciona a coluna status se não existir
  IF NOT column_exists('vendas_pulseiras', 'status') THEN
    EXECUTE 'ALTER TABLE vendas_pulseiras ADD COLUMN status VARCHAR(20) DEFAULT ''pago'';';
    
    -- Adiciona restrição de verificação para garantir valores válidos
    EXECUTE 'ALTER TABLE vendas_pulseiras ADD CONSTRAINT check_status CHECK (status IN (''pendente'', ''pago'', ''cancelada'', ''estornado''));';
    
    -- Atualiza o status para 'pago' para registros existentes
    EXECUTE 'UPDATE vendas_pulseiras SET status = ''pago'' WHERE status IS NULL;';
    
    RAISE NOTICE 'Coluna status adicionada à tabela vendas_pulseiras';
  ELSE
    RAISE NOTICE 'A coluna status já existe na tabela vendas_pulseiras';
  END IF;
END;
$$ LANGUAGE plpgsql;
