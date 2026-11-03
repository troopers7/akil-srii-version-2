const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function getFingerprint(filePath) {
  const meta = await sharp(filePath).metadata();
  const { data } = await sharp(filePath)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const stat = fs.statSync(filePath);
  return { 
    filePath, 
    fileName: path.basename(filePath),
    dir: path.basename(path.dirname(filePath)),
    width: meta.width, 
    height: meta.height, 
    totalPixels: meta.width * meta.height,
    sizeBytes: stat.size,
    pixels: data 
  };
}

async function run() {
  const p1 = fs.readdirSync('public/extracted/pdf1').map(f => path.join('public/extracted/pdf1', f));
  const p2 = fs.readdirSync('public/extracted/pdf2').map(f => path.join('public/extracted/pdf2', f));
  const allFiles = [...p1, ...p2];
  
  console.log(`Processing ${allFiles.length} files...`);
  const fps = [];
  for (const f of allFiles) {
    fps.push(await getFingerprint(f));
  }
  
  // Cluster duplicates
  const clusters = [];
  const assigned = new Set();
  
  for (let i = 0; i < fps.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = [fps[i]];
    assigned.add(i);
    
    for (let j = i + 1; j < fps.length; j++) {
      if (assigned.has(j)) continue;
      let diff = 0;
      for (let k = 0; k < 256; k++) {
        diff += Math.abs(fps[i].pixels[k] - fps[j].pixels[k]);
      }
      const avgDiff = diff / 256;
      if (avgDiff < 6.5) { // Visual match
        cluster.push(fps[j]);
        assigned.add(j);
      }
    }
    clusters.push(cluster);
  }
  
  console.log(`Total unique image clusters: ${clusters.length} (from ${allFiles.length} original files)`);
  
  const duplicates = clusters.filter(c => c.length > 1);
  console.log(`Found ${duplicates.length} clusters with duplicates:`);
  
  const chosenBest = [];
  const skippedDuplicates = [];
  
  clusters.forEach((c, idx) => {
    // Sort by resolution descending, then file size descending
    c.sort((a, b) => (b.totalPixels - a.totalPixels) || (b.sizeBytes - a.sizeBytes));
    const best = c[0];
    chosenBest.push(best);
    if (c.length > 1) {
      const dups = c.slice(1);
      skippedDuplicates.push(...dups);
      console.log(`\nCluster #${idx + 1}: KEEP [${best.dir}/${best.fileName}] (${best.width}x${best.height}, ${(best.sizeBytes/1024).toFixed(1)}KB)`);
      dups.forEach(d => console.log(`   DROP duplicate [${d.dir}/${d.fileName}] (${d.width}x${d.height}, ${(d.sizeBytes/1024).toFixed(1)}KB)`));
    }
  });
  
  console.log(`\nSummary: Kept ${chosenBest.length} unique images, discarded ${skippedDuplicates.length} duplicates.`);
  
  fs.writeFileSync('scripts/dedup_results.json', JSON.stringify({
    totalUnique: chosenBest.length,
    totalDiscarded: skippedDuplicates.length,
    kept: chosenBest.map(k => ({ file: k.filePath, dims: `${k.width}x${k.height}`, size: k.sizeBytes })),
    discarded: skippedDuplicates.map(d => ({ file: d.filePath, dims: `${d.width}x${d.height}`, size: d.sizeBytes }))
  }, null, 2));
}

run().catch(console.error);
