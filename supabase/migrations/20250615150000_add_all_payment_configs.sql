
-- Inserir configurações para todos os provedores de pagamento

-- PagSeguro
INSERT INTO configuracoes_sistema (categoria, chave, valor, descricao) VALUES
('pagamento', 'pagseguro_email', '""', 'Email da conta PagSeguro'),
('pagamento', 'pagseguro_token', '""', 'Token de acesso do PagSeguro'),
('pagamento', 'pagseguro_webhook_url', '"/webhook/pagseguro"', 'URL para receber notificações do PagSeguro'),
('pagamento', 'pagseguro_taxa_debito', '2.79', 'Taxa de débito do PagSeguro (%)'),
('pagamento', 'pagseguro_taxa_credito', '4.99', 'Taxa de crédito do PagSeguro (%)'),
('pagamento', 'pagseguro_taxa_pix', '1.99', 'Taxa PIX do PagSeguro (%)'),

-- Pagar.me
('pagamento', 'pagarme_api_key', '"sk_b5bd7d1e1e6642f5879d0ac424633802"', 'API Key do Pagar.me'),
('pagamento', 'pagarme_partner_id', '"61eaefd286db30019620e5b"', 'Partner ID do Pagar.me'),
('pagamento', 'pagarme_account_id', '"acc_Q1xPmGvTWGU4oR4y"', 'Account ID do Pagar.me'),
('pagamento', 'pagarme_webhook_url', '"/webhook/pagarme"', 'URL para receber notificações do Pagar.me'),
('pagamento', 'pagarme_taxa_debito', '2.19', 'Taxa de débito do Pagar.me (%)'),
('pagamento', 'pagarme_taxa_credito', '4.19', 'Taxa de crédito do Pagar.me (%)'),
('pagamento', 'pagarme_taxa_pix', '1.19', 'Taxa PIX do Pagar.me (%)'),

-- Stone
('pagamento', 'stone_api_key', '""', 'API Key da Stone'),
('pagamento', 'stone_webhook_url', '"/webhook/stone"', 'URL para receber notificações da Stone'),
('pagamento', 'stone_taxa_debito', '1.99', 'Taxa de débito da Stone (%)'),
('pagamento', 'stone_taxa_credito', '3.99', 'Taxa de crédito da Stone (%)'),
('pagamento', 'stone_taxa_pix', '0.99', 'Taxa PIX da Stone (%)'),

-- Mercado Pago
('pagamento', 'mercadopago_api_key', '""', 'API Key do Mercado Pago'),
('pagamento', 'mercadopago_webhook_url', '"/webhook/mercadopago"', 'URL para receber notificações do Mercado Pago'),
('pagamento', 'mercadopago_taxa_debito', '2.39', 'Taxa de débito do Mercado Pago (%)'),
('pagamento', 'mercadopago_taxa_credito', '4.39', 'Taxa de crédito do Mercado Pago (%)'),
('pagamento', 'mercadopago_taxa_pix', '0.99', 'Taxa PIX do Mercado Pago (%)');

-- Remover configurações antigas do PagSeguro se existirem
DELETE FROM configuracoes_sistema WHERE categoria = 'pagseguro';
