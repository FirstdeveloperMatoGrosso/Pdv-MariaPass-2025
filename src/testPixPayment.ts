import { paymentService } from './services/paymentService';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configura caminhos para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente do arquivo .env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Garante que as variáveis de ambiente estejam disponíveis
if (!process.env.VITE_PAGARME_API_KEY) {
  throw new Error('VITE_PAGARME_API_KEY não está definida no arquivo .env');
}

console.log('API Key:', process.env.VITE_PAGARME_API_KEY ? '*** Configurada ***' : 'Não configurada');

// Dados de teste para o cliente
const testCustomer = {
  name: 'João da Silva',
  email: 'joao.silva@example.com',
  document: '12345678909', // CPF
  document_type: 'CPF' as const, // Garante que é do tipo literal 'CPF'
  type: 'individual' as const, // Garante que é do tipo literal 'individual'
  phones: {
    mobile_phone: {
      country_code: '55',
      area_code: '11',
      number: '987654321'
    }
  },
  address: {
    line_1: 'Rua Exemplo',
    line_2: 'Apto 123',
    zip_code: '01310940',
    city: 'São Paulo',
    state: 'SP',
    country: 'BR'
  }
};

// Função para testar a geração do PIX
async function testPixPayment() {
  try {
    console.log('Iniciando teste de pagamento PIX...');
    
    const pixData = {
      amount: 10000, // R$ 100,00 em centavos
      customer: testCustomer,
      orderCode: `TEST_${Date.now()}`,
      expiresIn: 30, // 30 minutos
      description: 'Teste de pagamento PIX',
      items: [
        {
          amount: 10000, // R$ 100,00 em centavos
          description: 'Produto de teste',
          quantity: 1,
          code: 'PROD_TEST_001'
        }
      ]
    };

    console.log('Enviando requisição para gerar PIX...');
    console.log('Dados do pagamento:', JSON.stringify(pixData, null, 2));
    
    const response = await paymentService.createPixPayment(pixData);
    
    console.log('\n✅ PIX gerado com sucesso!');
    console.log('----------------------------------------');
    console.log('ID do Pedido:', response.orderId);
    console.log('ID da Cobrança:', response.chargeId);
    console.log('Status:', response.status);
    console.log('Valor: R$', (response.amount / 100).toFixed(2));
    console.log('QR Code URL:', response.qrCodeUrl);
    console.log('URL do PIX:', response.paymentUrl);
    console.log('Expira em:', new Date(response.expiresAt).toLocaleString());
    console.log('----------------------------------------');
    
    // Exibe o QR Code no terminal (se disponível)
    if (response.qrCode) {
      console.log('\n📱 Código PIX (copie e cole no seu app de banco):');
      console.log(response.qrCode);
      console.log('----------------------------------------');
    }
    
    return response;
  } catch (error) {
    console.error('\n❌ Erro ao gerar PIX:', error);
    throw error;
  }
}

// Executa o teste se este arquivo for executado diretamente
const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  testPixPayment()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erro no teste:', error);
      process.exit(1);
    });
}

export { testPixPayment };
