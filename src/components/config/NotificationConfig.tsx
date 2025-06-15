
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const NotificationConfig: React.FC = () => {
  const { configs, loading, updateConfig, getConfigValue } = useSystemConfig('notificacoes');

  if (loading) {
    return <div className="animate-pulse">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Configurações de Notificações</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notif-habilitadas">Notificações Habilitadas</Label>
          <Switch
            id="notif-habilitadas"
            checked={getConfigValue('notificacoes_habilitadas') || false}
            onCheckedChange={(checked) => updateConfig('notificacoes_habilitadas', checked, 'notificacoes')}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-email">Notificações por Email</Label>
            <Switch
              id="notif-email"
              checked={getConfigValue('notificacao_email') || false}
              onCheckedChange={(checked) => updateConfig('notificacao_email', checked, 'notificacoes')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-sistema">Notificações do Sistema</Label>
            <Switch
              id="notif-sistema"
              checked={getConfigValue('notificacao_sistema') || false}
              onCheckedChange={(checked) => updateConfig('notificacao_sistema', checked, 'notificacoes')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-estoque">Notificações de Estoque</Label>
            <Switch
              id="notif-estoque"
              checked={getConfigValue('notificacao_estoque') || false}
              onCheckedChange={(checked) => updateConfig('notificacao_estoque', checked, 'notificacoes')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-vendas">Notificações de Vendas</Label>
            <Switch
              id="notif-vendas"
              checked={getConfigValue('notificacao_vendas') || false}
              onCheckedChange={(checked) => updateConfig('notificacao_vendas', checked, 'notificacoes')}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email-admin">Email do Administrador</Label>
          <Input
            id="email-admin"
            type="email"
            value={getConfigValue('email_admin') || ''}
            onChange={(e) => updateConfig('email_admin', e.target.value, 'notificacoes')}
            placeholder="admin@exemplo.com"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationConfig;
