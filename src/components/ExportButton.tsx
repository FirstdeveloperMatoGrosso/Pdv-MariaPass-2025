import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2, FileText, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportButtonProps {
  onExportPDF?: () => void;
  onPrint?: () => void;
  onShareWhatsApp?: () => void;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExportPDF,
  onPrint,
  onShareWhatsApp,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('ExportButton renderizado com props:', {
    onExportPDF: !!onExportPDF,
    onPrint: !!onPrint,
    onShareWhatsApp: !!onShareWhatsApp,
    className
  });

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      toast.info('Exportar para PDF', {
        description: 'Funcionalidade de exportação para PDF será implementada em breve.',
      });
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      toast.info('Imprimir', {
        description: 'Funcionalidade de impressão será implementada em breve.',
      });
    }
  };

  const handleShareWhatsApp = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
    } else {
      toast.info('Compartilhar via WhatsApp', {
        description: 'Funcionalidade de compartilhamento será implementada em breve.',
      });
    }
  };

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-1 ${className}`}
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Exportar</span>
          <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Exportar Dados</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Exportar para PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          <span>Imprimir</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp}>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Compartilhar via WhatsApp</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
