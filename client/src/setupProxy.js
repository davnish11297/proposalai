const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up proxy middleware...');
  
  // Proxy all API requests to the backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug', // Enable debug logging
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying request:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', req.method, req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.log('❌ Proxy error for:', req.url, '->', err.message);
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