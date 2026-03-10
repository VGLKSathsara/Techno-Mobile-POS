// script.js - Main POS System Script

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

// Load inventory
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

// Save inventory
function saveInventory(inventory) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory))
}

// ==================== LOGIN FUNCTIONS ====================
window.login = function () {
  console.log('Login function called')

  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  if (username === 'DilkaRishan' && password === 'Dilka789') {
    console.log('Login successful')

    document.getElementById('loginPage').style.display = 'none'
    document.getElementById('posSystem').style.display = 'block'
    document.getElementById('loggedUser').innerText = 'DilkaRishan'

    initializePOS()
  } else {
    alert('Invalid credentials! Use DilkaRishan / Dilka789')
  }
}

window.logout = function () {
  console.log('Logout function called')

  document.getElementById('loginPage').style.display = 'block'
  document.getElementById('posSystem').style.display = 'none'
}

// ==================== POS FUNCTIONS ====================
function initializePOS() {
  console.log('Initializing POS...')

  // Clear accessories grid FIRST
  const accGrid = document.getElementById('accGrid')
  if (accGrid) {
    accGrid.innerHTML = '' // මේක වැදගත්!
  }

  // Load inventory from localStorage
  const savedInventory = loadInventory()

  // Add items from saved inventory
  if (accGrid) {
    savedInventory.forEach((item) => addAcc(item.n, item.p, false)) // false = don't save again
  }

  // Set date
  const dateInput = document.getElementById('inDate')
  if (dateInput) {
    dateInput.valueAsDate = new Date()
  }

  const liveDate = document.getElementById('liveDate')
  if (liveDate) {
    liveDate.innerText = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Generate invoice number
  const invoiceInput = document.getElementById('inNo')
  if (invoiceInput) {
    invoiceInput.value = generateInvoiceNumber()
  }

  // Display history
  if (typeof displayHistory === 'function') {
    displayHistory()
  }
}

function generateInvoiceNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100)
  return `INV-${year}${month}${day}-${random}`
}

// Add accessory with delete button - FIXED VERSION
window.addAcc = function (n = 'New Accessory', p = 0, shouldSave = true) {
  const accGrid = document.getElementById('accGrid')
  if (!accGrid) return

  const div = document.createElement('div')
  div.className = 'pos-acc-card'
  div.setAttribute('data-item-name', n)
  div.setAttribute('data-item-price', p)

  div.innerHTML = `
    <input type="checkbox" class="pos-check" onchange="recalc()">
    <div class="pos-acc-info">
      <input type="text" class="pos-acc-name" value="${n}" oninput="recalc()" placeholder="Item name">
      <div class="pos-acc-meta">
        <input type="number" class="pos-qty" value="1" min="1" oninput="recalc()">
        <input type="number" class="pos-price" value="${p}" oninput="recalc()" placeholder="Price">
      </div>
    </div>
    <button class="acc-delete-btn" onclick="deleteAccessory(this)" title="Remove accessory">
      <i class="fas fa-times"></i>
    </button>
  `
  accGrid.appendChild(div)

  // Save to localStorage only if shouldSave is true (prevent double saving)
  if (shouldSave) {
    saveInventoryToStorage()
  }
}

// Delete accessory function
window.deleteAccessory = function (button) {
  const card = button.closest('.pos-acc-card')
  if (card) {
    card.remove()
    recalc() // Recalculate total after deletion
    saveInventoryToStorage() // Update localStorage
  }
}

function saveInventoryToStorage() {
  const inventory = []
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    const nameInput = card.querySelector('.pos-acc-name')
    const priceInput = card.querySelector('.pos-price')

    if (nameInput && priceInput) {
      const name = nameInput.value || 'New Accessory'
      const price = Number(priceInput.value) || 0
      inventory.push({ n: name, p: price })
    }
  })
  saveInventory(inventory)
}

window.addDevice = function () {
  const deviceArea = document.getElementById('deviceArea')
  if (!deviceArea) return

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
  deviceArea.appendChild(div)
}

