// script.js - Complete POS System Script

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
  INVOICE_HISTORY: 'techno_invoice_history',
  INVENTORY: 'techno_inventory',
  USER: 'techno_user',
}

// ==================== INITIALIZATION ====================
const defaultInventory = [
  { n: 'iPhone 20W Power Adapter', p: 6500 },
  { n: 'MagSafe Charger', p: 14500 },
  { n: 'AirPods Pro (2nd Gen)', p: 85000 },
  { n: 'Silicone Case', p: 3500 },
  { n: '9H Tempered Glass', p: 1800 },
  { n: 'Power Bank 20,000mAh', p: 8900 },
]

// Load inventory from localStorage or use default
function loadInventory() {
  const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY)
  if (saved) {
    return JSON.parse(saved)
  }
  return defaultInventory
}

// Save inventory to localStorage
function saveInventory(inventory) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory))
}

// ==================== LOGIN FUNCTIONS ====================
function login() {
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  // Updated credentials: DilkaRishan / Dilka789
  if (username === 'DilkaRishan' && password === 'Dilka789') {
    localStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify({ username: 'DilkaRishan', loggedIn: true }),
    )
    document.getElementById('loginPage').style.display = 'none'
    document.getElementById('posSystem').style.display = 'block'
    document.getElementById('loggedUser').innerText = 'DilkaRishan'
    initializePOS()
  } else {
    alert('Invalid credentials! Use DilkaRishan / Dilka789')
  }
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.USER)
  document.getElementById('loginPage').style.display = 'block'
  document.getElementById('posSystem').style.display = 'none'
}

// Check if user is logged in
function checkLogin() {
  const user = localStorage.getItem(STORAGE_KEYS.USER)
  if (user) {
    document.getElementById('loginPage').style.display = 'none'
    document.getElementById('posSystem').style.display = 'block'
    initializePOS()
  }
}

// ==================== POS FUNCTIONS ====================
function initializePOS() {
  // Load inventory from localStorage
  const savedInventory = loadInventory()

  // Clear existing accessories first
  const accGrid = document.getElementById('accGrid')
  accGrid.innerHTML = ''

  savedInventory.forEach((item) => addAcc(item.n, item.p))

  // Set date
  document.getElementById('inDate').valueAsDate = new Date()
  document.getElementById('liveDate').innerText = new Date().toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  )

  // Generate invoice number
  document.getElementById('inNo').value = generateInvoiceNumber()

  // Display history
  if (typeof window.displayHistory === 'function') {
    window.displayHistory()
  }
}

// Generate unique invoice number
function generateInvoiceNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100)
  return `INV-${year}${month}${day}-${random}`
}

// Add accessory
function addAcc(n = 'New Accessory', p = 0) {
  const div = document.createElement('div')
  div.className = 'pos-acc-card'
  div.innerHTML = `
    <input type="checkbox" class="pos-check" onchange="recalc()">
    <div class="pos-acc-info">
      <input type="text" class="pos-acc-name" value="${n}" oninput="recalc()" placeholder="Item name">
      <div class="pos-acc-meta">
        <input type="number" class="pos-qty" value="1" min="1" oninput="recalc()">
        <input type="number" class="pos-price" value="${p}" oninput="recalc()" placeholder="Price">
      </div>
    </div>
  `
  document.getElementById('accGrid').appendChild(div)

  // Save to localStorage
  saveInventoryToStorage()
}

// Save inventory to localStorage
function saveInventoryToStorage() {
  const inventory = []
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    const name = card.querySelector('.pos-acc-name').value
    const price = Number(card.querySelector('.pos-price').value)
    inventory.push({ n: name, p: price })
  })
  saveInventory(inventory)
}

// Add device
function addDevice() {
  const div = document.createElement('div')
  div.className = 'pos-device-row'
  div.innerHTML = `
    <input type="text" class="d-name" placeholder="Device Model" oninput="recalc()">
    <input type="text" class="d-storage" placeholder="Storage" oninput="recalc()">
    <input type="text" class="d-imei" placeholder="IMEI / Serial" oninput="recalc()">
    <input type="number" class="d-qty" value="1" oninput="recalc()" style="text-align: center;">
    <input type="number" class="d-price" placeholder="Price" oninput="recalc()">
    <button onclick="this.parentElement.remove(); recalc()" style="background:none; border:none; color:#ef4444; font-size:22px; cursor:pointer;">&times;</button>
  `
  document.getElementById('deviceArea').appendChild(div)
}

