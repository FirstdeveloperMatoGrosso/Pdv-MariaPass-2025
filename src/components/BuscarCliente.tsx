import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, User, X, Check } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cliente } from '@/lib/supabase';

interface BuscarClienteProps {
  onSelect: (cliente: Cliente) => void;
  children: React.ReactNode;
  selectedClienteId?: string;
}

export const BuscarCliente: React.FC<BuscarClienteProps> = ({ 
  onSelect, 
  children,
  selectedClienteId
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { clientes, loading, totalPages } = useClientes(searchTerm, page, 5);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedClienteId);

  useEffect(() => {
    setSelectedId(selectedClienteId);
  }, [selectedClienteId]);

  const handleSelect = (cliente: Cliente) => {
    setSelectedId(cliente.id);
    onSelect(cliente);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setPage(1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento ou email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Carregando clientes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow 
                    key={cliente.id} 
                    className={selectedId === cliente.id ? 'bg-muted/50' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{cliente.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.documento}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.telefone || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(cliente.data_cadastro), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {selectedId === cliente.id ? (
                        <Button variant="ghost" size="sm" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Selecionado
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelect(cliente)}
                        >
                          Selecionar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Próxima
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuscarCliente;
