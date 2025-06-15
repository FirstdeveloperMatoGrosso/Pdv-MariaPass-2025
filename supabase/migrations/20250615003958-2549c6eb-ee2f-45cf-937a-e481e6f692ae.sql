
-- Criar tabela para configurações do sistema
CREATE TABLE public.configuracoes_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  chave TEXT NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(categoria, chave)
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (sistema público)
CREATE POLICY "Permitir todas as operações em configurações"
  ON public.configuracoes_sistema
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inserir configurações padrão
INSERT INTO public.configuracoes_sistema (categoria, chave, valor, descricao) VALUES
-- Configurações de Impressão
('impressao', 'impressora_padrao', '"HP LaserJet Pro"', 'Impressora padrão do sistema'),
('impressao', 'qualidade_impressao', '"alta"', 'Qualidade de impressão: baixa, media, alta'),
('impressao', 'orientacao_padrao', '"retrato"', 'Orientação padrão: retrato ou paisagem'),
('impressao', 'impressao_automatica', 'true', 'Habilitar impressão automática'),
('impressao', 'copias_padrao', '1', 'Número de cópias padrão'),
('impressao', 'papel_padrao', '"A4"', 'Tamanho de papel padrão'),

-- Configurações de Rede
('rede', 'wifi_habilitado', 'true', 'WiFi habilitado'),
('rede', 'nome_rede', '"MariaPass-Network"', 'Nome da rede WiFi'),
('rede', 'ip_estatico', 'false', 'Usar IP estático'),
('rede', 'endereco_ip', '"192.168.1.100"', 'Endereço IP estático'),
('rede', 'mascara_rede', '"255.255.255.0"', 'Máscara de rede'),
('rede', 'gateway', '"192.168.1.1"', 'Gateway padrão'),
('rede', 'dns_primario', '"8.8.8.8"', 'DNS primário'),
('rede', 'dns_secundario', '"8.8.4.4"', 'DNS secundário'),

-- Configurações de Backup
('backup', 'backup_automatico', 'true', 'Backup automático habilitado'),
('backup', 'frequencia_backup', '"diario"', 'Frequência: diario, semanal, mensal'),
('backup', 'horario_backup', '"02:00"', 'Horário do backup automático'),
('backup', 'local_backup', '"nuvem"', 'Local do backup: local, nuvem, ambos'),
('backup', 'retencao_dias', '30', 'Dias de retenção dos backups'),
('backup', 'comprimir_backup', 'true', 'Comprimir arquivos de backup'),

-- Configurações de Segurança
('seguranca', 'autenticacao_dois_fatores', 'false', 'Autenticação de dois fatores'),
('seguranca', 'tempo_sessao', '480', 'Tempo de sessão em minutos'),
('seguranca', 'bloqueio_tentativas', '5', 'Número de tentativas antes do bloqueio'),
('seguranca', 'log_atividades', 'true', 'Registrar log de atividades'),
('seguranca', 'criptografia_dados', 'true', 'Criptografar dados sensíveis'),
('seguranca', 'nivel_senha', '"media"', 'Nível de segurança da senha: baixa, media, alta'),

-- Configurações de Notificações
('notificacoes', 'notificacoes_habilitadas', 'true', 'Notificações habilitadas'),
('notificacoes', 'notificacao_email', 'true', 'Notificações por email'),
('notificacoes', 'notificacao_sistema', 'true', 'Notificações do sistema'),
('notificacoes', 'notificacao_estoque', 'true', 'Notificações de estoque baixo'),
('notificacoes', 'notificacao_vendas', 'false', 'Notificações de vendas'),
('notificacoes', 'email_admin', '"admin@mariapass.com"', 'Email do administrador'),

-- Configurações de Interface
('interface', 'tema', '"claro"', 'Tema da interface: claro, escuro'),
('interface', 'idioma', '"pt-BR"', 'Idioma da interface'),
('interface', 'tamanho_fonte', '"medio"', 'Tamanho da fonte: pequeno, medio, grande'),
('interface', 'animacoes', 'true', 'Habilitar animações'),
('interface', 'sons_sistema', 'true', 'Sons do sistema habilitados'),
('interface', 'layout_compacto', 'false', 'Layout compacto');
