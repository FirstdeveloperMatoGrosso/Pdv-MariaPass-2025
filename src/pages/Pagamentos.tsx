
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

interface PaymentProvider {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'error';
  apiKey: string;
  webhookUrl: string;
  fees: {
    debit: number;
    credit: number;
    pix: number;
  };
}

const Pagamentos: React.FC = () => {
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
      apiKey: '',
      webhookUrl: '',
      fees: { debit: 2.79, credit: 4.99, pix: 1.99 }
    }
  ]);

  const [editingProvider, setEditingProvider] = useState<string | null>(null);

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
    // Simular teste de conexão
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

  const handleSaveProvider = (providerId: string, data: Partial<PaymentProvider>) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, ...data } : p
    ));
    setEditingProvider(null);
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Integrações de Pagamento</h1>
        </div>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="w-5 h-5" />
            <span>Status das Integrações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {providers.map(provider => (
              <div key={provider.id} className="text-center">
                <div className="text-2xl mb-2">{provider.logo}</div>
                <div className="font-medium">{provider.name}</div>
                <div className="flex items-center justify-center mt-1">
                  {getStatusIcon(provider.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Detalhadas */}
      <div className="grid gap-6">
        {providers.map(provider => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{provider.logo}</span>
                  <div>
                    <CardTitle>{provider.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(provider.status)}
                      {getStatusIcon(provider.status)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConnection(provider.id)}
                  >
                    Testar Conexão
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingProvider(provider.id)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingProvider === provider.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <Input 
                      type="password"
                      defaultValue={provider.apiKey}
                      placeholder="Insira a API Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Webhook URL</label>
                    <Input 
                      defaultValue={provider.webhookUrl}
                      placeholder="URL do webhook para notificações"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Taxa Débito (%)</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        defaultValue={provider.fees.debit}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Taxa Crédito (%)</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        defaultValue={provider.fees.credit}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Taxa PIX (%)</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        defaultValue={provider.fees.pix}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleSaveProvider(provider.id, {})}>
                      Salvar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingProvider(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">API Key:</span>
                      <code className="block bg-gray-100 px-2 py-1 rounded text-xs mt-1">
                        {provider.apiKey || 'Não configurado'}
                      </code>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Webhook:</span>
                      <code className="block bg-gray-100 px-2 py-1 rounded text-xs mt-1">
                        {provider.webhookUrl || 'Não configurado'}
                      </code>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Taxas:</span>
                    <div className="flex space-x-4 mt-1">
                      <Badge variant="outline">Débito: {provider.fees.debit}%</Badge>
                      <Badge variant="outline">Crédito: {provider.fees.credit}%</Badge>
                      <Badge variant="outline">PIX: {provider.fees.pix}%</Badge>
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
