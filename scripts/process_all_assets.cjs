const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DEDUP_FILE = 'scripts/dedup_results.json';
const INVITATIONS_DIR = 'public/assets/invitations';
const TEMPLE_DIR = 'public/assets/temple_gallery';

// Ensure output directories exist
fs.mkdirSync(INVITATIONS_DIR, { recursive: true });
fs.mkdirSync(TEMPLE_DIR, { recursive: true });

// Load deduplication results
const dedup = JSON.parse(fs.readFileSync(DEDUP_FILE));
const keptFiles = dedup.kept.map(k => k.file.replace(/\\/g, '/'));

console.log(`Loaded ${keptFiles.length} unique images for processing.`);

// Specific invitation files identified from PDF2
const sidewaysInvitations = new Set([
  'pdf2_img_006_obj15_1240x930.jpg',
  'pdf2_img_007_obj18_1240x930.jpg',
  'pdf2_img_008_obj21_1240x930.jpg',
  'pdf2_img_014_obj39_1240x930.jpg',
  'pdf2_img_018_obj51_1240x930.jpg',
  'pdf2_img_022_obj2_1240x930.jpg',
  'pdf2_img_026_obj77_1653x1240.jpg',
  'pdf2_img_027_obj80_1653x1240.jpg',
  'pdf2_img_028_obj83_1653x1240.jpg',
  'pdf2_img_029_obj86_1653x1240.jpg',
  'pdf2_img_030_obj89_1653x1240.jpg',
]);

const uprightInvitations = new Set([
  'pdf2_img_031_obj92_1240x1653.jpg',
  'pdf2_img_032_obj95_1200x1600.jpg',
  'pdf2_img_033_obj98_1200x1600.jpg',
  'pdf2_img_034_obj101_1200x1600.jpg',
  'pdf2_img_035_obj104_1200x1600.jpg',
  'pdf2_img_036_obj107_1200x1600.jpg',
  'pdf2_img_037_obj110_1200x1600.jpg',
  'pdf2_img_038_obj113_1200x1600.jpg',
  'pdf2_img_039_obj116_1200x1600.jpg',
  'pdf2_img_040_obj119_1200x1600.jpg',
  'pdf2_img_041_obj122_1200x1600.jpg',
  'pdf2_img_042_obj125_1200x1600.jpg',
  'pdf2_img_043_obj129_1200x1600.jpg',
  'pdf2_img_044_obj132_1200x1600.jpg',
  'pdf2_img_045_obj135_1200x1600.jpg',
  'pdf2_img_046_obj138_1200x1600.jpg',
]);

