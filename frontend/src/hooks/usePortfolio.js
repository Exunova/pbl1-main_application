import { useState, useEffect, useMemo } from 'react'
import { ambilPnl, formatChange } from '../utils/portfolioUtils'

export function usePortfolio() {
  const [positions, setPositions] = useState([])
  const [pnlData, setPnlData] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' })

  const [editingId, setEditingId] = useState(null)
  const [availableTickers, setAvailableTickers] = useState([])
  const [showTickerDropdown, setShowTickerDropdown] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [sharesError, setSharesError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (!window.api) return
    Promise.all([
      window.api.getPositions().catch(() => []),
      window.api.fetchPnL().catch(() => null),
      window.api.getScrapedTickers().catch(() => [])
    ]).then(([positionsResult, pnlResult, tickersResult]) => {
      setPositions(positionsResult?.positions || [])
      setPnlData(pnlResult)
      if (tickersResult) setAvailableTickers(tickersResult)
      setIsInitialLoad(false)
    })
  }, [])

  const [forexPrompt, setForexPrompt] = useState(null)

  const handleSave = async () => {
    if (!form.ticker) {
      setErrorMessage("Ticker harus diisi!")
      return
    }
    if (!form.shares) {
      setErrorMessage("Shares harus diisi!")
      return
    }
    if (!form.buyPrice) {
      setErrorMessage("Buy Price harus diisi!")
      return
    }
    if (!form.buyDate) {
      setErrorMessage("Buy Date harus diisi!")
      return
    }
    const sharesNum = parseFloat(form.shares)
    if (isNaN(sharesNum) || sharesNum <= 0 || !Number.isInteger(sharesNum)) {
      setSharesError(true)
      setErrorMessage("Shares harus angka bulat dan lebih dari 0!")
      return
    }
    const buyPriceNum = parseFloat(form.buyPrice)
    if (isNaN(buyPriceNum) || buyPriceNum <= 0) {
      setErrorMessage("Buy Price harus lebih dari 0!");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (form.buyDate > today) {
      setErrorMessage("Buy date tidak boleh melebihi hari ini!");
      return;
    }
    if (!availableTickers.some(t => t.ticker === form.ticker)) {
      setErrorMessage("Ticker tidak valid! Pilih ticker dari dropdown.");
      return;
    }

    // Check forex rate availability before saving (skip for IDR)
    if (form.currency !== 'IDR') {
      try {
        const fxResult = await window.api.checkForexRate({ currency: form.currency, buyDate: form.buyDate });
        console.log('checkForexRate result:', JSON.stringify(fxResult));
        if (fxResult && !fxResult.available) {
          setForexPrompt(fxResult);
          return;
        }
      } catch (e) {
        console.error('checkForexRate error:', e);
        setErrorMessage(`Forex check error: ${e.message}`);
        return;
      }
    }

    await doSave();
  };

  const doSave = async () => {
    const pos = { ...form, shares: parseFloat(form.shares) * 100, buyPrice: parseFloat(form.buyPrice) };
    if (editingId) await window.api.editPosition(editingId, pos);
    else await window.api.addPosition(pos);
    const updated = await window.api.getPositions();
    setPositions(updated?.positions || []);
    setShowAdd(false);
    setEditingId(null);
    setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' });
    setSharesError(false);
    setErrorMessage('');
    setForexPrompt(null);
    window.api.fetchPnL().then(setPnlData).catch(() => {})
  };

  const handleForexChoice = (choice) => {
    if (choice === 'change_date') {
      // Close the prompt and let user change the date
      setForexPrompt(null);
    } else if (choice === 'use_average') {
      // Proceed with save — PnL calculation will use the fallback
      setForexPrompt(null);
      doSave();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.api.deletePosition(deleteTarget.id)
    const updated = await window.api.getPositions()
    setPositions(updated?.positions || [])
    setDeleteTarget(null)
    window.api.fetchPnL().then(setPnlData).catch(() => {})
  }

  const handleEditClick = (position) => {
    setForm({ ticker: position.ticker, company: position.company, shares: position.shares / 100, buyPrice: position.buyPrice, buyDate: position.buyDate, currency: position.currency });
    setEditingId(position.id);
    setSharesError(false);
    setErrorMessage('');
    setShowAdd(true);
  };

  const pieData = useMemo(() => positions.map((p, index) => {
    const cur = ambilPnl(p, index, pnlData);
    const shares = parseFloat(p.shares) || 0;
    const buyPrice = parseFloat(p.buyPrice) || 0;
    const curPriceIDR = cur?.currentPriceIDR || (buyPrice * 15650.0);
    return { name: p.ticker, value: curPriceIDR * shares };
  }).filter(d => d.value > 0), [positions, pnlData]);

  const treeData = useMemo(() => positions.map((p, index) => {
    const cur = ambilPnl(p, index, pnlData);
    const stockReturnIDR = cur?.stockReturnIDR ?? cur?.stockReturn ?? 0;
    const pnlPct = (cur?.buyPriceIDR && cur?.shares ? (stockReturnIDR / (cur.buyPriceIDR * cur.shares)) * 100 : 0);
    const valuationIDR = cur?.currentPriceIDR ? (cur.currentPriceIDR * p.shares) : (parseFloat(p.buyPrice) * 15650.0 * p.shares);
    return {
      name: p.ticker + ':' + formatChange(pnlPct),
      size: Math.max(valuationIDR, 1)
    }
  }), [positions, pnlData]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' });
    setSharesError(false);
    setErrorMessage('');
  }

  const openAddModal = () => {
    resetForm();
    setShowAdd(true);
  }

  return {
    positions,
    pnlData,
    showAdd,
    setShowAdd,
    form,
    setForm,
    editingId,
    availableTickers,
    showTickerDropdown,
    setShowTickerDropdown,
    isInitialLoad,
    sharesError,
    setSharesError,
    errorMessage,
    setErrorMessage,
    deleteTarget,
    setDeleteTarget,
    handleSave,
    handleDelete,
    handleEditClick,
    pieData,
    treeData,
    openAddModal,
    resetForm,
    forexPrompt,
    handleForexChoice
  }
}
