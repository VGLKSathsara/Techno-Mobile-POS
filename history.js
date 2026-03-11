// history.js - History Management

window.displayHistory = function () {
  const historyList = document.getElementById('historyList')
  if (!historyList) return
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )

  if (history.length === 0) {
    historyList.innerHTML =
      '<p style="text-align:center; padding:20px; color: #64748b;">No history found</p>'
    return
  }

  historyList.innerHTML = history
    .map(
      (inv, index) => `
    <div class="history-item">
      <div class="history-info">
        <h4>${inv.customerName || 'Walk-in Customer'}</h4>
        <div class="history-meta">
          <span># ${inv.invoiceNo || 'N/A'}</span> | <span>${inv.date || 'N/A'}</span>
        </div>
      </div>
      <div class="history-amount">Rs. ${(inv.total || 0).toFixed(2)}</div>
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
      console.error('Invoice not found')
      alert('Invoice not found')
      return
    }

    // Check if elements exist
    const elements = [
      'pdfCustomerName',
      'pdfCustomerPhone',
      'pdfInvoiceDisplay',
      'pdfDateDisplay',
      'pdfItemsBody',
      'pdfSubTotal',
      'pdfDiscount',
      'pdfGrandTotal',
    ]

    for (const elId of elements) {
      if (!document.getElementById(elId)) {
        console.error(`Element ${elId} not found`)
        alert('PDF template not found')
        return
      }
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
      '<tr><td colspan="4" style="text-align: center; padding: 20px;">No items found</td></tr>'

    document.getElementById('pdfSubTotal').innerText =
      `Rs. ${(inv.subtotal || 0).toFixed(2)}`
    document.getElementById('pdfDiscount').innerText =
      `-Rs. ${(inv.discount || 0).toFixed(2)}`
    document.getElementById('pdfGrandTotal').innerText =
      `Rs. ${(inv.total || 0).toFixed(2)}`

    setTimeout(() => {
      generatePDFWithSettings(inv.invoiceNo || 'invoice')
    }, 500)
  } catch (error) {
    console.error('Error viewing invoice:', error)
    alert('Error loading invoice')
  }
}

window.deleteFromHistory = function (index) {
  if (confirm('Delete this invoice?')) {
    try {
      const history = JSON.parse(
        localStorage.getItem('techno_invoice_history') || '[]',
      )
      history.splice(index, 1)
      localStorage.setItem('techno_invoice_history', JSON.stringify(history))
      displayHistory()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Error deleting invoice')
    }
  }
}
