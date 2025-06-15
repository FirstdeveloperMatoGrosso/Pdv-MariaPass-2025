
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Shield, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Recurso {
  id: string;
  nome: string;
  descricao: string;
  rota: string;
  categoria: string;
  icone?: string;
  ativo: boolean;
}

interface PermissaoAcesso {
  id: string;
  tipo_usuario: string;
  recurso_id: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
}

interface Permissao {
  recurso_id: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
}

const CriarUsuarioModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState<string>('');
  const [permissoes, setPermissoes] = useState<Record<string, Permissao>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar recursos do sistema
  const { data: recursos = [] } = useQuery({
    queryKey: ['recursos_sistema'],
    queryFn: async (): Promise<Recurso[]> => {
      const { data, error } = await (supabase as any)
        .from('recursos_sistema')
        .select('*')
        .eq('ativo', true)
        .order('categoria', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar permissões padrão por tipo
  const { data: permissoesPadrao = [] } = useQuery({
    queryKey: ['permissoes_padrao', tipoAcesso],
    queryFn: async (): Promise<PermissaoAcesso[]> => {
      if (!tipoAcesso) return [];
      
      const { data, error } = await (supabase as any)
        .from('permissoes_acesso')
        .select('*')
        .eq('tipo_usuario', tipoAcesso);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tipoAcesso,
  });

  // Atualizar permissões quando tipo de acesso muda
  React.useEffect(() => {
    if (permissoesPadrao.length > 0) {
      const novasPermissoes: Record<string, Permissao> = {};
      permissoesPadrao.forEach(p => {
        novasPermissoes[p.recurso_id] = {
          recurso_id: p.recurso_id,
          pode_visualizar: p.pode_visualizar,
          pode_criar: p.pode_criar,
          pode_editar: p.pode_editar,
          pode_deletar: p.pode_deletar,
        };
      });
      setPermissoes(novasPermissoes);
    }
  }, [permissoesPadrao]);

  // Criar usuário
  const criarUsuarioMutation = useMutation({
    mutationFn: async () => {
      // Simular hash da senha (em produção, isso seria feito no backend)
      const senhaHash = `$2b$10$${btoa(senha).slice(0, 53)}`;
      
      const { data, error } = await (supabase as any)
        .from('usuarios')
        .insert({
          nome,
          email,
          senha_hash: senhaHash,
          tipo_acesso: tipoAcesso,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar ação no controle de acesso
      await (supabase as any).from('controle_acesso').insert({
        usuario: 'Admin',
        acao: 'criar',
        recurso: 'usuario',
        sucesso: true,
        detalhes: { usuario_criado: email, tipo_acesso: tipoAcesso },
      });

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso",
        description: `${nome} foi adicionado ao sistema`,
      });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setTipoAcesso('');
    setPermissoes({});
  };

  const handlePermissaoChange = (recursoId: string, tipo: keyof Omit<Permissao, 'recurso_id'>, valor: boolean) => {
    setPermissoes(prev => ({
      ...prev,
      [recursoId]: {
        ...prev[recursoId],
        recurso_id: recursoId,
        [tipo]: valor,
      },
    }));
  };

  const tiposAcesso = [
    { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: 'gerente', label: 'Gerente', description: 'Acesso gerencial completo' },
    { value: 'operador', label: 'Operador', description: 'Acesso às operações básicas' },
    { value: 'visualizador', label: 'Visualizador', description: 'Apenas visualização' },
  ];

  const categorias = [...new Set(recursos.map(r => r.categoria))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Criar Usuário</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Criar Novo Usuário</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite uma senha segura"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Acesso</Label>
              <Select value={tipoAcesso} onValueChange={setTipoAcesso}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de acesso" />
                </SelectTrigger>
                <SelectContent>
                  {tiposAcesso.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div>
                        <div className="font-medium">{tipo.label}</div>
                        <div className="text-xs text-gray-500">{tipo.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissões personalizadas */}
          {tipoAcesso && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permissões de Acesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorias.map(categoria => {
                    const recursosCategoria = recursos.filter(r => r.categoria === categoria);
                    return (
                      <div key={categoria}>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">{categoria}</h4>
                        <div className="space-y-2">
                          {recursosCategoria.map(recurso => {
                            const permissao = permissoes[recurso.id] || {
                              recurso_id: recurso.id,
                              pode_visualizar: false,
                              pode_criar: false,
                              pode_editar: false,
                              pode_deletar: false,
                            };

                            return (
                              <div key={recurso.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">{recurso.nome}</div>
                                  <div className="text-xs text-gray-500">{recurso.descricao}</div>
                                </div>
                                <div className="flex space-x-3">
                                  <div className="flex items-center space-x-1">
                                    <Checkbox
                                      checked={permissao.pode_visualizar}
                                      onCheckedChange={(checked) => 
                                        handlePermissaoChange(recurso.id, 'pode_visualizar', !!checked)
                                      }
                                    />
                                    <Eye className="w-3 h-3 text-blue-500" />
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Checkbox
                                      checked={permissao.pode_criar}
                                      onCheckedChange={(checked) => 
                                        handlePermissaoChange(recurso.id, 'pode_criar', !!checked)
                                      }
                                    />
                                    <Plus className="w-3 h-3 text-green-500" />
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Checkbox
                                      checked={permissao.pode_editar}
                                      onCheckedChange={(checked) => 
                                        handlePermissaoChange(recurso.id, 'pode_editar', !!checked)
                                      }
                                    />
                                    <Edit className="w-3 h-3 text-yellow-500" />
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Checkbox
                                      checked={permissao.pode_deletar}
                                      onCheckedChange={(checked) => 
                                        handlePermissaoChange(recurso.id, 'pode_deletar', !!checked)
                                      }
                                    />
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => criarUsuarioMutation.mutate()}
              disabled={!nome || !email || !senha || !tipoAcesso || criarUsuarioMutation.isPending}
            >
              {criarUsuarioMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CriarUsuarioModal;