// Recalculate total
function recalc() {
  let sub = 0
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    if (card.querySelector('.pos-check').checked) {
      sub +=
        Number(card.querySelector('.pos-qty').value) *
        Number(card.querySelector('.pos-price').value)
    }
  })
  document.querySelectorAll('.d-name').forEach((d, i) => {
    if (d.value) {
      sub +=
        Number(document.querySelectorAll('.d-qty')[i].value) *
        Number(document.querySelectorAll('.d-price')[i].value)
    }
  })
  let disc = Number(document.getElementById('inDiscount').value)
  document.getElementById('liveTotal').innerText =
    'Rs. ' + (sub - disc).toLocaleString()
}

// Switch tabs
function switchTab(tab) {
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
    if (typeof window.displayHistory === 'function') {
      window.displayHistory()
    }
  }
}

// View invoice from history
function viewInvoice(index) {
  const history = loadHistory()
  const inv = history[index]

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

  // Generate PDF with fixed settings
  generatePDFWithSettings(inv.invoiceNo)
}

// Load history function
function loadHistory() {
  const saved = localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY)
  return saved ? JSON.parse(saved) : []
}

// ==================== PDF GENERATION FUNCTION - MAIN ====================
function generatePremiumPDF() {
  // Get data from UI
  const invoiceNo = document.getElementById('inNo').value
  const customerName =
    document.getElementById('inName').value || 'Walk-in Customer'
  const customerPhone =
    document.getElementById('inPhone').value || 'Not Provided'
  const invoiceDate = document.getElementById('inDate').value
  const discount = Number(document.getElementById('inDiscount').value)

  const formattedDate = invoiceDate
    ? new Date(invoiceDate)
        .toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '/')
    : new Date()
        .toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '/')

  // Update PDF elements
  document.getElementById('pdfCustomerName').innerText = customerName
  document.getElementById('pdfCustomerPhone').innerText = customerPhone
  document.getElementById('pdfInvoiceDisplay').innerText = invoiceNo
  document.getElementById('pdfDateDisplay').innerText = formattedDate

  let itemsHTML = ''
  let subtotal = 0

  // Add accessories
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    if (card.querySelector('.pos-check').checked) {
      const name = card.querySelector('.pos-acc-name').value
      const qty = Number(card.querySelector('.pos-qty').value)
      const price = Number(card.querySelector('.pos-price').value)
      const total = qty * price
      subtotal += total
      itemsHTML += `
        <tr>
          <td>
            <div class="pdf-item-title">${name}</div>
            <div class="pdf-item-sub">Accessory</div>
          </td>
          <td style="text-align: center;">${qty}</td>
          <td style="text-align: right;">Rs. ${price.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 600;">Rs. ${total.toLocaleString()}</td>
        </tr>
      `
    }
  })

  // Add devices
  document.querySelectorAll('.d-name').forEach((d, i) => {
    if (d.value) {
      const model = d.value
      const storage = document.querySelectorAll('.d-storage')[i].value
      const imei = document.querySelectorAll('.d-imei')[i].value
      const qty = Number(document.querySelectorAll('.d-qty')[i].value)
      const price = Number(document.querySelectorAll('.d-price')[i].value)
      const total = qty * price
      subtotal += total

      let description = model
      if (storage) description += ` | ${storage}`

      itemsHTML += `
        <tr>
          <td>
            <div class="pdf-item-title">${description}</div>
            ${imei ? `<div class="pdf-item-sub">IMEI: ${imei}</div>` : ''}
          </td>
          <td style="text-align: center;">${qty}</td>
          <td style="text-align: right;">Rs. ${price.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 600;">Rs. ${total.toLocaleString()}</td>
        </tr>
      `
    }
  })

  // If no items, show a message
  if (!itemsHTML) {
    itemsHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #9ca3af;">No items selected</td></tr>`
  }

  document.getElementById('pdfItemsBody').innerHTML = itemsHTML
  document.getElementById('pdfSubTotal').innerText =
    `Rs. ${subtotal.toLocaleString()}`
  document.getElementById('pdfDiscount').innerText =
    `-Rs. ${discount.toLocaleString()}`
  document.getElementById('pdfGrandTotal').innerText =
    `Rs. ${(subtotal - discount).toLocaleString()}`

  // Save to history
  const invoiceData = {
    invoiceNo: invoiceNo,
    customerName: customerName,
    phone: customerPhone,
    date: formattedDate,
    subtotal: subtotal,
    discount: discount,
    total: subtotal - discount,
    itemsHTML: itemsHTML,
  }

  saveToHistory(invoiceData)

  // Generate PDF with fixed settings
  generatePDFWithSettings(invoiceNo)
}

