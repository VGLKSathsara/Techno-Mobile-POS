// history.js - History Management

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

  // Stats
  const statsEl = document.getElementById('historyStats')
  if (statsEl) {
    const total = allHistory.reduce((s, inv) => s + (inv.total || 0), 0)
    const avg = allHistory.length ? total / allHistory.length : 0
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
        <div class="stat-label">Showing</div>
        <div class="stat-value">${filtered.length} of ${allHistory.length}</div>
      </div>
    `
  }

  const historyList = document.getElementById('historyList')
  if (!historyList) return

  if (filtered.length === 0) {
    historyList.innerHTML =
      '<div class="empty-state"><i class="fas fa-receipt"></i><p>No invoices found</p></div>'
    return
  }

  historyList.innerHTML = filtered
    .map(
      (inv, index) => `
    <div class="history-item">
      <div class="history-num">${index + 1}</div>
      <div class="history-info">
        <h4>${inv.customerName || 'Walk-in Customer'}</h4>
        <div class="history-meta">
          <span><i class="fas fa-hashtag"></i> ${inv.invoiceNo || 'N/A'}</span>
          <span><i class="fas fa-calendar-alt"></i> ${inv.date || 'N/A'}</span>
          ${inv.phone && inv.phone !== 'Not Provided' ? `<span><i class="fas fa-phone"></i> ${inv.phone}</span>` : ''}
        </div>
      </div>
      <div class="history-amount">Rs. ${(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="history-actions">
        <button class="history-btn view" onclick="viewInvoice(${index})"><i class="fas fa-eye"></i> View</button>
        <button class="history-btn delete" onclick="deleteFromHistory(${index})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `,
    )
    .join('')
}

window.viewInvoice = function (index) {
  try {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    const inv = history[index]
    if (!inv) {
      alert('Invoice not found')
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
                  `<li><i class="fas fa-check-circle" style="color:#10b981"></i> ${t.text}</li>`,
              )
              .join('')
    }

    setTimeout(() => generatePDFWithSettings(inv.invoiceNo || 'invoice'), 400)
  } catch (err) {
    console.error(err)
    alert('Error loading invoice')
  }
}

window.deleteFromHistory = function (index) {
  if (!confirm('Delete this invoice?')) return
  try {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    history.splice(index, 1)
    localStorage.setItem('techno_invoice_history', JSON.stringify(history))
    displayHistory()
    if (typeof showToast === 'function') showToast('Invoice deleted')
  } catch (err) {
    console.error(err)
    alert('Error deleting invoice')
  }
}
