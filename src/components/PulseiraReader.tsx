
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Search,
  Scan,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  const [codigo, setCodigo] = useState('');
  const [selectedPulseira, setSelectedPulseira] = useState<PulseiraData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchPulseira = async () => {
    if (!codigo.trim()) {
      toast.error('Digite o código da pulseira');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPulseira();
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
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Scan className="w-5 h-5 text-blue-600" />
          <span>Leitura de Pulseira</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Digite ou escaneie o código da pulseira"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={searchPulseira}
              disabled={isSearching}
              className="flex items-center space-x-1"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </Button>
          </div>
          
          {selectedPulseira && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Pulseira Encontrada</span>
                <Badge className={getStatusColor(selectedPulseira.status)}>
                  {selectedPulseira.status}
                </Badge>
              </div>
              
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PulseiraReader;
