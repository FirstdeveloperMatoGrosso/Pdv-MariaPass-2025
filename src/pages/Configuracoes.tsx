
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Monitor,
  Printer,
  Wifi,
  Database,
  Shield,
  Bell,
  Palette,
  Users,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import ScannerConfig from '../components/ScannerConfig';
import BarcodeScanner from '../components/BarcodeScanner';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface SystemConfig {
  nomeEmpresa: string;
  moeda: string;
  timezone: string;
  notificacoes: boolean;
  autoBackup: boolean;
  limiteEstoque: number;
  impressaoAutomatica: boolean;
}

const Configuracoes: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('geral');
  const [config, setConfig] = useState<SystemConfig>({
    nomeEmpresa: 'Sistema de Gestão',
    moeda: 'BRL',
    timezone: 'America/Sao_Paulo',
    notificacoes: true,
    autoBackup: true,
    limiteEstoque: 10,
    impressaoAutomatica: false
  });

  const handleProductScanned = (product: Product) => {
    console.log('Produto escaneado:', product);
    toast.success(`Produto ${product.name} escaneado com sucesso!`);
  };

  const handleSaveConfig = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Settings },
    { id: 'scanner', label: 'Scanner', icon: Monitor },
    { id: 'impressao', label: 'Impressão', icon: Printer },
    { id: 'rede', label: 'Rede', icon: Wifi },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'interface', label: 'Interface', icon: Palette }
  ];

  const TabIcon = tabs.find(tab => tab.id === activeTab)?.icon || Settings;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-gray-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
        </div>
        <Button 
          onClick={handleSaveConfig}
          className="flex items-center space-x-2 w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Configurações</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar de Navegação */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                      activeTab === tab.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm sm:text-base">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Configurações Gerais */}
          {activeTab === 'geral' && (
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Configurações Gerais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
                    <Input
                      value={config.nomeEmpresa}
                      onChange={(e) => setConfig(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Moeda</label>
                    <select 
                      value={config.moeda}
                      onChange={(e) => setConfig(prev => ({ ...prev, moeda: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="BRL">Real (BRL)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuso Horário</label>
                    <select 
                      value={config.timezone}
                      onChange={(e) => setConfig(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                      <option value="America/Manaus">Manaus (UTC-4)</option>
                      <option value="America/Rio_Branco">Rio Branco (UTC-5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Limite Mínimo de Estoque</label>
                    <Input
                      type="number"
                      value={config.limiteEstoque}
                      onChange={(e) => setConfig(prev => ({ ...prev, limiteEstoque: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Habilitar Notificações</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, notificacoes: !prev.notificacoes }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.notificacoes ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.notificacoes ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Backup Automático</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.autoBackup ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scanner */}
          {activeTab === 'scanner' && (
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Scanner de Código de Barras</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-6">
                  <ScannerConfig />
                  <BarcodeScanner onProductScanned={handleProductScanned} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status do Sistema */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center space-x-2">
                <TabIcon className="w-5 h-5" />
                <span>Status do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Banco de Dados</span>
                  <Badge className="bg-green-600">Conectado</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Sistema de Backup</span>
                  <Badge className="bg-green-600">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Scanner</span>
                  <Badge variant="secondary">Configurado</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Impressoras</span>
                  <Badge className="bg-blue-600">3 Ativas</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Terminais</span>
                  <Badge className="bg-green-600">2 Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Última Atualização</span>
                  <Badge variant="outline">Hoje</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
