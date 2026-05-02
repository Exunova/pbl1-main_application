import sys
from datetime import datetime

import yfinance as yf

from backend.src.ipc.base_page_handler import BasePageHandler


class PortfolioHandler(BasePageHandler):

    def handle_command(self, cmd: str, params: dict) -> dict:
        if cmd == "portfolio_list":
            return self.portfolio_list()
        elif cmd == "portfolio_add":
            return self.portfolio_add(params)
        elif cmd == "portfolio_edit":
            return self.portfolio_edit(params)
        elif cmd == "portfolio_delete":
            return self.portfolio_delete(params)
        elif cmd == "portfolio_pnl":
            return self.portfolio_pnl()
        elif cmd == "portfolio_export":
            return self.portfolio_export()
        elif cmd == "portfolio_import":
            return self.portfolio_import(params)
        return {}

    def portfolio_list(self) -> dict:
        """Return all portfolio positions."""
        try:
            rows = self._cache_db.get_positions()
            positions = [
                {
                    "id": row["id"],
                    "ticker": row["ticker"],
                    "company": row["company"],
                    "shares": row["shares"],
                    "buyPrice": row["buyPrice"],
                    "buyDate": row["buyDate"],
                    "currency": row["currency"],
                }
                for row in rows
            ]
            return {"positions": positions}
        except Exception as e:
            return {"positions": [], "error": str(e)}

    def portfolio_add(self, params: dict) -> dict:
        """Add a new position."""
        try:
            ticker = params.get("ticker")
            company = params.get("company")
            shares = params.get("shares")
            buyPrice = params.get("buyPrice")
            buyDate = params.get("buyDate")
            currency = params.get("currency", "USD")

            if not all([ticker, company, shares, buyPrice, buyDate]):
                return {"error": "Missing required fields"}

            new_id = self._cache_db.add_position({
                "ticker": ticker,
                "company": company,
                "shares": shares,
                "buyPrice": buyPrice,
                "buyDate": buyDate,
                "currency": currency,
            })

            return {
                "id": new_id,
                "ticker": ticker,
                "company": company,
                "shares": shares,
                "buyPrice": buyPrice,
                "buyDate": buyDate,
                "currency": currency,
            }
        except Exception as e:
            return {"error": str(e)}

    def portfolio_edit(self, params: dict) -> dict:
        """Edit an existing position."""
        try:
            pid = params.get("id")
            if not pid:
                return {"error": "Missing position id"}

            allowed_fields = ["ticker", "company", "shares", "buyPrice", "buyDate", "currency"]
            fields = {k: params[k] for k in allowed_fields if k in params}

            if not fields:
                return {"error": "No fields to update"}

            self._cache_db.edit_position(pid, fields)

            positions = self._cache_db.get_positions()
            row = next((p for p in positions if p["id"] == pid), None)

            if not row:
                return {"error": "Position not found"}

            return {
                "id": row["id"],
                "ticker": row["ticker"],
                "company": row["company"],
                "shares": row["shares"],
                "buyPrice": row["buyPrice"],
                "buyDate": row["buyDate"],
                "currency": row["currency"],
            }
        except Exception as e:
            return {"error": str(e)}

    def portfolio_delete(self, params: dict) -> dict:
        """Delete a position."""
        try:
            pid = params.get("id")
            if not pid:
                return {"error": "Missing position id"}

            self._cache_db.delete_position(pid)
            return {"status": "ok"}
        except Exception as e:
            return {"error": str(e)}

    def portfolio_pnl(self) -> dict:
        """Calculate PnL for all positions."""
        try:
            rows = self._cache_db.get_positions()
            positions = [
                {
                    "id": row["id"],
                    "ticker": row["ticker"],
                    "company": row["company"],
                    "shares": row["shares"],
                    "buyPrice": row["buyPrice"],
                    "buyDate": row["buyDate"],
                    "currency": row["currency"],
                }
                for row in rows
            ]

            if not positions:
                return {"positions": [], "total": {"totalPnL": 0, "stockReturn": 0, "forexReturn": 0}}

            tickers = list(set([p["ticker"] for p in positions]))
            fx_map = {"IDR": "USDIDR=X", "JPY": "USDJPY=X", "GBP": "USDGBP=X"}
            fx_symbols = list(fx_map.values())
            
            all_symbols = tickers + fx_symbols

            try:
                # OPTIMIZATION: Fetch 1 month of data for all stocks and FX pairs in ONE network call!
                # Disabled threads and progress to prevent yfinance from deadlocking/hanging.
                prices = yf.download(all_symbols, period="1mo", auto_adjust=True, threads=False, progress=False)
            except Exception as e:
                sys.stderr.write(f"yfinance batch download failed: {e}\n")
                prices = None

            def get_latest_price(symbol):
                if prices is None or prices.empty:
                    return None
                try:
                    s = prices["Close"] if len(all_symbols) == 1 else prices["Close"][symbol]
                    s = s.dropna()
                    if not s.empty:
                        return float(s.iloc[-1])
                except Exception:
                    pass
                return None

            def get_hist_avg(symbol):
                if prices is None or prices.empty:
                    return None
                try:
                    s = prices["Close"] if len(all_symbols) == 1 else prices["Close"][symbol]
                    s = s.dropna()
                    if not s.empty:
                        return float(s.mean())
                except Exception:
                    pass
                return None

            pnl_positions = []
            total_pnl_idr = 0.0
            total_stock_idr = 0.0
            total_forex_idr = 0.0

            for p in positions:
                ticker = p["ticker"]
                currency = p["currency"]
                shares = p["shares"]
                buy_price = p["buyPrice"]
                
                curr_fx = 1.0
                buy_fx = 1.0
                
                if currency != "USD":
                    fx_sym = fx_map.get(currency)
                    if fx_sym:
                        latest_fx = get_latest_price(fx_sym)
                        avg_fx = get_hist_avg(fx_sym)
                        
                        curr_fx = latest_fx if latest_fx else (15650.0 if currency == "IDR" else 1.0)
                        buy_fx = avg_fx if avg_fx else curr_fx
                
                current_price = get_latest_price(ticker)
                
                if current_price is None:
                    current_price = buy_price

                stock_return = (current_price - buy_price) * shares
                stock_return_idr = stock_return * curr_fx
                forex_return_idr = shares * buy_price * (curr_fx - buy_fx)

                total_pnl_idr += stock_return_idr + forex_return_idr
                total_stock_idr += stock_return_idr
                total_forex_idr += forex_return_idr

                pnl_positions.append({
                    "ticker": ticker,
                    "shares": shares,
                    "buyPrice": buy_price,
                    "currentPrice": current_price,
                    "currency": currency,
                    "fxRate": curr_fx,
                    "fxRateAtBuy": buy_fx,
                    "stockReturn": stock_return_idr,
                    "forexReturn": forex_return_idr,
                })

            return {
                "positions": pnl_positions,
                "total": {"totalPnL": total_pnl_idr, "stockReturn": total_stock_idr, "forexReturn": total_forex_idr},
            }
        except Exception as e:
            return {"error": str(e)}

    def portfolio_export(self) -> dict:
        """Export all positions."""
        try:
            rows = self._cache_db.get_positions()
            positions = [
                {
                    "id": row["id"],
                    "ticker": row["ticker"],
                    "company": row["company"],
                    "shares": row["shares"],
                    "buyPrice": row["buyPrice"],
                    "buyDate": row["buyDate"],
                    "currency": row["currency"],
                }
                for row in rows
            ]
            return {"positions": positions}
        except Exception as e:
            return {"error": str(e)}

    def portfolio_import(self, params: dict) -> dict:
        """Import positions."""
        try:
            incoming = params.get("positions", [])
            if not isinstance(incoming, list):
                return {"error": "positions must be a list"}

            added = 0
            for pos in incoming:
                if all(k in pos for k in ("ticker", "shares", "buyPrice", "buyDate", "currency")):
                    self._cache_db.add_position({
                        "ticker": pos.get("ticker"),
                        "company": pos.get("company", ""),
                        "shares": pos.get("shares"),
                        "buyPrice": pos.get("buyPrice"),
                        "buyDate": pos.get("buyDate"),
                        "currency": pos.get("currency"),
                    })
                    added += 1

            positions = self._cache_db.get_positions()
            total = len(positions)

            return {"imported": added, "total": total}
        except Exception as e:
            return {"error": str(e)}
