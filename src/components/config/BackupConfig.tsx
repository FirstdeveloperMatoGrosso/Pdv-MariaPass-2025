
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const BackupConfig: React.FC = () => {
  const { configs, loading, updateConfig, getConfigValue } = useSystemConfig('backup');

  if (loading) {
    return <div className="animate-pulse">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Configurações de Backup</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="backup-auto">Backup Automático</Label>
          <Switch
            id="backup-auto"
            checked={getConfigValue('backup_automatico') || false}
            onCheckedChange={(checked) => updateConfig('backup_automatico', checked, 'backup')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="frequencia">Frequência</Label>
            <select 
              id="frequencia"
              value={getConfigValue('frequencia_backup') || 'diario'}
              onChange={(e) => updateConfig('frequencia_backup', e.target.value, 'backup')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>
          <div>
            <Label htmlFor="horario">Horário do Backup</Label>
            <Input
              id="horario"
              type="time"
              value={getConfigValue('horario_backup') || '02:00'}
              onChange={(e) => updateConfig('horario_backup', e.target.value, 'backup')}
            />
          </div>
          <div>
            <Label htmlFor="local">Local do Backup</Label>
            <select 
              id="local"
              value={getConfigValue('local_backup') || 'nuvem'}
              onChange={(e) => updateConfig('local_backup', e.target.value, 'backup')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="local">Local</option>
              <option value="nuvem">Nuvem</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div>
            <Label htmlFor="retencao">Dias de Retenção</Label>
            <Input
              id="retencao"
              type="number"
              min="1"
              value={getConfigValue('retencao_dias') || 30}
              onChange={(e) => updateConfig('retencao_dias', parseInt(e.target.value), 'backup')}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="comprimir">Comprimir Backup</Label>
          <Switch
            id="comprimir"
            checked={getConfigValue('comprimir_backup') || false}
            onCheckedChange={(checked) => updateConfig('comprimir_backup', checked, 'backup')}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupConfig;
