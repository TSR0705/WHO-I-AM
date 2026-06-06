const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DB_DIR = path.join(__dirname, '../src/data');
const DATABASES = [
  {
    name: 'GeoLite2-ASN.mmdb',
    urls: [
      'https://cdn.jsdelivr.net/gh/P3TERX/GeoLite.mmdb@download/GeoLite2-ASN.mmdb',
      'https://raw.githubusercontent.com/P3TERX/GeoLite.mmdb/download/GeoLite2-ASN.mmdb'
    ]
  },
  {
    name: 'GeoLite2-City.mmdb',
    urls: [
      'https://cdn.jsdelivr.net/npm/geolite2-city/GeoLite2-City.mmdb.gz',
      'https://raw.githubusercontent.com/P3TERX/GeoLite.mmdb/download/GeoLite2-City.mmdb'
    ]
  }
];

console.log('GeoLite2 Database Downloader starting...');

if (!fs.existsSync(DB_DIR)) {
  console.log(`Creating directory: ${DB_DIR}`);
  fs.mkdirSync(DB_DIR, { recursive: true });
}

async function downloadFile(urls, destPath) {
  let lastError = null;
  for (const url of urls) {
    console.log(`Trying to download from: ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Status Code: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      let buffer = Buffer.from(arrayBuffer);
      
      // If gzipped (like GeoLite2-City from npm mirror), decompress it
      if (url.endsWith('.gz')) {
        console.log(`Decompressing GZIP database...`);
        buffer = zlib.gunzipSync(buffer);
      }

      fs.writeFileSync(destPath, buffer);
      console.log(`Successfully downloaded raw database to ${destPath}`);
      return; // Success, exit URLs loop
    } catch (err) {
      console.warn(`Download failed from ${url}:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All download sources failed.');
}

async function run() {
  const force = process.argv.includes('--force');
  
  for (const db of DATABASES) {
    const rawPath = path.join(DB_DIR, db.name);
    const compressedPath = rawPath + '.br';

    // If compressed file already exists and not forced, skip
    if (fs.existsSync(compressedPath) && !force) {
      console.log(`Database ${db.name}.br already exists. Skipping download (use --force to overwrite).`);
      continue;
    }

    console.log(`Processing database: ${db.name}...`);
    try {
      await downloadFile(db.urls, rawPath);
      
      // Compress raw file to Brotli
      console.log(`Compressing ${db.name} to Brotli (level 4)...`);
      const start = Date.now();
      const rawData = fs.readFileSync(rawPath);
      const compressedData = zlib.brotliCompressSync(rawData, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4
        }
      });
      fs.writeFileSync(compressedPath, compressedData);
      console.log(`Compressed in ${Date.now() - start}ms. Saved to ${compressedPath} (${compressedData.length} bytes)`);

      // Delete raw file to avoid bundling it
      fs.unlinkSync(rawPath);
      console.log(`Deleted raw ${db.name}`);

    } catch (err) {
      console.error(`Error processing ${db.name}:`, err.message);
      if (fs.existsSync(compressedPath)) {
        console.log(`Pre-existing compressed ${db.name}.br file found. Proceeding with existing database to avoid build failure.`);
      } else {
        console.error(`No pre-existing database file found. Build must fail.`);
        process.exit(1);
      }
    }
  }
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal database downloader error:', err);
  process.exit(1);
});
