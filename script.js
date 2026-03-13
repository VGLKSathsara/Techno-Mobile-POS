// script.js - Main POS System Script

const STORAGE_KEYS = {
  INVOICE_HISTORY: 'techno_invoice_history',
  INVENTORY: 'techno_inventory',
  USER: 'techno_user',
  TERMS: 'techno_terms',
}

const defaultInventory = [
  { n: 'iPhone 20W Power Adapter', p: 6500 },
  { n: 'MagSafe Charger', p: 14500 },
  { n: 'AirPods Pro (2nd Gen)', p: 85000 },
  { n: 'Silicone Case', p: 3500 },
  { n: '9H Tempered Glass', p: 1800 },
  { n: 'Power Bank 20,000mAh', p: 8900 },
]

const defaultTerms = [
  {
    id: 'term1',
    text: 'Genuine products with 2 year warranty',
    selected: true,
  },
  { id: 'term2', text: 'Physical damage not covered', selected: true },
  { id: 'term3', text: 'Warranty valid with original invoice', selected: true },
]

// Initialize default data
if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(defaultInventory))
}

if (!localStorage.getItem(STORAGE_KEYS.TERMS)) {
  localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(defaultTerms))
}

// Load Inventory
function loadInventory() {
  const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return defaultInventory
    }
  }
  return defaultInventory
}

// Save Inventory
function saveInventory(inventory) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory))
}

// Load Terms
function loadTerms() {
  const saved = localStorage.getItem(STORAGE_KEYS.TERMS)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return defaultTerms
    }
  }
  return defaultTerms
}

// Save Terms
function saveTerms(terms) {
  localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(terms))
}

// Display Terms in POS
function displayTerms() {
  const container = document.getElementById('termsContainer')
  if (!container) return

  const terms = loadTerms()

  if (terms.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 20px; color: var(--gray);">No terms added. Click "Add New Term" to create one.</p>'
    return
  }

  container.innerHTML = terms
    .map(
      (term) => `
    <div class="term-item" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--light); border-radius: 12px; border: 1px solid var(--border); margin-bottom: 8px;">
      <input type="checkbox" 
        ${term.selected ? 'checked' : ''} 
        onchange="toggleTerm('${term.id}')"
        style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;"
      >
      <input type="text" 
        value="${term.text.replace(/"/g, '&quot;')}" 
        onchange="updateTermText('${term.id}', this.value)"
        style="flex: 1; padding: 8px 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif;"
      >
      <button onclick="deleteTerm('${term.id}')" 
        style="background: none; border: none; color: var(--danger); font-size: 18px; cursor: pointer; padding: 5px;">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `,
    )
    .join('')
}

// Add New Term
window.addNewTerm = function () {
  const terms = loadTerms()
  const newId =
    'term_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  terms.push({
    id: newId,
    text: 'New term and condition',
    selected: true,
  })
  saveTerms(terms)
  displayTerms()
}

// Toggle Term Selection
window.toggleTerm = function (termId) {
  const terms = loadTerms()
  const term = terms.find((t) => t.id === termId)
  if (term) {
    term.selected = !term.selected
    saveTerms(terms)
  }
}

// Update Term Text
window.updateTermText = function (termId, newText) {
  const terms = loadTerms()
  const term = terms.find((t) => t.id === termId)
  if (term) {
    term.text = newText
    saveTerms(terms)
  }
}

// Delete Term
window.deleteTerm = function (termId) {
  if (confirm('Delete this term?')) {
    const terms = loadTerms()
    const filtered = terms.filter((t) => t.id !== termId)
    saveTerms(filtered)
    displayTerms()
  }
}

// Get Selected Terms for PDF
function getSelectedTermsHTML() {
  const terms = loadTerms()
  const selected = terms.filter((t) => t.selected)

  if (selected.length === 0) {
    return '<li style="color: #64748b;"><i class="fas fa-info-circle"></i> No terms selected</li>'
  }

  return selected
    .map(
      (term) => `
    <li><i class="fas fa-check-circle" style="color: #10b981;"></i> ${term.text}</li>
  `,
    )
    .join('')
}

// Phone number validation
window.validatePhone = function (input) {
  input.value = input.value.replace(/[^0-9]/g, '')
  if (input.value.length > 10) input.value = input.value.slice(0, 10)
}

