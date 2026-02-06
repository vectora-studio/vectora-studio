import { app, BrowserWindow, dialog, ipcMain } from 'electron';

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

/* ---------- WINDOW CONTROLS ---------- */
ipcMain.on('window:minimize', () => {
  if (win) win.minimize();
});

ipcMain.on('window:maximize', () => {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on('window:close', () => {
  if (win) win.close();
});

/* ---------- FILE DIALOGS ---------- */
ipcMain.handle('open-file-dialog', async () => {
  return await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
});

ipcMain.handle('select-export-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.canceled ? null : result;
});

app.whenReady().then(createWindow);
