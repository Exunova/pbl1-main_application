"""
Test suite for IPC Commands — 16 test cases (IPC-001 to IPC-016).

Module covered:
- ipc_main.py  (IPC-001 .. IPC-016)
"""

import pytest
import json
import time
import subprocess
import sys
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_SRC = ROOT_DIR / 'backend' / 'src'
SCRAPERS_DIR = BACKEND_SRC / 'scraping'
YAHOO_SCRAPERS_DIR = BACKEND_SRC / 'scraping' / 'yahoo_finance'


def _spawn_ipc_process(tmp_path):
    """Spawn ipc_main.py as a subprocess with isolated temp cache."""
    import shutil
    real_db = ROOT_DIR / 'backend' / 'cache.db'
    tmp_db = str(tmp_path / "cache.db")
    if os.path.exists(real_db):
        shutil.copy(real_db, tmp_db)

    env = os.environ.copy()
    env['PYTHONPATH'] = os.pathsep.join(str(p) for p in (BACKEND_SRC, SCRAPERS_DIR, YAHOO_SCRAPERS_DIR, ROOT_DIR))
    env['CACHE_DB'] = tmp_db

    proc = subprocess.Popen(
        [sys.executable, str(BACKEND_SRC / 'ipc_main.py')],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )
    time.sleep(0.5)
    return proc


def _send_raw(proc, payload):
    """Send raw payload string and return parsed JSON response."""
    proc.stdin.write(payload.encode() if isinstance(payload, str) else payload)
    proc.stdin.flush()
    line = proc.stdout.readline()
    if not line:
        raise RuntimeError("No response from ipc_main process")
    return json.loads(line)


def _cleanup_proc(proc):
    """Clean up an IPC process."""
    try:
        proc.stdin.close()
        proc.wait(timeout=2)
    except Exception:
        proc.kill()


class TestIPCRequestResponse:
    """IPC-001 .. IPC-009 — IPC request/response format and command execution."""

    def test_ipc_001_request_json_valid(self, ipc_process):
        """IPC-001: Request format JSON valid ke Python — response JSON ke STDOUT."""
        resp = ipc_process("health")
        assert isinstance(resp, dict), "Response must be a valid JSON object (dict)"
        assert "ok" in resp

    def test_ipc_002_response_id_matches_request(self, tmp_path):
        """IPC-002: Response ID cocok dengan request ID — id yang sama dikembalikan."""
        proc = _spawn_ipc_process(tmp_path)
        try:
            req = json.dumps({"id": "abc123", "cmd": "health", "params": {}}) + "\n"
            resp = _send_raw(proc, req)
            assert resp["id"] == "abc123", f"Expected id 'abc123', got '{resp.get('id')}'"
        finally:
            _cleanup_proc(proc)

    def test_ipc_003_response_format_valid(self, ipc_process):
        """IPC-003: Format response JSON valid — {"id":"...","ok":true/false,"data":{...}}."""
        resp = ipc_process("health")
        assert "id" in resp, "Response must contain 'id' field"
        assert "ok" in resp, "Response must contain 'ok' field"
        assert "data" in resp, "Response must contain 'data' field"

    def test_ipc_004_command_ohlcv(self, ipc_process):
        """IPC-004: Command ohlcv berjalan — data OHLCV ter-return di field data."""
        resp = ipc_process("ohlcv", {"ticker": "AAPL"})
        assert resp["ok"] is True, f"Expected ok=True, got: {resp}"
        assert "data" in resp, "Response must contain 'data' field"
        data = resp["data"]
        assert "ohlcv_15m" in data or data.get("ticker") == "AAPL", "OHLCV data structure missing"

    def test_ipc_005_command_news(self, ipc_process):
        """IPC-005: Command news berjalan — data berita US ter-return."""
        resp = ipc_process("news", {"region": "US"})
        assert resp["ok"] is True, f"Expected ok=True, got: {resp}"
        assert "data" in resp, "Response must contain 'data' field"
        data = resp["data"]
        assert "articles" in data, "News data must contain 'articles' field"

    def test_ipc_006_command_macro(self, ipc_process):
        """IPC-006: Command macro berjalan — data kalender ekonomi ter-return."""
        resp = ipc_process("macro", {"cc": "US"})
        assert resp["ok"] is True, f"Expected ok=True, got: {resp}"
        assert "data" in resp, "Response must contain 'data' field"
        data = resp["data"]
        assert "events" in data, "Macro data must contain 'events' field"

    def test_ipc_007_command_forex(self, ipc_process):
        """IPC-007: Command forex berjalan — data kurs ter-return."""
        resp = ipc_process("forex", {"pair": "USDIDR=X"})
        assert resp["ok"] is True, f"Expected ok=True, got: {resp}"
        assert "data" in resp, "Response must contain 'data' field"
        data = resp["data"]
        assert "current_rate" in data, "Forex data must contain 'current_rate' field"

    def test_ipc_008_command_company(self, ipc_process):
        """IPC-008: Command company berjalan — data profil perusahaan ter-return."""
        resp = ipc_process("company", {"ticker": "TSLA"})
        assert resp["ok"] is True, f"Expected ok=True, got: {resp}"
        assert "data" in resp, "Response must contain 'data' field"
        data = resp["data"]
        assert "info" in data, "Company data must contain 'info' field"

    def test_ipc_009_command_companies_batch(self, ipc_process):
        """IPC-009: Command companies (batch) berjalan — data multiple ticker dalam satu response."""
        resp = ipc_process("companies", {"tickers": ["AAPL", "NVDA"]})
        assert resp["ok"] is True, f"Expected ok=True, got: {resp}"
        assert "data" in resp, "Response must contain 'data' field"
        data = resp["data"]
        assert isinstance(data, dict), "Companies response data must be a dict mapping tickers to info"
        assert "AAPL" in data, "Batch response must contain 'AAPL'"
        assert "NVDA" in data, "Batch response must contain 'NVDA'"


