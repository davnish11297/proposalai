const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up proxy middleware...');
  
  // Proxy all API requests to the backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'silent', // Reduce logging
      onProxyReq: (proxyReq, req, res) => {
        // Log only important requests
        if (req.url.includes('/public/proposals')) {
          console.log('🔄 Proxying public proposal request:', req.method, req.url);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Log only important responses
        if (req.url.includes('/public/proposals')) {
          console.log('✅ Proxy response:', req.method, req.url, '->', proxyRes.statusCode);
        }
      },
      onError: (err, req, res) => {
        console.log('❌ Proxy error for:', req.url, '->', err.message);
        // Send a proper error response
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Proxy error: ' + err.message 
        }));
      }
    })
  );
  
  console.log('✅ Proxy middleware configured');
}; 