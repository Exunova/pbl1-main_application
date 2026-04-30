import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { spawn } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let pythonProcess = null
const pendingRequests = new Map()

function startPythonBackend() {
  // In production (packaged), use process.resourcesPath; in dev, use __dirname relative path
  const isDev = !app.isPackaged
  const backendDir = isDev
    ? join(__dirname, '../../../backend/src')
    : join(process.resourcesPath, 'backend/src')
  const pythonScript = join(backendDir, 'ipc_main.py')

  const candidates = isDev
    ? [
        join(backendDir, '../venv/Scripts/python.exe'), // Windows venv
        join(backendDir, '../venv/bin/python3'),        // Linux/Mac venv
        '/usr/bin/python3',
        'python',
        'python3',
      ]
    : [
        join(process.resourcesPath, 'backend-venv', 'Scripts', 'python.exe'), // Windows packaged
        join(process.resourcesPath, 'backend-venv', 'bin', 'python3'),        // Linux/Mac packaged
        '/usr/bin/python3',
        'python',
      ]

  let pythonExe = 'python'
  for (const c of candidates) {
    try {
      const { existsSync } = require('fs')
      if (c.includes('/') || c.includes('\\')) {
        if (existsSync(c)) { pythonExe = c; break }
      } else {
        pythonExe = c; break
      }
    } catch {}
  }

  console.log('[Python IPC] Using Python:', pythonExe)

  pythonProcess = spawn(pythonExe, [pythonScript], {
    cwd: backendDir,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  let buffer = ''

  pythonProcess.stdout.on('data', (data) => {
    buffer += data.toString()
    let newlineIndex
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex)
      buffer = buffer.slice(newlineIndex + 1)
      if (!line.trim()) continue
      try {
        const response = JSON.parse(line)
        const pending = pendingRequests.get(response.id)
        if (pending) {
          pendingRequests.delete(response.id)
          if (response.error) {
            pending.reject(new Error(response.error))
          } else {
            pending.resolve(response.data)
          }
        }
      } catch (e) {
        console.error('[Python IPC] Failed to parse response:', line, e)
      }
    }
  })

  pythonProcess.stderr.on('data', (data) => {
    console.error('[Python IPC stderr]', data.toString().trim())
  })

  pythonProcess.on('error', (err) => {
    console.error('[Python IPC] Process error:', err)
  })

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[Python IPC] Process exited with code ${code}, signal ${signal}`)
    pythonProcess = null
    pendingRequests.forEach((pending) => {
      pending.reject(new Error('Python backend process terminated'))
    })
    pendingRequests.clear()
  })

  console.log('[Python IPC] Backend process started')
}

function sendToPython(cmd, params = {}) {
  return new Promise((resolve, reject) => {
    if (!pythonProcess || !pythonProcess.stdin) {
      reject(new Error('Python backend not running'))
      return
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const message = JSON.stringify({ id, cmd, params }) + '\n'

    pendingRequests.set(id, { resolve, reject })

    try {
      pythonProcess.stdin.write(message, (err) => {
        if (err) {
          pendingRequests.delete(id)
          reject(err)
        }
      })
    } catch (err) {
      pendingRequests.delete(id)
      reject(err)
    }
  })
}

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
      preload: join(__dirname, '../preload/preload.mjs'),
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
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mapro.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  startPythonBackend()

  ipcMain.handle('portfolio-list', () => sendToPython('portfolio_list', {}))
  ipcMain.handle('portfolio-add', (_, pos) => sendToPython('portfolio_add', pos))
  ipcMain.handle('portfolio-edit', (_, id, fields) => sendToPython('portfolio_edit', { id, ...fields }))
  ipcMain.handle('portfolio-delete', (_, id) => sendToPython('portfolio_delete', { id }))
  ipcMain.handle('portfolio-pnl', () => sendToPython('portfolio_pnl', {}))
  ipcMain.handle('portfolio-export', () => sendToPython('portfolio_export', {}))
  ipcMain.handle('portfolio-import', (_, data) => sendToPython('portfolio_import', data))

  // Data fetching handlers — route to Python backend commands
  ipcMain.handle('fetchOHLCV', (_, ticker) => sendToPython('ohlcv', { ticker }))
  ipcMain.handle('fetchNews', (_, region) => sendToPython('news', { region }))
  ipcMain.handle('fetchMacro', (_, cc) => sendToPython('macro', { cc }))
  ipcMain.handle('fetchForex', (_, pair) => sendToPython('forex', { pair }))
  ipcMain.handle('fetchCompany', (_, ticker) => sendToPython('company', { ticker }))
  ipcMain.handle('fetchCompanies', (_, tickers) => sendToPython('companies', { tickers }))
  ipcMain.handle('fetchIndex', (_, idx) => sendToPython('index', { idx }))
  ipcMain.handle('fetchIndices', () => sendToPython('indices', {}))
  ipcMain.handle('triggerScrape', (_, type) => sendToPython('scrape', { type }))
  ipcMain.handle('scrapeLatest', () => sendToPython('scrape_latest', {}))
  ipcMain.handle('scrapeStatus', () => sendToPython('scrape_status', {}))
  ipcMain.handle('flask-health', () => sendToPython('health', {}))
  ipcMain.handle('get_scraped_tickers', () => sendToPython('get_scraped_tickers', {}))

  ipcMain.on('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.on('window-maximize', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (w?.isMaximized()) w.unmaximize(); else w?.maximize()
  })
  ipcMain.on('window-close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill()
    pythonProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})
