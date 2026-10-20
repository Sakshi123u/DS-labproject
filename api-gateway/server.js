import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.GATEWAY_PORT || process.env.API_GATEWAY_PORT || 8080;

const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:4001';
const BORROW_SERVICE_URL = process.env.BORROW_SERVICE_URL || 'http://localhost:4002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4003';

app.use(cors());
app.use(express.json());

// 1. Gateway health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'api-gateway',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
  });
});

// 2. Comprehensive System Status (actual health check to all microservices)
app.get('/api/system/health', async (req, res) => {
  const startTime = Date.now();

  const services = [
    { name: 'API Gateway', id: 'api-gateway', url: `http://localhost:${PORT}/health`, port: PORT, self: true },
    { name: 'Book Service', id: 'book-service', url: `${BOOK_SERVICE_URL}/health`, port: 4001 },
    { name: 'Borrow Service', id: 'borrow-service', url: `${BORROW_SERVICE_URL}/health`, port: 4002 },
    { name: 'Notification Service', id: 'notification-service', url: `${NOTIFICATION_SERVICE_URL}/health`, port: 4003 },
  ];

  const checks = await Promise.allSettled(
    services.map(async s => {
      const pingStart = Date.now();
      if (s.self) {
        return {
          id: s.id,
          name: s.name,
          port: s.port,
          status: 'UP',
          latencyMs: Date.now() - pingStart,
          details: { service: s.id, port: s.port },
        };
      }
      const response = await axios.get(s.url, { timeout: 2500 });
      return {
        id: s.id,
        name: s.name,
        port: s.port,
        status: response.data.status || 'UP',
        latencyMs: Date.now() - pingStart,
        details: response.data,
      };
    })
  );

  const results = checks.map((chk, idx) => {
    if (chk.status === 'fulfilled') {
      return chk.value;
    }
    return {
      id: services[idx].id,
      name: services[idx].name,
      port: services[idx].port,
      status: 'DOWN',
      latencyMs: -1,
      error: chk.reason.message,
    };
  });

  const allUp = results.every(r => r.status === 'UP');
  res.json({
    overallStatus: allUp ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    services: results,
  });
});

// 3. Consolidated Dashboard Stats (Aggregated from Book & Borrow services)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [bookStatsRes, borrowStatsRes, booksListRes, borrowHistoryRes] = await Promise.allSettled([
      axios.get(`${BOOK_SERVICE_URL}/books/stats/summary`, { timeout: 3000 }),
      axios.get(`${BORROW_SERVICE_URL}/borrow/stats`, { timeout: 3000 }),
      axios.get(`${BOOK_SERVICE_URL}/books`, { timeout: 3000 }),
      axios.get(`${BORROW_SERVICE_URL}/borrow/history`, { timeout: 3000 }),
    ]);

    const bookStats = bookStatsRes.status === 'fulfilled' ? bookStatsRes.value.data : { totalBooks: 0, totalAvailableCopies: 0 };
    const borrowStats = borrowStatsRes.status === 'fulfilled' ? borrowStatsRes.value.data : { activeBorrowings: 0, uniqueStudents: 0 };
    const allBooks = booksListRes.status === 'fulfilled' ? booksListRes.value.data : [];
    const allHistory = borrowHistoryRes.status === 'fulfilled' ? borrowHistoryRes.value.data : [];

    res.json({
      totalBooks: bookStats.totalBooks || 0,
      availableCopies: bookStats.totalAvailableCopies || 0,
      borrowedBooks: borrowStats.activeBorrowings || 0,
      totalStudents: borrowStats.uniqueStudents || 0,
      recentBooks: allBooks.slice(0, 5),
      recentActivity: allHistory.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Books Routing
app.all('/api/books*', async (req, res) => {
  const targetPath = req.originalUrl.replace(/^\/api/, '');
  const targetUrl = `${BOOK_SERVICE_URL}${targetPath}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      timeout: 5000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data || { error: `Book Service unavailable: ${error.message}` };
    res.status(status).json(data);
  }
});

// 5. Borrow Routing
app.all('/api/borrow*', async (req, res) => {
  const targetPath = req.originalUrl.replace(/^\/api/, '');
  const targetUrl = `${BORROW_SERVICE_URL}${targetPath}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      timeout: 5000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data || { error: `Borrow Service unavailable: ${error.message}` };
    res.status(status).json(data);
  }
});

// 6. Return Routing (e.g. POST /api/return/:id)
app.all('/api/return*', async (req, res) => {
  const targetPath = req.originalUrl.replace(/^\/api/, '');
  const targetUrl = `${BORROW_SERVICE_URL}${targetPath}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      timeout: 5000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data || { error: `Borrow Service unavailable: ${error.message}` };
    res.status(status).json(data);
  }
});

// 7. Notification Routing
app.all('/api/notifications*', async (req, res) => {
  const targetPath = req.originalUrl.replace(/^\/api/, '');
  const targetUrl = `${NOTIFICATION_SERVICE_URL}${targetPath}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      timeout: 5000,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data || { error: `Notification Service unavailable: ${error.message}` };
    res.status(status).json(data);
  }
});

// Safe start only when executed directly as main script or if port is available
const isDirectRun = process.argv[1] && process.argv[1].includes('api-gateway');

if (isDirectRun || process.env.STANDALONE_GATEWAY === 'true') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API Gateway] Listening on port ${PORT}`);
  });
  server.on('error', err => {
    console.warn(`[API Gateway] Port ${PORT} occupied (${err.message}); running as mounted gateway.`);
  });
}

export default app;
