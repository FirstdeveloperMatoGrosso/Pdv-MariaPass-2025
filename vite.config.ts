// @ts-nocheck
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { ServerResponse, IncomingMessage } from 'http';
import { Buffer } from 'buffer';

// Configuração do Vite
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  server: {
    host: "::",
    port: 8080,
    strictPort: true, // Impede que o Vite tente outras portas
    hmr: {
      port: 8080, // Força o HMR a usar a mesma porta
    },
    // Configuração de proxy
    proxy: {
      // Rota para a API local
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // Rota para a API do Supabase
      '/auth/v1': {
        target: env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/auth\/v1/, '/auth/v1')
      },
      // Rota para o Supabase Realtime
      '/rest/v1': {
        target: env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/rest\/v1/, '/rest/v1')
      },
      // Proxy para a API do Pagar.me
      '/api/pagarme': {
        target: 'https://api.pagar.me/core/v5',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api/pagarme': ''
        },
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
          // Adiciona headers necessários para a API do Pagar.me
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Accept', 'application/json');
          
          // Log da requisição
          console.log('Proxy: Encaminhando requisição para:', {
            method: req.method,
            url: `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
            headers: proxyReq.getHeaders()
          });
        },
        onProxyRes: (proxyRes, req, res) => {
          // Log da resposta
          console.log('Proxy: Resposta recebida com status:', proxyRes.statusCode);
        },
        onError: (err, req, res) => {
          console.error('Erro no proxy:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
          }
          res.end(JSON.stringify({ error: 'Erro ao conectar ao servidor de pagamentos' }));
        },
        configure: (proxy) => {
          // Configura timeout maior para evitar erros de timeout
          (proxy as any).timeout = 60000; // 60 segundos
          
          // Tratamento de erros
          proxy.on('error', (err, req: IncomingMessage, res: ServerResponse) => {
            console.error('Erro no proxy (evento):', {
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
          proxy.on('proxyReq', (proxyReq, req: IncomingMessage, res: ServerResponse) => {
            try {
              const url = req.url || 'unknown';
              const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              // Log detalhado da requisição
              console.log(`[${new Date().toISOString()}] [${requestId}] Request to Pagar.me:`, {
                method: req.method,
                url,
                headers: {
                  ...req.headers,
                  authorization: req.headers.authorization ? '***' : undefined
                }
              });
              
              // Usa a chave de teste do Pagar.me diretamente (apenas para desenvolvimento)
              const apiKey = 'sk_test_bb42e0672450489fb186dd88a72d4b3c';
              const auth = Buffer.from(`${apiKey}:`).toString('base64');
              
              // Remove headers antigos para evitar duplicação
              proxyReq.removeHeader('authorization');
              
              // Adiciona os headers necessários
              proxyReq.setHeader('Authorization', `Basic ${auth}`);
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Accept', 'application/json');
              proxyReq.setHeader('X-Request-ID', requestId);
              
              // Log do payload da requisição (se houver)
              if (req.method === 'POST' || req.method === 'PUT') {
                let body = [];
                proxyReq.on('data', (chunk) => {
                  body.push(chunk);
                });
                
                proxyReq.on('end', () => {
                  if (body.length > 0) {
                    const requestBody = Buffer.concat(body).toString();
                    console.log(`[${new Date().toISOString()}] [${requestId}] Request Body:`, requestBody);
                    
                    // Reconstruir o body para o proxy
                    proxyReq.write(requestBody);
                    proxyReq.end();
                  }
                });
              }
              
              // Log dos headers finais
              console.log(`[${new Date().toISOString()}] [${requestId}] Final Request Headers:`, {
                ...proxyReq.getHeaders(),
                authorization: '***'
              });
              
            } catch (proxyReqError) {
              console.error('Error in proxyReq handler:', proxyReqError);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Proxy Request Error',
                  message: proxyReqError.message,
                  stack: process.env.NODE_ENV === 'development' ? proxyReqError.stack : undefined
                }));
              }
            }
          });
          
          // Intercepta a resposta da API
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const requestId = proxyRes.req.getHeader('x-request-id') || 'unknown';
            const chunks: Buffer[] = [];
            
            console.log(`[${new Date().toISOString()}] [${requestId}] Response from Pagar.me:`, {
              statusCode: proxyRes.statusCode,
              statusMessage: proxyRes.statusMessage,
              headers: {
                ...proxyRes.headers,
                'set-cookie': proxyRes.headers['set-cookie'] ? '***' : undefined,
                'authorization': proxyRes.headers['authorization'] ? '***' : undefined,
              }
            });
            
            // Captura o corpo da resposta
            proxyRes.on('data', (chunk) => {
              chunks.push(chunk);
            });
            
            proxyRes.on('end', () => {
              if (chunks.length > 0) {
                try {
                  const body = Buffer.concat(chunks).toString('utf8');
                  console.log(`[${new Date().toISOString()}] [${requestId}] Response Body:`, body);
                } catch (error) {
                  console.error(`[${new Date().toISOString()}] [${requestId}] Error parsing response body:`, error);
                }
              }
            });
            
            proxyRes.on('error', (error) => {
              console.error(`[${new Date().toISOString()}] [${requestId}] Error in proxy response:`, error);
            });
          });  
          // Configuração de log para o corpo da requisição
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.method === 'POST' || req.method === 'PUT') {
              const body: any[] = [];
              
              req.on('data', (chunk) => {
                body.push(chunk);
              });
              
              req.on('end', () => {
                if (body.length > 0) {
                  try {
                    const requestBody = Buffer.concat(body).toString('utf8');
                    console.log('Request body:', requestBody);
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
    mode === 'development' ? componentTagger() : null,
  ].filter(Boolean) as any[],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      },
      {
        find: 'pagarme',
        replacement: path.resolve(__dirname, 'node_modules/pagarme/dist/pagarme.js')
      }
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  define: {
    'process.env': {
      VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL || ''),
      VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || '')
    },
    global: 'window',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react/jsx-dev-runtime'
    ],
    esbuildOptions: {
      target: 'es2020',
      loader: { 
        '.js': 'jsx' 
      },
      define: {
        global: 'globalThis',
      },
      jsx: 'automatic',
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
      ignoreDynamicRequires: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 2000,
  },
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
  };
});
