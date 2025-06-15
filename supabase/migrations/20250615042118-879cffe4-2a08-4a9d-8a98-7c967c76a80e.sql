
-- Criar tabela de categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela categorias
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir SELECT para todos os usuários autenticados
CREATE POLICY "Todos podem visualizar categorias" 
  ON public.categorias 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Criar política para permitir INSERT para todos os usuários autenticados
CREATE POLICY "Todos podem criar categorias" 
  ON public.categorias 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Criar política para permitir UPDATE para todos os usuários autenticados
CREATE POLICY "Todos podem editar categorias" 
  ON public.categorias 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Criar política para permitir DELETE para todos os usuários autenticados
CREATE POLICY "Todos podem deletar categorias" 
  ON public.categorias 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Inserir algumas categorias padrão
INSERT INTO public.categorias (nome, descricao) VALUES 
('Bebidas', 'Refrigerantes, sucos, águas e outras bebidas'),
('Salgados', 'Coxinhas, pastéis, esfirras e outros salgados'),
('Sanduíches', 'Hambúrguers, hot dogs e sanduíches diversos'),
('Doces', 'Brigadeiros, tortas, bolos e sobremesas'),
('Outros', 'Produtos diversos não categorizados');
