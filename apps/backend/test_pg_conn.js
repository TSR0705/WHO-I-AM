const { Pool } = require('pg');

const candidates = [
  process.env.DATABASE_URL,
  'postgresql://postgres:postgres@localhost:5432/postgres',
  'postgresql://postgres:password@localhost:5432/postgres',
  'postgresql://postgres:admin@localhost:5432/postgres',
  'postgresql://postgres:root@localhost:5432/postgres',
  'postgresql://postgres:@localhost:5432/postgres',
  'postgresql://postgres:postgres@localhost:5432/exposur_db',
  'postgresql://postgres:postgres@localhost:5432/exposur',
].filter(Boolean);

async function probe() {
  for (const uri of candidates) {
    console.log(`Probing: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
    const pool = new Pool({ connectionString: uri, connectionTimeoutMillis: 2000 });
    try {
      const client = await pool.connect();
      console.log(`SUCCESS! Connected with: ${uri}`);
      const res = await client.query('SELECT version()');
      console.log('Postgres Version:', res.rows[0].version);
      
      // Let's check if exposur database exists, and if not, create it
      const dbRes = await client.query("SELECT 1 FROM pg_database WHERE datname = 'exposur'");
      if (dbRes.rows.length === 0) {
        console.log('Creating database exposur...');
        await client.query('CREATE DATABASE exposur');
        console.log('Database exposur created successfully!');
      } else {
        console.log('Database exposur already exists.');
      }
      
      client.release();
      await pool.end();
      process.exit(0);
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    } finally {
      await pool.end();
    }
  }
  console.log('None of the candidate URLs connected successfully.');
  process.exit(1);
}

probe();
