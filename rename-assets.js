const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const assetsDir = path.join(__dirname, 'assets');
const oldVersion = '1.121.0';
const newVersion = '1.121.04567';

const filesToRename = [
  {
    old: `Black IDE-darwin-arm64-${oldVersion}.zip`,
    new: `Black IDE-darwin-arm64-${newVersion}.zip`
  },
  {
    old: `Black IDE.arm64.${oldVersion}.dmg`,
    new: `Black IDE.arm64.${newVersion}.dmg`
  },
  {
    old: `black ide-cli-darwin-arm64-${oldVersion}.tar.gz`,
    new: `black ide-cli-darwin-arm64-${newVersion}.tar.gz`
  }
];

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
  console.log('Starting assets renaming and checksum calculation...');

  // 1. Delete all existing .sha1 and .sha256 files in assets/
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
      if (file.endsWith('.sha1') || file.endsWith('.sha256')) {
        const filePath = path.join(assetsDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted old checksum file: ${file}`);
      }
    });
  } else {
    console.error('Assets directory does not exist!');
    process.exit(1);
  }

  // 2. Rename files and generate checksums
  filesToRename.forEach(item => {
    const oldPath = path.join(assetsDir, item.old);
    const newPath = path.join(assetsDir, item.new);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${item.old} -> ${item.new}`);
      calculateChecksums(newPath);
    } else {
      console.warn(`Warning: File not found for renaming: ${item.old}`);
    }
  });

  console.log('Rename and checksum generation completed successfully!');
}

run();
