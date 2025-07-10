import { supabase } from '@/lib/supabase';
import { Router } from 'express';

const router = Router();

// Rota para listar clientes
router.get('/', async (req, res) => {
  try {
    // Verifica autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// Rota para criar um novo cliente
router.post('/', async (req, res) => {
  try {
    // Verifica autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const clienteData = req.body;
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        ...clienteData,
        criado_por: session.user.id
      }])
      .select();

    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

export default router;