// ==================== FIXED PDF GENERATION FUNCTION - COMPLETELY CENTERED ====================
function generatePDFWithSettings(filename) {
  const element = document.getElementById('invoice-premium')
  const invoiceNo =
    filename || document.getElementById('pdfInvoiceDisplay').innerText

  // Reset element styles for PDF generation
  element.style.position = 'absolute'
  element.style.left = '0'
  element.style.top = '0'
  element.style.display = 'flex'
  element.style.justifyContent = 'center'
  element.style.alignItems = 'flex-start'
  element.style.width = '210mm'
  element.style.height = '297mm'
  element.style.margin = '0'
  element.style.padding = '0'
  element.style.background = 'white'
  element.style.zIndex = '9999'

  // Force reflow to ensure styles are applied
  void element.offsetHeight

  // PDF generation options - FIXED for proper centering
  const opt = {
    margin: [0, 0, 0, 0],
    filename: `TechnoMobile_${invoiceNo}.pdf`,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: false,
      windowWidth: 1200,
      backgroundColor: '#ffffff',
      onclone: function (clonedDoc) {
        // Get cloned element
        const clonedElement = clonedDoc.getElementById('invoice-premium')
        if (clonedElement) {
          // Reset all positioning for print
          clonedElement.style.position = 'relative'
          clonedElement.style.left = '0'
          clonedElement.style.top = '0'
          clonedElement.style.display = 'flex'
          clonedElement.style.justifyContent = 'center'
          clonedElement.style.alignItems = 'center'
          clonedElement.style.width = '210mm'
          clonedElement.style.height = '297mm'
          clonedElement.style.margin = '0 auto'
          clonedElement.style.padding = '0'
          clonedElement.style.background = 'white'

          // Fix invoice-pdf container
          const invoicePdf = clonedElement.querySelector('.invoice-pdf')
          if (invoicePdf) {
            invoicePdf.style.display = 'flex'
            invoicePdf.style.flexDirection = 'column'
            invoicePdf.style.alignItems = 'center'
            invoicePdf.style.justifyContent = 'flex-start'
            invoicePdf.style.width = '210mm'
            invoicePdf.style.padding = '12mm 15mm'
            invoicePdf.style.margin = '0 auto'
            invoicePdf.style.background = 'white'
          }

          // Fix invoice card
          const invoiceCard = clonedElement.querySelector('.invoice-card')
          if (invoiceCard) {
            invoiceCard.style.width = '100%'
            invoiceCard.style.maxWidth = '170mm'
            invoiceCard.style.margin = '0 auto'
            invoiceCard.style.position = 'relative'
            invoiceCard.style.left = '0'
            invoiceCard.style.right = '0'
          }

          // Fix table to prevent cutoff
          const tables = clonedElement.querySelectorAll('.pdf-table')
          tables.forEach((table) => {
            table.style.width = '100%'
            table.style.tableLayout = 'fixed'
          })
        }
      },
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
      precision: 16,
      hotfixes: ['px_scaling'],
    },
    pagebreak: { mode: ['css', 'legacy'] },
  }

  // Show loading message
  const downloadBtn = document.querySelector('.pos-btn-download')
  const originalText = downloadBtn.innerHTML
  downloadBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Generating PDF...'
  downloadBtn.disabled = true

  // Generate PDF
  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      // Reset button
      downloadBtn.innerHTML = originalText
      downloadBtn.disabled = false

      // Hide element again
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.top = '0'
    })
    .catch((error) => {
      console.error('PDF Generation Error:', error)
      alert('Error generating PDF. Please try again.')

      // Reset button
      downloadBtn.innerHTML = originalText
      downloadBtn.disabled = false

      // Hide element again
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.top = '0'
    })
}

// ==================== SAVE TO HISTORY FUNCTION ====================
function saveToHistory(invoice) {
  const history = loadHistory()
  history.unshift(invoice)
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))
  if (typeof window.displayHistory === 'function') {
    window.displayHistory()
  }
}

// ==================== DELETE FROM HISTORY FUNCTION ====================
function deleteFromHistory(index) {
  const history = loadHistory()
  history.splice(index, 1)
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))
  if (typeof window.displayHistory === 'function') {
    window.displayHistory()
  }
}

// ==================== CLEAR HISTORY FUNCTION ====================
function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify([]))
    if (typeof window.displayHistory === 'function') {
      window.displayHistory()
    }
  }
}

// Check login on page load
window.onload = function () {
  checkLogin()
}
