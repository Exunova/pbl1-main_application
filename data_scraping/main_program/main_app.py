"""
MAPRO — Program Utama (PyQt5)
Jalankan: python main_app.py

Pastikan semua anggota sudah push data ke GitHub
dan kamu sudah git pull sebelum menjalankan ini.
"""

import sys
import json
import os
from datetime import datetime
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QTabWidget, QWidget, QVBoxLayout,
    QHBoxLayout, QLabel, QTableWidget, QTableWidgetItem, QScrollArea,
    QFrame, QGroupBox, QHeaderView
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont, QColor

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "../data")


# ─── Helper ──────────────────────────────────────────────────────────────────

def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARN] Cannot load {path}: {e}")
        return {}


def fmt(val, decimals=2):
    if val is None:
        return "—"
    try:
        return f"{float(val):,.{decimals}f}"
    except:
        return str(val)


def fmt_pct(val):
    if val is None:
        return "—"
    try:
        v = float(val)
        pct = v * 100 if abs(v) < 1 else v
        return f"{pct:+.2f}%"
    except:
        return "—"


def color_for(val):
    try:
        return QColor("#22c55e") if float(val) >= 0 else QColor("#ef4444")
    except:
        return QColor("#94a3b8")


def lbl(text, bold=False, size=11, color=None):
    w = QLabel(str(text))
    f = QFont("Segoe UI", size)
    f.setBold(bold)
    w.setFont(f)
    if color:
        w.setStyleSheet(f"color: {color};")
    w.setWordWrap(True)
    return w


def make_table(headers):
    t = QTableWidget()
    t.setColumnCount(len(headers))
    t.setHorizontalHeaderLabels(headers)
    t.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
    t.setEditTriggers(QTableWidget.NoEditTriggers)
    t.setAlternatingRowColors(True)
    return t


def set_cell(table, row, col, text, fg=None):
    item = QTableWidgetItem(str(text))
    item.setTextAlignment(Qt.AlignCenter)
    if fg:
        item.setForeground(fg)
    table.setItem(row, col, item)


# ─── Tab 1: OHLCV ────────────────────────────────────────────────────────────

class OHLCVTab(QWidget):
    MARKETS = {
        "US": ["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM"],
        "ID": ["BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK"],
        "JP": ["7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T"],
        "GB": ["AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"],
    }

    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(lbl("Harga Historikal Saham & Index", bold=True, size=13))
        tabs = QTabWidget()
        for market, tickers in self.MARKETS.items():
            tabs.addTab(self._market_tab(market, tickers), market)
        layout.addWidget(tabs)

    def _market_tab(self, market, tickers):
        inner  = QWidget()
        layout = QVBoxLayout(inner)
        for ticker in tickers:
            fname = ticker.replace(".", "_").replace("^", "IDX_").replace("-", "_") + ".json"
            data  = load_json(os.path.join(DATA_DIR, "ohlcv", fname))
            box   = QGroupBox(ticker)
            bl    = QVBoxLayout(box)

            daily = data.get("ohlcv_daily", [])
            m1    = data.get("ohlcv_1m", [])

            if daily:
                last = daily[-1]
                row  = QHBoxLayout()
                for label, key in [("Date", "date"),("O","open"),("H","high"),("L","low"),("C","close"),("Vol","volume")]:
                    row.addWidget(lbl(f"{label}: {fmt(last.get(key), 0 if key == 'volume' else 2)}", size=10))
                row.addWidget(lbl(f"| {len(daily)} hari daily", size=10, color="#94a3b8"))
                bl.addLayout(row)
            else:
                bl.addWidget(lbl("Tidak ada data daily", color="#ef4444", size=10))

            bl.addWidget(lbl(f"Data 1m: {len(m1)} candles (7 hari terakhir)", color="#94a3b8", size=9))
            layout.addWidget(box)

        scroll = QScrollArea()
        scroll.setWidget(inner)
        scroll.setWidgetResizable(True)
        return scroll


