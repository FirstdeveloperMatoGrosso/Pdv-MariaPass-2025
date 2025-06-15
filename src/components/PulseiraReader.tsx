
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  User,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import BarcodeReader from './BarcodeReader';
import PulseiraHistorico from './PulseiraHistorico';

interface PulseiraData {
  id: string;
  codigo: string;
  saldo: number;
  status: string;
  tipo: string;
  cliente_nome: string;
  cliente_documento: string;
}

interface PulseiraReaderProps {
  onPulseiraSelected: (pulseira: PulseiraData) => void;
}

const PulseiraReader: React.FC<PulseiraReaderProps> = ({ onPulseiraSelected }) => {
  const [selectedPulseira, setSelectedPulseira] = useState<PulseiraData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  const searchPulseira = async (codigo: string) => {
    if (!codigo.trim()) {
      toast.error('Código da pulseira é obrigatório');
      return;
    }
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('pulseiras')
        .select('*')
        .eq('codigo', codigo.trim())
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Pulseira não encontrada');
        } else {
          toast.error('Erro ao buscar pulseira');
        }
        setSelectedPulseira(null);
        return;
      }
      
      setSelectedPulseira(data);
      onPulseiraSelected(data);
      toast.success('Pulseira encontrada!');
    } catch (error) {
      console.error('Erro ao buscar pulseira:', error);
      toast.error('Erro ao buscar pulseira');
      setSelectedPulseira(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800';
      case 'inativa': return 'bg-red-100 text-red-800';
      case 'bloqueada': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      <BarcodeReader 
        onCodeRead={searchPulseira}
        placeholder="Código da pulseira"
        title="Leitura de Pulseira"
      />
      
      {selectedPulseira && (
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Detalhes da Pulseira</span>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedPulseira.status)}>
                  {selectedPulseira.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHistorico(!showHistorico)}
                >
                  {showHistorico ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showHistorico ? 'Ocultar' : 'Ver'} Histórico
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-1">
                  <CreditCard className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600">Código:</span>
                  <span className="font-medium">{selectedPulseira.codigo}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-gray-600">Saldo:</span>
                  <span className="font-semibold text-green-600">
                    R$ {selectedPulseira.saldo.toFixed(2)}
                  </span>
                </div>
                
                {selectedPulseira.cliente_nome && (
                  <div className="flex items-center space-x-1 col-span-2">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{selectedPulseira.cliente_nome}</span>
                  </div>
                )}
                
                {selectedPulseira.cliente_documento && (
                  <div className="flex items-center space-x-1 col-span-2">
                    <span className="text-gray-600">Documento:</span>
                    <span className="font-medium">{selectedPulseira.cliente_documento}</span>
                  </div>
                )}
              </div>
              
              {selectedPulseira.status !== 'ativa' && (
                <div className="flex items-center space-x-1 mt-2 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">
                    {selectedPulseira.status === 'inativa' 
                      ? 'Pulseira inativa - não é possível recarregar'
                      : 'Pulseira bloqueada - verifique com administrador'
                    }
                  </span>
                </div>
              )}
              
              {selectedPulseira.status === 'ativa' && (
                <div className="flex items-center space-x-1 mt-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Pulseira pronta para recarga</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {showHistorico && selectedPulseira && (
        <PulseiraHistorico 
          pulseiraId={selectedPulseira.id}
          codigoPulseira={selectedPulseira.codigo}
        />
      )}
    </div>
  );
};

export default PulseiraReader;
