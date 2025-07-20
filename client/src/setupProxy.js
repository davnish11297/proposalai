const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up proxy middleware...');
  
  // Only proxy requests that start with /api
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '/api', // Keep the /api prefix
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying request:', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', req.method, req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.log('❌ Proxy error:', err.message);
        console.log('❌ Proxy error details:', err);
      }
    })
  );
  
  console.log('✅ Proxy middleware configured');
}; 