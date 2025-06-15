
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const SecurityConfig: React.FC = () => {
  const { configs, loading, updateConfig, getConfigValue } = useSystemConfig('seguranca');

  if (loading) {
    return <div className="animate-pulse">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Configurações de Segurança</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="2fa">Autenticação de Dois Fatores</Label>
          <Switch
            id="2fa"
            checked={getConfigValue('autenticacao_dois_fatores') || false}
            onCheckedChange={(checked) => updateConfig('autenticacao_dois_fatores', checked, 'seguranca')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tempo-sessao">Tempo de Sessão (minutos)</Label>
            <Input
              id="tempo-sessao"
              type="number"
              min="1"
              value={getConfigValue('tempo_sessao') || 480}
              onChange={(e) => updateConfig('tempo_sessao', parseInt(e.target.value), 'seguranca')}
            />
          </div>
          <div>
            <Label htmlFor="tentativas">Tentativas Antes do Bloqueio</Label>
            <Input
              id="tentativas"
              type="number"
              min="1"
              value={getConfigValue('bloqueio_tentativas') || 5}
              onChange={(e) => updateConfig('bloqueio_tentativas', parseInt(e.target.value), 'seguranca')}
            />
          </div>
          <div>
            <Label htmlFor="nivel-senha">Nível de Segurança da Senha</Label>
            <select 
              id="nivel-senha"
              value={getConfigValue('nivel_senha') || 'media'}
              onChange={(e) => updateConfig('nivel_senha', e.target.value, 'seguranca')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="log-atividades">Log de Atividades</Label>
            <Switch
              id="log-atividades"
              checked={getConfigValue('log_atividades') || false}
              onCheckedChange={(checked) => updateConfig('log_atividades', checked, 'seguranca')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="criptografia">Criptografia de Dados</Label>
            <Switch
              id="criptografia"
              checked={getConfigValue('criptografia_dados') || false}
              onCheckedChange={(checked) => updateConfig('criptografia_dados', checked, 'seguranca')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityConfig;
