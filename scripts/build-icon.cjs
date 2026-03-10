const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const pngPath = path.join(root, 'icon.png');
const icoPath = path.join(root, 'icon.ico');
const squarePath = path.join(root, 'icon-square.png');

if (!fs.existsSync(pngPath)) {
  console.error('icon.png introuvable à la racine du projet.');
  process.exit(1);
}

async function main() {
  const sharp = require('sharp');
  const size = 256; // Taille pour icône Bureau bien visible (comme les autres icônes)

  // Recadrer le logo (supprimer les marges transparentes) puis le mettre en 256x256
  // pour qu'il remplisse l'icône du Bureau et paraisse aussi gros que les autres
  const trimmed = await sharp(pngPath)
    .trim({ threshold: 10 })
    .toBuffer();
  await sharp(trimmed)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(squarePath);

  try {
    const out = execSync(`npx png-to-ico icon-square.png`, {
      cwd: root,
      encoding: 'buffer',
    });
    fs.writeFileSync(icoPath, out);
    console.log('icon.ico généré avec succès.');
  } finally {
    try { fs.unlinkSync(squarePath); } catch (_) {}
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
