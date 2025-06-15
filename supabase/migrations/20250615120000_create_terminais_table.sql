
-- Criar tabela terminais se não existir
CREATE TABLE IF NOT EXISTS terminais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  localizacao VARCHAR(255) NOT NULL,
  endereco_ip VARCHAR(15) NOT NULL,
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'manutencao')),
  ultima_conexao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  versao VARCHAR(20) DEFAULT '1.0.0',
  tempo_atividade VARCHAR(50) DEFAULT '0h 0m',
  vendas_totais INTEGER DEFAULT 0,
  vendas_hoje INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados de exemplo para teste
INSERT INTO terminais (nome, localizacao, endereco_ip, status, versao, tempo_atividade, vendas_totais, vendas_hoje) VALUES
('Terminal Principal', 'Loja Centro', '192.168.1.10', 'online', '2.1.5', '8h 30m', 1250, 35),
('Terminal Caixa 01', 'Setor A', '192.168.1.11', 'online', '2.1.5', '8h 15m', 980, 28),
('Terminal Caixa 02', 'Setor A', '192.168.1.12', 'offline', '2.1.4', '0h 0m', 750, 0),
('Terminal Self-Service', 'Hall Principal', '192.168.1.15', 'online', '2.1.5', '7h 45m', 520, 18),
('Terminal Backup', 'Almoxarifado', '192.168.1.20', 'manutencao', '2.0.8', '0h 0m', 125, 0),
('Terminal Mobile 01', 'Área Externa', '192.168.1.25', 'online', '2.1.3', '4h 20m', 340, 12),
('Terminal Balcão', 'Atendimento', '192.168.1.30', 'online', '2.1.5', '8h 00m', 890, 22),
('Terminal Drive-Thru', 'Área Externa', '192.168.1.35', 'offline', '2.1.2', '0h 0m', 445, 0)
ON CONFLICT (id) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_terminais_status ON terminais(status);
CREATE INDEX IF NOT EXISTS idx_terminais_localizacao ON terminais(localizacao);
CREATE INDEX IF NOT EXISTS idx_terminais_endereco_ip ON terminais(endereco_ip);

-- Habilitar RLS (Row Level Security)
ALTER TABLE terminais ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura e escrita (ajuste conforme suas necessidades de segurança)
CREATE POLICY IF NOT EXISTS "Permitir acesso completo aos terminais" ON terminais
FOR ALL USING (true);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_terminais_updated_at ON terminais;
CREATE TRIGGER update_terminais_updated_at
  BEFORE UPDATE ON terminais
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela e colunas para documentação
COMMENT ON TABLE terminais IS 'Tabela para controle e monitoramento de terminais do sistema';
COMMENT ON COLUMN terminais.nome IS 'Nome identificador do terminal';
COMMENT ON COLUMN terminais.localizacao IS 'Local físico onde o terminal está instalado';
COMMENT ON COLUMN terminais.endereco_ip IS 'Endereço IP do terminal na rede';
COMMENT ON COLUMN terminais.status IS 'Status atual do terminal: online, offline ou manutencao';
COMMENT ON COLUMN terminais.ultima_conexao IS 'Data e hora da última conexão do terminal';
COMMENT ON COLUMN terminais.versao IS 'Versão do software instalado no terminal';
COMMENT ON COLUMN terminais.tempo_atividade IS 'Tempo que o terminal está ativo desde a última inicialização';
COMMENT ON COLUMN terminais.vendas_totais IS 'Total de vendas realizadas pelo terminal';
COMMENT ON COLUMN terminais.vendas_hoje IS 'Vendas realizadas hoje pelo terminal';
