const { app, BrowserWindow, ipcMain, dialog, protocol, net, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const DB_PATH = path.join(app.getPath('userData'), 'burrito_db.json');
const IMAGES_PATH = path.join(app.getPath('userData'), 'burrito_images');

if (!fs.existsSync(IMAGES_PATH)) fs.mkdirSync(IMAGES_PATH, { recursive: true });

protocol.registerSchemesAsPrivileged([{
  scheme: 'local-resource',
  privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true, bypassCSP: true }
}]);

let mainWindow;
let hasUnsavedChanges = false;

ipcMain.handle('open-external', async (event, targetUrl) => {
  if (targetUrl?.startsWith('http')) {
    await shell.openExternal(targetUrl);
    return true;
  }
  return false;
});

ipcMain.on('set-unsaved-state', (event, state) => { hasUnsavedChanges = state; });

ipcMain.on('force-close', () => { hasUnsavedChanges = false; mainWindow.close(); });

ipcMain.handle('load-splash-config', async () => ({ enabled: false }));

ipcMain.handle('read-splash-text', async () => null);

ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (action === 'minimize') win.minimize();
  else if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
  else if (action === 'close') win.close();
});

ipcMain.handle('delete-originals', async () => {
  try {
    const files = fs.readdirSync(IMAGES_PATH);
    let deletedCount = 0;
    for (const file of files) {
      if (file.includes('_thumb')) {
        const baseName = file.replace('_thumb.jpg', '');
        for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
          const originalPath = path.join(IMAGES_PATH, baseName + ext);
          if (fs.existsSync(originalPath)) {
            fs.unlinkSync(originalPath);
            deletedCount++;
            break;
          }
        }
      }
    }
    return { success: true, count: deletedCount };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('load-db', async () => {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(await fs.promises.readFile(DB_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error("DB Load Error", e);
  }
  return { folders: [{ id: 'root', name: 'Unsorted', icon: 'Archive' }], items: [], tags: [], settings: {} };
});

ipcMain.handle('save-db', async (event, data) => {
  try {
    await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error("DB Save Error", e);
    return false;
  }
});

ipcMain.handle('read-text-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text', extensions: ['txt'] }]
  });
  return filePaths?.[0] ? fs.readFileSync(filePaths[0], 'utf-8') : null;
});

ipcMain.handle('save-imported-image', async (event, arrayBuffer) => {
  try {
    const buffer = Buffer.from(arrayBuffer);
    const filename = `import_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const filePath = path.join(IMAGES_PATH, `${filename}.png`);
    await fs.promises.writeFile(filePath, buffer);
    const image = nativeImage.createFromBuffer(buffer);
    if (!image.isEmpty()) {
      const thumbnail = image.resize({ width: 200, quality: 'best' });
      await fs.promises.writeFile(path.join(IMAGES_PATH, `${filename}_thumb.jpg`), thumbnail.toJPEG(80));
    }
    return `local-resource://${filePath}`;
  } catch (e) {
    console.error("Image Import Error:", e);
    return null;
  }
});

ipcMain.handle('fetch-civitai', async (event, { url: modelUrl, apiKey }) => {
  try {
    const idMatch = modelUrl.match(/models\/(\d+)/);
    if (!idMatch) return { success: false, error: "Invalid Civitai URL" };

    const modelId = idMatch[1];
    let versionId = null;
    try {
      const urlObj = new URL(modelUrl);
      versionId = urlObj.searchParams.get('modelVersionId');
    } catch (e) {}

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await net.fetch(`https://civitai.com/api/v1/models/${modelId}`, { headers });
    if (!response.ok) return { success: false, error: `API Error: ${response.status}` };

    const data = await response.json();
    let version = versionId ? data.modelVersions?.find(v => String(v.id) === versionId) : data.modelVersions?.[0];
    if (!version?.images) return { success: false, error: "No images found" };

    const remoteImages = version.images.slice(0, 3);
    const localImages = [];

    for (let i = 0; i < remoteImages.length; i++) {
      const imgUrl = remoteImages[i].url;
      const ext = path.extname(url.parse(imgUrl).pathname) || '.jpeg';
      const filename = `civ_${modelId}_v${version.id}_${i}${ext}`;
      const filePath = path.join(IMAGES_PATH, filename);

      try {
        if (!fs.existsSync(filePath)) {
          const imgRes = await net.fetch(imgUrl);
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            await fs.promises.writeFile(filePath, buffer);
            const image = nativeImage.createFromBuffer(buffer);
            if (!image.isEmpty()) {
              const thumbnail = image.resize({ width: 200, quality: 'best' });
              await fs.promises.writeFile(filePath.replace(ext, '_thumb.jpg'), thumbnail.toJPEG(80));
            }
          }
        }
        if (fs.existsSync(filePath)) localImages.push(`local-resource://${filePath}`);
      } catch (err) {
        console.error(`Failed to download image ${i}`, err);
      }
    }

    return localImages.length > 0
      ? { success: true, images: localImages, name: data.name }
      : { success: false, error: "Failed to download images" };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    backgroundColor: '#050505',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  let forceClose = false;
  mainWindow.on('close', (e) => {
    if (forceClose) return;
    if (hasUnsavedChanges) {
      e.preventDefault();
      mainWindow.webContents.send('prompt-unsaved');
    }
  });
};

ipcMain.handle('confirm-close', (event, saveFirst) => {
  return new Promise((resolve) => {
    if (saveFirst) {
      mainWindow.webContents.send('save-and-close');
      resolve('save');
    } else {
      forceClose = true;
      mainWindow.close();
      resolve('close');
    }
  });
});

app.on('ready', () => {
  protocol.handle('local-resource', (request) => {
    try {
      let rawPath = request.url.replace(/^local-resource:\/\//, '');
      let pathForNormalization = decodeURIComponent(rawPath);
      if (process.platform === 'win32' && pathForNormalization.match(/^[a-zA-Z][\\/]/)) {
        pathForNormalization = pathForNormalization.charAt(0) + ':' + pathForNormalization.slice(1);
      }
      return net.fetch(url.pathToFileURL(path.normalize(pathForNormalization)).toString());
    } catch (e) {
      return new Response("Internal Server Error", { status: 500 });
    }
  });
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('generate-thumbnails', async () => {
  try {
    const files = await fs.promises.readdir(IMAGES_PATH);
    let count = 0, regenerated = 0;

    for (const file of files) {
      if (file.includes('_thumb')) continue;
      const ext = path.extname(file).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

      const fullPath = path.join(IMAGES_PATH, file);
      const thumbPath = path.join(IMAGES_PATH, file.replace(ext, '_thumb.jpg'));
      let needsThumb = !fs.existsSync(thumbPath);

      if (!needsThumb) {
        const stats = fs.statSync(thumbPath);
        if (stats.size === 0) {
          needsThumb = true;
          regenerated++;
        } else {
          try {
            const testImage = nativeImage.createFromBuffer(await fs.promises.readFile(thumbPath));
            if (testImage.isEmpty()) { needsThumb = true; regenerated++; }
          } catch { needsThumb = true; regenerated++; }
        }
      }

      if (needsThumb) {
        const image = nativeImage.createFromBuffer(await fs.promises.readFile(fullPath));
        if (!image.isEmpty()) {
          await fs.promises.writeFile(thumbPath, image.resize({ width: 200, quality: 'best' }).toJPEG(80));
          count++;
        }
      }
    }
    return { success: true, count, regenerated };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
