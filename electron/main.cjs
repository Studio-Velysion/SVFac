const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let tasksDb = null;

// Stub utilisé quand la base SQLite ne peut pas être chargée (ex: better-sqlite3 non recompilé pour Electron).
// Chaque appel échoue pour que le frontend bascule sur le store (localStorage).
const DB_UNAVAILABLE = Symbol('DB_UNAVAILABLE');
function throwDbUnavailable() {
  const err = new Error('DB_UNAVAILABLE');
  err.code = DB_UNAVAILABLE;
  throw err;
}
const tasksDbStub = {
  getProjects: () => { throwDbUnavailable(); },
  getProject: () => { throwDbUnavailable(); },
  createProject: () => { throwDbUnavailable(); },
  updateProject: () => { throwDbUnavailable(); },
  deleteProject: () => { throwDbUnavailable(); },
  archiveProject: () => { throwDbUnavailable(); },
  unarchiveProject: () => { throwDbUnavailable(); },
  duplicateProject: () => { throwDbUnavailable(); },
  getTasks: () => { throwDbUnavailable(); },
  getTask: () => { throwDbUnavailable(); },
  createTask: () => { throwDbUnavailable(); },
  updateTask: () => { throwDbUnavailable(); },
  updateTaskStatus: () => { throwDbUnavailable(); },
  deleteTask: () => { throwDbUnavailable(); },
  getTaskStatsByProject: () => { throwDbUnavailable(); },
  getNotes: () => { throwDbUnavailable(); },
  updateNotes: () => { throwDbUnavailable(); },
  getProjectUpdates: () => { throwDbUnavailable(); },
  createProjectUpdate: () => { throwDbUnavailable(); },
  updateProjectUpdate: () => { throwDbUnavailable(); },
  deleteProjectUpdate: () => { throwDbUnavailable(); },
  getActivityLog: () => { throwDbUnavailable(); },
  logActivity: () => { throwDbUnavailable(); },
};

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const rootDir = path.join(__dirname, '..');
const iconPathIco = path.join(rootDir, 'icon.ico');
const iconPathPng = path.join(rootDir, 'icon.png');
const hasIcon = fs.existsSync(iconPathIco) || fs.existsSync(iconPathPng);
const iconPath = fs.existsSync(iconPathIco) ? iconPathIco : iconPathPng;

function sanitizeFolderName(name) {
  if (!name || typeof name !== 'string') return 'Client';
  return name
    .replace(/[\s]+/g, ' ')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim() || 'Client';
}

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Emplacement dossier client',
  });
  return canceled ? null : (filePaths && filePaths[0]) || null;
});

ipcMain.handle('create-client-folder', async (_e, basePath, clientName) => {
  if (!basePath || !clientName) return { ok: false, path: null };
  const dirName = sanitizeFolderName(clientName);
  const fullPath = path.join(basePath, dirName);
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    return { ok: true, path: fullPath };
  } catch (err) {
    return { ok: false, path: fullPath, error: err.message };
  }
});

ipcMain.handle('get-client-folder-path', (_e, basePath, clientName) => {
  if (!basePath || !clientName) return null;
  const dirName = sanitizeFolderName(clientName);
  return path.join(basePath, dirName);
});

/** Retourne le chemin du dossier client par défaut (Documents/Dossiers clients) et crée le dossier si besoin. */
ipcMain.handle('get-default-client-folder', async () => {
  try {
    const documentsPath = app.getPath('documents');
    const defaultFolderName = 'Dossiers clients';
    const fullPath = path.join(documentsPath, defaultFolderName);
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
  } catch (err) {
    return null;
  }
});

