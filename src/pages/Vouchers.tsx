
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Search,
  Filter,
  Plus,
  Calendar,
  CreditCard,
  Gift,
  Percent,
  Users
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Voucher {
  id: string;
  codigo: string;
  tipo: string;
  valor: number;
  porcentagem: number;
  produto_id: string;
  data_validade: string;
  limite_uso: number;
  usos_realizados: number;
  status: string;
  cliente_nome: string;
  cliente_email: string;
  observacoes: string;
  created_at: string;
}

const Vouchers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Buscar vouchers do Supabase
  const { data: vouchers = [], isLoading, refetch } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar vouchers:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  const filteredVouchers = vouchers.filter((voucher: Voucher) => {
    const matchesSearch = voucher.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || voucher.tipo === selectedType;
    const matchesStatus = selectedStatus === 'all' || voucher.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-600">Ativo</Badge>;
      case 'usado':
        return <Badge className="bg-blue-600">Usado</Badge>;
      case 'expirado':
        return <Badge variant="secondary">Expirado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'desconto':
        return <Percent className="w-3 h-3 mr-1" />;
      case 'produto_gratis':
        return <Gift className="w-3 h-3 mr-1" />;
      case 'credito':
        return <CreditCard className="w-3 h-3 mr-1" />;
      default:
        return <Ticket className="w-3 h-3 mr-1" />;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'desconto': return 'Desconto';
      case 'produto_gratis': return 'Produto Grátis';
      case 'credito': return 'Crédito';
      default: return tipo;
    }
  };

  const formatValue = (voucher: Voucher) => {
    if (voucher.porcentagem) {
      return `${voucher.porcentagem}%`;
    } else if (voucher.valor) {
      return `R$ ${voucher.valor.toFixed(2)}`;
    } else {
      return 'Produto Grátis';
    }
  };

  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter((v: Voucher) => v.status === 'ativo').length;
  const usedVouchers = vouchers.filter((v: Voucher) => v.status === 'usado').length;
  const expiredVouchers = vouchers.filter((v: Voucher) => v.status === 'expirado').length;

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando vouchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Ticket className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Gestão de Vouchers</h1>
        </div>
        <Button className="flex items-center space-x-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span>Novo Voucher</span>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Ticket className="w-5 h-5 text-purple-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total de Vouchers</p>
                <p className="text-lg sm:text-2xl font-bold">{totalVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-green-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Ativos</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{activeVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Usados</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{usedVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-red-600" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Expirados</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{expiredVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código, cliente ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Filter className="w-4 h-4 text-gray-500" />
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="desconto">Desconto</option>
                  <option value="produto_gratis">Produto Grátis</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 flex-1">
                <Users className="w-4 h-4 text-gray-500" />
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="all">Todos os status</option>
                  <option value="ativo">Ativo</option>
                  <option value="usado">Usado</option>
                  <option value="expirado">Expirado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vouchers */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Vouchers Cadastrados ({filteredVouchers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Código</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Validade</TableHead>
                  <TableHead className="hidden md:table-cell">Uso</TableHead>
                  <TableHead className="hidden lg:table-cell">Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher: Voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{voucher.codigo}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {getTypeLabel(voucher.tipo)} - {formatValue(voucher)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="flex items-center w-fit">
                        {getTypeIcon(voucher.tipo)}
                        {getTypeLabel(voucher.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-semibold">
                      {formatValue(voucher)}
                    </TableCell>
                    <TableCell>{getStatusBadge(voucher.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {new Date(voucher.data_validade).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">
                        {voucher.usos_realizados} / {voucher.limite_uso}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{voucher.cliente_nome}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{voucher.cliente_email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Vouchers;
