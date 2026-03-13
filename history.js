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

    const elements = [
      'pdfCustomerName',
      'pdfCustomerPhone',
      'pdfInvoiceDisplay',
      'pdfDateDisplay',
      'pdfItemsBody',
      'pdfSubTotal',
      'pdfDiscount',
      'pdfGrandTotal',
      'pdfTermsList',
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

    // Load terms from localStorage for history view
    const terms = JSON.parse(localStorage.getItem('techno_terms') || '[]')
    const selectedTerms = terms.filter((t) => t.selected)
    const pdfTermsList = document.getElementById('pdfTermsList')
    if (pdfTermsList) {
      if (selectedTerms.length === 0) {
        pdfTermsList.innerHTML =
          '<li style="color: #64748b;"><i class="fas fa-info-circle"></i> No terms selected</li>'
      } else {
        pdfTermsList.innerHTML = selectedTerms
          .map(
            (term) => `
          <li><i class="fas fa-check-circle" style="color: #10b981;"></i> ${term.text}</li>
        `,
          )
          .join('')
      }
    }

    // Show print popup for history view
    setTimeout(() => {
      printInvoiceFromHistory(inv.invoiceNo || 'invoice')
    }, 500)
  } catch (error) {
    console.error('Error viewing invoice:', error)
    alert('Error loading invoice')
  }
}

// Print from history
window.printInvoiceFromHistory = function (filename) {
  const element = document.getElementById('invoice-premium')
  if (!element) {
    console.error('PDF element not found')
    return
  }

  const printStyles = `
    <style>
      @media print {
        body {
          margin: 0;
          padding: 10mm;
          background: white;
        }
        #invoice-premium {
          display: block !important;
          position: relative !important;
          left: 0 !important;
          top: 0 !important;
          visibility: visible !important;
          width: 100%;
          box-shadow: none;
        }
        .invoice-pdf {
          padding: 0;
        }
        .invoice-card {
          box-shadow: none;
          border: 1px solid #e2e8f0;
        }
        .pdf-header {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page {
          size: A4;
          margin: 0.5in;
        }
      }
    </style>
  `

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Invoice - ${filename}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          ${document.querySelector('style').innerHTML}
        </style>
        ${printStyles}
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }, 500);
          }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
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
