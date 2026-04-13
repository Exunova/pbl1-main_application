import { vi } from "vitest";

const mockIpcRenderer = {
    invoke: vi.fn(),
    send: vi.fn(),
};

Object.defineProperty(globalThis, "window", {
    value: {
        api: {
            fetchOHLCV: vi.fn(),
            fetchNews: vi.fn(),
            fetchMacro: vi.fn(),
            fetchForex: vi.fn(),
            fetchCompany: vi.fn(),
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
            minimize: vi.fn(),
            maximize: vi.fn(),
            close: vi.fn(),
        },
    },
    writable: true,
});

export { mockIpcRenderer };
