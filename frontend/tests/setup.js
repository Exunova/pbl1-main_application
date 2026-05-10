import { vi } from "vitest";

const mockIpcRenderer = {
    invoke: vi.fn(),
    send: vi.fn(),
};

// Mock ResizeObserver for jsdom (used by lightweight-charts/CandlestickChart)
class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
        this.observe = vi.fn();
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
    }
}
global.ResizeObserver = ResizeObserver;

// Mock usePortfolio hook for PortfolioView tests
// Returns resolved state with empty positions to allow testing of UI elements
vi.mock('../src/hooks/usePortfolio.js', () => ({
    usePortfolio: () => ({
        positions: [],
        pnlData: { total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 } },
        showAdd: false,
        setShowAdd: vi.fn(),
        form: { ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' },
        setForm: vi.fn(),
        editingId: null,
        availableTickers: [],
        showTickerDropdown: false,
        setShowTickerDropdown: vi.fn(),
        isInitialLoad: false, // Changed from true to allow rendering of full UI
        sharesError: false,
        setSharesError: vi.fn(),
        errorMessage: '',
        setErrorMessage: vi.fn(),
        deleteTarget: null,
        setDeleteTarget: vi.fn(),
        handleSave: vi.fn(),
        handleDelete: vi.fn(),
        handleEditClick: vi.fn(),
        pieData: [],
        treeData: [],
        openAddModal: vi.fn(),
        resetForm: vi.fn(),
    }),
}))

Object.defineProperty(globalThis, "window", {
    value: {
        api: {
            fetchOHLCV: vi.fn().mockResolvedValue({}),
            fetchNews: vi.fn(),
            fetchMacro: vi.fn(),
            fetchForex: vi.fn(),
            fetchCompany: vi.fn().mockResolvedValue({}),
            fetchCompanies: vi.fn().mockResolvedValue({}),
            fetchIndex: vi.fn(),
            fetchIndices: vi.fn(),
            triggerScrape: vi.fn(),
            scrapeStatus: vi.fn(),
            getPositions: vi.fn(),
            addPosition: vi.fn(),
            deletePosition: vi.fn(),
            editPosition: vi.fn(),
            fetchPnL: vi.fn(),
            portfolioExport: vi.fn(),
            portfolioImport: vi.fn(),
            flaskHealth: vi.fn(),
            getScrapedTickers: vi.fn().mockResolvedValue([]),
            scrapeLatest: vi.fn(),
            minimize: vi.fn(),
            maximize: vi.fn(),
            close: vi.fn(),
        },
        requestAnimationFrame: vi.fn(),
        cancelAnimationFrame: vi.fn(),
    },
    writable: true,
});

export { mockIpcRenderer };
