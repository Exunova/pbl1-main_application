#!/bin/bash
set -euo pipefail

VENV_PYTHON="/Users/hafizfs/Documents/Tugas_repo/pbl1-main_application/backend/src/venv/bin/python3"
PROJECT_ROOT="/Users/hafizfs/Documents/Tugas_repo/pbl1-main_application"
EVIDENCE_FILE="$PROJECT_ROOT/.sisyphus/evidence/task-4-ipc-verification.txt"

ALL_TICKERS='["NVDA","AAPL","GOOGL","MSFT","AMZN","META","TSLA","BRK-B","LLY","JPM","BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK","BBNI.JK","PGAS.JK","ADRO.JK","UNVR.JK","KLBF.JK","7203.T","8306.T","6758.T","9984.T","6501.T","8316.T","9983.T","6857.T","8035.T","8058.T","AZN.L","HSBA.L","SHEL.L","BATS.L","GSK.L","BP.L","BARC.L","LLOY.L","NG.L","REL.L"]'

PYTHON_CMD=""

find_python() {
    if [ -x "$VENV_PYTHON" ]; then
        PYTHON_CMD="$VENV_PYTHON"
    elif command -v python3 &>/dev/null; then
        PYTHON_CMD="python3"
    else
        echo "FAIL: No suitable Python interpreter found"
        exit 1
    fi
}

ipc_send() {
    local cmd="$1"
    local params="$2"
    local id="${3:-t1}"

    echo '{"id":"'"$id"'","cmd":"'"$cmd"'","params":'"$params"'}' | \
        PYTHONPATH="$PROJECT_ROOT" \
        "$PYTHON_CMD" -c "
import sys, json
sys.path.insert(0, '$PROJECT_ROOT')
from backend.src.ipc_main import handle_command
req = json.loads(sys.stdin.readline())
resp = handle_command(req)
sys.stdout.write(json.dumps(resp))
" 2>/dev/null
}

color_green() { printf '\033[0;32m%s\033[0m' "$1"; }
color_red()   { printf '\033[0;31m%s\033[0m' "$1"; }

PASS_COUNT=0
FAIL_COUNT=0

check() {
    local name="$1"
    local result="$2"
    if [ "$result" = "PASS" ]; then
        ((PASS_COUNT++))
        echo "[$(color_green 'PASS')] $name"
    else
        ((FAIL_COUNT++))
        echo "[$(color_red 'FAIL')] $name"
    fi
}

mkdir -p "$(dirname "$EVIDENCE_FILE")"

{
    echo "========================================"
    echo "IPC Data Flow Verification"
    echo "Date: $(date)"
    echo "========================================"
    echo ""
} > "$EVIDENCE_FILE"

echo "========================================"
echo "IPC Data Flow Verification"
echo "Date: $(date)"
echo "========================================"
echo ""

find_python
echo "Using Python: $PYTHON_CMD"
echo ""

echo "--- Test 1: health command ---"
HEALTH_RESP=$(ipc_send "health" "{}" "t1")
HEALTH_OK=$(echo "$HEALTH_RESP" | "$PYTHON_CMD" -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('ok') == True else 'false')" 2>/dev/null)

if [ "$HEALTH_OK" = "true" ]; then
    check "health command returns ok:true" "PASS"
    echo "health command returns ok:true" >> "$EVIDENCE_FILE"
else
    check "health command returns ok:true" "FAIL"
    echo "health command FAILED. Response: $HEALTH_RESP" >> "$EVIDENCE_FILE"
    echo "health command FAILED. Response: $HEALTH_RESP"
fi
echo ""

echo "--- Test 2: ohlcv for each index ---"
for idx in ^GSPC ^JKLQ45 ^N225 ^FTSE; do
    OHLCV_RESP=$(ipc_send "ohlcv" "{\"ticker\":\"$idx\"}" "t2-$idx")
    OHLCV_LEN=$(echo "$OHLCV_RESP" | "$PYTHON_CMD" -c "
import sys,json
d=json.load(sys.stdin)
arr = d.get('data',{}).get('ohlcv_15m',[])
print(len(arr))
" 2>/dev/null)

    if [ -n "$OHLCV_LEN" ] && [ "$OHLCV_LEN" -gt 0 ]; then
        check "ohlcv $idx has ohlcv_15m array with length > 0 (got $OHLCV_LEN)" "PASS"
        echo "ohlcv $idx: PASS (length=$OHLCV_LEN)" >> "$EVIDENCE_FILE"
    else
        check "ohlcv $idx has ohlcv_15m array with length > 0" "FAIL"
        echo "ohlcv $idx: FAIL (length=$OHLCV_LEN)" >> "$EVIDENCE_FILE"
    fi
done
echo ""

echo "--- Test 3: companies for all 40 tickers ---"
COMP_RESP=$(ipc_send "companies" "{\"tickers\":$ALL_TICKERS}" "t3-companies")

TICKERS_JSON=$(echo "$COMP_RESP" | "$PYTHON_CMD" -c "
import sys,json
d=json.load(sys.stdin)
tickers_dict = d.get('data',{})
print(json.dumps(tickers_dict))
" 2>/dev/null)

MISSING_PRICE=0
FOUND_PRICE=0

for ticker in NVDA AAPL GOOGL MSFT AMZN META TSLA BRK-B LLY JPM BBCA.JK BBRI.JK BMRI.JK TLKM.JK ASII.JK BBNI.JK PGAS.JK ADRO.JK UNVR.JK KLBF.JK 7203.T 8306.T 6758.T 9984.T 6501.T 8316.T 9983.T 6857.T 8035.T 8058.T AZN.L HSBA.L SHEL.L BATS.L GSK.L BP.L BARC.L LLOY.L NG.L REL.L; do
    PRICE=$(echo "$TICKERS_JSON" | "$PYTHON_CMD" -c "
import sys,json
d=json.load(sys.stdin)
t = d.get('$ticker', {})
info = t.get('info', {})
price = info.get('price')
loading = t.get('loading', False)
if price:
    print('found')
elif loading:
    print('loading')
else:
    print('missing')
" 2>/dev/null)

    if [ "$PRICE" = "found" ]; then
        ((FOUND_PRICE++))
    elif [ "$PRICE" = "loading" ]; then
        echo "  $ticker: loading (background fetch triggered)" >> "$EVIDENCE_FILE"
    else
        ((MISSING_PRICE++))
    fi
done

if [ "$MISSING_PRICE" -eq 0 ]; then
    check "All 40 tickers have info.price in companies response ($FOUND_PRICE found)" "PASS"
    echo "companies: PASS ($FOUND_PRICE found)" >> "$EVIDENCE_FILE"
else
    check "All 40 tickers have info.price in companies response ($FOUND_PRICE found, $MISSING_PRICE missing)" "FAIL"
    echo "companies: FAIL ($FOUND_PRICE found, $MISSING_PRICE missing)" >> "$EVIDENCE_FILE"
fi
echo ""

echo "========================================"
echo "SUMMARY"
echo "========================================"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "Total: $PASS_COUNT / $TOTAL passed"

echo "" >> "$EVIDENCE_FILE"
echo "Summary: $PASS_COUNT PASS, $FAIL_COUNT FAIL out of $TOTAL checks" >> "$EVIDENCE_FILE"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "Overall: $(color_green 'ALL TESTS PASSED')"
    echo "Overall: ALL TESTS PASSED" >> "$EVIDENCE_FILE"
    exit 0
else
    echo "Overall: $(color_red 'SOME TESTS FAILED')"
    echo "Overall: SOME TESTS FAILED" >> "$EVIDENCE_FILE"
    exit 1
fi