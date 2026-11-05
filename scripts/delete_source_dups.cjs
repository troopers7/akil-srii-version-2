const fs = require('fs');
const path = require('path');

const dedup = JSON.parse(fs.readFileSync('scripts/dedup_results.json'));
const toDelete = dedup.discarded.map(d => d.file.replace(/\\/g, '/'));

console.log(`Found ${toDelete.length} duplicate files to delete:\n`);

let deleted = 0;
let skipped = 0;

for (const filePath of toDelete) {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    fs.unlinkSync(filePath);
    console.log(`  ✅ Deleted: ${filePath} (${(stat.size/1024).toFixed(1)}KB)`);
    deleted++;
  } else {
    console.log(`  ⚠️  Already gone: ${filePath}`);
    skipped++;
  }
}

console.log(`\n=== Done! ===`);
console.log(`Deleted: ${deleted} files`);
console.log(`Already gone: ${skipped} files`);

// Verify what's left
const pdf1 = fs.readdirSync('public/extracted/pdf1').filter(f => /\.(jpg|jpeg|png)$/i.test(f));
const pdf2 = fs.readdirSync('public/extracted/pdf2').filter(f => /\.(jpg|jpeg|png)$/i.test(f));
console.log(`\nRemaining:`);
console.log(`  pdf1: ${pdf1.length} files`);
console.log(`  pdf2: ${pdf2.length} files`);
console.log(`  Total: ${pdf1.length + pdf2.length} unique files`);

