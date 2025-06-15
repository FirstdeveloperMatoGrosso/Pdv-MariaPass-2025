
-- Inserir configurações do PagSeguro
INSERT INTO configuracoes_sistema (categoria, chave, valor, descricao) VALUES
('pagseguro', 'api_key', '"DEMO_API_KEY"', 'Chave da API do PagSeguro (Token de acesso)'),
('pagseguro', 'sandbox', 'true', 'Usar ambiente de teste (sandbox) do PagSeguro'),
('pagseguro', 'expiracao_minutos', '15', 'Tempo de expiração do PIX em minutos'),
('pagseguro', 'webhook_url', '"/webhook/pagseguro"', 'URL para receber notificações do PagSeguro'),
('pagseguro', 'nome_recebedor', '"Maria Pass Sistema"', 'Nome que aparece no PIX'),
('pagseguro', 'cidade_recebedor', '"São Paulo"', 'Cidade do recebedor PIX');

-- Comentários explicativos
COMMENT ON TABLE configuracoes_sistema IS 'Configurações gerais do sistema, incluindo integrações de pagamento';
