const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const PORT = 5173;
const isWin = process.platform === 'win32';

// Lancer le serveur Vite (sans shell pour pouvoir l'arrêter proprement à la fermeture)
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteBin, '--port', String(PORT)], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: false,
});

// Lancer Electron sans shell pour éviter la deprecation DEP0190 (args non échappés)
const electronCli = path.join(root, 'node_modules', 'electron', 'cli.js');
const electron = spawn(process.execPath, [electronCli, '.'], { cwd: root, stdio: 'inherit', windowsHide: false });

function stopServer() {
  try {
    if (vite.pid) {
      if (isWin) {
        spawn('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      } else {
        process.kill(-vite.pid, 'SIGTERM');
      }
    }
  } catch (_) {}
}

// Quand on ferme Electron : arrêter le serveur puis quitter
electron.on('close', (code) => {
  stopServer();
  process.exit(code ?? 0);
});

// Si le serveur s'arrête tout seul, quitter aussi
vite.on('close', (code) => {
  process.exit(code ?? 0);
});

// Arrêter le serveur à la sortie du processus (Ctrl+C, fermeture du terminal)
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(0); });
process.on('SIGTERM', () => { stopServer(); process.exit(0); });
