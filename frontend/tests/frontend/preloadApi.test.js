import { describe, it, expect, vi } from 'vitest'

const preloadContent = `import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  fetchOHLCV: (ticker) => ipcRenderer.invoke('fetchOHLCV', ticker),
  fetchNews: (region) => ipcRenderer.invoke('fetchNews', region),
  fetchMacro: (cc) => ipcRenderer.invoke('fetchMacro', cc),
  fetchForex: (pair) => ipcRenderer.invoke('fetchForex', pair),
  fetchCompany: (ticker) => ipcRenderer.invoke('fetchCompany', ticker),
  fetchIndex: (idx) => ipcRenderer.invoke('fetchIndex', idx),
  fetchIndices: () => ipcRenderer.invoke('fetchIndices'),
  triggerScrape: (type) => ipcRenderer.invoke('triggerScrape', type),
  scrapeStatus: () => ipcRenderer.invoke('scrapeStatus'),
  getPositions: () => ipcRenderer.invoke('portfolio-list'),
  addPosition: (pos) => ipcRenderer.invoke('portfolio-add', pos),
  deletePosition: (id) => ipcRenderer.invoke('portfolio-delete', id),
  editPosition: (id, fields) => ipcRenderer.invoke('portfolio-edit', id, fields),
  fetchPnL: () => ipcRenderer.invoke('portfolio-pnl'),
  portfolioExport: () => ipcRenderer.invoke('portfolio-export'),
  portfolioImport: (positions) => ipcRenderer.invoke('portfolio-import', positions),
  flaskHealth: () => ipcRenderer.invoke('flask-health'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})`

describe('preload.js API Surface', () => {
  const requiredDataFetchers = [
    'fetchOHLCV',
    'fetchNews',
    'fetchMacro',
    'fetchForex',
    'fetchCompany',
    'fetchIndex',
    'fetchIndices',
    'triggerScrape',
    'scrapeStatus',
  ]

  const requiredPortfolioMethods = [
    'getPositions',
    'addPosition',
    'deletePosition',
    'editPosition',
    'fetchPnL',
    'portfolioExport',
    'portfolioImport',
  ]

  const requiredWindowControls = [
    'minimize',
    'maximize',
    'close',
  ]

  const allMethods = [...requiredDataFetchers, ...requiredPortfolioMethods, ...requiredWindowControls, 'flaskHealth']

  requiredDataFetchers.forEach(method => {
    it(`${method} is defined using ipcRenderer.invoke`, () => {
      expect(preloadContent).toContain(`${method}:`)
      expect(preloadContent).toContain(`ipcRenderer.invoke`)
    })
  })

  requiredPortfolioMethods.forEach(method => {
    it(`${method} is defined using ipcRenderer.invoke`, () => {
      expect(preloadContent).toContain(`${method}:`)
      expect(preloadContent).toContain(`ipcRenderer.invoke`)
    })
  })

  requiredWindowControls.forEach(method => {
    it(`${method} is defined using ipcRenderer.send`, () => {
      expect(preloadContent).toContain(`${method}:`)
      expect(preloadContent).toContain(`ipcRenderer.send`)
    })
  })

  it('flaskHealth is defined using ipcRenderer.invoke', () => {
    expect(preloadContent).toContain('flaskHealth:')
    expect(preloadContent).toContain(`ipcRenderer.invoke('flask-health')`)
  })

  it('ALL required methods are present', () => {
    allMethods.forEach(method => {
      expect(preloadContent).toContain(`${method}:`)
    })
  })

  it('fetchOHLCV uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('fetchOHLCV'`)
  })

  it('fetchNews uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('fetchNews'`)
  })

  it('fetchMacro uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('fetchMacro'`)
  })

  it('fetchForex uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('fetchForex'`)
  })

  it('fetchCompany uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('fetchCompany'`)
  })

  it('fetchIndex uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('fetchIndex'`)
  })

  it('fetchIndices uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('fetchIndices'`)
  })

  it('triggerScrape uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('triggerScrape'`)
  })

  it('scrapeStatus uses correct channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('scrapeStatus'`)
  })

  it('getPositions uses portfolio-list channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('portfolio-list'`)
  })

  it('addPosition uses portfolio-add channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('portfolio-add'`)
  })

  it('deletePosition uses portfolio-delete channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('portfolio-delete'`)
  })

  it('editPosition uses portfolio-edit channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('portfolio-edit'`)
  })

  it('fetchPnL uses portfolio-pnl channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('portfolio-pnl'`)
  })

  it('portfolioExport uses portfolio-export channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('portfolio-export'`)
  })

  it('portfolioImport uses portfolio-import channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('portfolio-import'`)
  })

  it('flaskHealth uses flask-health channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.invoke('flask-health'`)
  })

  it('minimize uses window-minimize channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.send('window-minimize')`)
  })

  it('maximize uses window-maximize channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.send('window-maximize')`)
  })

  it('close uses window-close channel', () => {
    expect(preloadContent).toContain(`ipcRenderer.send('window-close')`)
  })

  it('Data fetchers use ipcRenderer.invoke', () => {
    const invokeCount = (preloadContent.match(/ipcRenderer\.invoke/g) || []).length
    expect(invokeCount).toBe(17)
  })

  it('Window controls use ipcRenderer.send', () => {
    const sendCount = (preloadContent.match(/ipcRenderer\.send/g) || []).length
    expect(sendCount).toBe(3)
  })

  it('contextBridge.exposeInMainWorld is used', () => {
    expect(preloadContent).toContain('contextBridge.exposeInMainWorld')
  })

  it('api object is exposed to window', () => {
    expect(preloadContent).toContain("exposeInMainWorld('api'")
  })
})