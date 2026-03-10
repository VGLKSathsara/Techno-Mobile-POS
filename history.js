// history.js - History Management

// Display history function
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
