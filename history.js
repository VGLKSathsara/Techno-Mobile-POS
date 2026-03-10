// ==================== HISTORY MANAGEMENT ====================
const STORAGE_KEYS = {
  INVOICE_HISTORY: 'techno_invoice_history',
  INVENTORY: 'techno_inventory',
  USER: 'techno_user',
}

// Load invoice history
function loadHistory() {
  const saved = localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY)
  return saved ? JSON.parse(saved) : []
}

// Save invoice to histo
function saveToHistory(invoice) {
  const history = loadHistory()
  history.unshift(invoice) // Add to beginning
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))
  if (typeof displayHistory === 'function') {
    displayHistory()
  }
}

// Delete from history
function deleteFromHistory(index) {
  const history = loadHistory()
  history.splice(index, 1)
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))
  if (typeof displayHistory === 'function') {
    displayHistory()
  }
}

// Clear all history
function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify([]))
    if (typeof displayHistory === 'function') {
      displayHistory()
    }
  }
}

// Display history (will be implemented in main script)
window.displayHistory = function () {
  const history = loadHistory()
  const historyList = document.getElementById('historyList')

  if (!historyList) return

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
        <h4>${inv.customerName}</h4>
        <div class="history-meta">
          <span><i class="fas fa-file-invoice"></i> ${inv.invoiceNo}</span>
          <span><i class="fas fa-calendar"></i> ${inv.date}</span>
          <span><i class="fas fa-phone"></i> ${inv.phone}</span>
        </div>
      </div>
      <div class="history-amount">Rs. ${inv.total.toLocaleString()}</div>
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
