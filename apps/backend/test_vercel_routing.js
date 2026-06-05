const http = require('http');
const app = require('./dist/index').default;

// Start server on a dynamic port
const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`Test server started on port ${port}`);

  // Fire a request with the Vercel production route prefix
  const req = http.get(`http://localhost:${port}/_/backend/api/whoami`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Request Path: /_/backend/api/whoami');
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', data);
      
      try {
        const parsed = JSON.parse(data);
        if (res.statusCode === 200 && parsed.ip) {
          console.log('\n🎉 SUCCESS: Prefix rewrite middleware works perfectly! Production 404 is fixed.');
          server.close();
          process.exit(0);
        } else {
          throw new Error('Response did not match expected structure');
        }
      } catch (err) {
        console.error('\n❌ FAILURE: Failed to handle prefixed request correctly.', err.message);
        server.close();
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.error('\n❌ Request Error:', err.message);
    server.close();
    process.exit(1);
  });
});
