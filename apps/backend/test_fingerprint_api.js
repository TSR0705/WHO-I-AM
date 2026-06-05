const http = require('http');

const payload = JSON.stringify({
  canvasHash: 'abc123canvas',
  audioHash: 'xyz789audio',
  browser: 'Chrome 120',
  os: 'Windows 11',
  device: 'desktop'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/fingerprint',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', JSON.parse(body));
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(payload);
req.end();
