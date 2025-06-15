
-- Criar bucket para armazenar imagens de produtos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('produtos', 'produtos', true);

-- Política para permitir upload de imagens (INSERT)
CREATE POLICY "Allow public uploads to produtos bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'produtos');

-- Política para permitir visualização de imagens (SELECT)
CREATE POLICY "Allow public access to produtos bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'produtos');

-- Política para permitir atualização de imagens (UPDATE)
CREATE POLICY "Allow public updates to produtos bucket" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'produtos');

-- Política para permitir exclusão de imagens (DELETE)
CREATE POLICY "Allow public deletes from produtos bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'produtos');
