
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
  const reportNumber = `REL-${Date.now().toString().slice(-6)}`;
  
  // Cores baseadas no modelo
  const primaryColor: [number, number, number] = [139, 69, 255]; // Roxo
  const secondaryColor: [number, number, number] = [75, 85, 99]; // Cinza
  const accentColor: [number, number, number] = [34, 197, 94]; // Verde
  
  // ==================== CABEÇALHO ====================
  
  // Título principal
  doc.setTextColor(...primaryColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Vendas', 20, 30);
  
  // Logo da empresa (área reservada - pode ser customizada)
  doc.setFillColor(240, 240, 240);
  doc.rect(150, 15, 40, 20, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text('LOGO', 165, 27);
  
  // ==================== INFORMAÇÕES DO RELATÓRIO ====================
  
  let yPos = 55;
  
  // Caixa de informações do relatório
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, 170, 35, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, yPos, 170, 35);
  
  // Coluna esquerda - Dados do relatório
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Relatório #', 25, yPos + 10);
  doc.text('Período', 25, yPos + 18);
  doc.text('Data de Emissão', 25, yPos + 26);
  
  doc.setFont('helvetica', 'bold');
  doc.text(reportNumber, 65, yPos + 10);
  doc.text(reportData.period, 65, yPos + 18);
  doc.text(currentDate, 65, yPos + 26);
  
  // Coluna direita - Dados da empresa
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(companyData.name, 110, yPos + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(9);
  
  const addressLines = companyData.address.split(',');
  let addressY = yPos + 16;
  addressLines.forEach(line => {
    doc.text(line.trim(), 110, addressY);
    addressY += 4;
  });
  
  doc.text(`CNPJ: ${companyData.cnpj}`, 110, addressY + 2);
  doc.text(`${companyData.email} | ${companyData.phone}`, 110, addressY + 6);
  
  yPos += 50;
  
  // ==================== RESUMO EXECUTIVO ====================
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Executivo', 20, yPos);
  
  yPos += 15;
  
  // Tabela de resumo estilo invoice
  const summaryData = [
    ['Faturamento Total', '', '', `R$ ${reportData.salesData.total.toFixed(2)}`],
    ['Total de Pedidos', '', '', reportData.salesData.orders.toString()],
    ['Ticket Médio', '', '', `R$ ${reportData.salesData.avgTicket.toFixed(2)}`],
    ['', '', 'Sub Total', `R$ ${reportData.salesData.total.toFixed(2)}`],
    ['', '', 'Impostos (est.)', `R$ ${(reportData.salesData.total * 0.08).toFixed(2)}`],
    ['', '', 'Total Líquido', `R$ ${(reportData.salesData.total * 0.92).toFixed(2)}`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Período Anterior', 'Variação', 'Valor Atual']],
    body: summaryData,
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
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      if (data.row.index >= 3 && data.column.index === 2) {
        data.cell.styles.fillColor = [245, 245, 245];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 5) {
        data.cell.styles.fillColor = accentColor;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  // ==================== PRODUTOS MAIS VENDIDOS ====================
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Análise de Produtos', 20, yPos);
  
  yPos += 10;
  
  const productTableData = reportData.topProducts.map((product, index) => [
    (index + 1).toString(),
    product.name,
    product.quantity.toString(),
    `R$ ${(product.revenue / product.quantity).toFixed(2)}`,
    `R$ ${product.revenue.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Produto/Descrição', 'Qtd', 'Valor Unit.', 'Total']],
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
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY;
  
  // Nova página se necessário
  if (finalY > 200) {
    doc.addPage();
    yPos = 30;
  } else {
    yPos = finalY + 20;
  }
  
  // ==================== HISTÓRICO DE PEDIDOS ====================
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Histórico de Pedidos Recentes', 20, yPos);
  
  yPos += 10;
  
  const orderTableData = reportData.recentOrders.map(order => [
    order.id,
    order.time,
    order.items.toString(),
    `R$ ${order.total.toFixed(2)}`,
    order.status
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Pedido', 'Horário', 'Itens', 'Valor', 'Status']],
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
      0: { cellWidth: 35 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      if (data.column.index === 4) {
        if (data.cell.text[0] === 'Concluído') {
          data.cell.styles.textColor = accentColor;
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.text[0] === 'Cancelado') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // ==================== RODAPÉ INFORMATIVO ====================
  
  const lastTableY = (doc as any).lastAutoTable.finalY;
  let footerY = lastTableY + 30;
  
  // Caixa de informações adicionais
  doc.setFillColor(248, 250, 252);
  doc.rect(20, footerY, 170, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, footerY, 170, 25);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Observações e Condições', 25, footerY + 8);
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('• Relatório gerado automaticamente pelo Sistema MariaPass', 25, footerY + 15);
  doc.text('• Dados coletados em tempo real do sistema de vendas', 25, footerY + 19);
  
  // ==================== RODAPÉ FINAL ====================
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha do rodapé
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(20, 285, 190, 285);
    
    // Informações do rodapé
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Para dúvidas, entre em contato: ${companyData.email}`, 20, 292);
    doc.text(`Telefone: ${companyData.phone}`, 20, 296);
    
    // Numeração das páginas
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${i} de ${pageCount}`, 170, 292);
    doc.text(`Gerado em: ${currentDate}`, 170, 296);
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