class TestIPCErrorHandling:
    """IPC-010 .. IPC-016 — IPC error handling and edge cases."""

    def test_ipc_010_unknown_command(self, ipc_process):
        """IPC-010: Command tidak dikenal — error terdefinisi, tidak crash."""
        resp = ipc_process("unknown_cmd_xyz")
        assert resp["ok"] is False, "Unknown command must return ok=False"
        assert "error" in resp, "Error response must contain 'error' field"

    def test_ipc_011_malformed_json(self, tmp_path):
        """IPC-011: Request JSON malformed — parse error tertangkap, error response."""
        proc = _spawn_ipc_process(tmp_path)
        try:
            resp = _send_raw(proc, "this is not json{\n")
            assert resp["ok"] is False, "Malformed JSON must return ok=False"
            assert "Invalid JSON" in resp.get("error", ""), f"Error must mention 'Invalid JSON', got: {resp.get('error')}"
            valid = _send_raw(proc, json.dumps({"id": "alive", "cmd": "health", "params": {}}) + "\n")
            assert valid["ok"] is True, "Process must remain responsive after malformed JSON"
        finally:
            _cleanup_proc(proc)

    def test_ipc_012_missing_cmd_field(self, tmp_path):
        """IPC-012: Request tanpa field cmd — error response jelas, tidak crash."""
        proc = _spawn_ipc_process(tmp_path)
        try:
            req = json.dumps({"id": "nocmd", "params": {}}) + "\n"
            resp = _send_raw(proc, req)
            assert resp["ok"] is False, "Missing cmd must return ok=False"
            assert "error" in resp, "Error response must contain 'error' field"
            valid = _send_raw(proc, json.dumps({"id": "alive", "cmd": "health", "params": {}}) + "\n")
            assert valid["ok"] is True, "Process must remain responsive after missing cmd"
        finally:
            _cleanup_proc(proc)

    def test_ipc_013_missing_params_field(self, tmp_path):
        """IPC-013: Request tanpa field params — error response atau default params, tidak crash."""
        proc = _spawn_ipc_process(tmp_path)
        try:
            req = json.dumps({"id": "noparams", "cmd": "health"}) + "\n"
            resp = _send_raw(proc, req)
            assert resp["ok"] is True, f"Command without params should succeed with defaults, got: {resp}"
            assert "data" in resp, "Response must contain 'data' field"
        finally:
            _cleanup_proc(proc)

    def test_ipc_014_concurrent_requests(self, tmp_path):
        """IPC-014: Concurrent request (5 sekaligus) — semua response ter-return dengan id benar."""
        proc = _spawn_ipc_process(tmp_path)
        try:
            ids = ["req-1", "req-2", "req-3", "req-4", "req-5"]
            for req_id in ids:
                req = json.dumps({"id": req_id, "cmd": "health", "params": {}}) + "\n"
                proc.stdin.write(req.encode())
            proc.stdin.flush()

            responses = []
            for _ in ids:
                line = proc.stdout.readline()
                assert line, "Missing response for one of the rapid-fire requests"
                responses.append(json.loads(line))

            returned_ids = {r["id"] for r in responses}
            assert returned_ids == set(ids), f"Expected IDs {set(ids)}, got {returned_ids}"
            for r in responses:
                assert r["ok"] is True, f"All responses should succeed, got: {r}"
        finally:
            _cleanup_proc(proc)

    def test_ipc_015_latency_cache_hit(self, ipc_process):
        """IPC-015: Latency IPC pipe — < 2000ms untuk request yang hit cache."""
        ipc_process("health")
        start = time.time()
        resp = ipc_process("health")
        elapsed_ms = (time.time() - start) * 1000
        assert resp["ok"] is True, "Health command must succeed"
        assert elapsed_ms < 2000, f"Latency {elapsed_ms:.2f}ms exceeded 2000ms threshold"

    def test_ipc_016_python_backend_crash(self, tmp_path):
        """IPC-016: Python backend handles invalid input gracefully — tidak freeze."""
        proc = _spawn_ipc_process(tmp_path)
        try:
            malformed_inputs = [
                "not json at all\n",
                "{}\n",
                json.dumps({"id": "bad", "cmd": None, "params": {}}) + "\n",
                json.dumps({"id": "bad2", "cmd": "", "params": {}}) + "\n",
                "null\n",
            ]

            for payload in malformed_inputs:
                proc.stdin.write(payload.encode())
            proc.stdin.flush()

            responses = []
            for _ in malformed_inputs:
                line = proc.stdout.readline()
                assert line, "Process hung on malformed input"
                try:
                    responses.append(json.loads(line))
                except json.JSONDecodeError:
                    pytest.fail("Non-JSON response received for malformed input")

            for r in responses:
                assert "ok" in r, f"Response must contain 'ok' field: {r}"

            valid = _send_raw(proc, json.dumps({"id": "alive", "cmd": "health", "params": {}}) + "\n")
            assert valid["ok"] is True, "Process must remain responsive after multiple malformed inputs"
        finally:
            _cleanup_proc(proc)
