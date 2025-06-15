
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanyData {
  name: string;
  address: string;
  cnpj: string;
  email: string;
  phone: string;
}

interface SalesData {
  total: number;
  orders: number;
  avgTicket: number;
}

interface ProductData {
  name: string;
  quantity: number;
  revenue: number;
}

interface OrderData {
  id: string;
  time: string;
  items: number;
  total: number;
  status: string;
}

interface ReportData {
  period: string;
  salesData: SalesData;
  topProducts: ProductData[];
  recentOrders: OrderData[];
}

export const generateReportPDF = (companyData: CompanyData, reportData: ReportData): jsPDF => {
  const doc = new jsPDF();
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const reportNumber = `#${Date.now().toString().slice(-6)}`;
  
  // Cores exatas da imagem
  const darkBlue: [number, number, number] = [31, 41, 55]; // Cor do cabeçalho
  const lightGray: [number, number, number] = [248, 250, 252]; // Fundo das linhas
  const mediumGray: [number, number, number] = [107, 114, 128]; // Texto secundário
  const greenAccent: [number, number, number] = [16, 185, 129]; // Verde dos valores
  
  // ==================== CABEÇALHO SUPERIOR ====================
  
  // Fundo azul escuro do cabeçalho (toda a largura)
  doc.setFillColor(...darkBlue);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Título "INVOICE" em branco
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO', 20, 25);
  
  // Número do relatório no canto direito
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(reportNumber, 170, 25);
  
  // Data abaixo do número
  doc.setFontSize(10);
  doc.text(currentDate, 170, 32);
  
  // ==================== INFORMAÇÕES DA EMPRESA ====================
  
  let yPos = 60;
  
  // Nome da empresa (grande e em negrito)
  doc.setTextColor(...darkBlue);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyData.name, 20, yPos);
  
  yPos += 8;
  
  // Endereço da empresa
  doc.setTextColor(...mediumGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const addressLines = companyData.address.split(',');
  addressLines.forEach(line => {
    doc.text(line.trim(), 20, yPos);
    yPos += 4;
  });
  
  doc.text(companyData.email, 20, yPos);
  yPos += 4;
  doc.text(companyData.phone, 20, yPos);
  yPos += 4;
  doc.text(`CNPJ: ${companyData.cnpj}`, 20, yPos);
  
  // ==================== INFORMAÇÕES DO PERÍODO ====================
  
  yPos = 60;
  
  // Alinhado à direita
  doc.setTextColor(...mediumGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Período:', 140, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkBlue);
  doc.text(reportData.period, 140, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mediumGray);
  doc.text('Data de Emissão:', 140, yPos + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkBlue);
  doc.text(currentDate, 140, yPos + 22);
  
  yPos = 110;
  
  // ==================== TABELA PRINCIPAL - RESUMO ====================
  
  // Garantir que salesData existe e tem as propriedades corretas
  const salesTotal = reportData.salesData?.total || 0;
  const salesOrders = reportData.salesData?.orders || 0;
  const salesAvgTicket = reportData.salesData?.avgTicket || 0;
  
  const summaryTableData = [
    ['Faturamento Total', '', `R$ ${salesTotal.toFixed(2)}`],
    ['Total de Pedidos', '', salesOrders.toString()],
    ['Ticket Médio', '', `R$ ${salesAvgTicket.toFixed(2)}`],
    ['', '', ''], // Linha vazia
    ['', 'TOTAL GERAL', `R$ ${salesTotal.toFixed(2)}`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Qtd', 'Valor']],
    body: summaryTableData,
    theme: 'grid',
    headStyles: {
      fillColor: darkBlue,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: {
      fillColor: lightGray
    },
    didParseCell: function(data) {
      // Linha do total em destaque
      if (data.row.index === 4) {
        data.cell.styles.fillColor = darkBlue;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 12;
      }
      // Linha vazia
      if (data.row.index === 3) {
        data.cell.styles.fillColor = [255, 255, 255];
      }
      // Valores em verde
      if (data.column.index === 2 && data.row.index < 3) {
        data.cell.styles.textColor = greenAccent;
      }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  // ==================== PRODUTOS MAIS VENDIDOS ====================
  
  doc.setTextColor(...darkBlue);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Produtos Mais Vendidos', 20, yPos);
  
  yPos += 10;
  
  const productTableData = (reportData.topProducts || []).map((product, index) => [
    product.name,
    product.quantity.toString(),
    `R$ ${(product.revenue / product.quantity).toFixed(2)}`,
    `R$ ${product.revenue.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Produto', 'Qtd', 'Valor Unit.', 'Total']],
    body: productTableData,
    theme: 'grid',
    headStyles: {
      fillColor: darkBlue,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: {
      fillColor: lightGray
    },
    didParseCell: function(data) {
      // Valores monetários em verde
      if (data.column.index >= 2) {
        data.cell.styles.textColor = greenAccent;
      }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  // ==================== OBSERVAÇÕES ====================
  
  doc.setTextColor(...darkBlue);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Observações', 20, yPos);
  
  yPos += 8;
  
  doc.setTextColor(...mediumGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('• Este relatório foi gerado automaticamente pelo sistema MariaPass', 20, yPos);
  yPos += 5;
  doc.text('• Os dados apresentados refletem as vendas do período selecionado', 20, yPos);
  yPos += 5;
  doc.text('• Para dúvidas ou esclarecimentos, entre em contato conosco', 20, yPos);
  
  // ==================== RODAPÉ ====================
  
  // Linha horizontal no rodapé
  doc.setDrawColor(...mediumGray);
  doc.setLineWidth(0.5);
  doc.line(20, 280, 190, 280);
  
  // Informações do rodapé
  doc.setTextColor(...mediumGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyData.name} - ${companyData.email} - ${companyData.phone}`, 20, 285);
  
  // Numeração da página
  doc.setFont('helvetica', 'bold');
  doc.text('Página 1 de 1', 170, 285);
  
  return doc;
};

export const shareViaPIX = (pdfBlob: Blob, companyName: string, period: string) => {
  const message = `📊 *Relatório de Vendas - ${companyName}*\n\n` +
    `📅 Período: ${period}\n` +
    `📋 Relatório detalhado em anexo\n\n` +
    `_Gerado automaticamente pelo Sistema MariaPass_`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};
