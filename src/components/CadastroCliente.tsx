import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, Mail, FileText, Home, MapPin, Phone, Building, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Cliente, NovoCliente } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CadastroClienteProps {
  clienteId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Cliente | null;
}

const CadastroCliente: React.FC<CadastroClienteProps> = ({ 
  clienteId, 
  onSuccess, 
  onCancel,
  initialData
}) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!clienteId);
  
  const [formData, setFormData] = useState<Omit<NovoCliente, 'id' | 'data_cadastro'>>({
    nome: '',
    email: '',
    documento: '',
    telefone: '',
    tipo: 'PF',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: ''
    },
    ativo: true
  });

  // Carregar dados do cliente se estiver editando
  useEffect(() => {
    if (clienteId && !initialData) {
      carregarCliente();
    } else if (initialData) {
      setFormData({
        nome: initialData.nome,
        email: initialData.email || '',
        documento: initialData.documento,
        telefone: initialData.telefone || '',
        tipo: initialData.tipo,
        endereco: initialData.endereco || {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: ''
        },
        ativo: initialData.ativo
      });
    }
  }, [clienteId, initialData]);

  const carregarCliente = async () => {
    if (!clienteId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setFormData({
          nome: data.nome,
          email: data.email || '',
          documento: data.documento,
          telefone: data.telefone || '',
          tipo: data.tipo,
          endereco: data.endereco || {
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            uf: ''
          },
          ativo: data.ativo
        });
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name.startsWith('endereco.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...(prev.endereco || {}),
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: {
            ...(prev.endereco || {}),
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || ''
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Verifique o número e tente novamente.');
    }
  };

  const formatarDocumento = (documento: string, tipo: 'PF' | 'PJ') => {
    // Remove todos os caracteres não numéricos
    const numeros = documento.replace(/[^0-9]/g, '');
    
    if (tipo === 'PF') {
      // Formatar CPF: 000.000.000-00
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // Formatar CNPJ: 00.000.000/0000-00
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    
    if (numeros.length <= 10) {
      // Formato: (00) 0000-0000
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Formato: (00) 00000-0000
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{4})/, '$1-$2');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.documento) {
      toast.error('Nome e documento são campos obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      
      const dadosCliente: NovoCliente = {
        ...formData,
        documento: formData.documento.replace(/\D/g, ''), // Remove formatação
        telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
        endereco: formData.endereco?.cep ? formData.endereco : null
      };
      
      if (clienteId) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update(dadosCliente)
          .eq('id', clienteId);
          
        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('clientes')
          .insert([dadosCliente]);
          
        if (error) throw error;
        toast.success('Cliente cadastrado com sucesso!');
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="w-6 h-6" />
          {isEditing ? 'Editar Cliente' : 'Novo Cliente/Empresa'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados Pessoais
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tipo"
                      value="PF"
                      checked={formData.tipo === 'PF'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>Pessoa Física</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tipo"
                      value="PJ"
                      checked={formData.tipo === 'PJ'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>Pessoa Jurídica</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nome">
                  {formData.tipo === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder={formData.tipo === 'PF' ? 'Nome completo' : 'Razão Social'}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documento">
                  {formData.tipo === 'PF' ? 'CPF *' : 'CNPJ *'}
                </Label>
                <Input
                  id="documento"
                  name="documento"
                  value={formData.documento}
                  onChange={(e) => {
                    const value = e.target.value;
                    const formatted = formData.tipo === 'PF'
                      ? value.replace(/\D/g, '')
                          .replace(/(\d{3})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                          .replace(/(\-\d{2})\d+?$/, '$1')
                          .substring(0, 14)
                      : value.replace(/\D/g, '')
                          .replace(/^(\d{2})(\d{3})/, '$1.$2')
                          .replace(/(\d{3})(\d{3})/, '.$1/$2')
                          .replace(/(\d{4})(\d{1,2})/, '$1-$2')
                          .substring(0, 18);
                    
                    setFormData(prev => ({
                      ...prev,
                      documento: formatted
                    }));
                  }}
                  placeholder={formData.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={(e) => {
                    const value = e.target.value;
                    const formatted = value
                      .replace(/\D/g, '')
                      .replace(/(\d{2})(\d)/, '($1) $2')
                      .replace(/(\d{5})(\d{4})(\d{0,1})/, '$1-$2');
                    
                    setFormData(prev => ({
                      ...prev,
                      telefone: formatted.substring(0, 15)
                    }));
                  }}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="pt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ativo: e.target.checked
                    }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Cliente ativo</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Endereço
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco.cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="endereco.cep"
                      name="endereco.cep"
                      value={formData.endereco?.cep || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').substring(0, 8);
                        const formatted = value.replace(/^(\d{5})(\d{1,3})/, '$1-$2');
                        
                        setFormData(prev => ({
                          ...prev,
                          endereco: {
                            ...(prev.endereco || {}),
                            cep: formatted
                          }
                        }));
                        
                        if (value.length === 8) {
                          buscarCep(value);
                        }
                      }}
                      placeholder="00000-000"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => formData.endereco?.cep && buscarCep(formData.endereco.cep)}
                      disabled={!formData.endereco?.cep || formData.endereco.cep.replace(/\D/g, '').length < 8}
                    >
                      Buscar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endereco.logradouro">Logradouro</Label>
                  <Input
                    id="endereco.logradouro"
                    name="endereco.logradouro"
                    value={formData.endereco?.logradouro || ''}
                    onChange={handleChange}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco.numero">Número</Label>
                    <Input
                      id="endereco.numero"
                      name="endereco.numero"
                      value={formData.endereco?.numero || ''}
                      onChange={handleChange}
                      placeholder="Nº"
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="endereco.complemento">Complemento</Label>
                    <Input
                      id="endereco.complemento"
                      name="endereco.complemento"
                      value={formData.endereco?.complemento || ''}
                      onChange={handleChange}
                      placeholder="Apto, Bloco, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endereco.bairro">Bairro</Label>
                  <Input
                    id="endereco.bairro"
                    name="endereco.bairro"
                    value={formData.endereco?.bairro || ''}
                    onChange={handleChange}
                    placeholder="Bairro"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco.cidade">Cidade</Label>
                    <Input
                      id="endereco.cidade"
                      name="endereco.cidade"
                      value={formData.endereco?.cidade || ''}
                      onChange={handleChange}
                      placeholder="Cidade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endereco.uf">UF</Label>
                    <Input
                      id="endereco.uf"
                      name="endereco.uf"
                      value={formData.endereco?.uf || ''}
                      onChange={handleChange}
                      placeholder="UF"
                      maxLength={2}
                      className="uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CadastroCliente;
