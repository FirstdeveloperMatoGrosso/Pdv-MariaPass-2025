-- Script para adicionar a coluna status à tabela pedidos
-- Execute este script no seu banco de dados Supabase

-- Adiciona a coluna status se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE pedidos 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pendente';
        
        -- Atualiza o status para 'concluido' para registros existentes
        UPDATE pedidos 
        SET status = 'concluido' 
        WHERE status IS NULL;
        
        -- Adiciona uma restrição para garantir valores válidos
        ALTER TABLE pedidos 
        ADD CONSTRAINT check_status 
        CHECK (status IN ('pendente', 'concluido', 'cancelado', 'estornado'));
        
        RAISE NOTICE 'Coluna status adicionada à tabela pedidos com sucesso!';
    ELSE
        RAISE NOTICE 'A coluna status já existe na tabela pedidos.';
    END IF;
END $$;
