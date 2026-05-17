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
        elif cmd == "check_forex_rate":
            return self.check_forex_rate(params)
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

            # Determine date range: from the earliest buyDate to today
            from datetime import timedelta
            buy_dates = []
            for p in positions:
                try:
                    buy_dates.append(datetime.strptime(p["buyDate"], "%Y-%m-%d").date())
                except (ValueError, TypeError):
                    pass
            
            if buy_dates:
                earliest_date = min(buy_dates) - timedelta(days=7)  # buffer for weekends/holidays
                start_str = earliest_date.isoformat()
            else:
                start_str = None

            try:
                # Download data from earliest buyDate to now for accurate historical lookups
                download_kwargs = {
                    "auto_adjust": True,
                    "threads": False,
                    "progress": False,
                }
                if start_str:
                    download_kwargs["start"] = start_str
                else:
                    download_kwargs["period"] = "1mo"

                prices = yf.download(all_symbols, **download_kwargs)
                if prices is not None and not prices.empty:
                    sys.stderr.write(f"yfinance download success. Date range: {prices.index[0]} to {prices.index[-1]}\n")
                else:
                    sys.stderr.write("yfinance download returned empty data\n")
            except Exception as e:
                sys.stderr.write(f"yfinance batch download failed: {e}\n")
                prices = None

            def _get_series(symbol):
                """Extract the Close price series for a symbol from the downloaded data."""
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
                    return s.dropna()
                except Exception as e:
                    sys.stderr.write(f"Error getting series for {symbol}: {e}\n")
                    return None

            def get_latest_price(symbol):
                """Get the most recent closing price for a symbol."""
                s = _get_series(symbol)
                if s is not None and not s.empty:
                    value = float(s.iloc[-1])
                    return value if math.isfinite(value) else None
                return None

            def get_price_on_date(symbol, target_date):
                """Get the closing price on or closest before the target_date.
                
                This is used to find the forex rate on the exact buy date,
                giving an accurate forex return calculation.
                """
                s = _get_series(symbol)
                if s is None or s.empty:
                    return None
                try:
                    # Filter to dates on or before the target date
                    mask = s.index.date <= target_date
                    filtered = s[mask]
                    if not filtered.empty:
                        value = float(filtered.iloc[-1])
                        return value if math.isfinite(value) else None
                    # If no data before target, use the earliest available
                    value = float(s.iloc[0])
                    return value if math.isfinite(value) else None
                except Exception as e:
                    sys.stderr.write(f"Error getting price on date for {symbol} at {target_date}: {e}\n")
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

                # Parse buyDate for historical rate lookup
                try:
                    buy_date = datetime.strptime(p["buyDate"], "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    buy_date = datetime.now().date()
                
                curr_fx = 1.0
                buy_fx = 1.0
                
                if currency != "USD":
                    fx_sym = fx_map.get(currency)
                    if fx_sym:
                        latest_fx = get_latest_price(fx_sym)
                        # Use the forex rate on the exact buy date instead of average
                        historical_fx = get_price_on_date(fx_sym, buy_date)
                        
                        curr_fx = latest_fx if latest_fx else (15650.0 if currency == "IDR" else 1.0)
                        buy_fx = historical_fx if historical_fx else curr_fx
                
                # Get USDIDR rates: current and on buy date
                usd_idr_rate = get_latest_price("USDIDR=X") or 15650.0
                buy_usd_idr = get_price_on_date("USDIDR=X", buy_date) or 15650.0
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

    def check_forex_rate(self, params: dict) -> dict:
        """Check if forex rate is available on a specific buy date.

        Returns the exact rate if available, or offers a 1-month average
        as an alternative so the user can decide.
        """
        try:
            from datetime import timedelta

            currency = params.get("currency", "USD")
            buy_date_str = params.get("buyDate")

            if not buy_date_str:
                return {"error": "Missing buyDate"}

            # IDR positions don't need forex conversion
            if currency == "IDR":
                return {"available": True, "rate": 1.0, "currency": "IDR"}

            try:
                buy_date = datetime.strptime(buy_date_str, "%Y-%m-%d").date()
            except ValueError:
                return {"error": "Invalid date format, use YYYY-MM-DD"}

            # Determine which forex pair to check
            fx_map = {"USD": "USDIDR=X", "JPY": "USDJPY=X", "GBP": "USDGBP=X"}
            fx_symbol = fx_map.get(currency)
            if not fx_symbol:
                return {"error": f"Unsupported currency: {currency}"}

            # Download 1 month of data around the buy date
            start = buy_date - timedelta(days=7)
            end = buy_date + timedelta(days=7)
            today = datetime.now().date()
            if end > today:
                end = today

            try:
                data = yf.download(fx_symbol, start=start.isoformat(), end=end.isoformat(),
                                   auto_adjust=True, threads=False, progress=False)
            except Exception as e:
                return {"error": f"Failed to fetch forex data: {str(e)}"}

            if data is None or data.empty:
                return {"available": False, "reason": "no_data", "currency": currency,
                        "buyDate": buy_date_str, "avgRate": None}

            # Handle MultiIndex columns from yfinance
            def _extract_close(df):
                """Extract Close price series, handling both MultiIndex and flat columns."""
                if "Close" not in df.columns and hasattr(df.columns, 'get_level_values'):
                    # MultiIndex: try to find Close at level 0
                    close_cols = [c for c in df.columns if c[0] == "Close"]
                    if close_cols:
                        return df[close_cols[0]].dropna()
                    return None
                col = df["Close"]
                # If col is a DataFrame (MultiIndex), get the first column
                if hasattr(col, 'columns'):
                    col = col.iloc[:, 0]
                return col.dropna()

            close = _extract_close(data)
            if close is None or close.empty:
                return {"available": False, "reason": "no_data", "currency": currency,
                        "buyDate": buy_date_str, "avgRate": None}

            # Check if exact date exists in the data
            exact_match = close[close.index.date == buy_date]

            if not exact_match.empty:
                rate = float(exact_match.iloc[-1])
                return {"available": True, "rate": rate, "currency": currency,
                        "buyDate": buy_date_str}

            # Exact date not available — calculate 1-month average as alternative
            try:
                avg_start = buy_date - timedelta(days=30)
                avg_data = yf.download(fx_symbol, start=avg_start.isoformat(),
                                       end=(buy_date + timedelta(days=1)).isoformat(),
                                       auto_adjust=True, threads=False, progress=False)
                if avg_data is not None and not avg_data.empty:
                    avg_close = _extract_close(avg_data)
                    avg_rate = float(avg_close.mean()) if avg_close is not None and not avg_close.empty else None
                else:
                    avg_rate = None
            except Exception:
                avg_rate = None

            # Find nearest available date
            before = close[close.index.date < buy_date]
            nearest_date = before.index[-1].date().isoformat() if not before.empty else None
            nearest_rate = float(before.iloc[-1]) if not before.empty else None

            return {
                "available": False,
                "reason": "not_trading_day",
                "currency": currency,
                "buyDate": buy_date_str,
                "nearestDate": nearest_date,
                "nearestRate": nearest_rate,
                "avgRate": avg_rate,
            }
        except Exception as e:
            return {"error": str(e)}
