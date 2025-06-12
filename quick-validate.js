const fs = require('fs');
const path = require('path');

console.log('🔍 Validating IIIF Manifests');
console.log('=============================\n');

const manifestsDir = './manifests';
const files = fs.readdirSync(manifestsDir);
const manifestFiles = files.filter(f => f.endsWith('.json'));

let totalValid = 0;
let totalCanvases = 0;
let totalImages = 0;

for (const file of manifestFiles) {
  const filePath = path.join(manifestsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const manifest = JSON.parse(content);
    
    console.log(`📄 ${file}`);
    console.log(`   Status: ✅ Valid JSON`);
    console.log(`   Type: ${manifest.type}`);
    
    if (manifest.type === 'Manifest') {
      const canvasCount = manifest.items?.length || 0;
      console.log(`   Canvases: ${canvasCount}`);
      console.log(`   Title: ${manifest.label?.zh?.[0] || 'No title'}`);
      totalCanvases += canvasCount;
      totalImages += canvasCount; // Each canvas has one image
    } else if (manifest.type === 'Collection') {
      const itemCount = manifest.items?.length || 0;
      console.log(`   Collection Items: ${itemCount}`);
    }
    
    totalValid++;
  } catch (error) {
    console.log(`📄 ${file}`);
    console.log(`   Status: ❌ Invalid JSON - ${error.message}`);
  }
  console.log('');
}

console.log('📊 Summary');
console.log('==========');
console.log(`Total files: ${manifestFiles.length}`);
console.log(`Valid files: ${totalValid}`);
console.log(`Total canvases: ${totalCanvases}`);
console.log(`Total images: ${totalImages}`);
console.log(`Success rate: ${Math.round((totalValid / manifestFiles.length) * 100)}%`);
