
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Printer, Settings } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const PrintConfig: React.FC = () => {
  const { configs, loading, updateConfig, getConfigValue } = useSystemConfig('impressao');

  if (loading) {
    return <div className="animate-pulse">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Printer className="w-5 h-5" />
          <span>Configurações de Impressão</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="impressora-padrao">Impressora Padrão</Label>
            <Input
              id="impressora-padrao"
              value={getConfigValue('impressora_padrao') || ''}
              onChange={(e) => updateConfig('impressora_padrao', e.target.value, 'impressao')}
            />
          </div>
          <div>
            <Label htmlFor="qualidade">Qualidade de Impressão</Label>
            <select 
              id="qualidade"
              value={getConfigValue('qualidade_impressao') || 'alta'}
              onChange={(e) => updateConfig('qualidade_impressao', e.target.value, 'impressao')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <Label htmlFor="orientacao">Orientação Padrão</Label>
            <select 
              id="orientacao"
              value={getConfigValue('orientacao_padrao') || 'retrato'}
              onChange={(e) => updateConfig('orientacao_padrao', e.target.value, 'impressao')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="retrato">Retrato</option>
              <option value="paisagem">Paisagem</option>
            </select>
          </div>
          <div>
            <Label htmlFor="papel">Tamanho do Papel</Label>
            <select 
              id="papel"
              value={getConfigValue('papel_padrao') || 'A4'}
              onChange={(e) => updateConfig('papel_padrao', e.target.value, 'impressao')}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="Carta">Carta</option>
            </select>
          </div>
          <div>
            <Label htmlFor="copias">Número de Cópias Padrão</Label>
            <Input
              id="copias"
              type="number"
              min="1"
              value={getConfigValue('copias_padrao') || 1}
              onChange={(e) => updateConfig('copias_padrao', parseInt(e.target.value), 'impressao')}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-print">Impressão Automática</Label>
          <Switch
            id="auto-print"
            checked={getConfigValue('impressao_automatica') || false}
            onCheckedChange={(checked) => updateConfig('impressao_automatica', checked, 'impressao')}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PrintConfig;
