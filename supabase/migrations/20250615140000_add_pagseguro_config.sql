
-- Inserir configurações do PagBank (antigo PagSeguro)
INSERT INTO configuracoes_sistema (categoria, chave, valor, descricao) VALUES
('pagseguro', 'email', '"seu-email@exemplo.com"', 'Email da conta PagBank'),
('pagseguro', 'token', '"DEMO_TOKEN"', 'Token de acesso do PagBank'),
('pagseguro', 'sandbox', 'true', 'Usar ambiente de teste (sandbox) do PagBank'),
('pagseguro', 'expiracao_minutos', '15', 'Tempo de expiração do PIX em minutos'),
('pagseguro', 'webhook_url', '"/webhook/pagseguro"', 'URL para receber notificações do PagBank'),
('pagseguro', 'nome_recebedor', '"Maria Pass Sistema"', 'Nome que aparece no PIX'),
('pagseguro', 'cidade_recebedor', '"São Paulo"', 'Cidade do recebedor PIX');

-- Comentários explicativos
COMMENT ON TABLE configuracoes_sistema IS 'Configurações gerais do sistema, incluindo integrações de pagamento';
