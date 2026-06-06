const fs = require('fs');
const path = require('path');
const https = require('https');

const DB_DIR = path.join(__dirname, '../src/data');
const DB_PATH = path.join(DB_DIR, 'GeoLite2-ASN.mmdb');
const DOWNLOAD_URL = 'https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb';

console.log('GeoLite2 ASN Database Downloader starting...');

if (!fs.existsSync(DB_DIR)) {
  console.log(`Creating directory: ${DB_DIR}`);
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    function get(currentUrl) {
      https.get(currentUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          console.log(`Following redirect to: ${response.headers.location}`);
          get(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download database. HTTP Status Code: ${response.statusCode}`));
          return;
        }

        const file = fs.createWriteStream(destPath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close(() => {
            console.log('Database download complete.');
            resolve();
          });
        });

        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    }

    get(url);
  });
}

downloadFile(DOWNLOAD_URL, DB_PATH)
  .then(() => {
    console.log(`Successfully saved GeoLite2-ASN database to ${DB_PATH}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error downloading database:', err.message);
    if (fs.existsSync(DB_PATH)) {
      console.log('Pre-existing database file found. Proceeding with existing database to avoid build failure.');
      process.exit(0);
    } else {
      console.error('No pre-existing database file found. Build must fail.');
      process.exit(1);
    }
  });
