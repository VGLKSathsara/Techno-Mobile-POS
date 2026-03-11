// script.js - Main POS System Script

const STORAGE_KEYS = {
  INVOICE_HISTORY: 'techno_invoice_history',
  INVENTORY: 'techno_inventory',
  USER: 'techno_user',
}

const defaultInventory = [
  { n: 'iPhone 20W Power Adapter', p: 6500 },
  { n: 'MagSafe Charger', p: 14500 },
  { n: 'AirPods Pro (2nd Gen)', p: 85000 },
  { n: 'Silicone Case', p: 3500 },
  { n: '9H Tempered Glass', p: 1800 },
  { n: 'Power Bank 20,000mAh', p: 8900 },
]

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

function saveInventory(inventory) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory))
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

  // Get total
  const totalText = document.getElementById('liveTotal').innerText
  const total =
    parseFloat(totalText.replace(/[^0-9.-]/g, '').replace(/,/g, '')) || 0

  // Validate
  if (discount < 0) discount = 0
  if (discount > total) discount = total

  // Update
  discountInput.value = discount
  recalc()
}

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

window.logout = function () {
  document.getElementById('loginPage').style.display = 'block'
  document.getElementById('posSystem').style.display = 'none'
  document.getElementById('username').value = ''
  document.getElementById('password').value = ''
}

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
  recalc()

  if (typeof displayHistory === 'function') displayHistory()
}

function generateInvoiceNumber() {
  const now = new Date()
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`
}

window.addAcc = function (n = 'New Accessory', p = 0, shouldSave = true) {
  const accGrid = document.getElementById('accGrid')
  if (!accGrid) return
  const div = document.createElement('div')
  div.className = 'pos-acc-card'
  div.innerHTML = `
    <input type="checkbox" class="pos-check" onchange="recalc()">
    <div class="pos-acc-info">
      <input type="text" class="pos-acc-name" value="${n}" oninput="recalc()">
      <div class="pos-acc-meta">
        <input type="number" class="pos-qty" value="1" min="1" oninput="recalc()">
        <input type="number" class="pos-price" value="${p}" oninput="recalc()">
      </div>
    </div>
    <button class="acc-delete-btn" onclick="deleteAccessory(this)"><i class="fas fa-times"></i></button>
  `
  accGrid.appendChild(div)
  if (shouldSave) saveInventoryToStorage()
  recalc()
}

window.deleteAccessory = function (button) {
  button.closest('.pos-acc-card').remove()
  recalc()
  saveInventoryToStorage()
}

function saveInventoryToStorage() {
  const inventory = []
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    inventory.push({
      n: card.querySelector('.pos-acc-name').value || 'New Accessory',
      p: Number(card.querySelector('.pos-price').value) || 0,
    })
  })
  saveInventory(inventory)
}

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
    <button onclick="this.parentElement.remove(); recalc()" style="background:none; border:none; color:#ef4444; font-size:22px; cursor:pointer;">&times;</button>
  `
  deviceArea.appendChild(div)
  recalc()
}

window.recalc = function () {
  let sub = 0
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    if (card.querySelector('.pos-check')?.checked) {
      sub +=
        (Number(card.querySelector('.pos-qty').value) || 0) *
        (Number(card.querySelector('.pos-price').value) || 0)
    }
  })
  document.querySelectorAll('.pos-device-row').forEach((row) => {
    const qty = Number(row.querySelector('.d-qty').value) || 0
    const price = Number(row.querySelector('.d-price').value) || 0
    sub += qty * price
  })
  const discount = Number(document.getElementById('inDiscount').value) || 0
  document.getElementById('liveTotal').innerText =
    'Rs. ' + (sub - discount).toLocaleString()
}

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

window.generatePremiumPDF = function () {
  // Check if there are any items
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
  const discount = Number(document.getElementById('inDiscount').value) || 0

  // Update PDF elements
  document.getElementById('pdfCustomerName').innerText = customerName
  document.getElementById('pdfCustomerPhone').innerText = customerPhone
  document.getElementById('pdfInvoiceDisplay').innerText = invoiceNo

  // Better date format
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  document.getElementById('pdfDateDisplay').innerText = formattedDate

  // Build items table
  let itemsHTML = ''
  let subtotal = 0

  // Add accessories
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
        <td style="text-align: right;">Rs. ${price.toLocaleString()}</td>
        <td style="text-align: right;">Rs. ${total.toLocaleString()}</td>
      </tr>`
    }
  })

  // Add devices
  document.querySelectorAll('.pos-device-row').forEach((row) => {
    const name = row.querySelector('.d-name').value
    if (name && name.trim() !== '') {
      const storage = row.querySelector('.d-storage').value
      const imei = row.querySelector('.d-imei').value
      const qty = Number(row.querySelector('.d-qty').value) || 1
      const price = Number(row.querySelector('.d-price').value) || 0
      const total = qty * price
      subtotal += total

      let description = name
      if (storage && storage.trim() !== '') description += ` (${storage})`
      if (imei && imei.trim() !== '') description += ` - IMEI: ${imei}`

      itemsHTML += `<tr>
        <td style="text-align: left;">${description}</td>
        <td style="text-align: center;">${qty}</td>
        <td style="text-align: right;">Rs. ${price.toLocaleString()}</td>
        <td style="text-align: right;">Rs. ${total.toLocaleString()}</td>
      </tr>`
    }
  })

  // If no items were added
  if (itemsHTML === '') {
    alert('No items selected')
    return
  }

  document.getElementById('pdfItemsBody').innerHTML = itemsHTML
  document.getElementById('pdfSubTotal').innerText =
    `Rs. ${subtotal.toLocaleString()}`
  document.getElementById('pdfDiscount').innerText =
    `-Rs. ${discount.toLocaleString()}`
  document.getElementById('pdfGrandTotal').innerText =
    `Rs. ${(subtotal - discount).toLocaleString()}`

  // Save to History
  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
  )
  history.unshift({
    invoiceNo,
    customerName,
    phone: customerPhone,
    date: formattedDate,
    total: subtotal - discount,
    itemsHTML,
    subtotal,
    discount,
  })
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))

  // Generate PDF
  generatePDFWithSettings(invoiceNo)
}

window.generatePDFWithSettings = function (filename) {
  const element = document.getElementById('invoice-premium')
  if (!element) {
    console.error('PDF element not found')
    return
  }

  // Temporarily show the element for PDF generation
  element.style.position = 'static'
  element.style.left = '0'
  element.style.display = 'block'
  element.style.visibility = 'visible'

  // Check if html2pdf is available
  if (typeof html2pdf === 'undefined') {
    console.error('html2pdf library not loaded')
    alert('PDF library not loaded. Please refresh the page.')
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    return
  }

  // Configure PDF options for better formatting
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `TM_${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      letterRendering: true,
      useCORS: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: { mode: ['css', 'legacy'] },
  }

  // Generate PDF
  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      // Hide element after PDF generation
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

// Fixed clearHistory function
window.clearHistory = function () {
  if (confirm('Clear all history? This action cannot be undone.')) {
    localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, '[]')
    if (typeof displayHistory === 'function') displayHistory()
  }
}

window.onload = () => {
  document.getElementById('loginPage').style.display = 'block'
  document.getElementById('posSystem').style.display = 'none'
}
