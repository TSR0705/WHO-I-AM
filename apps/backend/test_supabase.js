const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:[REDACTED_PASSWORD]@db.redacted.supabase.co:5432/postgres',
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testConnection();
