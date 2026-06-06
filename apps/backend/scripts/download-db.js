const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../src/data');
const DATABASES = [
  {
    name: 'GeoLite2-ASN.mmdb',
    url: 'https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb'
  },
  {
    name: 'GeoLite2-City.mmdb',
    url: 'https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb'
  }
];

console.log('GeoLite2 Database Downloader starting...');

if (!fs.existsSync(DB_DIR)) {
  console.log(`Creating directory: ${DB_DIR}`);
  fs.mkdirSync(DB_DIR, { recursive: true });
}

async function downloadFile(url, destPath) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download database. HTTP Status Code: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
  console.log(`Download complete: ${path.basename(destPath)}`);
}

async function run() {
  const force = process.argv.includes('--force');
  for (const db of DATABASES) {
    const destPath = path.join(DB_DIR, db.name);
    if (fs.existsSync(destPath) && !force) {
      console.log(`Database ${db.name} already exists. Skipping download (use --force to overwrite).`);
      continue;
    }
    console.log(`Downloading ${db.name}...`);
    try {
      await downloadFile(db.url, destPath);
      console.log(`Successfully saved ${db.name} to ${destPath}`);
    } catch (err) {
      console.error(`Error downloading ${db.name}:`, err.message);
      if (fs.existsSync(destPath)) {
        console.log(`Pre-existing ${db.name} file found. Proceeding with existing database to avoid build failure.`);
      } else {
        console.error(`No pre-existing ${db.name} file found. Build must fail.`);
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
