import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { ServerResponse, IncomingMessage } from 'http';
import type { ProxyOptions } from 'vite';

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy para a API do Pagar.me
      '/api/pagarme': {
        target: 'https://api.pagar.me',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/pagarme/, '/core/v5'),
        configure: (proxy) => {
          // Configura timeout maior para evitar erros de timeout
          (proxy as any).timeout = 60000; // 60 segundos
          
          // Tratamento de erros
          proxy.on('error', (err, req: IncomingMessage, res: ServerResponse) => {
            console.error('Proxy error:', {
              message: err.message,
              stack: err.stack,
              code: (err as any).code,
              syscall: (err as any).syscall,
              hostname: (err as any).hostname,
              port: (err as any).port,
              response: (err as any).response?.data,
              config: {
                url: (err as any).config?.url,
                method: (err as any).config?.method,
                headers: (err as any).config?.headers ? {
                  ...(err as any).config.headers,
                  authorization: (err as any).config.headers?.authorization ? '***' : undefined
                } : undefined,
                data: (err as any).config?.data
              }
            });
            
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
            }
            
            const errorResponse = { 
              error: 'Proxy error',
              message: err.message,
              details: process.env.NODE_ENV === 'development' ? {
                code: (err as any).code,
                syscall: (err as any).syscall,
                hostname: (err as any).hostname,
                port: (err as any).port
              } : undefined
            };
            
            console.error('Sending error response to client:', errorResponse);
            res.end(JSON.stringify(errorResponse));
          });
          
          // Intercepta a requisição para adicionar headers
          proxy.on('proxyReq', (proxyReq, req: IncomingMessage) => {
            const url = req.url || 'unknown';
            console.log('Sending Request to Pagar.me:', req.method, url);
            
            // Usa a chave de teste do Pagar.me diretamente (apenas para desenvolvimento)
            const apiKey = 'sk_test_bb42e0672450489fb186dd88a72d4b3c';
            const auth = Buffer.from(`${apiKey}:`).toString('base64');
            
            // Remove headers antigos para evitar duplicação
            proxyReq.removeHeader('authorization');
            
            // Adiciona os headers necessários
            proxyReq.setHeader('Authorization', `Basic ${auth}`);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
            
            // Adiciona um ID de requisição para rastreamento
            const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            if (req.headers) {
              req.headers['x-request-id'] = requestId;
            }
            
            // Log dos headers para debug (sem expor a chave)
            console.log('Request headers:', {
              'Authorization': `Basic ${'*'.repeat(10)}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Request-ID': requestId
            });
            
            // Log do corpo da requisição para debug
            if (req.method === 'POST' || req.method === 'PUT') {
              const chunks: Buffer[] = [];
              req.on('data', (chunk) => {
                chunks.push(chunk);
              });
              
              req.on('end', () => {
                if (chunks.length > 0) {
                  try {
                    const body = Buffer.concat(chunks).toString();
                    console.log('Request body:', body);
                  } catch (e) {
                    console.error('Error parsing request body:', e);
                  }
                }
              });
            }
          });
          
          // Intercepta a resposta para log
          proxy.on('proxyRes', (proxyRes, req: IncomingMessage) => {
            const statusCode = proxyRes.statusCode;
            const url = req.url || 'unknown';
            console.log(`[${new Date().toISOString()}] Response from Pagar.me: ${req.method} ${url} - ${statusCode}`);
            
            // Log de headers da resposta
            console.log('Response headers:', {
              'content-type': proxyRes.headers['content-type'],
              'date': proxyRes.headers['date'],
              'server': proxyRes.headers['server'],
              'x-ratelimit-limit': proxyRes.headers['x-ratelimit-limit'],
              'x-ratelimit-remaining': proxyRes.headers['x-ratelimit-remaining'],
              'x-ratelimit-reset': proxyRes.headers['x-ratelimit-reset']
            });
            
            // Log de erros de autenticação
            if (statusCode === 401) {
              console.error('Erro de autenticação na API do Pagar.me. Verifique a chave de API.');
            }
            
            // Log de rate limit
            if (statusCode === 429) {
              console.error('Rate limit excedido na API do Pagar.me. Aguarde antes de tentar novamente.');
            }
            
            // Captura o corpo da resposta para log
            const responseChunks: Buffer[] = [];
            const originalWrite = (proxyRes as any).write;
            const originalEnd = (proxyRes as any).end;
            
            // Sobrescrevendo métodos para capturar a resposta
            (proxyRes as any).write = function (chunk: any, ...args: any[]): boolean {
              if (chunk) responseChunks.push(Buffer.from(chunk));
              return originalWrite.apply(proxyRes, [chunk, ...args]);
            };
            
            // Sobrescrevendo métodos para capturar a resposta
            (proxyRes as any).end = function (chunk?: any, ...args: any[]): any {
              if (chunk) {
                responseChunks.push(Buffer.from(chunk));
              }
              
              try {
                if (responseChunks.length > 0) {
                  const body = Buffer.concat(responseChunks).toString('utf8');
                  if (body) {
                    console.log('Response body:', body);
                  }
                }
              } catch (e) {
                console.error('Error parsing response body:', e);
              }
              
              return originalEnd.apply(proxyRes, [chunk, ...args]);
            };
          });
        }
      }
    }
  },
  plugins: [
    react(),
    process.env.NODE_ENV === 'development' && componentTagger(),
  ].filter(Boolean) as any[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Usando a versão ESM do SDK que é mais adequada para o navegador
      'pagarme': path.resolve(__dirname, '../dist/esm/index.js'),
    },
    // Garante que as extensões .js sejam resolvidas corretamente
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  define: {
    'process.env': {},
    global: 'window',
  },
  optimizeDeps: {
    esbuildOptions: {
      // Configurações para o esbuild
      target: 'es2020',
      // Habilita suporte a CommonJS
      mainFields: ['module', 'main'],
      // Configura o loader para arquivos .js
      loader: { '.js': 'jsx' },
      // Define variáveis de ambiente
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
    },
    // Força a inclusão do SDK nos bundles otimizados
    include: ['pagarme'],
  },
  build: {
    commonjsOptions: {
      // Habilita a transformação de módulos CommonJS
      transformMixedEsModules: true,
      // Configurações adicionais para CommonJS
      esmExternals: true,
      // Desativa a transformação de requires dinâmicos
      ignoreDynamicRequires: true,
    },
    // Configurações de rollup
    rollupOptions: {
      // Externaliza o SDK para evitar duplicação
      external: ['pagarme'],
      output: {
        // Define o nome global para o SDK
        globals: {
          pagarme: 'pagarme',
        },
      },
    },
    // Aumenta o limite de tamanho dos chunks
    chunkSizeWarningLimit: 2000,
  },
});
