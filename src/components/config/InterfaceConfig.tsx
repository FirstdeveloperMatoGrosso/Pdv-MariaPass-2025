
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Palette } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const InterfaceConfig: React.FC = () => {
  const { configs, loading, updateConfig, getConfigValue } = useSystemConfig('interface');

  if (loading) {
    return <div className="animate-pulse">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="w-5 h-5" />
          <span>Configurações de Interface</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tema">Tema</Label>
            <select 
              id="tema"
              value={getConfigValue('tema') || 'claro'}
              onChange={(e) => updateConfig('tema', e.target.value, 'interface')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="claro">Claro</option>
              <option value="escuro">Escuro</option>
            </select>
          </div>
          <div>
            <Label htmlFor="idioma">Idioma</Label>
            <select 
              id="idioma"
              value={getConfigValue('idioma') || 'pt-BR'}
              onChange={(e) => updateConfig('idioma', e.target.value, 'interface')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
          <div>
            <Label htmlFor="fonte">Tamanho da Fonte</Label>
            <select 
              id="fonte"
              value={getConfigValue('tamanho_fonte') || 'medio'}
              onChange={(e) => updateConfig('tamanho_fonte', e.target.value, 'interface')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="pequeno">Pequeno</option>
              <option value="medio">Médio</option>
              <option value="grande">Grande</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="animacoes">Animações</Label>
            <Switch
              id="animacoes"
              checked={getConfigValue('animacoes') || false}
              onCheckedChange={(checked) => updateConfig('animacoes', checked, 'interface')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sons">Sons do Sistema</Label>
            <Switch
              id="sons"
              checked={getConfigValue('sons_sistema') || false}
              onCheckedChange={(checked) => updateConfig('sons_sistema', checked, 'interface')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="layout">Layout Compacto</Label>
            <Switch
              id="layout"
              checked={getConfigValue('layout_compacto') || false}
              onCheckedChange={(checked) => updateConfig('layout_compacto', checked, 'interface')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterfaceConfig;
