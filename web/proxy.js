// Simple proxy that combines frontend + backend on one port
const http = require('http');
const httpProxy = require('http-proxy');

const FRONTEND_PORT = 3007;
const BACKEND_PORT = 8080;

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    // Route API requests to backend
    proxy.web(req, res, { target: `http://localhost:${BACKEND_PORT}` });
  } else {
    // Route everything else to frontend
    proxy.web(req, res, { target: `http://localhost:${FRONTEND_PORT}` });
  }
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.writeHead(502, { 'Content-Type': 'text/plain' });
  res.end('Bad Gateway');
});

server.listen(4000, '0.0.0.0', () => {
  console.log('Proxy server running on port 4000');
  console.log(`Frontend (static): http://localhost:${FRONTEND_PORT}`);
  console.log(`Backend (API): http://localhost:${BACKEND_PORT}`);
  console.log(`Combined proxy: http://localhost:4000`);
});
