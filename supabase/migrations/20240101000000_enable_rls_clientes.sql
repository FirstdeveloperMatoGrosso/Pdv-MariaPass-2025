-- Ativa o RLS na tabela clientes (se ainda não estiver ativado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'clientes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS ativado na tabela clientes';
  ELSE
    RAISE NOTICE 'RLS já está ativado na tabela clientes';
  END IF;
END $$;

-- Cria as políticas apenas se não existirem
DO $$
BEGIN
  -- Política de leitura
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clientes' 
    AND policyname = 'Permitir leitura de clientes para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir leitura de clientes para usuários autenticados"
    ON public.clientes
    FOR SELECT
    TO authenticated
    USING (true);
    RAISE NOTICE 'Política de leitura criada';
  ELSE
    RAISE NOTICE 'Política de leitura já existe';
  END IF;
  
  -- Política de inserção
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clientes' 
    AND policyname = 'Permitir inserção de clientes para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir inserção de clientes para usuários autenticados"
    ON public.clientes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
    RAISE NOTICE 'Política de inserção criada';
  ELSE
    RAISE NOTICE 'Política de inserção já existe';
  END IF;
  
  -- Política de atualização
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clientes' 
    AND policyname = 'Permitir atualização de clientes para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir atualização de clientes para usuários autenticados"
    ON public.clientes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
    RAISE NOTICE 'Política de atualização criada';
  ELSE
    RAISE NOTICE 'Política de atualização já existe';
  END IF;
  
  -- Política de exclusão
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clientes' 
    AND policyname = 'Permitir exclusão de clientes para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir exclusão de clientes para usuários autenticados"
    ON public.clientes
    FOR DELETE
    TO authenticated
    USING (true);
    RAISE NOTICE 'Política de exclusão criada';
  ELSE
    RAISE NOTICE 'Política de exclusão já existe';
  END IF;
END $$;
