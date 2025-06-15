
-- Remover políticas existentes
DROP POLICY IF EXISTS "Todos podem visualizar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Todos podem criar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Todos podem editar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Todos podem deletar categorias" ON public.categorias;

-- Criar políticas mais permissivas para permitir acesso sem autenticação
CREATE POLICY "Permitir SELECT para todos" 
  ON public.categorias 
  FOR SELECT 
  USING (true);

CREATE POLICY "Permitir INSERT para todos" 
  ON public.categorias 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para todos" 
  ON public.categorias 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Permitir DELETE para todos" 
  ON public.categorias 
  FOR DELETE 
  USING (true);
