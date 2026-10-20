import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bookServiceApp from './book-service/server.js';
import notificationServiceApp from './notification-service/server.js';
import borrowServiceApp from './borrow-service/server.js';
import apiGatewayApp from './api-gateway/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

// Start the independent microservices on their designated ports for REST communication
const bookServer = bookServiceApp.listen(4001, '0.0.0.0', () => {
  console.log('[Book Service] HTTP listening on 0.0.0.0:4001');
});
bookServer.on('error', (err: any) => {
  if (err.code !== 'EADDRINUSE') {
    console.warn('[Book Service] HTTP warning:', err.message);
  }
});

const notifServer = notificationServiceApp.listen(4003, '0.0.0.0', () => {
  console.log('[Notification Service] HTTP listening on 0.0.0.0:4003');
});
notifServer.on('error', (err: any) => {
  if (err.code !== 'EADDRINUSE') {
    console.warn('[Notification Service] HTTP warning:', err.message);
  }
});

const borrowServer = borrowServiceApp.listen(4002, '0.0.0.0', () => {
  console.log('[Borrow Service] HTTP listening on 0.0.0.0:4002');
});
borrowServer.on('error', (err: any) => {
  if (err.code !== 'EADDRINUSE') {
    console.warn('[Borrow Service] HTTP warning:', err.message);
  }
});

// Mount API Gateway routes on the main host Express app
app.use(apiGatewayApp);

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In development mode, mount Vite middleware as required by AI Studio guidelines
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LibraFlow Host] Main host dev server running on http://0.0.0.0:${PORT}`);
    console.log(`[LibraFlow Host] Microservices cluster operational:`);
    console.log(`  - API Gateway:          http://0.0.0.0:${PORT}/api (and internal routes)`);
    console.log(`  - Book Service:         http://0.0.0.0:4001`);
    console.log(`  - Borrow Service:       http://0.0.0.0:4002`);
    console.log(`  - Notification Service: http://0.0.0.0:4003`);
  });
}

startServer().catch(err => {
  console.error('[LibraFlow Host] Failed to start server:', err);
});
