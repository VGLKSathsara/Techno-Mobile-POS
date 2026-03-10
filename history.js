// history.js - History Management for Techno Mobile POS

// ==================== HISTORY FUNCTIONS ====================

// Display history in the history tab
window.displayHistory = function () {
  console.log('Displaying history...')

  const historyList = document.getElementById('historyList')
  if (!historyList) return

  // Load history from localStorage
  const saved = localStorage.getItem('techno_invoice_history')
  const history = saved ? JSON.parse(saved) : []

  if (history.length === 0) {
    historyList.innerHTML = `
      <div style="text-align: center; padding: 50px; color: var(--gray);">
        <i class="fas fa-history" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
        <p>No invoice history found</p>
      </div>
    `
    return
  }

  // Display history items
  historyList.innerHTML = history
    .map(
      (inv, index) => `
    <div class="history-item">
      <div class="history-info">
        <h4>${inv.customerName || 'Customer'}</h4>
        <div class="history-meta">
          <span><i class="fas fa-file-invoice"></i> ${inv.invoiceNo || 'N/A'}</span>
          <span><i class="fas fa-calendar"></i> ${inv.date || 'N/A'}</span>
          <span><i class="fas fa-phone"></i> ${inv.phone || 'N/A'}</span>
        </div>
      </div>
      <div class="history-amount">Rs. ${(inv.total || 0).toLocaleString()}</div>
      <div class="history-actions">
        <button class="history-btn view" onclick="viewInvoice(${index})">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="history-btn delete" onclick="deleteFromHistory(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `,
    )
    .join('')
}

// View invoice from history
window.viewInvoice = function (index) {
  console.log('Viewing invoice:', index)

  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]
  if (!inv) return

  // Populate PDF with history data
  document.getElementById('pdfCustomerName').innerText = inv.customerName
  document.getElementById('pdfCustomerPhone').innerText = inv.phone
  document.getElementById('pdfInvoiceDisplay').innerText = inv.invoiceNo
  document.getElementById('pdfDateDisplay').innerText = inv.date
  document.getElementById('pdfItemsBody').innerHTML = inv.itemsHTML
  document.getElementById('pdfSubTotal').innerText =
    `Rs. ${inv.subtotal.toLocaleString()}`
  document.getElementById('pdfDiscount').innerText =
    `-Rs. ${inv.discount.toLocaleString()}`
  document.getElementById('pdfGrandTotal').innerText =
    `Rs. ${inv.total.toLocaleString()}`

  // Generate PDF
  if (typeof generatePDFWithSettings === 'function') {
    generatePDFWithSettings(inv.invoiceNo)
  } else {
    console.error('generatePDFWithSettings function not found')
  }
}

// Delete from history
window.deleteFromHistory = function (index) {
  console.log('Deleting invoice:', index)

  if (confirm('Are you sure you want to delete this invoice?')) {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    history.splice(index, 1)
    localStorage.setItem('techno_invoice_history', JSON.stringify(history))
    displayHistory()
  }
}

// Clear all history
window.clearHistory = function () {
  console.log('Clearing all history')

  if (confirm('Are you sure you want to clear all history?')) {
    localStorage.setItem('techno_invoice_history', JSON.stringify([]))
    displayHistory()
  }
}
