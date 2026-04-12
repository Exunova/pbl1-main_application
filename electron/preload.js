import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  fetchOHLCV: (ticker) => fetch(`http://127.0.0.1:3847/api/ohlcv/${ticker}`).then(r => r.json()),
  fetchNews: (region) => fetch(`http://127.0.0.1:3847/api/news/${region}`).then(r => r.json()),
  fetchMacro: (cc) => fetch(`http://127.0.0.1:3847/api/macro/${cc}`).then(r => r.json()),
  fetchForex: (pair) => fetch(`http://127.0.0.1:3847/api/forex/${pair}`).then(r => r.json()),
  fetchCompany: (ticker) => fetch(`http://127.0.0.1:3847/api/company/${ticker}`).then(r => r.json()),
  fetchIndex: (idx) => fetch(`http://127.0.0.1:3847/api/index/${idx}`).then(r => r.json()),
  fetchIndices: () => fetch('http://127.0.0.1:3847/api/indices').then(r => r.json()),
  triggerScrape: (type) => fetch(`http://127.0.0.1:3847/api/scrape/${type}`, {method:'POST'}).then(r => r.json()),
  scrapeStatus: () => fetch('http://127.0.0.1:3847/api/scrape/status').then(r => r.json()),
  getPositions: () => ipcRenderer.invoke('get-positions'),
  addPosition: (pos) => ipcRenderer.invoke('add-position', pos),
  deletePosition: (id) => ipcRenderer.invoke('delete-position', id),
  fetchPnL: () => fetch('http://127.0.0.1:3847/api/portfolio/pnl').then(r => r.json()),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  flaskHealth: () => ipcRenderer.invoke('flask-health')
})