ipcMain.handle('list-note-files', async (_e, folderPath) => {
  if (!folderPath) return [];
  try {
    if (!fs.existsSync(folderPath)) return [];
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.(txt|md)$/i.test(e.name))
      .map((e) => ({ name: e.name, path: path.join(folderPath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (_) {
    return [];
  }
});

ipcMain.handle('list-folder-contents', async (_e, folderPath) => {
  if (!folderPath) return [];
  try {
    if (!fs.existsSync(folderPath)) return [];
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    return entries
      .map((e) => ({
        name: e.name,
        fullPath: path.join(folderPath, e.name),
        isDirectory: e.isDirectory(),
      }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  } catch (_) {
    return [];
  }
});

ipcMain.handle('create-subfolder', async (_e, parentPath, folderName) => {
  if (!parentPath || !folderName) return { ok: false, path: null };
  const safe = folderName.replace(/[<>:"/\\|?*]/g, '_').trim() || 'Nouveau dossier';
  const fullPath = path.join(parentPath, safe);
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    return { ok: true, path: fullPath };
  } catch (err) {
    return { ok: false, path: fullPath, error: err.message };
  }
});

ipcMain.handle('delete-path', async (_e, fullPath) => {
  if (!fullPath) return { ok: false };
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('read-note', async (_e, folderPath, filename) => {
  if (!folderPath || !filename) return null;
  const fullPath = path.join(folderPath, filename);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch (_) {
    return null;
  }
});

ipcMain.handle('write-note', async (_e, folderPath, filename, content) => {
  if (!folderPath || !filename) return { ok: false };
  let safeName = path.basename(filename).replace(/[<>:"/\\|?*]/g, '_');
  if (!/\.(txt|md)$/i.test(safeName)) safeName = safeName + '.txt';
  const fullPath = path.join(folderPath, safeName);
  try {
    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(fullPath, content ?? '', 'utf8');
    return { ok: true, filename: safeName };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('open-folder', async (_e, folderPath) => {
  if (!folderPath) return { ok: false };
  try {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    await shell.openPath(folderPath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('open-external', async (_e, url) => {
  if (!url || typeof url !== 'string') return;
  try {
    await shell.openExternal(url);
  } catch (_) {}
});

// --- Google Drive (stubs : à compléter avec OAuth + API Drive)
// Pour activer : configurer GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (ou fichier config) et implémenter OAuth + upload/download.
ipcMain.handle('google-drive-connect', async (_e, clientId, clientSecret) => {
  if (!clientId || !String(clientId).trim()) {
    return { ok: false, error: 'Renseignez le Client ID dans les paramètres (Google Drive).' };
  }
  return { ok: false, error: 'Connexion Google Drive en cours de développement.' };
});

ipcMain.handle('google-drive-save', async (_e, jsonContent) => {
  return { ok: false, error: 'Google Drive non configuré.' };
});
ipcMain.handle('google-drive-restore', async () => {
  return { cancelled: true };
});

ipcMain.handle('print-html-to-pdf', async (e, fullHtml) => {
  if (!fullHtml || typeof fullHtml !== 'string') return { ok: false, error: 'HTML invalide' };
  let pdfWin = null;
  try {
    const parentWin = BrowserWindow.fromWebContents(e.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(parentWin || undefined, {
      title: 'Enregistrer le PDF',
      defaultPath: `document-${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    const preloadPath = path.join(__dirname, 'preload.cjs');
    pdfWin = new BrowserWindow({
      width: 794,
      height: 1123,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true, preload: preloadPath },
    });
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml);
    await pdfWin.loadURL(dataUrl);
    await new Promise((resolve) => pdfWin.webContents.once('did-finish-load', resolve));

    const pdfBuffer = await pdfWin.webContents.printToPDF({
      printBackground: true,
      margin: { marginType: 'default' },
      landscape: false,
    });
    fs.writeFileSync(filePath, pdfBuffer);
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    if (pdfWin && !pdfWin.isDestroyed()) pdfWin.destroy();
  }
});

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SVFac — Studio Velysion Facture',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    ...(hasIcon && { icon: iconPath }),
    show: false,
  });

  if (hasIcon) win.setIcon(iconPath);

  if (isDev) {
    const devUrl = 'http://localhost:5173';
    const loadingHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chargement</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#0a0a0a;color:#fff;font-family:'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}.title{font-size:clamp(2rem,5vw,3.5rem);font-weight:700;letter-spacing:.02em;margin-bottom:3rem;text-align:center;padding:0 1rem}.bar-wrap{width:min(320px,85vw);height:8px;background:rgba(255,255,255,.12);border-radius:999px;overflow:hidden}.bar{height:100%;width:35%;background:linear-gradient(90deg,#7c3aed 0%,#a78bfa 100%);border-radius:999px;animation:load 1.4s ease-in-out infinite}@keyframes load{0%{transform:translateX(-100%)}50%{transform:translateX(200%)}100%{transform:translateX(-100%)}}</style></head><body><h1 class="title">SVFac</h1><div class="bar-wrap"><div class="bar"></div></div></body></html>`;

    win.show();
    win.focus();
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(loadingHtml));

    function pollServer() {
      http.get(devUrl, (res) => {
        if (win.isDestroyed()) return;
        win.loadURL(devUrl);
      }).on('error', () => {
        if (win.isDestroyed()) return;
        setTimeout(pollServer, 400);
      });
    }
    win.webContents.once('did-finish-load', () => {
      if (win.isDestroyed()) return;
      pollServer();
    });
  } else {
    win.once('ready-to-show', () => {
      win.show();
      win.focus();
    });
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  const { setupIpcTasksHandlers } = require('./ipc-tasks.cjs');
  try {
    const { AppDatabase } = require('./database.cjs');
    const userDataPath = app.getPath('userData');
    tasksDb = new AppDatabase(userDataPath);
    tasksDb.initialize();
    setupIpcTasksHandlers(tasksDb);
  } catch (err) {
    console.error('Erreur init base Tâches (utilisation du stockage local à la place):', err.message || err);
    tasksDb = null;
    setupIpcTasksHandlers(tasksDbStub);
  }
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => {
  if (tasksDb) {
    try {
      tasksDb.close();
    } catch (e) {}
    tasksDb = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
