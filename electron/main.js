import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { spawn, execSync } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as db from './db'

let flaskProc = null

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    backgroundColor: '#0d0f14',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../src/index.html'))
  }
}

function startFlask() {
  const serverPath = join(__dirname, '..', 'server', 'main.py')
  flaskProc = spawn('python3', [serverPath], {
    cwd: join(__dirname, '..'),
    stdio: 'pipe',
    detached: false
  })
  flaskProc.stdout.on('data', (d) => process.stdout.write(d))
  flaskProc.stderr.on('data', (d) => process.stderr.write(d))
  flaskProc.on('error', (e) => console.error('Flask error:', e))
}

function stopFlask() {
  if (flaskProc) {
    flaskProc.kill()
    flaskProc = null
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mapro.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('get-positions', () => db.getPositions())
  ipcMain.handle('add-position', (_, pos) => db.addPosition(pos))
  ipcMain.handle('delete-position', (_, id) => db.deletePosition(id))

  ipcMain.on('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.on('window-maximize', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (w?.isMaximized()) w.unmaximize(); else w?.maximize()
  })
  ipcMain.on('window-close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())

  ipcMain.handle('flask-health', async () => {
    try {
      const res = await fetch('http://127.0.0.1:3847/health')
      return res.ok
    } catch { return false }
  })

  startFlask()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopFlask()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopFlask()
})