// Apply discount function
window.applyDiscount = function () {
  const discountInput = document.getElementById('inDiscount')
  let discount = parseFloat(discountInput.value) || 0

  const totalText = document.getElementById('liveTotal').innerText
  let totalNumber = totalText.replace('Rs.', '').trim()
  totalNumber = totalNumber.replace(/,/g, '')
  const total = parseFloat(totalNumber) || 0

  if (discount < 0) discount = 0
  if (discount > total) discount = total

  discountInput.value = discount
  recalc()
}

// Login function
window.login = function () {
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value
  if (username === 'DilkaRishan' && password === 'Dilka789') {
    document.getElementById('loginPage').style.display = 'none'
    document.getElementById('posSystem').style.display = 'block'
    document.getElementById('loggedUser').innerText = username
    initializePOS()
  } else {
    alert('Invalid credentials!')
  }
}

// Logout function
window.logout = function () {
  document.getElementById('loginPage').style.display = 'block'
  document.getElementById('posSystem').style.display = 'none'
  document.getElementById('username').value = ''
  document.getElementById('password').value = ''
}

// Initialize POS
function initializePOS() {
  const accGrid = document.getElementById('accGrid')
  if (accGrid) accGrid.innerHTML = ''

  const deviceArea = document.getElementById('deviceArea')
  if (deviceArea) deviceArea.innerHTML = ''

  const savedInventory = loadInventory()

  if (accGrid) {
    savedInventory.forEach((item) => addAcc(item.n, item.p, false))
  }

  const dateInput = document.getElementById('inDate')
  if (dateInput) dateInput.valueAsDate = new Date()

  const liveDate = document.getElementById('liveDate')
  if (liveDate) {
    liveDate.innerText = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  document.getElementById('inNo').value = generateInvoiceNumber()
  document.getElementById('inDiscount').value = 0

  displayTerms()
  recalc()

  if (typeof displayHistory === 'function') displayHistory()
}

// Generate Invoice Number
function generateInvoiceNumber() {
  const now = new Date()
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`
}

// Add Accessory
window.addAcc = function (n = 'New Accessory', p = 0, shouldSave = true) {
  const accGrid = document.getElementById('accGrid')
  if (!accGrid) return
  const div = document.createElement('div')
  div.className = 'pos-acc-card'
  div.innerHTML = `
    <input type="checkbox" class="pos-check" onchange="recalc()">
    <div class="pos-acc-info">
      <input type="text" class="pos-acc-name" value="${n}" oninput="recalc(); saveInventoryToStorage()">
      <div class="pos-acc-meta">
        <input type="number" class="pos-qty" value="1" min="1" oninput="recalc()">
        <input type="number" class="pos-price" value="${p}" oninput="recalc(); saveInventoryToStorage()">
      </div>
    </div>
    <button class="acc-delete-btn" onclick="deleteAccessory(this)"><i class="fas fa-times"></i></button>
  `
  accGrid.appendChild(div)
  if (shouldSave) {
    saveInventoryToStorage()
  }
  recalc()
}

// Delete Accessory
window.deleteAccessory = function (button) {
  if (confirm('Delete this accessory?')) {
    button.closest('.pos-acc-card').remove()
    recalc()
    saveInventoryToStorage()
  }
}

// Save Inventory to Storage
function saveInventoryToStorage() {
  const inventory = []
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    const nameInput = card.querySelector('.pos-acc-name')
    const priceInput = card.querySelector('.pos-price')

    if (nameInput && priceInput) {
      inventory.push({
        n: nameInput.value || 'New Accessory',
        p: Number(priceInput.value) || 0,
      })
    }
  })
  saveInventory(inventory)
}

// Add Device
window.addDevice = function () {
  const deviceArea = document.getElementById('deviceArea')
  const div = document.createElement('div')
  div.className = 'pos-device-row'
  div.innerHTML = `
    <input type="text" class="d-name" placeholder="Device Model" oninput="recalc()">
    <input type="text" class="d-storage" placeholder="Storage" oninput="recalc()">
    <input type="text" class="d-imei" placeholder="IMEI" oninput="recalc()">
    <input type="number" class="d-qty" value="1" min="1" oninput="recalc()">
    <input type="number" class="d-price" placeholder="Price" oninput="recalc()">
    <button onclick="if(confirm('Remove this device?')){this.parentElement.remove(); recalc()}" style="background:none; border:none; color:#ef4444; font-size:22px; cursor:pointer;">&times;</button>
  `
  deviceArea.appendChild(div)
  recalc()
}

// Recalculate Total
window.recalc = function () {
  let sub = 0

  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    if (card.querySelector('.pos-check')?.checked) {
      const qty = Number(card.querySelector('.pos-qty').value) || 0
      const price = Number(card.querySelector('.pos-price').value) || 0
      sub += qty * price
    }
  })

  document.querySelectorAll('.pos-device-row').forEach((row) => {
    const qty = Number(row.querySelector('.d-qty').value) || 0
    const price = Number(row.querySelector('.d-price').value) || 0
    sub += qty * price
  })

  const discount = parseFloat(document.getElementById('inDiscount').value) || 0
  const total = sub - discount
  document.getElementById('liveTotal').innerText = 'Rs. ' + total.toFixed(2)
}

// Switch Tab
window.switchTab = function (tab) {
  const posTab = document.getElementById('posTab')
  const historyTab = document.getElementById('historyTab')
  const navItems = document.querySelectorAll('.nav-item')
  if (tab === 'pos') {
    posTab.style.display = 'block'
    historyTab.classList.remove('active')
    navItems[0].classList.add('active')
    navItems[1].classList.remove('active')
  } else {
    posTab.style.display = 'none'
    historyTab.classList.add('active')
    navItems[0].classList.remove('active')
    navItems[1].classList.add('active')
    if (typeof displayHistory === 'function') displayHistory()
  }
}

// ========== PDF TEMPLATE UPDATE FUNCTION ==========
function updatePDFTemplate() {
  const customerName =
    document.getElementById('inName').value || 'Walk-in Customer'
  const customerPhone =
    document.getElementById('inPhone').value || 'Not Provided'
  const invoiceNo = document.getElementById('inNo').value
  const discount = parseFloat(document.getElementById('inDiscount').value) || 0

  document.getElementById('pdfCustomerName').innerText = customerName
  document.getElementById('pdfCustomerPhone').innerText = customerPhone
  document.getElementById('pdfInvoiceDisplay').innerText = invoiceNo

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  document.getElementById('pdfDateDisplay').innerText = formattedDate

  let itemsHTML = ''
  let subtotal = 0

  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    if (card.querySelector('.pos-check').checked) {
      const name = card.querySelector('.pos-acc-name').value || 'Accessory'
      const qty = Number(card.querySelector('.pos-qty').value) || 1
      const price = Number(card.querySelector('.pos-price').value) || 0
      const total = qty * price
      subtotal += total

      itemsHTML += `<tr>
        <td style="text-align: left;">${name}</td>
        <td style="text-align: center;">${qty}</td>
        <td style="text-align: right;">Rs. ${price.toFixed(2)}</td>
        <td style="text-align: right;">Rs. ${total.toFixed(2)}</td>
      </tr>`
    }
  })

  document.querySelectorAll('.pos-device-row').forEach((row) => {
    const name = row.querySelector('.d-name').value
    if (name && name.trim() !== '') {
      const storage = row.querySelector('.d-storage').value
      const imei = row.querySelector('.d-imei').value
      const qty = Number(row.querySelector('.d-qty').value) || 1
      const price = Number(row.querySelector('.d-price').value) || 0

      if (price === 0) return

      const total = qty * price
      subtotal += total

      let description = name
      if (storage && storage.trim() !== '') description += ` (${storage})`
      if (imei && imei.trim() !== '') description += ` - IMEI: ${imei}`

      itemsHTML += `<tr>
        <td style="text-align: left;">${description}</td>
        <td style="text-align: center;">${qty}</td>
        <td style="text-align: right;">Rs. ${price.toFixed(2)}</td>
        <td style="text-align: right;">Rs. ${total.toFixed(2)}</td>
      </tr>`
    }
  })

  document.getElementById('pdfItemsBody').innerHTML = itemsHTML
  document.getElementById('pdfSubTotal').innerText =
    `Rs. ${subtotal.toFixed(2)}`
  document.getElementById('pdfDiscount').innerText =
    `-Rs. ${discount.toFixed(2)}`
  document.getElementById('pdfGrandTotal').innerText =
    `Rs. ${(subtotal - discount).toFixed(2)}`

  const pdfTermsList = document.getElementById('pdfTermsList')
  if (pdfTermsList) {
    pdfTermsList.innerHTML = getSelectedTermsHTML()
  }

  return subtotal
}

// ========== PRINT FUNCTION ==========
window.printInvoice = function () {
  const hasAccessories =
    document.querySelectorAll('.pos-acc-card .pos-check:checked').length > 0
  const hasDevices = Array.from(
    document.querySelectorAll('.pos-device-row'),
  ).some(
    (row) =>
      row.querySelector('.d-name') &&
      row.querySelector('.d-name').value.trim() !== '',
  )

  if (!hasAccessories && !hasDevices) {
    alert('Please add at least one item to print invoice')
    return
  }

  // Update PDF template with current data
  const subtotal = updatePDFTemplate()

  // Save to History before printing
  const invoiceNo = document.getElementById('inNo').value
  const customerName =
    document.getElementById('inName').value || 'Walk-in Customer'
  const customerPhone =
    document.getElementById('inPhone').value || 'Not Provided'
  const discount = parseFloat(document.getElementById('inDiscount').value) || 0

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
  )
  history.unshift({
    invoiceNo,
    customerName,
    phone: customerPhone,
    date: formattedDate,
    total: subtotal - discount,
    itemsHTML: document.getElementById('pdfItemsBody').innerHTML,
    subtotal,
    discount,
  })
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))

  // Get the invoice element
  const invoiceElement = document.getElementById('invoice-premium')

  // Create print-specific styles
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

  // Open print dialog in new window
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Invoice - ${invoiceNo}</title>
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
        ${invoiceElement.outerHTML}
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

// ========== PDF GENERATION FUNCTION ==========
window.generatePremiumPDF = function () {
  const hasAccessories =
    document.querySelectorAll('.pos-acc-card .pos-check:checked').length > 0
  const hasDevices = Array.from(
    document.querySelectorAll('.pos-device-row'),
  ).some(
    (row) =>
      row.querySelector('.d-name') &&
      row.querySelector('.d-name').value.trim() !== '',
  )

  if (!hasAccessories && !hasDevices) {
    alert('Please add at least one item to generate invoice')
    return
  }

  const invoiceNo = document.getElementById('inNo').value
  const customerName =
    document.getElementById('inName').value || 'Walk-in Customer'
  const customerPhone =
    document.getElementById('inPhone').value || 'Not Provided'
  const discount = parseFloat(document.getElementById('inDiscount').value) || 0

  // Update PDF template
  const subtotal = updatePDFTemplate()

  // Save to History
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
  )
  history.unshift({
    invoiceNo,
    customerName,
    phone: customerPhone,
    date: formattedDate,
    total: subtotal - discount,
    itemsHTML: document.getElementById('pdfItemsBody').innerHTML,
    subtotal,
    discount,
  })
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))

  // Generate PDF
  generatePDFWithSettings(invoiceNo)
}

// Generate PDF with Settings
window.generatePDFWithSettings = function (filename) {
  const element = document.getElementById('invoice-premium')
  if (!element) {
    console.error('PDF element not found')
    return
  }

  element.style.position = 'static'
  element.style.left = '0'
  element.style.display = 'block'
  element.style.visibility = 'visible'
  element.style.background = 'white'

  if (typeof html2pdf === 'undefined') {
    console.error('html2pdf library not loaded')
    alert('PDF library not loaded. Please refresh the page.')
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    return
  }

  const opt = {
    margin: [0.3, 0.3, 0.3, 0.3],
    filename: `TM_${filename}.pdf`,
    image: {
      type: 'jpeg',
      quality: 0.95,
    },
    html2canvas: {
      scale: 2,
      letterRendering: true,
      useCORS: true,
      logging: false,
      allowTaint: false,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
      precision: 16,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      before: '.page-break',
      after: '.page-break',
      avoid: 'tr',
    },
  }

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.visibility = 'hidden'
    })
    .catch((error) => {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.visibility = 'hidden'
    })
}

// Clear History
window.clearHistory = function () {
  if (confirm('Clear all history? This action cannot be undone.')) {
    localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, '[]')
    if (typeof displayHistory === 'function') displayHistory()
  }
}

// Enter key support for discount
document.addEventListener('DOMContentLoaded', function () {
  const discountInput = document.getElementById('inDiscount')
  if (discountInput) {
    discountInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        applyDiscount()
      }
    })
  }
})

window.onload = () => {
  document.getElementById('loginPage').style.display = 'block'
  document.getElementById('posSystem').style.display = 'none'
}