window.recalc = function () {
  let sub = 0

  // Calculate accessories
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    if (card.querySelector('.pos-check')?.checked) {
      const qty = Number(card.querySelector('.pos-qty')?.value) || 0
      const price = Number(card.querySelector('.pos-price')?.value) || 0
      sub += qty * price
    }
  })

  // Calculate devices
  document.querySelectorAll('.d-name').forEach((d, i) => {
    if (d.value) {
      const qty = Number(document.querySelectorAll('.d-qty')[i]?.value) || 0
      const price = Number(document.querySelectorAll('.d-price')[i]?.value) || 0
      sub += qty * price
    }
  })

  // Apply discount
  const discount = Number(document.getElementById('inDiscount')?.value) || 0
  const total = sub - discount

  // Update display
  const liveTotal = document.getElementById('liveTotal')
  if (liveTotal) {
    liveTotal.innerText = 'Rs. ' + total.toLocaleString()
  }
}

window.switchTab = function (tab) {
  const posTab = document.getElementById('posTab')
  const historyTab = document.getElementById('historyTab')
  const navItems = document.querySelectorAll('.nav-item')

  if (!posTab || !historyTab) return

  if (tab === 'pos') {
    posTab.style.display = 'block'
    historyTab.classList.remove('active')
    navItems[0]?.classList.add('active')
    navItems[1]?.classList.remove('active')
  } else {
    posTab.style.display = 'none'
    historyTab.classList.add('active')
    navItems[0]?.classList.remove('active')
    navItems[1]?.classList.add('active')

    // Display history when switching to history tab
    if (typeof displayHistory === 'function') {
      displayHistory()
    }
  }
}

// ==================== PDF GENERATION FUNCTIONS ====================
window.generatePremiumPDF = function () {
  console.log('Generating PDF...')

  // Get data from UI
  const invoiceNo = document.getElementById('inNo')?.value || 'INV-001'
  const customerName =
    document.getElementById('inName')?.value || 'Walk-in Customer'
  const customerPhone =
    document.getElementById('inPhone')?.value || 'Not Provided'
  const invoiceDate = document.getElementById('inDate')?.value
  const discount = Number(document.getElementById('inDiscount')?.value) || 0

  const formattedDate = invoiceDate
    ? new Date(invoiceDate).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })

  // Update PDF elements
  document.getElementById('pdfCustomerName').innerText = customerName
  document.getElementById('pdfCustomerPhone').innerText = customerPhone
  document.getElementById('pdfInvoiceDisplay').innerText = invoiceNo
  document.getElementById('pdfDateDisplay').innerText = formattedDate

  let itemsHTML = ''
  let subtotal = 0

  // Add accessories
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    if (card.querySelector('.pos-check')?.checked) {
      const name = card.querySelector('.pos-acc-name')?.value || 'Accessory'
      const qty = Number(card.querySelector('.pos-qty')?.value) || 0
      const price = Number(card.querySelector('.pos-price')?.value) || 0
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
      const storage = document.querySelectorAll('.d-storage')[i]?.value || ''
      const imei = document.querySelectorAll('.d-imei')[i]?.value || ''
      const qty = Number(document.querySelectorAll('.d-qty')[i]?.value) || 0
      const price = Number(document.querySelectorAll('.d-price')[i]?.value) || 0
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

  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
  )
  history.unshift(invoiceData)
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))

  // Refresh history display
  if (typeof displayHistory === 'function') {
    displayHistory()
  }

  // Generate PDF
  generatePDFWithSettings(invoiceNo)
}

// PDF generation function
window.generatePDFWithSettings = function (filename) {
  const element = document.getElementById('invoice-premium')
  if (!element) return

  const downloadBtn = document.querySelector('.pos-btn-download')
  const originalText = downloadBtn?.innerHTML || 'Download'

  if (downloadBtn) {
    downloadBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Generating...'
    downloadBtn.disabled = true
  }

  const opt = {
    margin: [0, 0, 0, 0],
    filename: `TechnoMobile_${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      if (downloadBtn) {
        downloadBtn.innerHTML = originalText
        downloadBtn.disabled = false
      }
    })
    .catch((error) => {
      console.error('PDF Error:', error)
      if (downloadBtn) {
        downloadBtn.innerHTML = originalText
        downloadBtn.disabled = false
      }
      alert('Error generating PDF')
    })
}

// ==================== INITIALIZATION ====================
window.onload = function () {
  console.log('Page loaded')

  // Always show login page first
  document.getElementById('loginPage').style.display = 'block'
  document.getElementById('posSystem').style.display = 'none'
}
