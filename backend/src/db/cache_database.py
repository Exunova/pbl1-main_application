import sqlite3
import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional


APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DB = os.environ.get('Cache_DB', os.path.join(APP_DIR, 'cache.db'))


class CacheDatabase:
    """Singleton database wrapper for cache, positions, and scrape_status tables."""

    def __init__(self) -> None:
        self._conn: Optional[sqlite3.Connection] = None
        self.init_db()

    def get_conn(self) -> sqlite3.Connection:
        """Create and return a new database connection with WAL mode."""
        conn = sqlite3.connect(CACHE_DB)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        """Create the cache, positions, and scrape_status tables if they don't exist."""
        conn = self.get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                company TEXT NOT NULL,
                shares REAL NOT NULL,
                buyPrice REAL NOT NULL,
                buyDate TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD'
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scrape_status (
                key TEXT PRIMARY KEY,
                updated_at TEXT,
                status TEXT
            )
        """)
        conn.commit()
        conn.close()

    # ── Cache operations ──────────────────────────────────────────

    def cache_get(self, key: str) -> Optional[Any]:
        """Return parsed JSON data or None if not found."""
        conn = self.get_conn()
        row = conn.execute("SELECT data, updated_at FROM cache WHERE key = ?", (key,)).fetchone()
        conn.close()
        if row:
            return json.loads(row[0])
        return None

    def cache_set(self, key: str, data: Any, ttl_seconds: Optional[int] = None) -> None:
        """Store data as JSON under key. ttl_seconds is ignored (simple implementation)."""
        conn = self.get_conn()
        conn.execute("""
            INSERT OR REPLACE INTO cache (key, data, updated_at)
            VALUES (?, ?, ?)
        """, (key, json.dumps(data, default=str), datetime.now().isoformat()))
        conn.commit()
        conn.close()

    def cache_delete(self, key: str) -> None:
        """Delete a key from the cache table."""
        conn = self.get_conn()
        conn.execute("DELETE FROM cache WHERE key = ?", (key,))
        conn.commit()
        conn.close()

    # ── Portfolio operations ───────────────────────────────────────

    def get_positions(self) -> List[Dict[str, Any]]:
        """Return all positions as a list of dictionaries."""
        conn = self.get_conn()
        rows = conn.execute("SELECT * FROM positions").fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def add_position(self, pos: Dict[str, Any]) -> int:
        """Insert a new position and return its ID."""
        conn = self.get_conn()
        cur = conn.execute("""
            INSERT INTO positions (ticker, company, shares, buyPrice, buyDate, currency)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (pos['ticker'], pos['company'], pos['shares'], pos['buyPrice'], pos['buyDate'], pos.get('currency', 'USD')))
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return new_id

    def edit_position(self, id: int, fields: Dict[str, Any]) -> None:
        """Update a position by id with the given fields."""
        sets = ', '.join(f"{k} = ?" for k in fields)
        vals = list(fields.values()) + [id]
        conn = self.get_conn()
        conn.execute(f"UPDATE positions SET {sets} WHERE id = ?", vals)
        conn.commit()
        conn.close()

    def delete_position(self, id: int) -> None:
        """Delete a position by id."""
        conn = self.get_conn()
        conn.execute("DELETE FROM positions WHERE id = ?", (id,))
        conn.commit()
        conn.close()

    # ── Scrape status ─────────────────────────────────────────────

    def set_scrape_status(self, key: str, status: str) -> None:
        """Set or update the scrape status for a given key."""
        conn = self.get_conn()
        conn.execute("""
            INSERT OR REPLACE INTO scrape_status (key, updated_at, status)
            VALUES (?, ?, ?)
        """, (key, datetime.now().isoformat(), status))
        conn.commit()
        conn.close()

    def get_scrape_status(self, key: str) -> Optional[Dict[str, Any]]:
        """Return scrape status row as dict or None if not found."""
        conn = self.get_conn()
        row = conn.execute("SELECT * FROM scrape_status WHERE key = ?", (key,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def get_all_scrape_status(self) -> Dict[str, str]:
        """Return all scrape statuses as a dict mapping key -> status."""
        conn = self.get_conn()
        rows = conn.execute("SELECT * FROM scrape_status").fetchall()
        conn.close()
        return {r['key']: r['status'] for r in rows}


# Singleton instance
db = CacheDatabase()
