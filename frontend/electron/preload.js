import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    fetchOHLCV: (ticker) => ipcRenderer.invoke("fetchOHLCV", ticker),
    fetchNews: (region) => ipcRenderer.invoke("fetchNews", region),
    fetchMacro: (cc) => ipcRenderer.invoke("fetchMacro", cc),
    fetchForex: (pair) => ipcRenderer.invoke("fetchForex", pair),
    fetchCompany: (ticker) => ipcRenderer.invoke("fetchCompany", ticker),
    fetchCompanies: (tickers) =>
        ipcRenderer.invoke("fetchCompanies", { tickers }),
    fetchIndex: (idx) => ipcRenderer.invoke("fetchIndex", idx),
    fetchIndices: () => ipcRenderer.invoke("fetchIndices"),
    triggerScrape: (type) => ipcRenderer.invoke("triggerScrape", type),
    scrapeLatest: () => ipcRenderer.invoke("scrapeLatest"),
    scrapeStatus: () => ipcRenderer.invoke("scrapeStatus"),

    getPositions: () => ipcRenderer.invoke("portfolio-list"),
    addPosition: (pos) => ipcRenderer.invoke("portfolio-add", pos),
    deletePosition: (id) => ipcRenderer.invoke("portfolio-delete", id),
    editPosition: (id, fields) =>
        ipcRenderer.invoke("portfolio-edit", id, fields),
    fetchPnL: () => ipcRenderer.invoke("portfolio-pnl"),
    portfolioExport: () => ipcRenderer.invoke("portfolio-export"),
    portfolioImport: (positions) =>
        ipcRenderer.invoke("portfolio-import", positions),

    flaskHealth: () => ipcRenderer.invoke("flask-health"),

    minimize: () => ipcRenderer.send("window-minimize"),
    maximize: () => ipcRenderer.send("window-maximize"),
    close: () => ipcRenderer.send("window-close"),
});
