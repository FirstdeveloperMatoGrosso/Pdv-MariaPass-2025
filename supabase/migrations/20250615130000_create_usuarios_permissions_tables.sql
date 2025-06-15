
-- Criar tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  tipo_acesso VARCHAR(50) DEFAULT 'operador' CHECK (tipo_acesso IN ('admin', 'gerente', 'operador', 'visualizador')),
  ativo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de páginas/recursos do sistema
CREATE TABLE IF NOT EXISTS recursos_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  rota VARCHAR(255) NOT NULL UNIQUE,
  icone VARCHAR(50),
  categoria VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de permissões por tipo de usuário
CREATE TABLE IF NOT EXISTS permissoes_acesso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_usuario VARCHAR(50) NOT NULL,
  recurso_id UUID REFERENCES recursos_sistema(id) ON DELETE CASCADE,
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_deletar BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tipo_usuario, recurso_id)
);

-- Inserir recursos do sistema
INSERT INTO recursos_sistema (nome, descricao, rota, icone, categoria) VALUES
('Dashboard', 'Página inicial com visão geral', '/', 'Home', 'Principal'),
('Vendas', 'Gerenciamento de vendas', '/vendas', 'ShoppingCart', 'Vendas'),
('Produtos', 'Cadastro e gerenciamento de produtos', '/produtos', 'Package', 'Estoque'),
('Importar Excel', 'Importação de dados via Excel', '/importar-excel', 'Upload', 'Estoque'),
('Relatórios', 'Relatórios e análises', '/relatorios', 'BarChart3', 'Relatórios'),
('Pagamentos', 'Controle de pagamentos', '/pagamentos', 'CreditCard', 'Financeiro'),
('Cancelamentos', 'Gerenciamento de cancelamentos', '/cancelamentos', 'XCircle', 'Vendas'),
('Estoque', 'Controle de estoque', '/estoque', 'Package2', 'Estoque'),
('Impressões', 'Controle de impressões', '/impressoes', 'Printer', 'Sistema'),
('Terminais', 'Gerenciamento de terminais', '/terminais', 'Monitor', 'Sistema'),
('Controle Acesso', 'Controle de usuários e acessos', '/acesso', 'Shield', 'Sistema'),
('Vouchers', 'Gerenciamento de vouchers', '/vouchers', 'Ticket', 'Promoções'),
('Recarga Pulseiras', 'Recarga de pulseiras', '/recarga-pulseiras', 'Zap', 'Sistema'),
('Configurações', 'Configurações do sistema', '/configuracoes', 'Settings', 'Sistema'),
('Integração Nota Fiscal', 'Integração com nota fiscal', '/integracao-nota-fiscal', 'FileText', 'Integrações'),
('Integração Boleto', 'Integração com boletos', '/integracao-boleto', 'Receipt', 'Integrações'),
('Integração NFCe', 'Integração com NFCe', '/integracao-nfce', 'QrCode', 'Integrações')
ON CONFLICT (rota) DO NOTHING;

-- Inserir permissões padrão para cada tipo de usuário
-- ADMIN: acesso total
INSERT INTO permissoes_acesso (tipo_usuario, recurso_id, pode_visualizar, pode_criar, pode_editar, pode_deletar)
SELECT 'admin', id, true, true, true, true FROM recursos_sistema
ON CONFLICT (tipo_usuario, recurso_id) DO NOTHING;

-- GERENTE: acesso a quase tudo, exceto algumas configurações críticas
INSERT INTO permissoes_acesso (tipo_usuario, recurso_id, pode_visualizar, pode_criar, pode_editar, pode_deletar)
SELECT 'gerente', id, true, true, true, 
       CASE WHEN rota IN ('/acesso', '/configuracoes') THEN false ELSE true END
FROM recursos_sistema
ON CONFLICT (tipo_usuario, recurso_id) DO NOTHING;

-- OPERADOR: acesso a vendas e operações básicas
INSERT INTO permissoes_acesso (tipo_usuario, recurso_id, pode_visualizar, pode_criar, pode_editar, pode_deletar)
SELECT 'operador', id, 
       CASE WHEN rota IN ('/', '/vendas', '/produtos', '/estoque', '/impressoes', '/vouchers', '/recarga-pulseiras') THEN true ELSE false END,
       CASE WHEN rota IN ('/vendas', '/vouchers', '/recarga-pulseiras') THEN true ELSE false END,
       CASE WHEN rota IN ('/vendas', '/estoque') THEN true ELSE false END,
       false
FROM recursos_sistema
ON CONFLICT (tipo_usuario, recurso_id) DO NOTHING;

-- VISUALIZADOR: apenas visualização
INSERT INTO permissoes_acesso (tipo_usuario, recurso_id, pode_visualizar, pode_criar, pode_editar, pode_deletar)
SELECT 'visualizador', id, 
       CASE WHEN rota NOT IN ('/acesso', '/configuracoes', '/integracao-nota-fiscal', '/integracao-boleto', '/integracao-nfce') THEN true ELSE false END,
       false, false, false
FROM recursos_sistema
ON CONFLICT (tipo_usuario, recurso_id) DO NOTHING;

-- Inserir usuários de exemplo
INSERT INTO usuarios (nome, email, senha_hash, tipo_acesso) VALUES
('Administrador', 'admin@sistema.com', '$2b$10$example.hash.here', 'admin'),
('Maria Gerente', 'gerente@sistema.com', '$2b$10$example.hash.here', 'gerente'),
('João Operador', 'operador@sistema.com', '$2b$10$example.hash.here', 'operador'),
('Ana Visualizadora', 'viewer@sistema.com', '$2b$10$example.hash.here', 'visualizador')
ON CONFLICT (email) DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_acesso ON usuarios(tipo_acesso);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_permissoes_tipo_usuario ON permissoes_acesso(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_recursos_rota ON recursos_sistema(rota);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_acesso ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY IF NOT EXISTS "Permitir acesso aos usuários" ON usuarios FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Permitir acesso aos recursos" ON recursos_sistema FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Permitir acesso às permissões" ON permissoes_acesso FOR ALL USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE usuarios IS 'Usuários do sistema com diferentes níveis de acesso';
COMMENT ON TABLE recursos_sistema IS 'Recursos/páginas disponíveis no sistema';
COMMENT ON TABLE permissoes_acesso IS 'Permissões de acesso por tipo de usuário';
