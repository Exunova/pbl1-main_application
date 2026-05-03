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
  { ticker: 'AZN.L', name: "ASTRAZENECA PLC ORD SHS $0.25", price: 13512.0, change: -3.13, region: 'GB', sector: 'Healthcare', industry: 'Drug Manufacturers - General' },
  { ticker: 'BARC.L', name: "BARCLAYS PLC ORD 25P", price: 433.75, change: 0.53, region: 'GB', sector: 'Financial Services', industry: 'Banks - Diversified' },
  { ticker: 'BATS.L', name: "BRITISH AMERICAN TOBACCO PLC OR", price: 4329.0, change: 0.14, region: 'GB', sector: 'Consumer Defensive', industry: 'Tobacco' },
  { ticker: 'BP.L', name: "BP PLC $0.25", price: 571.9, change: -2.04, region: 'GB', sector: 'Energy', industry: 'Oil & Gas Integrated' },
  { ticker: 'GSK.L', name: "GSK PLC ORD 31 1/4P", price: 1901.0, change: -1.43, region: 'GB', sector: 'Healthcare', industry: 'Drug Manufacturers - General' },
  { ticker: 'HSBA.L', name: "HSBC HOLDINGS PLC ORD $0.50 (UK", price: 1359.4, change: 0.77, region: 'GB', sector: 'Financial Services', industry: 'Banks - Diversified' },
  { ticker: 'LLOY.L', name: "LLOYDS BANKING GROUP PLC ORD 10", price: 98.24, change: -1.45, region: 'GB', sector: 'Financial Services', industry: 'Banks - Regional' },
  { ticker: 'NG.L', name: "NATIONAL GRID PLC ORD 12 204/47", price: 1309.0, change: -0.24, region: 'GB', sector: 'Utilities', industry: 'Utilities - Regulated Electric' },
  { ticker: 'REL.L', name: "RELX PLC ORD 14 51/116P", price: 2698.0, change: 0.6, region: 'GB', sector: 'Industrials', industry: 'Specialty Business Services' },
  { ticker: 'SHEL.L', name: "SHELL PLC ORD EUR0.07", price: 3290.0, change: -1.08, region: 'GB', sector: 'Energy', industry: 'Oil & Gas Integrated' },
  { ticker: 'ADRO.JK', name: "Alamtri Resources Indonesia Tbk", price: 2520.0, change: 3.28, region: 'ID', sector: 'Energy', industry: 'Thermal Coal' },
  { ticker: 'ASII.JK', name: "Astra International Tbk", price: 5975.0, change: -1.24, region: 'ID', sector: 'Industrials', industry: 'Conglomerates' },
  { ticker: 'BBCA.JK', name: "Bank Central Asia Tbk", price: 5850.0, change: -2.09, region: 'ID', sector: 'Financial Services', industry: 'Banks - Regional' },
  { ticker: 'BBNI.JK', name: "Bank Negara Indonesia  (Persero", price: 3720.0, change: -2.11, region: 'ID', sector: 'Financial Services', industry: 'Banks - Regional' },
  { ticker: 'BBRI.JK', name: "Bank Rakyat Indonesia (Persero)", price: 2990.0, change: -2.61, region: 'ID', sector: 'Financial Services', industry: 'Banks - Regional' },
  { ticker: 'BMRI.JK', name: "Bank Mandiri (Persero) Tbk", price: 4390.0, change: -0.9, region: 'ID', sector: 'Financial Services', industry: 'Banks - Regional' },
  { ticker: 'KLBF.JK', name: "Kalbe Farma Tbk", price: 865.0, change: -1.14, region: 'ID', sector: 'Healthcare', industry: 'Drug Manufacturers - General' },
  { ticker: 'PGAS.JK', name: "Perusahaan Gas Negara (Persero)", price: 1940.0, change: 1.04, region: 'ID', sector: 'Utilities', industry: 'Utilities - Regulated Gas' },
  { ticker: 'TLKM.JK', name: "Telkom Indonesia (Persero) Tbk.", price: 2810.0, change: -2.09, region: 'ID', sector: 'Communication Services', industry: 'Telecom Services' },
  { ticker: 'UNVR.JK', name: "Unilever Indonesia Tbk", price: 1535.0, change: -2.54, region: 'ID', sector: 'Consumer Defensive', industry: 'Household & Personal Products' },
  { ticker: '6501.T', name: "HITACHI", price: 4795.0, change: -1.78, region: 'JP', sector: 'Industrials', industry: 'Conglomerates' },
  { ticker: '6758.T', name: "SONY GROUP CORPORATION", price: 3127.0, change: 0.45, region: 'JP', sector: 'Technology', industry: 'Consumer Electronics' },
  { ticker: '6857.T', name: "ADVANTEST CORP", price: 27815.0, change: -1.57, region: 'JP', sector: 'Technology', industry: 'Semiconductor Equipment & Materials' },
  { ticker: '7203.T', name: "TOYOTA MOTOR CORP", price: 3000.0, change: -0.76, region: 'JP', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
  { ticker: '8035.T', name: "TOKYO ELECTRON", price: 47450.0, change: 6.89, region: 'JP', sector: 'Technology', industry: 'Semiconductor Equipment & Materials' },
  { ticker: '8058.T', name: "MITSUBISHI CORP", price: 5219.0, change: 4.59, region: 'JP', sector: 'Industrials', industry: 'Conglomerates' },
  { ticker: '8306.T', name: "MITSUBISHI UFJ FINANCIAL GROUP ", price: 2798.0, change: -0.67, region: 'JP', sector: 'Financial Services', industry: 'Banks - Diversified' },
  { ticker: '8316.T', name: "SUMITOMO MITSUI FINANCIAL GROUP", price: 5541.0, change: 0.53, region: 'JP', sector: 'Financial Services', industry: 'Banks - Diversified' },
  { ticker: '9983.T', name: "FAST RETAILING CO LTD", price: 72890.0, change: -0.95, region: 'JP', sector: 'Consumer Cyclical', industry: 'Apparel Retail' },
  { ticker: '9984.T', name: "SOFTBANK GROUP CORP", price: 5424.0, change: 3.93, region: 'JP', sector: 'Communication Services', industry: 'Telecom Services' },
  { ticker: 'AAPL', name: "Apple Inc.", price: 280.14, change: 3.24, region: 'US', sector: 'Technology', industry: 'Consumer Electronics' },
  { ticker: 'AMZN', name: "Amazon.com, Inc.", price: 268.26, change: 1.21, region: 'US', sector: 'Consumer Cyclical', industry: 'Internet Retail' },
  { ticker: 'BRK-B', name: "Berkshire Hathaway Inc. New", price: 473.01, change: -0.12, region: 'US', sector: 'Financial Services', industry: 'Insurance - Diversified' },
  { ticker: 'GOOGL', name: "Alphabet Inc.", price: 385.69, change: 0.23, region: 'US', sector: 'Communication Services', industry: 'Internet Content & Information' },
  { ticker: 'JPM', name: "JP Morgan Chase & Co.", price: 312.47, change: -0.24, region: 'US', sector: 'Financial Services', industry: 'Banks - Diversified' },
  { ticker: 'LLY', name: "Eli Lilly and Company", price: 963.33, change: 3.07, region: 'US', sector: 'Healthcare', industry: 'Drug Manufacturers - General' },
  { ticker: 'META', name: "Meta Platforms, Inc.", price: 608.745, change: -0.52, region: 'US', sector: 'Communication Services', industry: 'Internet Content & Information' },
  { ticker: 'MSFT', name: "Microsoft Corporation", price: 414.44, change: 1.63, region: 'US', sector: 'Technology', industry: 'Software - Infrastructure' },
  { ticker: 'NVDA', name: "NVIDIA Corporation", price: 198.45, change: -0.56, region: 'US', sector: 'Technology', industry: 'Semiconductors' },
  { ticker: 'TSLA', name: "Tesla, Inc.", price: 390.82, change: 2.41, region: 'US', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
]

export const generateSparklineData = () => {
  return Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50);
}
