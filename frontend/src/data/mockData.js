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

export const stockScreenerData = [
  // --- Asia Pacific ---
  { ticker: 'BBCA.JK', name: 'Bank Central Asia', price: '9,850', change: 1.25, region: 'Asia Pacific', sector: 'Finance', industry: 'Commercial Banks', cap: '1,213.2T', pe: '24.5', div: '2.1%' },
  { ticker: 'TLKM.JK', name: 'Telkom Indonesia', price: '3,840', change: -0.52, region: 'Asia Pacific', sector: 'Communication Services', industry: 'Telecom Services', cap: '380.4T', pe: '15.2', div: '4.5%' },
  { ticker: 'ASII.JK', name: 'Astra International', price: '5,125', change: 0.98, region: 'Asia Pacific', sector: 'Consumer Discretionary', industry: 'Automotive', cap: '207.5T', pe: '8.4', div: '6.2%' },
  { ticker: 'BMRI.JK', name: 'Bank Mandiri', price: '6,750', change: 2.11, region: 'Asia Pacific', sector: 'Finance', industry: 'Commercial Banks', cap: '630.1T', pe: '12.5', div: '3.8%' },
  { ticker: '7203.T', name: 'Toyota Motor', price: '3,456', change: 1.54, region: 'Asia Pacific', sector: 'Consumer Discretionary', industry: 'Automotive', cap: '45.2T JPY', pe: '10.5', div: '2.8%' },
  { ticker: '005930.KS', name: 'Samsung Electronics', price: '82,400', change: 3.21, region: 'Asia Pacific', sector: 'Technology', industry: 'Semiconductors', cap: '492.1T KRW', pe: '14.2', div: '1.9%' },
  { ticker: '0700.HK', name: 'Tencent Holdings', price: '312.4', change: -1.23, region: 'Asia Pacific', sector: 'Communication Services', industry: 'Entertainment', cap: '2.9T HKD', pe: '22.8', div: '0.8%' },
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', price: '2,845', change: 0.45, region: 'Asia Pacific', sector: 'Energy', industry: 'Oil & Gas', cap: '19.2T INR', pe: '25.6', div: '0.4%' },
  { ticker: 'CBA.AX', name: 'Commonwealth Bank', price: '115.2', change: -0.12, region: 'Asia Pacific', sector: 'Finance', industry: 'Commercial Banks', cap: '192.4B AUD', pe: '18.4', div: '4.2%' },
  { ticker: 'SONY.T', name: 'Sony Group Corp', price: '12,980', change: 0.65, region: 'Asia Pacific', sector: 'Technology', industry: 'Electronic Components', cap: '16.4T JPY', pe: '15.8', div: '0.7%' },
  { ticker: 'BYD.HK', name: 'BYD Company', price: '215.6', change: 4.12, region: 'Asia Pacific', sector: 'Consumer Discretionary', industry: 'Automotive', cap: '628B HKD', pe: '28.4', div: '0.5%' },
  { ticker: 'BDO.PS', name: 'BDO Unibank', price: '148.5', change: -0.32, region: 'Asia Pacific', sector: 'Finance', industry: 'Commercial Banks', cap: '785B PHP', pe: '11.2', div: '2.4%' },
  { ticker: 'DBS.SI', name: 'DBS Group Holdings', price: '36.10', change: 0.85, region: 'Asia Pacific', sector: 'Finance', industry: 'Commercial Banks', cap: '92B SGD', pe: '10.1', div: '5.2%' },

  // --- Americas ---
  { ticker: 'AAPL', name: 'Apple Inc', price: '185.32', change: 1.15, region: 'Americas', sector: 'Technology', industry: 'Consumer Electronics', cap: '2.8T USD', pe: '28.4', div: '0.5%' },
  { ticker: 'MSFT', name: 'Microsoft Corp', price: '420.55', change: 0.92, region: 'Americas', sector: 'Technology', industry: 'Software', cap: '3.1T USD', pe: '35.6', div: '0.7%' },
  { ticker: 'GOOGL', name: 'Alphabet Inc', price: '152.18', change: -0.45, region: 'Americas', sector: 'Communication Services', industry: 'Internet Services', cap: '1.9T USD', pe: '24.1', div: '0.0%' },
  { ticker: 'AMZN', name: 'Amazon.com Inc', price: '187.20', change: 2.15, region: 'Americas', sector: 'Consumer Discretionary', industry: 'Internet Retail', cap: '1.8T USD', pe: '52.3', div: '0.0%' },
  { ticker: 'NVDA', name: 'NVIDIA Corp', price: '890.45', change: 4.52, region: 'Americas', sector: 'Technology', industry: 'Semiconductors', cap: '2.2T USD', pe: '75.2', div: '0.0%' },
  { ticker: 'TSLA', name: 'Tesla Inc', price: '175.40', change: -3.21, region: 'Americas', sector: 'Consumer Discretionary', industry: 'Automotive', cap: '556B USD', pe: '42.8', div: '0.0%' },
  { ticker: 'VALE', name: 'Vale S.A.', price: '12.45', change: -1.12, region: 'Americas', sector: 'Materials', industry: 'Mining', cap: '54B USD', pe: '6.5', div: '8.4%' },
  { ticker: 'MELI', name: 'MercadoLibre Inc', price: '1,452.12', change: 1.85, region: 'Americas', sector: 'Consumer Discretionary', industry: 'Internet Retail', cap: '73B USD', pe: '65.2', div: '0.0%' },
  { ticker: 'RY', name: 'Royal Bank of Canada', price: '138.25', change: 0.42, region: 'Americas', sector: 'Finance', industry: 'Commercial Banks', cap: '194B CAD', pe: '12.4', div: '4.1%' },
  { ticker: 'PETR4.SA', name: 'Petrobras', price: '38.45', change: -2.15, region: 'Americas', sector: 'Energy', industry: 'Oil & Gas', cap: '512B BRL', pe: '4.2', div: '14.5%' },
  { ticker: 'JPM', name: 'JPMorgan Chase', price: '198.45', change: 0.58, region: 'Americas', sector: 'Finance', industry: 'Commercial Banks', cap: '570B USD', pe: '11.8', div: '2.2%' },

  // --- Europe ---
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', price: '821.50', change: 1.45, region: 'Europe', sector: 'Consumer Discretionary', industry: 'Luxury Goods', cap: '410B EUR', pe: '24.2', div: '1.6%' },
  { ticker: 'ASML.AS', name: 'ASML Holding', price: '912.40', change: 2.15, region: 'Europe', sector: 'Technology', industry: 'Semiconductor Equipment', cap: '360B EUR', pe: '45.1', div: '0.8%' },
  { ticker: 'SAP.DE', name: 'SAP SE', price: '178.55', change: 0.92, region: 'Europe', sector: 'Technology', industry: 'Software', cap: '210B EUR', pe: '32.4', div: '1.2%' },
  { ticker: 'NESN.SW', name: 'Nestle S.A.', price: '92.45', change: -0.52, region: 'Europe', sector: 'Consumer Staples', industry: 'Packaged Foods', cap: '245B CHF', pe: '18.4', div: '3.2%' },
  { ticker: 'SHELL.L', name: 'Shell plc', price: '2,845', change: 1.12, region: 'Europe', sector: 'Energy', industry: 'Oil & Gas', cap: '192B GBP', pe: '8.4', div: '4.1%' },
  { ticker: 'HSBA.L', name: 'HSBC Holdings', price: '645.2', change: 0.45, region: 'Europe', sector: 'Finance', industry: 'Commercial Banks', cap: '120B GBP', pe: '7.2', div: '7.8%' },
  { ticker: 'AIR.PA', name: 'Airbus SE', price: '165.25', change: 1.85, region: 'Europe', sector: 'Industrials', industry: 'Aerospace', cap: '130B EUR', pe: '22.4', div: '1.1%' },
  { ticker: 'OR.PA', name: 'L\'Oreal', price: '435.80', change: 0.65, region: 'Europe', sector: 'Consumer Staples', industry: 'Personal Care', cap: '232B EUR', pe: '35.4', div: '1.5%' },
  { ticker: 'VOW3.DE', name: 'Volkswagen AG', price: '124.50', change: -1.45, region: 'Europe', sector: 'Consumer Discretionary', industry: 'Automotive', cap: '70B EUR', pe: '4.2', div: '7.5%' },
  { ticker: 'NOVN.SW', name: 'Novartis AG', price: '88.25', change: 0.32, region: 'Europe', sector: 'Healthcare', industry: 'Pharmaceuticals', cap: '185B CHF', pe: '14.5', div: '3.8%' },

  // --- Middle East ---
  { ticker: '2222.SR', name: 'Saudi Aramco', price: '31.45', change: -0.25, region: 'Middle East', sector: 'Energy', industry: 'Oil & Gas', cap: '7.6T SAR', pe: '15.4', div: '4.8%' },
  { ticker: '1120.SR', name: 'Al Rajhi Bank', price: '82.40', change: 0.85, region: 'Middle East', sector: 'Finance', industry: 'Commercial Banks', cap: '330B SAR', pe: '18.2', div: '2.5%' },
  { ticker: 'FAB.AD', name: 'First Abu Dhabi Bank', price: '13.85', change: -0.92, region: 'Middle East', sector: 'Finance', industry: 'Commercial Banks', cap: '152B AED', pe: '10.4', div: '5.2%' },
  { ticker: 'ETISALAT.AD', name: 'e& (Etisalat)', price: '18.45', change: 0.45, region: 'Middle East', sector: 'Communication Services', industry: 'Telecom Services', cap: '160B AED', pe: '16.4', div: '4.4%' },
  { ticker: 'QNBK.QA', name: 'Qatar National Bank', price: '14.55', change: -0.32, region: 'Middle East', sector: 'Finance', industry: 'Commercial Banks', cap: '135B QAR', pe: '9.2', div: '5.8%' },
  { ticker: 'TEVA.TA', name: 'Teva Pharmaceutical', price: '52.10', change: 3.42, region: 'Middle East', sector: 'Healthcare', industry: 'Pharmaceuticals', cap: '58B ILS', pe: '12.4', div: '0.0%' },
  { ticker: 'ICL.TA', name: 'ICL Group', price: '18.45', change: -1.45, region: 'Middle East', sector: 'Materials', industry: 'Chemicals', cap: '24B ILS', pe: '7.5', div: '6.2%' }
]

export const generateSparklineData = () => {
  return Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50);
}