
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
  
  // Cores
  const primaryColor = [34, 197, 94]; // Verde
  const secondaryColor = [75, 85, 99]; // Cinza
  
  // Header com logo e dados da empresa
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo (círculo com MP)
  doc.setFillColor(255, 255, 255);
  doc.circle(25, 20, 8, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MP', 21, 24);
  
  // Nome da empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyData.name, 40, 18);
  
  // Dados da empresa
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyData.address, 40, 25);
  doc.text(`CNPJ: ${companyData.cnpj} | ${companyData.email} | ${companyData.phone}`, 40, 30);
  
  // Título do relatório
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE VENDAS', 20, 55);
  
  // Período e data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${reportData.period}`, 20, 65);
  doc.text(`Data de emissão: ${currentDate}`, 20, 72);
  
  // Linha separadora
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 78, 190, 78);
  
  // Resumo de vendas
  let yPosition = 90;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('RESUMO GERAL', 20, yPosition);
  
  yPosition += 15;
  
  // Cards de resumo
  const cardWidth = 50;
  const cardHeight = 25;
  const cardSpacing = 10;
  
  // Card 1 - Faturamento
  doc.setFillColor(240, 253, 244);
  doc.rect(20, yPosition, cardWidth, cardHeight, 'F');
  doc.setDrawColor(...primaryColor);
  doc.rect(20, yPosition, cardWidth, cardHeight);
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FATURAMENTO TOTAL', 22, yPosition + 8);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`R$ ${reportData.salesData.total.toFixed(2)}`, 22, yPosition + 16);
  
  // Card 2 - Pedidos
  doc.setFillColor(239, 246, 255);
  doc.rect(20 + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.rect(20 + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight);
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('PEDIDOS REALIZADOS', 22 + cardWidth + cardSpacing, yPosition + 8);
  
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.salesData.orders.toString(), 22 + cardWidth + cardSpacing, yPosition + 16);
  
  // Card 3 - Ticket Médio
  doc.setFillColor(250, 245, 255);
  doc.rect(20 + (cardWidth + cardSpacing) * 2, yPosition, cardWidth, cardHeight, 'F');
  doc.setDrawColor(147, 51, 234);
  doc.rect(20 + (cardWidth + cardSpacing) * 2, yPosition, cardWidth, cardHeight);
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TICKET MÉDIO', 22 + (cardWidth + cardSpacing) * 2, yPosition + 8);
  
  doc.setTextColor(147, 51, 234);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`R$ ${reportData.salesData.avgTicket.toFixed(2)}`, 22 + (cardWidth + cardSpacing) * 2, yPosition + 16);
  
  yPosition += 40;
  
  // Tabela de produtos mais vendidos
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUTOS MAIS VENDIDOS', 20, yPosition);
  
  yPosition += 10;
  
  const productTableData = reportData.topProducts.map(product => [
    product.name,
    product.quantity.toString(),
    `R$ ${product.revenue.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Produto', 'Quantidade', 'Receita']],
    body: productTableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: secondaryColor
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Nova página para pedidos recentes se necessário
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  
  if (finalY > 200) {
    doc.addPage();
    yPosition = 30;
  } else {
    yPosition = finalY + 20;
  }
  
  // Tabela de pedidos recentes
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PEDIDOS RECENTES', 20, yPosition);
  
  yPosition += 10;
  
  const orderTableData = reportData.recentOrders.map(order => [
    order.id,
    order.time,
    order.items.toString(),
    `R$ ${order.total.toFixed(2)}`,
    order.status
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Pedido', 'Hora', 'Itens', 'Total', 'Status']],
    body: orderTableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: secondaryColor
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha do footer
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);
    
    // Texto do footer
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório gerado automaticamente pelo Sistema MariaPass', 20, 287);
    doc.text(`Página ${i} de ${pageCount}`, 170, 287);
    doc.text(`Gerado em: ${currentDate}`, 20, 292);
  }
  
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
