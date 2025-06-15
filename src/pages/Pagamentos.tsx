
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Settings, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useSystemConfig } from '@/hooks/useSystemConfig';

interface PaymentProvider {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'error';
  apiKey?: string;
  email?: string;
  token?: string;
  webhookUrl: string;
  fees: {
    debit: number;
    credit: number;
    pix: number;
  };
}

const Pagamentos: React.FC = () => {
  const { configs, updateConfig, getConfigValue } = useSystemConfig('pagseguro');
  
  const [providers, setProviders] = useState<PaymentProvider[]>([
    {
      id: 'stone',
      name: 'Stone',
      logo: '🟢',
      status: 'connected',
      apiKey: 'sk_stone_***************',
      webhookUrl: 'https://webhook.stone.com.br/callback',
      fees: { debit: 1.99, credit: 3.99, pix: 0.99 }
    },
    {
      id: 'pagarme',
      name: 'Pagar.me',
      logo: '🔵',
      status: 'disconnected',
      apiKey: '',
      webhookUrl: '',
      fees: { debit: 2.19, credit: 4.19, pix: 1.19 }
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      logo: '🔷',
      status: 'error',
      apiKey: 'TEST-***************',
      webhookUrl: 'https://webhook.mercadopago.com/notifications',
      fees: { debit: 2.39, credit: 4.39, pix: 0.99 }
    },
    {
      id: 'pagseguro',
      name: 'PagSeguro',
      logo: '🟡',
      status: 'disconnected',
      email: getConfigValue('email') || '',
      token: getConfigValue('token') || '',
      webhookUrl: getConfigValue('webhook_url') || '/webhook/pagseguro',
      fees: { 
        debit: 2.79, 
        credit: 4.99, 
        pix: parseFloat(getConfigValue('taxa_pix')) || 1.99 
      }
    }
  ]);

  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  const handleTestConnection = (providerId: string) => {
    toast.info(`Testando conexão com ${providers.find(p => p.id === providerId)?.name}...`);
    
    setTimeout(() => {
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: Math.random() > 0.3 ? 'connected' : 'error' as const }
          : p
      ));
      toast.success('Teste de conexão concluído!');
    }, 2000);
  };

  const handleSaveProvider = async (providerId: string) => {
    if (providerId === 'pagseguro') {
      // Salvar configurações específicas do PagSeguro
      try {
        console.log('💾 Salvando configurações PagSeguro:', formData);
        
        const savePromises = [];
        
        if (formData.email !== undefined && formData.email !== '') {
          console.log('📧 Salvando email:', formData.email);
          savePromises.push(updateConfig('email', formData.email, 'pagseguro'));
        }
        if (formData.token !== undefined && formData.token !== '') {
          console.log('🔑 Salvando token:', formData.token?.substring(0, 10) + '...');
          savePromises.push(updateConfig('token', formData.token, 'pagseguro'));
        }
        if (formData.webhookUrl !== undefined) {
          savePromises.push(updateConfig('webhook_url', formData.webhookUrl, 'pagseguro'));
        }
        if (formData.taxaDebit !== undefined) {
          savePromises.push(updateConfig('taxa_debito', formData.taxaDebit.toString(), 'pagseguro'));
        }
        if (formData.taxaCredit !== undefined) {
          savePromises.push(updateConfig('taxa_credito', formData.taxaCredit.toString(), 'pagseguro'));
        }
        if (formData.taxaPix !== undefined) {
          savePromises.push(updateConfig('taxa_pix', formData.taxaPix.toString(), 'pagseguro'));
        }
        
        await Promise.all(savePromises);
        
        // Atualizar o estado local
        setProviders(prev => prev.map(p => 
          p.id === providerId ? { 
            ...p, 
            email: formData.email || p.email,
            token: formData.token || p.token,
            webhookUrl: formData.webhookUrl || p.webhookUrl,
            status: (formData.email && formData.token) ? 'connected' : 'disconnected'
          } : p
        ));
        
        console.log('✅ Todas as configurações do PagSeguro salvas!');
        toast.success('Configurações do PagSeguro salvas com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao salvar configurações do PagSeguro:', error);
        toast.error('Erro ao salvar configurações do PagSeguro');
      }
    } else {
      // Lógica para outros provedores
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, ...formData } : p
      ));
      toast.success('Configurações salvas com sucesso!');
    }
    
    setEditingProvider(null);
    setFormData({});
  };

  const startEditing = (provider: PaymentProvider) => {
    setEditingProvider(provider.id);
    setFormData({
      email: provider.email || '',
      token: provider.token || '',
      apiKey: provider.apiKey || '',
      webhookUrl: provider.webhookUrl || '',
      taxaDebit: provider.fees.debit,
      taxaCredit: provider.fees.credit,
      taxaPix: provider.fees.pix
    });
  };

  return (
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <CreditCard className="w-5 h-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Integrações de Pagamento</h1>
        </div>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="flex items-center space-x-1 text-sm sm:text-base">
            <Wifi className="w-4 h-4" />
            <span>Status das Integrações</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {providers.map(provider => (
              <div key={provider.id} className="text-center">
                <div className="text-lg sm:text-xl mb-1">{provider.logo}</div>
                <div className="font-medium text-xs sm:text-sm">{provider.name}</div>
                <div className="flex items-center justify-center mt-1">
                  {getStatusIcon(provider.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Detalhadas */}
      <div className="grid gap-2 sm:gap-3">
        {providers.map(provider => (
          <Card key={provider.id}>
            <CardHeader className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl">{provider.logo}</span>
                  <div>
                    <CardTitle className="text-sm sm:text-base">{provider.name}</CardTitle>
                    <div className="flex items-center space-x-1 mt-1">
                      {getStatusBadge(provider.status)}
                      {getStatusIcon(provider.status)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConnection(provider.id)}
                    className="h-8 text-xs px-2"
                  >
                    Testar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEditing(provider)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 pt-0">
              {editingProvider === provider.id ? (
                <div className="space-y-2">
                  {provider.id === 'pagseguro' ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1">Email</label>
                        <Input 
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Insira o email da conta PagSeguro"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Token</label>
                        <Input 
                          type="password"
                          value={formData.token}
                          onChange={(e) => setFormData({...formData, token: e.target.value})}
                          placeholder="Insira o token do PagSeguro"
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium mb-1">API Key</label>
                      <Input 
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                        placeholder="Insira a API Key"
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Webhook URL</label>
                    <Input 
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
                      placeholder="URL do webhook para notificações"
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Taxa Débito (%)</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.taxaDebit}
                        onChange={(e) => setFormData({...formData, taxaDebit: parseFloat(e.target.value)})}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Taxa Crédito (%)</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.taxaCredit}
                        onChange={(e) => setFormData({...formData, taxaCredit: parseFloat(e.target.value)})}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Taxa PIX (%)</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.taxaPix}
                        onChange={(e) => setFormData({...formData, taxaPix: parseFloat(e.target.value)})}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button onClick={() => handleSaveProvider(provider.id)} className="h-8 text-xs px-3">
                      Salvar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingProvider(null)}
                      className="h-8 text-xs px-3"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {provider.id === 'pagseguro' ? (
                      <>
                        <div>
                          <span className="text-xs text-gray-500">Email:</span>
                          <code className="block bg-gray-100 px-1 py-1 rounded text-xs mt-1">
                            {provider.email || 'Não configurado'}
                          </code>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Token:</span>
                          <code className="block bg-gray-100 px-1 py-1 rounded text-xs mt-1">
                            {provider.token ? '***' + provider.token.slice(-4) : 'Não configurado'}
                          </code>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="text-xs text-gray-500">API Key:</span>
                        <code className="block bg-gray-100 px-1 py-1 rounded text-xs mt-1">
                          {provider.apiKey || 'Não configurado'}
                        </code>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Webhook:</span>
                      <code className="block bg-gray-100 px-1 py-1 rounded text-xs mt-1">
                        {provider.webhookUrl || 'Não configurado'}
                      </code>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Taxas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">Débito: {provider.fees.debit}%</Badge>
                      <Badge variant="outline" className="text-xs">Crédito: {provider.fees.credit}%</Badge>
                      <Badge variant="outline" className="text-xs">PIX: {provider.fees.pix}%</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pagamentos;