# ─── Tab 2: Company Info ─────────────────────────────────────────────────────

class CompanyInfoTab(QWidget):
    ALL_TICKERS = [
        "NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM",
        "BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK",
        "7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T",
        "AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L",
    ]

    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(lbl("Informasi Perusahaan", bold=True, size=13))

        table = make_table(["Ticker","Nama","Sektor","Industri","Market Cap","P/E","Div Yield","Analis"])
        rows  = []
        for ticker in self.ALL_TICKERS:
            fname = ticker.replace(".", "_").replace("-", "_") + ".json"
            data  = load_json(os.path.join(DATA_DIR, "company_info", fname))
            info  = data.get("info", {})
            iden  = info.get("identity", {})
            val   = info.get("valuation", {})
            div   = info.get("dividend", {})
            ana   = info.get("analyst", {})
            rows.append([
                ticker,
                iden.get("longName") or "—",
                iden.get("sector")   or "—",
                iden.get("industry") or "—",
                fmt(val.get("marketCap"), 0),
                fmt(val.get("trailingPE")),
                fmt_pct(div.get("dividendYield")),
                ana.get("recommendationKey") or "—",
            ])

        table.setRowCount(len(rows))
        for r, row_data in enumerate(rows):
            for c, cell in enumerate(row_data):
                set_cell(table, r, c, cell)
        layout.addWidget(table)


# ─── Tab 3: Berita ───────────────────────────────────────────────────────────

