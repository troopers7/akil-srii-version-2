const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getFileHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buf).digest('hex');
}

function checkDuplicates(dir) {
  const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f));
  console.log(`\nChecking ${dir} (${files.length} files)...`);

  const hashMap = {};
  const duplicates = [];

  for (const f of files) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    const hash = getFileHash(fp);

    if (hashMap[hash]) {
      duplicates.push({ keep: hashMap[hash], remove: fp, hash });
    } else {
      hashMap[hash] = fp;
    }
  }

  if (duplicates.length === 0) {
    console.log('  ✅ No exact duplicates found.');
  } else {
    console.log(`  ❌ Found ${duplicates.length} exact duplicates:`);
    duplicates.forEach(d => {
      console.log(`     KEEP: ${path.basename(d.keep)}`);
      console.log(`     DROP: ${path.basename(d.remove)}`);
    });
  }

  return duplicates;
}

const invDups = checkDuplicates('public/assets/invitations');
const templeDups = checkDuplicates('public/assets/temple_gallery');

const allDups = [...invDups, ...templeDups];
console.log(`\n=== TOTAL DUPLICATES FOUND: ${allDups.length} ===`);
fs.writeFileSync('scripts/inv_temple_dups.json', JSON.stringify(allDups, null, 2));
console.log('Results saved to scripts/inv_temple_dups.json');

