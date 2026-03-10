/**
 * Génère icon.png (sans fond) à partir de public/logo.svg
 * pour un logo gros et visible sur le Bureau.
 */
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public', 'logo.svg');
const pngPath = path.join(root, 'icon.png');

const SIZE = 512; // Taille grande pour être bien visible sur le Bureau

if (!fs.existsSync(svgPath)) {
  console.error('public/logo.svg introuvable.');
  process.exit(1);
}

async function main() {
  const sharp = require('sharp');
  const svgBuffer = fs.readFileSync(svgPath);
  await sharp(svgBuffer)
    .resize(SIZE, SIZE)
    .png()
    .toFile(pngPath);
  console.log('icon.png généré (512x512, sans fond) à la racine.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
