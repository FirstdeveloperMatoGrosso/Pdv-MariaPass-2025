
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Share, FileText, Settings } from 'lucide-react';
import CompanyConfig from './CompanyConfig';
import { generateReportPDF, shareViaPIX } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  reportData: any;
  period: string;
}

interface CompanyData {
  name: string;
  address: string;
  cnpj: string;
  email: string;
  phone: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, reportData, period }) => {
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Carregar dados da empresa do localStorage
    const savedData = localStorage.getItem('companyData');
    if (savedData) {
      setCompanyData(JSON.parse(savedData));
    }
  }, []);

  const handleGeneratePDF = async (shareWhatsApp: boolean = false) => {
    if (!companyData) {
      toast({
        title: "Erro",
        description: "Configure os dados da empresa antes de exportar",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = generateReportPDF(companyData, {
        period,
        salesData: {
          total: reportData?.faturamentoTotal || 0,
          orders: reportData?.pedidosRealizados || 0,
          avgTicket: reportData?.ticketMedio || 0
        },
        topProducts: [
          { name: 'Suco Natural Laranja', quantity: 45, revenue: 450.00 },
          { name: 'Sanduíche Natural Frango', quantity: 28, revenue: 420.00 },
          { name: 'Café Expresso Premium', quantity: 52, revenue: 416.00 },
          { name: 'Pão de Queijo Tradicional', quantity: 67, revenue: 335.00 },
          { name: 'Água Mineral 500ml', quantity: 89, revenue: 267.00 }
        ],
        recentOrders: [
          { id: 'PED-001', time: '14:32', items: 3, total: 28.50, status: 'Concluído' },
          { id: 'PED-002', time: '14:28', items: 2, total: 18.00, status: 'Concluído' },
          { id: 'PED-003', time: '14:25', items: 5, total: 67.50, status: 'Concluído' },
          { id: 'PED-004', time: '14:20', items: 1, total: 8.00, status: 'Cancelado' },
          { id: 'PED-005', time: '14:18', items: 4, total: 42.00, status: 'Concluído' }
        ]
      });

      if (shareWhatsApp) {
        const pdfBlob = pdf.output('blob');
        shareViaPIX(pdfBlob, companyData.name, period);
        
        toast({
          title: "WhatsApp aberto",
          description: "O WhatsApp foi aberto com a mensagem. Anexe o PDF manualmente.",
        });
      } else {
        const fileName = `relatorio-vendas-${period.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        toast({
          title: "PDF gerado",
          description: "O relatório foi baixado com sucesso!",
        });
      }

      onClose();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Exportar Relatório</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Período selecionado:</h3>
                <p className="text-lg text-green-600 font-bold">{period}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleGeneratePDF(false)}
                  disabled={isGenerating || !companyData}
                  className="h-16 flex flex-col items-center justify-center space-y-2"
                >
                  <Download className="w-6 h-6" />
                  <span>Baixar PDF</span>
                </Button>

                <Button
                  onClick={() => handleGeneratePDF(true)}
                  disabled={isGenerating || !companyData}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-2"
                >
                  <Share className="w-6 h-6" />
                  <span>Compartilhar via WhatsApp</span>
                </Button>
              </div>

              {!companyData && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                  <Settings className="w-4 h-4 inline mr-1" />
                  Configure os dados da empresa na aba "Configurações" antes de exportar.
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>• O PDF será gerado com layout profissional</p>
                <p>• Inclui logo, dados da empresa e relatório completo</p>
                <p>• Para WhatsApp: o aplicativo abrirá com mensagem pronta</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config">
            <CompanyConfig onDataChange={setCompanyData} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
