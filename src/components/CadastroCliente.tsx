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
    } else if (name === 'documento') {
      // Para o campo documento, apenas aceita números e não formata
      const numeros = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numeros
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserIcon className="w-5 h-5" />
          {isEditing ? 'Editar Cliente' : 'Novo Cliente/Empresa'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h3 className="text-base font-medium flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-primary" />
                Dados Pessoais
              </h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="tipo" className="text-xs font-medium text-gray-700">Tipo *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tipo"
                      value="PF"
                      checked={formData.tipo === 'PF'}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 text-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs">Pessoa Física</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tipo"
                      value="PJ"
                      checked={formData.tipo === 'PJ'}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 text-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs">Pessoa Jurídica</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-medium text-gray-700">
                  {formData.tipo === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="text-xs h-8"
                  placeholder={formData.tipo === 'PF' ? 'Nome completo' : 'Razão Social'}
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="documento" className="text-xs font-medium text-gray-700">
                  {formData.tipo === 'PF' ? 'CPF *' : 'CNPJ *'}
                </Label>
                <Input
                  id="documento"
                  name="documento"
                  type="text"
                  inputMode="numeric"
                  value={formData.documento}
                  onChange={handleChange}
                  className="text-xs h-8"
                  placeholder={formData.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  maxLength={formData.tipo === 'PF' ? 14 : 18}
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-gray-700">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="text-xs h-8"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs font-medium text-gray-700">Telefone</Label>
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
                  className="text-xs h-8"
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="pt-1">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ativo: e.target.checked
                    }))}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-gray-700">Cliente ativo</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-base font-medium flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-primary" />
                Endereço
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="endereco.cep" className="text-xs font-medium text-gray-700">CEP</Label>
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
                      className="h-8 text-xs"
                      onClick={() => formData.endereco?.cep && buscarCep(formData.endereco.cep)}
                      disabled={!formData.endereco?.cep || formData.endereco.cep.replace(/\D/g, '').length < 8}
                    >
                      Buscar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="endereco.logradouro" className="text-xs font-medium text-gray-700">Logradouro</Label>
                  <Input
                    id="endereco.logradouro"
                    name="endereco.logradouro"
                    value={formData.endereco?.logradouro || ''}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="endereco.numero" className="text-xs font-medium text-gray-700">Número</Label>
                    <Input
                      id="endereco.numero"
                      name="endereco.numero"
                      value={formData.endereco?.numero || ''}
                      onChange={handleChange}
                      className="text-xs h-8"
                      placeholder="Nº"
                    />
                  </div>
                  
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="endereco.complemento" className="text-xs font-medium text-gray-700">Complemento</Label>
                    <Input
                      id="endereco.complemento"
                      name="endereco.complemento"
                      value={formData.endereco?.complemento || ''}
                      onChange={handleChange}
                      className="text-xs h-8"
                      placeholder="Apto, Bloco, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="endereco.bairro" className="text-xs font-medium text-gray-700">Bairro</Label>
                  <Input
                    id="endereco.bairro"
                    name="endereco.bairro"
                    value={formData.endereco?.bairro || ''}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="Bairro"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="endereco.cidade" className="text-xs font-medium text-gray-700">Cidade</Label>
                    <Input
                      id="endereco.cidade"
                      name="endereco.cidade"
                      value={formData.endereco?.cidade || ''}
                      onChange={handleChange}
                      className="text-xs h-8"
                      placeholder="Cidade"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="endereco.uf" className="text-xs font-medium text-gray-700">UF</Label>
                    <Input
                      id="endereco.uf"
                      name="endereco.uf"
                      value={formData.endereco?.uf || ''}
                      onChange={handleChange}
                      className="text-xs h-8 uppercase"
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="h-9 text-xs"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CadastroCliente;
