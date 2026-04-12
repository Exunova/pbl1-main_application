export const MARKETS = {
  US: { index: "^GSPC", label: "S&P 500", tickers: ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"] },
  ID: { index: "^JKLQ45", label: "LQ45", tickers: ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"] },
  JP: { index: "^N225", label: "Nikkei 225", tickers: ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"] },
  GB: { index: "^FTSE", label: "FTSE 100", tickers: ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"] },
}

export const COUNTRY_INDEX_MAP = {
  US: { index: "^GSPC", name: "S&P 500" },
  ID: { index: "^JKLQ45", name: "LQ45" },
  JP: { index: "^N225", name: "Nikkei 225" },
  GB: { index: "^FTSE", name: "FTSE 100" },
}

export const MOCK_INDICES = [
  { index: "^GSPC", name: "S&P 500", country: "US", current_price: 5234.5, prev_close: 5200.0, change_pct: 0.66 },
  { index: "^JKLQ45", name: "LQ45", country: "ID", current_price: 1820.0, prev_close: 1810.0, change_pct: 0.55 },
  { index: "^N225", name: "Nikkei 225", country: "JP", current_price: 39500.0, prev_close: 39200.0, change_pct: 0.77 },
  { index: "^FTSE", name: "FTSE 100", country: "GB", current_price: 7950.0, prev_close: 7980.0, change_pct: -0.38 },
]

export const MOCK_FOREX = {
  "IDR_USD": { pair: "IDR_USD", label: "USD/IDR", current_rate: 15650.0, prev_close: 15620.0, change_pct: 0.19 },
  "JPY_USD": { pair: "JPY_USD", label: "USD/JPY", current_rate: 149.5, prev_close: 149.8, change_pct: -0.20 },
  "GBP_USD": { pair: "GBP_USD", label: "GBP/USD", current_rate: 0.79, prev_close: 0.78, change_pct: 0.13 },
}

export const MOCK_EVENTS = {
  US: [
    { name: "Core CPI", date: "2026-04-12", time: "08:30", impact: "high", actual: "3.1%", forecast: "3.0%", previous: "2.9%" },
    { name: "Retail Sales", date: "2026-04-12", time: "10:00", impact: "medium", actual: "0.5%", forecast: "0.4%", previous: "0.3%" },
  ],
  ID: [
    { name: "BI Rate", date: "2026-04-12", time: "14:00", impact: "high", actual: "5.75%", forecast: "5.75%", previous: "5.50%" },
  ],
  JP: [
    { name: "Core Machine Orders", date: "2026-04-13", time: "08:30", impact: "medium", actual: "—", forecast: "2.1%", previous: "1.5%" },
  ],
  GB: [
    { name: "GDP", date: "2026-04-13", time: "07:00", impact: "high", actual: "—", forecast: "0.3%", previous: "0.1%" },
  ],
}

export const MOCK_NEWS = {
  US: [
    { title: "S&P 500 rises on strong earnings reports", link: "#", publisher: "Reuters", published: "2026-04-12 08:30", thumbnail: { type: "og", url: "" } },
    { title: "Fed signals patience on rate cuts", link: "#", publisher: "Bloomberg", published: "2026-04-12 07:15", thumbnail: { type: "og", url: "" } },
  ],
  ID: [
    { title: "LQ45 hits new high as commodities rally", link: "#", publisher: "Kompas", published: "2026-04-12 09:00", thumbnail: { type: "og", url: "" } },
  ],
  JP: [
    { title: "Nikkei 225 gains on yen weakness", link: "#", publisher: "Nikkei", published: "2026-04-12 07:30", thumbnail: { type: "og", url: "" } },
  ],
  GB: [
    { title: "FTSE 100 mixed as energy stocks fall", link: "#", publisher: "FT", published: "2026-04-12 08:00", thumbnail: { type: "og", url: "" } },
  ],
}