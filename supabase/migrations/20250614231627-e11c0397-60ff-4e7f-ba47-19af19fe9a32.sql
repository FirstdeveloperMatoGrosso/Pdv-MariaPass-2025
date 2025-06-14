
-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  codigo_barras TEXT UNIQUE,
  categoria TEXT NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de terminais
CREATE TABLE public.terminais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  localizacao TEXT NOT NULL,
  endereco_ip TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'manutencao')),
  ultima_conexao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  versao TEXT NOT NULL DEFAULT '1.0.0',
  tempo_atividade TEXT DEFAULT '0d 0h 0m',
  vendas_totais INTEGER DEFAULT 0,
  vendas_hoje INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT NOT NULL UNIQUE,
  terminal_id UUID REFERENCES public.terminais(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'cancelado')),
  valor_total DECIMAL(10,2) NOT NULL,
  tipo_pagamento TEXT,
  data_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE public.itens_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de cancelamentos
CREATE TABLE public.cancelamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES public.pedidos(id),
  motivo TEXT NOT NULL,
  valor_cancelado DECIMAL(10,2) NOT NULL,
  responsavel TEXT NOT NULL,
  data_cancelamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aprovado BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de impressões
CREATE TABLE public.impressoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES public.pedidos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('comprovante', 'voucher', 'relatorio', 'ticket')),
  impressora TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'imprimindo', 'concluido', 'falhou')),
  data_impressao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paginas INTEGER DEFAULT 1,
  copias INTEGER DEFAULT 1,
  usuario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vouchers
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('desconto', 'produto_gratis', 'credito')),
  valor DECIMAL(10,2),
  porcentagem INTEGER,
  produto_id UUID REFERENCES public.produtos(id),
  data_validade TIMESTAMP WITH TIME ZONE NOT NULL,
  limite_uso INTEGER DEFAULT 1,
  usos_realizados INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'usado', 'expirado', 'cancelado')),
  cliente_nome TEXT,
  cliente_email TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pulseiras
CREATE TABLE public.pulseiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'bloqueada')),
  tipo TEXT NOT NULL DEFAULT 'comum' CHECK (tipo IN ('comum', 'vip', 'cortesia')),
  data_ativacao TIMESTAMP WITH TIME ZONE,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  cliente_nome TEXT,
  cliente_documento TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de recargas de pulseiras
CREATE TABLE public.recargas_pulseiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pulseira_id UUID REFERENCES public.pulseiras(id),
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_novo DECIMAL(10,2) NOT NULL,
  tipo_pagamento TEXT NOT NULL,
  terminal_id UUID REFERENCES public.terminais(id),
  responsavel TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de controle de acesso
CREATE TABLE public.controle_acesso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario TEXT NOT NULL,
  acao TEXT NOT NULL,
  recurso TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  sucesso BOOLEAN NOT NULL DEFAULT true,
  detalhes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir dados de exemplo em produtos
INSERT INTO public.produtos (nome, preco, codigo_barras, categoria, estoque, status) VALUES
('Suco Natural Laranja', 10.00, '7891234567890', 'Bebidas', 25, 'ativo'),
('Pão de Queijo Tradicional', 5.00, '7891234567891', 'Salgados', 15, 'ativo'),
('Sanduíche Natural Frango', 15.00, '7891234567892', 'Sanduíches', 8, 'ativo'),
('Água Mineral 500ml', 3.00, '7891234567893', 'Bebidas', 50, 'ativo'),
('Café Expresso Premium', 8.00, '7891234567894', 'Bebidas', 30, 'ativo'),
('Croissant Chocolate', 7.50, '7891234567895', 'Doces', 12, 'ativo'),
('Hambúrguer Artesanal', 22.00, '7891234567896', 'Sanduíches', 6, 'ativo'),
('Refrigerante Lata', 4.50, '7891234567897', 'Bebidas', 40, 'ativo');

-- Inserir dados de exemplo em terminais
INSERT INTO public.terminais (nome, localizacao, endereco_ip, status, versao, tempo_atividade, vendas_totais, vendas_hoje) VALUES
('Terminal Principal', 'Hall de Entrada', '192.168.1.100', 'online', '2.1.0', '15d 8h 30m', 1250, 85),
('Terminal Backup', 'Área de Espera', '192.168.1.101', 'offline', '2.0.8', '0d 0h 0m', 890, 0),
('Terminal VIP', 'Sala VIP', '192.168.1.102', 'manutencao', '2.1.0', '2d 4h 15m', 560, 12),
('Terminal Cafeteria', 'Cafeteria', '192.168.1.103', 'online', '2.1.0', '10d 2h 45m', 2100, 150);

-- Inserir dados de exemplo em pedidos
INSERT INTO public.pedidos (numero_pedido, terminal_id, status, valor_total, tipo_pagamento, observacoes) VALUES
('PED-001', (SELECT id FROM public.terminais WHERE nome = 'Terminal Principal'), 'concluido', 28.50, 'cartao_credito', 'Pedido normal'),
('PED-002', (SELECT id FROM public.terminais WHERE nome = 'Terminal Principal'), 'concluido', 18.00, 'pix', 'Cliente preferencial'),
('PED-003', (SELECT id FROM public.terminais WHERE nome = 'Terminal VIP'), 'processando', 67.50, 'dinheiro', 'Pedido grande'),
('PED-004', (SELECT id FROM public.terminais WHERE nome = 'Terminal Principal'), 'cancelado', 8.00, 'cartao_debito', 'Cancelado pelo cliente');

