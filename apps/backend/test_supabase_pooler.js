const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ypcyjefjkgowzubakcoo:Tsr-Rajput2007@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres',
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log('Connecting to pooler...');
    await client.connect();
    console.log('Connected to pooler successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testConnection();
