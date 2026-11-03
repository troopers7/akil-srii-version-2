const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function extractImagesFromPdf(pdfPath, outDirPrefix) {
  const buf = fs.readFileSync(pdfPath);
  console.log('Processing', pdfPath, 'size:', buf.length);
  const outDir = path.resolve('public/extracted', outDirPrefix);
  fs.mkdirSync(outDir, { recursive: true });

  const str = buf.toString('latin1');
  const objRegex = /(\d+)\s+(\d+)\s+obj\s*<<([\s\S]*?)>>\s*stream\r?\n/g;
  let match;
  let count = 0;
  let saved = 0;

  while ((match = objRegex.exec(str)) !== null) {
    const objNum = match[1];
    const dict = match[3];
    if (!dict.includes('/Subtype') || !dict.includes('/Image')) continue;

    count++;
    const wMatch = dict.match(/\/Width\s+(\d+)/);
    const hMatch = dict.match(/\/Height\s+(\d+)/);
    const w = wMatch ? parseInt(wMatch[1]) : 0;
    const h = hMatch ? parseInt(hMatch[1]) : 0;
    const streamStart = match.index + match[0].length;

    let len = 0;
    const lenMatch = dict.match(/\/Length\s+(\d+)/);
    if (lenMatch) {
      len = parseInt(lenMatch[1]);
    }

    let streamBuf;
    if (len > 0) {
      streamBuf = buf.subarray(streamStart, streamStart + len);
    } else {
      const endPos = buf.indexOf(Buffer.from('endstream'), streamStart);
      streamBuf = buf.subarray(streamStart, endPos);
    }

    let imgData = null;
    let ext = 'jpg';

    if (dict.includes('/FlateDecode') && dict.includes('/DCTDecode')) {
      try {
        imgData = zlib.inflateSync(streamBuf);
        ext = 'jpg';
      } catch (err) {
        console.error('Error inflating obj', objNum, err.message);
      }
    } else if (dict.includes('/DCTDecode')) {
      imgData = streamBuf;
      ext = 'jpg';
    }

    if (imgData) {
      saved++;
      const filename = `${outDirPrefix}_img_${String(saved).padStart(3, '0')}_obj${objNum}_${w}x${h}.${ext}`;
      fs.writeFileSync(path.join(outDir, filename), imgData);
    }
  }
  console.log(pdfPath, 'found', count, 'images, successfully saved', saved, 'to', outDir);
}

extractImagesFromPdf('akil_photos.pdf', 'pdf1');
extractImagesFromPdf('akil_photos2.pdf', 'pdf2');
