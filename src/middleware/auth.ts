import { Request, Response, NextFunction } from 'express';
import { supabase } from '@/lib/supabase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verifica o token de autorização no cabeçalho
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    // Remove o prefixo 'Bearer ' do token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação inválido' });
    }

    // Verifica o token com o Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Adiciona o usuário ao objeto de requisição para uso posterior
    (req as any).user = user;
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro ao processar autenticação' });
  }
};
