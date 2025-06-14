
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Volume2, Timer, Zap } from 'lucide-react';

interface ScannerConfigProps {
  config: {
    autoScan: boolean;
    soundEnabled: boolean;
    scanDelay: number;
    duplicateFilter: boolean;
  };
  onConfigChange: (config: any) => void;
}

const ScannerConfig: React.FC<ScannerConfigProps> = ({ config, onConfigChange }) => {
  const updateConfig = (key: string, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Settings className="w-5 h-5" />
          <span>Configurações do Scanner</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <Label htmlFor="auto-scan">Escaneamento Automático</Label>
          </div>
          <Switch
            id="auto-scan"
            checked={config.autoScan}
            onCheckedChange={(checked) => updateConfig('autoScan', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <Label htmlFor="sound">Som de Confirmação</Label>
          </div>
          <Switch
            id="sound"
            checked={config.soundEnabled}
            onCheckedChange={(checked) => updateConfig('soundEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <Label htmlFor="delay">Filtro Anti-Duplicação</Label>
          </div>
          <Switch
            id="delay"
            checked={config.duplicateFilter}
            onCheckedChange={(checked) => updateConfig('duplicateFilter', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scan-delay">Intervalo de Escaneamento (ms)</Label>
          <Input
            id="scan-delay"
            type="number"
            min="100"
            max="2000"
            value={config.scanDelay}
            onChange={(e) => updateConfig('scanDelay', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScannerConfig;
