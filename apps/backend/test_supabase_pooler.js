const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres',
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
