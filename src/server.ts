import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import clientesRouter from './routes/api/clientes';
import { supabase } from './lib/supabase';
import { requireAuth } from './middleware/auth';

// Carrega as variáveis de ambiente
console.log('Variáveis de ambiente carregadas:');
console.log('SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '*** Configurado ***' : 'Não configurado');
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://seu-dominio.com' 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Retorna os dados da sessão
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(400).json({ 
      error: error.message || 'Erro ao fazer login' 
    });
  }
});

// Rota de logout
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// Rota para verificar a sessão
app.get('/api/auth/session', requireAuth, async (req, res) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    res.json({ user });
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    res.status(500).json({ error: 'Erro ao verificar sessão' });
  }
});

// Rotas da API protegidas
app.use('/api/clientes', requireAuth, clientesRouter);

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});

// Exporta o app para testes
export default app;
