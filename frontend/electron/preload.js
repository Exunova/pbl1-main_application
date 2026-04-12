import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Data fetching (all via IPC → Python backend)
  fetchOHLCV: (ticker) => ipcRenderer.invoke('fetchOHLCV', ticker),
  fetchNews: (region) => ipcRenderer.invoke('fetchNews', region),
  fetchMacro: (cc) => ipcRenderer.invoke('fetchMacro', cc),
  fetchForex: (pair) => ipcRenderer.invoke('fetchForex', pair),
  fetchCompany: (ticker) => ipcRenderer.invoke('fetchCompany', ticker),
  fetchIndex: (idx) => ipcRenderer.invoke('fetchIndex', idx),
  fetchIndices: () => ipcRenderer.invoke('fetchIndices'),
  triggerScrape: (type) => ipcRenderer.invoke('triggerScrape', type),
  scrapeStatus: () => ipcRenderer.invoke('scrapeStatus'),

  // Portfolio (via IPC → Python backend)
  getPositions: () => ipcRenderer.invoke('get-positions'),
  addPosition: (pos) => ipcRenderer.invoke('add-position', pos),
  deletePosition: (id) => ipcRenderer.invoke('delete-position', id),
  editPosition: (id, fields) => ipcRenderer.invoke('edit-position', id, fields),
  fetchPnL: () => ipcRenderer.invoke('fetchPnL'),
  portfolioExport: () => ipcRenderer.invoke('portfolio-export'),
  portfolioImport: (positions) => ipcRenderer.invoke('portfolio-import', positions),

  // Health check
  flaskHealth: () => ipcRenderer.invoke('flask-health'),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})