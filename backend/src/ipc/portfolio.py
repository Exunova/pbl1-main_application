import sys
import re
import math
from datetime import datetime

import yfinance as yf

from backend.src.ipc.base_page_handler import BasePageHandler


class PortfolioHandler(BasePageHandler):
    VALID_CURRENCIES = {"USD", "IDR", "JPY", "GBP"}
    TICKER_RE = re.compile(r"^[A-Za-z0-9._^-]{1,32}$")

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

            validation_error = self._validate_position_fields({
                "ticker": ticker,
                "company": company,
                "shares": shares,
                "buyPrice": buyPrice,
                "buyDate": buyDate,
                "currency": currency,
            }, require_all=True)
            if validation_error:
                return {"error": validation_error}

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

            validation_error = self._validate_position_fields(fields, require_all=False)
            if validation_error:
                return {"error": validation_error}

            if not self._cache_db.edit_position(pid, fields):
                return {"error": "Position not found"}

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

            if not self._cache_db.delete_position(pid):
                return {"error": "Position not found"}
            return {"status": "ok"}
        except Exception as e:
            return {"error": str(e)}

    def _validate_position_fields(self, fields: dict, require_all: bool) -> str | None:
        required = ["ticker", "company", "shares", "buyPrice", "buyDate", "currency"]
        if require_all:
            missing = [field for field in required if fields.get(field) in (None, "")]
            if missing:
                return f"Missing required fields: {', '.join(missing)}"

        if "ticker" in fields and fields.get("ticker") in (None, ""):
            return "Ticker is required"
        if "ticker" in fields and not self.TICKER_RE.fullmatch(str(fields.get("ticker"))):
            return "Ticker format is invalid"

        if "company" in fields and fields.get("company") in (None, ""):
            return "Company is required"

        if "shares" in fields:
            try:
                shares = float(fields.get("shares"))
            except (TypeError, ValueError):
                return "Shares must be a number"
            if shares <= 0:
                return "Shares must be greater than 0"

        if "buyPrice" in fields:
            try:
                buy_price = float(fields.get("buyPrice"))
            except (TypeError, ValueError):
                return "Buy price must be a number"
            if buy_price <= 0:
                return "Buy price must be greater than 0"

        if "buyDate" in fields:
            try:
                buy_date = datetime.strptime(str(fields.get("buyDate")), "%Y-%m-%d").date()
            except (TypeError, ValueError):
                return "Buy date must use YYYY-MM-DD format"
            if buy_date > datetime.now().date():
                return "Buy date cannot be in the future"

        if "currency" in fields and fields.get("currency") not in self.VALID_CURRENCIES:
            return "Currency must be one of USD, IDR, JPY, GBP"

        return None

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
                if prices is not None and not prices.empty:
                    sys.stderr.write(f"yfinance download success. Columns: {prices.columns.tolist()}\n")
                    if "Close" in prices.columns:
                        sys.stderr.write(f"Close data head:\n{prices['Close'].head()}\n")
                    else:
                        sys.stderr.write(f"NO CLOSE COLUMN in prices. Available levels: {prices.columns.levels if hasattr(prices.columns, 'levels') else 'N/A'}\n")
                else:
                    sys.stderr.write("yfinance download returned empty data\n")
            except Exception as e:
                sys.stderr.write(f"yfinance batch download failed: {e}\n")
                prices = None

            def get_latest_price(symbol):
                if prices is None or prices.empty:
                    return None
                try:
                    if len(all_symbols) == 1:
                        s = prices["Close"]
                    else:
                        if ("Close", symbol) in prices.columns:
                            s = prices[("Close", symbol)]
                        elif "Close" in prices.columns and symbol in prices["Close"].columns:
                            s = prices["Close"][symbol]
                        else:
                            found_col = [c for c in prices.columns if c[1] == symbol and c[0] == 'Close']
                            if found_col:
                                s = prices[found_col[0]]
                            else:
                                return None
                    s = s.dropna()
                    if not s.empty:
                        value = float(s.iloc[-1])
                        return value if math.isfinite(value) else None
                except Exception as e:
                    sys.stderr.write(f"Error getting latest price for {symbol}: {e}\n")
                    pass
                return None

            def get_hist_avg(symbol):
                if prices is None or prices.empty:
                    return None
                try:
                    if len(all_symbols) == 1:
                        s = prices["Close"]
                    else:
                        if ("Close", symbol) in prices.columns:
                            s = prices[("Close", symbol)]
                        elif "Close" in prices.columns and symbol in prices["Close"].columns:
                            s = prices["Close"][symbol]
                        else:
                            found_col = [c for c in prices.columns if c[1] == symbol and c[0] == 'Close']
                            if found_col:
                                s = prices[found_col[0]]
                            else:
                                return None
                    s = s.dropna()
                    if not s.empty:
                        value = float(s.mean())
                        return value if math.isfinite(value) else None
                except Exception as e:
                    sys.stderr.write(f"Error getting hist avg for {symbol}: {e}\n")
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
                
                # Conversion to IDR:
                # If currency is USD, we need USDIDR rate.
                # If currency is JPY, we need JPYIDR rate (or JPYUSD * USDIDR).
                # Existing curr_fx is USD/Foreign (e.g. 149 JPY per 1 USD).
                # We need conversion to IDR for ALL metrics.
                
                usd_idr_rate = get_latest_price("USDIDR=X") or 15650.0
                buy_usd_idr = get_hist_avg("USDIDR=X") or 15650.0
                latest_price = get_latest_price(ticker)
                price_unavailable = latest_price is None

                if currency == "IDR":
                    buy_price_idr = buy_price
                    current_price_idr = latest_price if latest_price is not None else buy_price
                    stock_return_native = (current_price_idr - buy_price_idr) * shares
                    stock_return_idr = stock_return_native
                    forex_return_idr = 0.0
                elif currency == "USD":
                    buy_price_idr = buy_price * buy_usd_idr
                    current_price_usd = latest_price if latest_price is not None else buy_price
                    current_price_idr = current_price_usd * usd_idr_rate

                    stock_return_native = (current_price_usd - buy_price) * shares
                    stock_return_idr = stock_return_native * usd_idr_rate
                    forex_return_idr = buy_price * shares * (usd_idr_rate - buy_usd_idr)
                else:
                    buy_usd_curr = buy_fx
                    buy_curr_idr = (1.0 / buy_usd_curr) * buy_usd_idr
                    buy_price_idr = buy_price * buy_curr_idr
                    
                    current_usd_curr = curr_fx
                    current_curr_idr = (1.0 / current_usd_curr) * usd_idr_rate
                    current_price_foreign = latest_price if latest_price is not None else buy_price
                    current_price_idr = current_price_foreign * current_curr_idr

                    stock_return_native = (current_price_foreign - buy_price) * shares
                    stock_return_idr = stock_return_native * current_curr_idr
                    forex_return_idr = buy_price * shares * (current_curr_idr - buy_curr_idr)

                total_pnl_idr += (stock_return_idr + forex_return_idr)
                total_stock_idr += stock_return_idr
                total_forex_idr += forex_return_idr
                
                pnl_positions.append({
                    "id": p["id"],
                    "ticker": ticker,
                    "shares": shares,
                    "buyPrice": buy_price,
                    "buyPriceIDR": buy_price_idr,
                    "currentPrice": latest_price,
                    "currentPriceIDR": current_price_idr,
                    "currency": currency,
                    "stockReturn": stock_return_native,
                    "stockReturnIDR": stock_return_idr,
                    "forexReturn": forex_return_idr,
                    "totalPnL": stock_return_idr + forex_return_idr,
                    "priceError": "Price unavailable" if price_unavailable else None,
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
