-- Script para adicionar a coluna status à tabela vendas_pulseiras
-- Execute este script no seu banco de dados Supabase

-- Adiciona a coluna status se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendas_pulseiras' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE vendas_pulseiras 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pendente';
        
        -- Atualiza o status para 'pago' para registros existentes
        UPDATE vendas_pulseiras 
        SET status = 'pago' 
        WHERE status IS NULL;
        
        -- Adiciona restrição de verificação para garantir valores válidos
        ALTER TABLE vendas_pulseiras 
        ADD CONSTRAINT check_status 
        CHECK (status IN ('pendente', 'pago', 'cancelada', 'estornado'));
        
        RAISE NOTICE 'Coluna status adicionada à tabela vendas_pulseiras';
    ELSE
        RAISE NOTICE 'A coluna status já existe na tabela vendas_pulseiras';
    END IF;
END $$;
