const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment or .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString
});

async function run() {
  console.log('--- STARTING PERSISTENCE & INTEGRATION TESTS ---');
  console.log(`Connection string: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`);
  
  try {
    // 1. Verify connection and schema existence
    console.log('1. Connecting and verifying table...');
    const tablesRes = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'fingerprints'
    `);
    
    if (tablesRes.rows.length === 0) {
      throw new Error("Table 'fingerprints' does not exist in the database! Schema initialization failed.");
    }
    console.log("SUCCESS: 'fingerprints' table verified.");

    // 2. Insert test data
    console.log('2. Inserting test fingerprint...');
    const testCanvas = 'test_canvas_sig_' + Date.now();
    const testAudio = 'test_audio_sig_' + Date.now();
    
    await pool.query(`
      INSERT INTO fingerprints (canvas_hash, audio_hash, browser, os, device)
      VALUES ($1, $2, $3, $4, $5)
    `, [testCanvas, testAudio, 'TestBrowser', 'TestOS', 'test_device']);
    console.log('SUCCESS: Test fingerprint inserted.');

    // 3. Query and verify persistence
    console.log('3. Verifying record persistence...');
    const selectRes = await pool.query(`
      SELECT * FROM fingerprints WHERE canvas_hash = $1
    `, [testCanvas]);
    
    if (selectRes.rows.length === 0) {
      throw new Error('Verification failed: Inserted record not found in database.');
    }
    
    const record = selectRes.rows[0];
    if (record.audio_hash !== testAudio || record.browser !== 'TestBrowser') {
      throw new Error(`Verification failed: Record contents mismatch! Found: ${JSON.stringify(record)}`);
    }
    console.log('SUCCESS: Persistent record verification passed.');

    // 4. Compute uniqueness statistics
    console.log('4. Testing uniqueness statistics calculation...');
    const totalRes = await pool.query('SELECT COUNT(*) FROM fingerprints');
    const totalProfiles = Number(totalRes.rows[0].count || 1);
    
    const canvasRes = await pool.query('SELECT COUNT(*) FROM fingerprints WHERE canvas_hash = $1', [testCanvas]);
    const canvasCount = Number(canvasRes.rows[0].count || 1);
    const canvasUniqueness = (canvasCount / totalProfiles) * 100;
    
    console.log(`- Total Checked Profiles in DB: ${totalProfiles}`);
    console.log(`- Test canvas occurrences: ${canvasCount} (${canvasUniqueness.toFixed(2)}%)`);
    
    if (canvasCount !== 1) {
      throw new Error(`Expected canvas count to be 1, got ${canvasCount}`);
    }
    console.log('SUCCESS: Uniqueness calculation verified.');

    // 5. Clean up test record
    console.log('5. Cleaning up test record...');
    const deleteRes = await pool.query('DELETE FROM fingerprints WHERE canvas_hash = $1', [testCanvas]);
    console.log(`SUCCESS: Deleted ${deleteRes.rowCount} test record(s).`);
    
    // Final check
    const finalCheck = await pool.query('SELECT COUNT(*) FROM fingerprints WHERE canvas_hash = $1', [testCanvas]);
    if (Number(finalCheck.rows[0].count) !== 0) {
      throw new Error('Cleanup failed: Test record still exists in the database.');
    }
    console.log('SUCCESS: Database is clean.');
    
    console.log('\n🎉 ALL PERSISTENCE AND INTEGRATION TESTS PASSED 100%!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
