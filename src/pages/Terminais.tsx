
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Wifi,
  WifiOff,
  Power,
  PowerOff,
  Settings,
  Refresh,
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Terminal {
  id: string;
  name: string;
  location: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
  version: string;
  uptime: string;
  totalSales: number;
  todaySales: number;
}

const Terminais: React.FC = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([
    {
      id: '1',
      name: 'Terminal Principal',
      location: 'Hall de Entrada',
      ipAddress: '192.168.1.100',
      status: 'online',
      lastSeen: '2024-06-14 10:30:00',
      version: '2.1.0',
      uptime: '15d 8h 30m',
      totalSales: 1250,
      todaySales: 85
    },
    {
      id: '2',
      name: 'Terminal Backup',
      location: 'Área de Espera',
      ipAddress: '192.168.1.101',
      status: 'offline',
      lastSeen: '2024-06-14 09:15:30',
      version: '2.0.8',
      uptime: '0d 0h 0m',
      totalSales: 890,
      todaySales: 0
    },
    {
      id: '3',
      name: 'Terminal VIP',
      location: 'Sala VIP',
      ipAddress: '192.168.1.102',
      status: 'maintenance',
      lastSeen: '2024-06-14 08:45:15',
      version: '2.1.0',
      uptime: '2d 4h 15m',
      totalSales: 560,
      todaySales: 12
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredTerminals = terminals.filter(terminal =>
    terminal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terminal.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terminal.ipAddress.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Online</Badge>;
      case 'offline':
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" />Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const updateTerminalStatus = (id: string, newStatus: 'online' | 'offline' | 'maintenance') => {
    setTerminals(prev => prev.map(terminal =>
      terminal.id === id ? {
        ...terminal,
        status: newStatus,
        lastSeen: new Date().toLocaleString('pt-BR')
      } : terminal
    ));
    toast.success(`Status do terminal atualizado para ${newStatus}!`);
  };

  const restartTerminal = (id: string) => {
    const terminal = terminals.find(t => t.id === id);
    if (terminal) {
      toast.success(`Reiniciando ${terminal.name}...`);
      setTimeout(() => {
        updateTerminalStatus(id, 'online');
      }, 3000);
    }
  };

  const onlineTerminals = terminals.filter(t => t.status === 'online').length;
  const offlineTerminals = terminals.filter(t => t.status === 'offline').length;
  const maintenanceTerminals = terminals.filter(t => t.status === 'maintenance').length;
  const totalSalesToday = terminals.reduce((acc, t) => acc + t.todaySales, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Monitor className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Controle de Terminais</h1>
        </div>
        <Button className="flex items-center space-x-2">
          <Refresh className="w-4 h-4" />
          <span>Atualizar Status</span>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-2xl font-bold text-green-600">{onlineTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-red-600">{offlineTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Manutenção</p>
                <p className="text-2xl font-bold text-yellow-600">{maintenanceTerminals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Vendas Hoje</p>
                <p className="text-2xl font-bold">{totalSalesToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {offlineTerminals > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Terminais Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {terminals.filter(t => t.status === 'offline').map(terminal => (
                <div key={terminal.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="font-medium">{terminal.name} - {terminal.location}</span>
                  <Badge variant="destructive">Offline desde {terminal.lastSeen}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, localização ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Terminais */}
      <Card>
        <CardHeader>
          <CardTitle>Terminais Cadastrados ({filteredTerminals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Terminal</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Conexão</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Vendas Hoje</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerminals.map((terminal) => (
                <TableRow key={terminal.id}>
                  <TableCell className="font-medium">{terminal.name}</TableCell>
                  <TableCell>{terminal.location}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {terminal.ipAddress}
                    </code>
                  </TableCell>
                  <TableCell>{getStatusBadge(terminal.status)}</TableCell>
                  <TableCell className="text-sm">{terminal.lastSeen}</TableCell>
                  <TableCell>
                    <Badge variant="outline">v{terminal.version}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{terminal.uptime}</TableCell>
                  <TableCell className="font-semibold">{terminal.todaySales}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {terminal.status === 'offline' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateTerminalStatus(terminal.id, 'online')}
                        >
                          <Power className="w-3 h-3" />
                        </Button>
                      )}
                      {terminal.status === 'online' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restartTerminal(terminal.id)}
                        >
                          <Refresh className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTerminalStatus(terminal.id, 'maintenance')}
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terminais;
