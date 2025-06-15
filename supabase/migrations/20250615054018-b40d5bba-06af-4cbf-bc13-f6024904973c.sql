
-- Atualizar a tabela cancelamentos para estar completa e funcional
ALTER TABLE cancelamentos 
ADD COLUMN IF NOT EXISTS numero_pedido TEXT,
ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
ADD COLUMN IF NOT EXISTS produto_nome TEXT,
ADD COLUMN IF NOT EXISTS operador TEXT DEFAULT 'Sistema';

-- Atualizar valores padrão para campos existentes
UPDATE cancelamentos SET aprovado = false WHERE aprovado IS NULL;
UPDATE cancelamentos SET responsavel = 'Sistema' WHERE responsavel = '';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cancelamentos_data ON cancelamentos(data_cancelamento);
CREATE INDEX IF NOT EXISTS idx_cancelamentos_status ON cancelamentos(aprovado);
CREATE INDEX IF NOT EXISTS idx_cancelamentos_pedido ON cancelamentos(pedido_id);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN cancelamentos.id IS 'ID único do cancelamento';
COMMENT ON COLUMN cancelamentos.pedido_id IS 'Referência ao pedido cancelado (opcional)';
COMMENT ON COLUMN cancelamentos.numero_pedido IS 'Número do pedido para referência';
COMMENT ON COLUMN cancelamentos.cliente_nome IS 'Nome do cliente';
COMMENT ON COLUMN cancelamentos.produto_nome IS 'Nome do produto cancelado';
COMMENT ON COLUMN cancelamentos.valor_cancelado IS 'Valor do cancelamento';
COMMENT ON COLUMN cancelamentos.motivo IS 'Motivo do cancelamento';
COMMENT ON COLUMN cancelamentos.observacoes IS 'Observações adicionais';
COMMENT ON COLUMN cancelamentos.responsavel IS 'Responsável pelo cancelamento';
COMMENT ON COLUMN cancelamentos.operador IS 'Operador que processou o cancelamento';
COMMENT ON COLUMN cancelamentos.aprovado IS 'Status de aprovação do cancelamento';
COMMENT ON COLUMN cancelamentos.data_cancelamento IS 'Data e hora do cancelamento';
