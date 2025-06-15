
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Wifi } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const NetworkConfig: React.FC = () => {
  const { configs, loading, updateConfig, getConfigValue } = useSystemConfig('rede');

  if (loading) {
    return <div className="animate-pulse">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wifi className="w-5 h-5" />
          <span>Configurações de Rede</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="wifi">WiFi Habilitado</Label>
          <Switch
            id="wifi"
            checked={getConfigValue('wifi_habilitado') || false}
            onCheckedChange={(checked) => updateConfig('wifi_habilitado', checked, 'rede')}
          />
        </div>
        <div>
          <Label htmlFor="nome-rede">Nome da Rede</Label>
          <Input
            id="nome-rede"
            value={getConfigValue('nome_rede') || ''}
            onChange={(e) => updateConfig('nome_rede', e.target.value, 'rede')}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ip-estatico">IP Estático</Label>
          <Switch
            id="ip-estatico"
            checked={getConfigValue('ip_estatico') || false}
            onCheckedChange={(checked) => updateConfig('ip_estatico', checked, 'rede')}
          />
        </div>
        {getConfigValue('ip_estatico') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endereco-ip">Endereço IP</Label>
              <Input
                id="endereco-ip"
                value={getConfigValue('endereco_ip') || ''}
                onChange={(e) => updateConfig('endereco_ip', e.target.value, 'rede')}
              />
            </div>
            <div>
              <Label htmlFor="mascara">Máscara de Rede</Label>
              <Input
                id="mascara"
                value={getConfigValue('mascara_rede') || ''}
                onChange={(e) => updateConfig('mascara_rede', e.target.value, 'rede')}
              />
            </div>
            <div>
              <Label htmlFor="gateway">Gateway</Label>
              <Input
                id="gateway"
                value={getConfigValue('gateway') || ''}
                onChange={(e) => updateConfig('gateway', e.target.value, 'rede')}
              />
            </div>
            <div>
              <Label htmlFor="dns-primario">DNS Primário</Label>
              <Input
                id="dns-primario"
                value={getConfigValue('dns_primario') || ''}
                onChange={(e) => updateConfig('dns_primario', e.target.value, 'rede')}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkConfig;