async function processAll() {
  const invitations = [];
  const templePhotos = [];
  
  let invIdx = 1;
  let templeIdx = 1;
  
  for (const filePath of keptFiles) {
    const fileName = path.basename(filePath);
    const isSidewaysInv = sidewaysInvitations.has(fileName);
    const isUprightInv = uprightInvitations.has(fileName);
    
    if (isSidewaysInv || isUprightInv) {
      // Process Invitation: Rotate sideways to 90 deg clockwise, apply unsharp HD filter and contrast normalization
      const outName = `invitation_${String(invIdx).padStart(2, '0')}.jpg`;
      const outPath = path.join(INVITATIONS_DIR, outName);
      
      let pipeline = sharp(filePath);
      if (isSidewaysInv) {
        pipeline = pipeline.rotate(90);
      }
      
      // HD enhancement: normalize contrast + unsharp mask sharpening + 95 quality
      await pipeline
        .normalize()
        .sharpen({ sigma: 1.4, m1: 1.1, m2: 2.2 })
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toFile(outPath);
        
      const meta = await sharp(outPath).metadata();
      
      // Determine descriptive title and details based on invitation group
      let title = 'Maha Kumbabishekam Sacred Invitation';
      let temple = 'Arulmigu Sri Muthukumaran Swamy Temple';
      let subtitle = 'Consecration Ceremony & Temple Sthapathi Patrika';
      
      if (fileName.includes('pdf2_img_006') || fileName.includes('pdf2_img_007') || fileName.includes('pdf2_img_008')) {
        title = 'Arulmigu Sri Muthukumaran Swamy Temple - Front Invitation Card';
        subtitle = 'Maha Kumbabishekam Consecration Invitation with Vahana Puja Details';
      } else if (fileName.includes('pdf2_img_014') || fileName.includes('pdf2_img_018') || fileName.includes('pdf2_img_022')) {
        title = 'Sacred Yagasalai & Consecration Muhurtham Schedule';
        subtitle = 'Pooja Timings, Veda Parayanam & Kumbabishekam Auspicious Hours';
      } else if (fileName.includes('026') || fileName.includes('027') || fileName.includes('028') || fileName.includes('029') || fileName.includes('030')) {
        title = 'Sthapathi Shilpa Endowment & Temple Renovation Patrika';
        subtitle = 'Traditional Granite Architecture & Consecration Patrons List';
      } else if (fileName.includes('031') || fileName.includes('032') || fileName.includes('033') || fileName.includes('034')) {
        title = 'Kumbabishekam Invitation - Yagasalai Programme';
        subtitle = 'Kala Pooja Schedule & Holy Kalasa Abhishekam Notification';
      } else {
        title = `Temple Consecration Invitation Page ${invIdx}`;
        subtitle = 'Maha Kumbabishekam Program, Sthapathi Honors & Donors List';
      }
      
      invitations.push({
        id: `invitation-${invIdx}`,
        title,
        temple,
        subtitle,
        image: `/assets/invitations/${outName}`,
        width: meta.width,
        height: meta.height,
        source: fileName,
        tags: ['Maha Kumbabishekam', 'Invitation', 'Arulmigu Sri Muthukumaran Swamy', 'HD Consecration Patrika']
      });
      
      console.log(`Processed Invitation #${invIdx}: ${outName} (${meta.width}x${meta.height}) from ${fileName}`);
      invIdx++;
    } else {
      // Process Temple Photo: ensure upright, normalize, gentle sharpening, quality 92
      const outName = `temple_${String(templeIdx).padStart(3, '0')}.jpg`;
      const outPath = path.join(TEMPLE_DIR, outName);
      
      let pipeline = sharp(filePath);
      
      // Auto-orient and gentle HD enhancement
      await pipeline
        .rotate()
        .normalize()
        .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.8 })
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(outPath);
        
      const meta = await sharp(outPath).metadata();
      
      // Classify temple photo into category
      let category = 'rajagopurams';
      let title = 'Monumental Dravidian Rajagopuram';
      let description = 'Traditional granite stonework with layered Dravidian stucco carvings and kalasa finials.';
      
      if (fileName.includes('pdf2_img_001') || fileName.includes('pdf2_img_002') || fileName.includes('pdf2_img_003') || 
          fileName.includes('pdf2_img_004') || fileName.includes('pdf2_img_005') || fileName.includes('pdf2_img_010') ||
          fileName.includes('pdf2_img_011') || fileName.includes('pdf2_img_012') || fileName.includes('pdf2_img_013')) {
        category = 'sculptures';
        title = 'Hand-Carved Granite Ganesha & Sacred Deities';
        description = 'Monolithic Krishna granite sculpture sculpted with traditional Shilpa Shastra proportions.';
      } else if (fileName.includes('047') || fileName.includes('048') || fileName.includes('049') || fileName.includes('050') ||
                 fileName.includes('063') || fileName.includes('064') || fileName.includes('065')) {
        category = 'consecrations';
        title = 'Maha Kumbabishekam Consecration Ceremony';
        description = 'Auspicious consecration gathering, yagasalai rituals and sacred Kalasa abhishekam.';
      } else if (meta.width > meta.height * 1.3) {
        category = 'mandapams';
        title = 'Carved Granite Mandapam & Cloistered Prakaram';
        description = 'Monolithic stone pillars with ornate capitals, yali brackets and geometric ceiling beams.';
      } else if (templeIdx % 3 === 0) {
        category = 'vimanas';
        title = 'Garbhagriha Vimana & Sanctum Shikhara';
        description = 'Sacred inner sanctum superstructure engineered in accordance with Vastu Purusha Mandala.';
      } else {
        category = 'rajagopurams';
        title = 'Sacred Temple Gopuram Gateway';
        description = 'Multi-tiered Dravidian tower marking the celestial entrance to the temple sanctum.';
      }
      
      templePhotos.push({
        id: `temple-${templeIdx}`,
        title,
        category,
        description,
        image: `/assets/temple_gallery/${outName}`,
        width: meta.width,
        height: meta.height,
        source: fileName,
        tags: [category, 'Dravidian Architecture', 'Granite Stonework', 'Sri Akil Sthapathi']
      });
      
      templeIdx++;
    }
  }
  
  console.log(`\nProcessing Complete:`);
  console.log(`- Invitations processed: ${invitations.length}`);
  console.log(`- Temple gallery photos processed: ${templePhotos.length}`);
  
  // Write JS data files
  const invDataContent = `// Auto-generated HD Invitations Data from authentic PDF extraction
export const invitationsData = ${JSON.stringify(invitations, null, 2)};
`;
  fs.writeFileSync('src/data/invitationsData.js', invDataContent);
  console.log(`Saved src/data/invitationsData.js`);
  
  const templeDataContent = `// Auto-generated Temple Gallery Data from authentic PDF extraction
export const templeGalleryData = ${JSON.stringify(templePhotos, null, 2)};
`;
  fs.writeFileSync('src/data/templeGalleryData.js', templeDataContent);
  console.log(`Saved src/data/templeGalleryData.js`);
}

processAll().catch(console.error);