-- Inserir dados de exemplo em vouchers
INSERT INTO public.vouchers (codigo, tipo, valor, porcentagem, data_validade, limite_uso, status, cliente_nome, observacoes) VALUES
('DESC10', 'desconto', 10.00, NULL, '2024-12-31 23:59:59', 1, 'ativo', 'João Silva', 'Desconto de boas-vindas'),
('GRATIS20', 'desconto', NULL, 20, '2024-12-31 23:59:59', 5, 'ativo', 'Maria Santos', 'Desconto percentual'),
('CREDITO50', 'credito', 50.00, NULL, '2024-12-31 23:59:59', 1, 'usado', 'Pedro Costa', 'Crédito promocional'),
('VIP15', 'desconto', NULL, 15, '2024-12-31 23:59:59', 3, 'ativo', 'Ana Lima', 'Desconto VIP');

-- Inserir dados de exemplo em pulseiras
INSERT INTO public.pulseiras (codigo, saldo, status, tipo, data_ativacao, cliente_nome, cliente_documento) VALUES
('PUL001', 25.50, 'ativa', 'comum', now(), 'Carlos Oliveira', '123.456.789-00'),
('PUL002', 100.00, 'ativa', 'vip', now(), 'Fernanda Reis', '987.654.321-00'),
('PUL003', 0.00, 'inativa', 'comum', NULL, NULL, NULL),
('PUL004', 75.25, 'ativa', 'cortesia', now(), 'Roberto Silva', '111.222.333-44'),
('PUL005', 12.80, 'bloqueada', 'comum', now() - interval '5 days', 'Luciana Costa', '555.666.777-88');

-- Inserir dados de exemplo em cancelamentos
INSERT INTO public.cancelamentos (pedido_id, motivo, valor_cancelado, responsavel, aprovado, observacoes) VALUES
((SELECT id FROM public.pedidos WHERE numero_pedido = 'PED-004'), 'Cliente desistiu', 8.00, 'Operador', true, 'Cancelamento aprovado pelo supervisor');

-- Inserir dados de exemplo em impressões
INSERT INTO public.impressoes (pedido_id, tipo, impressora, status, paginas, copias, usuario) VALUES
((SELECT id FROM public.pedidos WHERE numero_pedido = 'PED-001'), 'comprovante', 'Impressora Principal', 'concluido', 1, 1, 'Sistema'),
((SELECT id FROM public.pedidos WHERE numero_pedido = 'PED-002'), 'voucher', 'Impressora Vouchers', 'falhou', 1, 1, 'Operador'),
((SELECT id FROM public.pedidos WHERE numero_pedido = 'PED-003'), 'relatorio', 'Impressora Principal', 'imprimindo', 3, 2, 'Admin');

-- Inserir dados de exemplo em recargas de pulseiras
INSERT INTO public.recargas_pulseiras (pulseira_id, valor, saldo_anterior, saldo_novo, tipo_pagamento, terminal_id, responsavel) VALUES
((SELECT id FROM public.pulseiras WHERE codigo = 'PUL001'), 25.50, 0.00, 25.50, 'cartao_credito', (SELECT id FROM public.terminais WHERE nome = 'Terminal Principal'), 'Operador'),
((SELECT id FROM public.pulseiras WHERE codigo = 'PUL002'), 100.00, 0.00, 100.00, 'pix', (SELECT id FROM public.terminais WHERE nome = 'Terminal VIP'), 'Admin'),
((SELECT id FROM public.pulseiras WHERE codigo = 'PUL004'), 75.25, 0.00, 75.25, 'cortesia', (SELECT id FROM public.terminais WHERE nome = 'Terminal Principal'), 'Gerente');

-- Inserir dados de exemplo em controle de acesso
INSERT INTO public.controle_acesso (usuario, acao, recurso, ip_address, sucesso, detalhes) VALUES
('admin', 'login', 'sistema', '192.168.1.50', true, '{"navegador": "Chrome", "dispositivo": "Desktop"}'),
('operador', 'visualizar', 'produtos', '192.168.1.51', true, '{"pagina": "produtos", "filtros": "categoria:bebidas"}'),
('gerente', 'editar', 'terminal', '192.168.1.52', true, '{"terminal_id": "Terminal Principal", "acao": "atualizar_status"}'),
('usuario_teste', 'login', 'sistema', '192.168.1.53', false, '{"erro": "credenciais_invalidas", "tentativas": 3}');

-- Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancelamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impressoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulseiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recargas_pulseiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_acesso ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para permitir acesso público (pode ser ajustado depois)
CREATE POLICY "Permitir acesso público a produtos" ON public.produtos FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a terminais" ON public.terminais FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a pedidos" ON public.pedidos FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a itens_pedido" ON public.itens_pedido FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a cancelamentos" ON public.cancelamentos FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a impressoes" ON public.impressoes FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a vouchers" ON public.vouchers FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a pulseiras" ON public.pulseiras FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a recargas_pulseiras" ON public.recargas_pulseiras FOR ALL USING (true);
CREATE POLICY "Permitir acesso público a controle_acesso" ON public.controle_acesso FOR ALL USING (true);
