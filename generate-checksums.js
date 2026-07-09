const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const assetsDir = path.join(__dirname, 'assets');

// Helper: Calculate checksums
function calculateChecksums(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  
  // SHA-256
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const sha256Content = `${sha256Hash}  ${path.basename(filePath)}\n`;
  fs.writeFileSync(`${filePath}.sha256`, sha256Content);
  console.log(`Generated SHA-256 for ${path.basename(filePath)}`);

  // SHA-1
  const sha1Hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
  const sha1Content = `${sha1Hash}  ${path.basename(filePath)}\n`;
  fs.writeFileSync(`${filePath}.sha1`, sha1Content);
  console.log(`Generated SHA-1 for ${path.basename(filePath)}`);
}

function run() {
  console.log('Calculating checksums for files in assets/...');
  
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
      // Only hash binary files (zip, dmg, tar.gz)
      if (file.endsWith('.zip') || file.endsWith('.dmg') || file.endsWith('.tar.gz')) {
        const filePath = path.join(assetsDir, file);
        calculateChecksums(filePath);
      }
    });
  } else {
    console.error('Assets directory does not exist!');
  }
}

run();
