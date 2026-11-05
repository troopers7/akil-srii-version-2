const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function getPerceptualHash(filePath) {
  const { data } = await sharp(filePath)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const stat = fs.statSync(filePath);
  const meta = await sharp(filePath).metadata();
  return {
    filePath,
    fileName: path.basename(filePath),
    pixels: data,
    size: stat.size,
    width: meta.width,
    height: meta.height
  };
}

async function findVisualDuplicates(dir, label, threshold = 6.5) {
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .map(f => path.join(dir, f));

  console.log(`\n=== ${label} (${files.length} files) ===`);
  
  const hashes = [];
  for (const f of files) {
    try {
      hashes.push(await getPerceptualHash(f));
    } catch(e) {
      console.log(`  Skip ${f}: ${e.message}`);
    }
  }

  const clusters = [];
  const assigned = new Set();

  for (let i = 0; i < hashes.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = [hashes[i]];
    assigned.add(i);
    for (let j = i + 1; j < hashes.length; j++) {
      if (assigned.has(j)) continue;
      let diff = 0;
      for (let k = 0; k < 256; k++) {
        diff += Math.abs(hashes[i].pixels[k] - hashes[j].pixels[k]);
      }
      const avgDiff = diff / 256;
      if (avgDiff < threshold) {
        cluster.push(hashes[j]);
        assigned.add(j);
      }
    }
    clusters.push(cluster);
  }

  const dupClusters = clusters.filter(c => c.length > 1);
  
  if (dupClusters.length === 0) {
    console.log('  ✅ No visual duplicates found!');
    return { toDelete: [], uniqueCount: clusters.length };
  }

  console.log(`  ❌ Found ${dupClusters.length} clusters with visual duplicates:`);
  
  const toDelete = [];
  dupClusters.forEach((cluster, idx) => {
    // Keep highest resolution + largest file
    cluster.sort((a, b) => (b.width * b.height - a.width * a.height) || (b.size - a.size));
    const keep = cluster[0];
    const dups = cluster.slice(1);
    console.log(`  Cluster ${idx+1}: KEEP ${keep.fileName} (${keep.width}x${keep.height}, ${(keep.size/1024).toFixed(1)}KB)`);
    dups.forEach(d => {
      console.log(`             DROP ${d.fileName} (${d.width}x${d.height}, ${(d.size/1024).toFixed(1)}KB)`);
      toDelete.push(d.filePath);
    });
  });

  return { toDelete, uniqueCount: clusters.length };
}

async function main() {
  const invResult = await findVisualDuplicates('public/assets/invitations', 'INVITATIONS');
  const templeResult = await findVisualDuplicates('public/assets/temple_gallery', 'TEMPLE GALLERY');

  const allToDelete = [...invResult.toDelete, ...templeResult.toDelete];
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Invitations: ${invResult.uniqueCount} unique (${invResult.toDelete.length} to delete)`);
  console.log(`Temple Gallery: ${templeResult.uniqueCount} unique (${templeResult.toDelete.length} to delete)`);
  console.log(`Total files to delete: ${allToDelete.length}`);
  
  fs.writeFileSync('scripts/visual_dups_to_delete.json', JSON.stringify({
    invitationsToDelete: invResult.toDelete,
    templeToDelete: templeResult.toDelete,
    allToDelete
  }, null, 2));
  
  console.log('\nSaved list to scripts/visual_dups_to_delete.json');
  console.log('Run with --delete flag to actually delete the files.');

  // Auto delete if --delete flag passed
  if (process.argv.includes('--delete') && allToDelete.length > 0) {
    console.log('\n🗑️  Deleting duplicate files...');
    for (const f of allToDelete) {
      fs.unlinkSync(f);
      console.log(`  Deleted: ${path.basename(f)}`);
    }
    console.log(`\n✅ Done! Deleted ${allToDelete.length} duplicate files.`);
  }
}

main().catch(console.error);

