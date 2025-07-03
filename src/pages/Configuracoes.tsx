
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
import PrintConfig from '../components/config/PrintConfig';
import NetworkConfig from '../components/config/NetworkConfig';
import BackupConfig from '../components/config/BackupConfig';
import SecurityConfig from '../components/config/SecurityConfig';
import NotificationConfig from '../components/config/NotificationConfig';
import InterfaceConfig from '../components/config/InterfaceConfig';

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

interface ScannerConfigType {
  autoScan: boolean;
  soundEnabled: boolean;
  scanDelay: number;
  duplicateFilter: boolean;
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

  const [scannerConfig, setScannerConfig] = useState<ScannerConfigType>({
    autoScan: false,
    soundEnabled: true,
    scanDelay: 1000,
    duplicateFilter: true
  });

  const handleProductScanned = (product: Product) => {
    console.log('Produto escaneado:', product);
    toast.success(`Produto ${product.name} escaneado com sucesso!`);
  };

  const handleSaveConfig = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleScannerConfigChange = (newConfig: ScannerConfigType) => {
    setScannerConfig(newConfig);
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
    <div className="pl-4 pr-4 sm:pl-6 sm:pr-6 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Configurações do Sistema</h1>
        </div>
        <Button 
          onClick={handleSaveConfig}
          className="flex items-center space-x-2 w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Configurações</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sidebar de Navegação */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-3">
            <CardTitle className="text-base">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                      activeTab === tab.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          {/* Configurações Gerais */}
          {activeTab === 'geral' && (
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Settings className="w-4 h-4" />
                  <span>Configurações Gerais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
                    <Input
                      value={config.nomeEmpresa}
                      onChange={(e) => setConfig(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Moeda</label>
                    <select 
                      value={config.moeda}
                      onChange={(e) => setConfig(prev => ({ ...prev, moeda: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="BRL">Real (BRL)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fuso Horário</label>
                    <select 
                      value={config.timezone}
                      onChange={(e) => setConfig(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                      <option value="America/Manaus">Manaus (UTC-4)</option>
                      <option value="America/Rio_Branco">Rio Branco (UTC-5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Limite Mínimo de Estoque</label>
                    <Input
                      type="number"
                      value={config.limiteEstoque}
                      onChange={(e) => setConfig(prev => ({ ...prev, limiteEstoque: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Habilitar Notificações</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, notificacoes: !prev.notificacoes }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors text-xs ${
                        config.notificacoes ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          config.notificacoes ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backup Automático</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors text-xs ${
                        config.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          config.autoBackup ? 'translate-x-5' : 'translate-x-1'
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
              <CardHeader className="p-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Monitor className="w-4 h-4" />
                  <span>Scanner de Código de Barras</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-4">
                  <ScannerConfig 
                    config={scannerConfig}
                    onConfigChange={handleScannerConfigChange}
                  />
                  <BarcodeScanner onProductScanned={handleProductScanned} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impressão */}
          {activeTab === 'impressao' && <PrintConfig />}

          {/* Rede */}
          {activeTab === 'rede' && <NetworkConfig />}

          {/* Backup */}
          {activeTab === 'backup' && <BackupConfig />}

          {/* Segurança */}
          {activeTab === 'seguranca' && <SecurityConfig />}

          {/* Notificações */}
          {activeTab === 'notificacoes' && <NotificationConfig />}

          {/* Interface */}
          {activeTab === 'interface' && <InterfaceConfig />}

          {/* Status do Sistema */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <TabIcon className="w-4 h-4" />
                <span>Status do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Banco de Dados</span>
                  <Badge className="bg-green-600 text-xs">Conectado</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Sistema de Backup</span>
                  <Badge className="bg-green-600 text-xs">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Scanner</span>
                  <Badge variant="secondary" className="text-xs">Configurado</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Impressoras</span>
                  <Badge className="bg-blue-600 text-xs">3 Ativas</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Terminais</span>
                  <Badge className="bg-green-600 text-xs">2 Online</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium">Última Atualização</span>
                  <Badge variant="outline" className="text-xs">Hoje</Badge>
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
