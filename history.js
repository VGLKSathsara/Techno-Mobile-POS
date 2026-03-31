// history.js — Invoice History Management (v2.2)

window.displayHistory = function () {
  const query =
    document.getElementById('historySearch')?.value.toLowerCase().trim() || ''
  const allHistory = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const filtered = query
    ? allHistory.filter(
        (inv) =>
          (inv.customerName || '').toLowerCase().includes(query) ||
          (inv.invoiceNo || '').toLowerCase().includes(query) ||
          (inv.phone || '').includes(query),
      )
    : allHistory

  _renderStats(allHistory, filtered)
  _renderList(filtered, allHistory)
}

function _renderStats(allHistory, filtered) {
  const statsEl = document.getElementById('historyStats')
  if (!statsEl) return
  const total = allHistory.reduce((s, inv) => s + (inv.total || 0), 0)
  const avg = allHistory.length ? total / allHistory.length : 0
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const todayRevenue = allHistory
    .filter((inv) => inv.date === today)
    .reduce((s, inv) => s + (inv.total || 0), 0)

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Invoices</div>
      <div class="stat-value blue">${allHistory.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value green">Rs. ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg. Invoice</div>
      <div class="stat-value">Rs. ${avg.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Today's Revenue</div>
      <div class="stat-value" style="color:var(--warning)">Rs. ${todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Showing</div>
      <div class="stat-value">${filtered.length} <span style="font-size:14px;font-weight:500;color:var(--gray)">of ${allHistory.length}</span></div>
    </div>
  `
}

function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function _renderList(filtered, allHistory) {
  const historyList = document.getElementById('historyList')
  if (!historyList) return

  if (filtered.length === 0) {
    historyList.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>No invoices found</p></div>`
    return
  }

  historyList.innerHTML = filtered
    .map((inv) => {
      // Find real index in full array so delete/view works even when filtered
      const realIndex = allHistory.findIndex(
        (h) =>
          h.invoiceNo === inv.invoiceNo &&
          h.customerName === inv.customerName &&
          h.date === inv.date,
      )
      return `
    <div class="history-item" id="hist-item-${realIndex}">
      <div class="history-num">${realIndex + 1}</div>
      <div class="history-info">
        <h4>${_escHtml(inv.customerName || 'Walk-in Customer')}</h4>
        <div class="history-meta">
          <span><i class="fas fa-hashtag"></i> ${_escHtml(inv.invoiceNo || 'N/A')}</span>
          <span><i class="fas fa-calendar-alt"></i> ${_escHtml(inv.date || 'N/A')}</span>
          ${inv.phone && inv.phone !== 'Not Provided' ? `<span><i class="fas fa-phone"></i> ${_escHtml(inv.phone)}</span>` : ''}
        </div>
      </div>
      <div class="history-amount">Rs. ${(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="history-actions">
        <button class="history-btn view" id="dl-btn-${realIndex}" onclick="viewInvoice(${realIndex})">
          <i class="fas fa-file-download"></i> Download PDF
        </button>
        <button class="history-btn delete" onclick="deleteFromHistory(${realIndex})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`
    })
    .join('')
}

window.viewInvoice = function (index) {
  try {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    const inv = history[index]
    if (!inv) {
      if (typeof showToast === 'function')
        showToast('Invoice not found', 'error')
      return
    }

    document.getElementById('pdfCustomerName').innerText =
      inv.customerName || 'Walk-in Customer'
    document.getElementById('pdfCustomerPhone').innerText =
      inv.phone || 'Not Provided'
    document.getElementById('pdfInvoiceDisplay').innerText =
      inv.invoiceNo || 'N/A'
    document.getElementById('pdfDateDisplay').innerText =
      inv.date || new Date().toLocaleDateString()
    document.getElementById('pdfItemsBody').innerHTML =
      inv.itemsHTML ||
      '<tr><td colspan="4" style="text-align:center;padding:20px">No items found</td></tr>'
    document.getElementById('pdfSubTotal').innerText =
      `Rs. ${(inv.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    document.getElementById('pdfDiscount').innerText =
      `-Rs. ${(inv.discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    document.getElementById('pdfGrandTotal').innerText =
      `Rs. ${(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    const terms = JSON.parse(localStorage.getItem('techno_terms') || '[]')
    const selected = terms.filter((t) => t.selected)
    const pdfTermsList = document.getElementById('pdfTermsList')
    if (pdfTermsList) {
      pdfTermsList.innerHTML =
        selected.length === 0
          ? '<li style="color:#64748b"><i class="fas fa-info-circle"></i> No terms selected</li>'
          : selected
              .map(
                (t) =>
                  `<li><i class="fas fa-check-circle" style="color:#10b981"></i> ${_escHtml(t.text)}</li>`,
              )
              .join('')
    }

    // Loading state on button
    const btn = document.getElementById(`dl-btn-${index}`)
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'
    }

    setTimeout(() => {
      if (typeof generatePDFWithSettings === 'function') {
        generatePDFWithSettings(inv.invoiceNo || 'invoice')
      }
      setTimeout(() => {
        if (btn) {
          btn.disabled = false
          btn.innerHTML = '<i class="fas fa-file-download"></i> Download PDF'
        }
      }, 3500)
    }, 300)
  } catch (err) {
    console.error('viewInvoice error:', err)
    if (typeof showToast === 'function')
      showToast('Error loading invoice', 'error')
  }
}

window.deleteFromHistory = function (index) {
  if (!confirm('Delete this invoice? This cannot be undone.')) return
  try {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    history.splice(index, 1)
    localStorage.setItem('techno_invoice_history', JSON.stringify(history))
    displayHistory()
    if (typeof showToast === 'function') showToast('Invoice deleted')
  } catch (err) {
    console.error('deleteFromHistory error:', err)
    if (typeof showToast === 'function')
      showToast('Error deleting invoice', 'error')
  }
}

window.exportHistoryCSV = function () {
  const allHistory = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  if (allHistory.length === 0) {
    if (typeof showToast === 'function')
      showToast('No invoices to export', 'error')
    return
  }
  const headers = [
    'Invoice No',
    'Customer Name',
    'Phone',
    'Date',
    'Subtotal',
    'Discount',
    'Total',
  ]
  const rows = allHistory.map((inv) => [
    inv.invoiceNo || '',
    inv.customerName || 'Walk-in Customer',
    inv.phone || '',
    inv.date || '',
    (inv.subtotal || 0).toFixed(2),
    (inv.discount || 0).toFixed(2),
    (inv.total || 0).toFixed(2),
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `TM_History_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  if (typeof showToast === 'function') showToast('Exported as CSV!', 'success')
}
