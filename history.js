// history.js - History Management

window.displayHistory = function () {
  const historyList = document.getElementById('historyList')
  if (!historyList) return
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )

  if (history.length === 0) {
    historyList.innerHTML =
      '<p style="text-align:center; padding:20px;">No history found</p>'
    return
  }

  historyList.innerHTML = history
    .map(
      (inv, index) => `
    <div class="history-item">
      <div class="history-info">
        <h4>${inv.customerName}</h4>
        <div class="history-meta">
          <span># ${inv.invoiceNo}</span> | <span>${inv.date}</span>
        </div>
      </div>
      <div class="history-amount">Rs. ${inv.total.toLocaleString()}</div>
      <div class="history-actions">
        <button class="history-btn view" onclick="viewInvoice(${index})"><i class="fas fa-eye"></i></button>
        <button class="history-btn delete" onclick="deleteFromHistory(${index})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `,
    )
    .join('')
}

window.viewInvoice = function (index) {
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]
  if (!inv) return

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

  // Delay added to ensure DOM is rendered before PDF capture
  setTimeout(() => {
    generatePDFWithSettings(inv.invoiceNo)
  }, 500)
}

window.deleteFromHistory = function (index) {
  if (confirm('Delete this invoice?')) {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    history.splice(index, 1)
    localStorage.setItem('techno_invoice_history', JSON.stringify(history))
    displayHistory()
  }
}

window.clearHistory = function () {
  if (confirm('Clear all history?')) {
    localStorage.setItem('techno_invoice_history', '[]')
    displayHistory()
  }
}
