const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const pkgPath = path.join(root, 'package.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const parts = pkg.version.split('.').map(Number);
// Incrémente le dernier chiffre (patch) : 1.0.4 → 1.0.5
parts[parts.length - 1] = (parts[parts.length - 1] || 0) + 1;
const newVersion = parts.join('.');

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('Version mise à jour :', pkg.version);