class NewsTab(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(lbl("Berita per Index", bold=True, size=13))
        tabs = QTabWidget()
        for market in ["US", "ID", "JP", "GB"]:
            tabs.addTab(self._news_tab(market), market)
        layout.addWidget(tabs)

    def _news_tab(self, market):
        data     = load_json(os.path.join(DATA_DIR, "news", f"{market.lower()}_news.json"))
        articles = data.get("articles", [])

        inner  = QWidget()
        layout = QVBoxLayout(inner)
        layout.addWidget(lbl(
            f"{data.get('label', market)}  ·  {len(articles)} artikel  ·  {data.get('scraped_at','—')}",
            color="#94a3b8", size=9
        ))

        for art in articles:
            frame = QFrame()
            frame.setFrameShape(QFrame.StyledPanel)
            fl = QVBoxLayout(frame)
            fl.addWidget(lbl(art.get("title", "—"), bold=True, size=11))

            pub   = art.get("publisher", "")
            ts    = art.get("published", "")
            thumb = art.get("thumbnail", {}).get("type", "—")
            fl.addWidget(lbl(f"{pub}  ·  {ts}  ·  thumbnail: {thumb}", color="#94a3b8", size=9))

            link = art.get("link", "")
            if link:
                link_lbl = QLabel(f'<a href="{link}">Buka artikel ↗</a>')
                link_lbl.setOpenExternalLinks(True)
                link_lbl.setFont(QFont("Segoe UI", 9))
                fl.addWidget(link_lbl)

            layout.addWidget(frame)

        scroll = QScrollArea()
        scroll.setWidget(inner)
        scroll.setWidgetResizable(True)
        return scroll


# ─── Tab 4: Macroeconomic Events ─────────────────────────────────────────────

class MacroTab(QWidget):
    IMPACT_COLOR = {"high": "#ef4444", "medium": "#f59e0b", "low": "#94a3b8"}

    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(lbl("Macroeconomic Events", bold=True, size=13))
        tabs = QTabWidget()
        for code in ["US", "ID", "JP", "GB"]:
            tabs.addTab(self._country_tab(code), code)
        layout.addWidget(tabs)

    def _country_tab(self, code):
        data   = load_json(os.path.join(DATA_DIR, "macro", f"{code.lower()}_macro.json"))
        events = data.get("events", [])

        table = make_table(["Nama Event","Tanggal","Waktu","Impact","Actual","Forecast","Previous"])
        table.setRowCount(len(events))
        for r, ev in enumerate(events):
            set_cell(table, r, 0, ev.get("name",""))
            set_cell(table, r, 1, ev.get("date",""))
            set_cell(table, r, 2, ev.get("time",""))
            impact = ev.get("impact","")
            set_cell(table, r, 3, impact, fg=QColor(self.IMPACT_COLOR.get(impact, "#94a3b8")))
            set_cell(table, r, 4, ev.get("actual","—"))
            set_cell(table, r, 5, ev.get("forecast","—"))
            set_cell(table, r, 6, ev.get("previous","—"))

        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.addWidget(lbl(
            f"{data.get('name', code)}  ·  {len(events)} events  ·  {data.get('scraped_at','—')}",
            color="#94a3b8", size=9
        ))
        layout.addWidget(table)
        return widget


# ─── Tab 5: Forex ────────────────────────────────────────────────────────────

class ForexTab(QWidget):
    PAIRS = ["IDR_USD","JPY_USD","GBP_USD","USD_IDR","USD_JPY","USD_GBP"]

    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(lbl("Forex Rate", bold=True, size=13))

        table = make_table(["Pair","Label","Rate","Prev Close","Change %"])
        table.setRowCount(len(self.PAIRS))
        for r, pair in enumerate(self.PAIRS):
            data = load_json(os.path.join(DATA_DIR, "forex", f"{pair.lower()}.json"))
            chg  = data.get("change_pct")
            set_cell(table, r, 0, pair)
            set_cell(table, r, 1, data.get("label","—"))
            set_cell(table, r, 2, fmt(data.get("current_rate"), 6))
            set_cell(table, r, 3, fmt(data.get("prev_close"), 6))
            set_cell(table, r, 4, fmt_pct(chg), fg=color_for(chg) if chg is not None else None)

        layout.addWidget(table)
        summary = load_json(os.path.join(DATA_DIR, "forex", "_summary.json"))
        layout.addWidget(lbl(f"Scraped at: {summary.get('scraped_at','—')}", color="#94a3b8", size=9))


# ─── Main Window ─────────────────────────────────────────────────────────────

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MAPRO — Multimarket Analytics")
        self.setMinimumSize(1100, 700)
        self.setStyleSheet("""
            QMainWindow, QWidget  { background-color: #0d0f14; color: #e2e8f0; }
            QTabBar::tab          { background: #1c2030; padding: 8px 20px; color: #94a3b8; border-radius: 4px; }
            QTabBar::tab:selected { background: #2d3748; color: #60a5fa; }
            QTableWidget          { background: #141720; gridline-color: #1e2433; }
            QHeaderView::section  { background: #1c2030; padding: 6px; color: #94a3b8; }
            QGroupBox             { border: 1px solid #1e2433; border-radius: 6px; margin-top: 6px; padding: 6px; }
            QGroupBox::title      { color: #60a5fa; }
            QFrame[frameShape="1"]{ border: 1px solid #1e2433; border-radius: 6px; padding: 4px; margin-bottom: 4px; }
            QScrollBar:vertical   { width: 6px; background: #1c2030; }
            QScrollBar::handle:vertical { background: #374151; border-radius: 3px; }
        """)

        tabs = QTabWidget()
        tabs.addTab(OHLCVTab(),       "📈  OHLCV")
        tabs.addTab(CompanyInfoTab(), "🏢  Company Info")
        tabs.addTab(NewsTab(),        "📰  Berita")
        tabs.addTab(MacroTab(),       "🌐  Macro Events")
        tabs.addTab(ForexTab(),       "💱  Forex")
        self.setCentralWidget(tabs)

        self.statusBar().setStyleSheet("background: #141720; color: #94a3b8; font-size: 11px;")
        self.statusBar().showMessage(
            f"MAPRO  ·  Data dir: {os.path.abspath(DATA_DIR)}  ·  Loaded: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )


def main():
    app = QApplication(sys.argv)
    app.setFont(QFont("Segoe UI", 10))
    win = MainWindow()
    win.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
