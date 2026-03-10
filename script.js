// ==================== INITIALIZATION ==================
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

  // Generate PDF
  const element = document.getElementById('invoice-premium')
  element.style.position = 'static'
  element.style.left = '0'

  const opt = {
    margin: [0, 0, 0, 0],
    filename: `TechnoMobile_${inv.invoiceNo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      element.style.position = 'absolute'
      element.style.left = '-9999px'
    })
}

// Generate PDF
function generatePremiumPDF() {
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

  document.getElementById('pdfCustomerName').innerText = customerName
  document.getElementById('pdfCustomerPhone').innerText = customerPhone
  document.getElementById('pdfInvoiceDisplay').innerText = invoiceNo
  document.getElementById('pdfDateDisplay').innerText = formattedDate

  let itemsHTML = ''
  let subtotal = 0

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

  if (typeof saveToHistory === 'function') {
    saveToHistory(invoiceData)
  }

  // Generate PDF
  const element = document.getElementById('invoice-premium')
  element.style.position = 'static'
  element.style.left = '0'

  const opt = {
    margin: [0, 0, 0, 0],
    filename: `TechnoMobile_${invoiceNo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 1200,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  }

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      element.style.position = 'absolute'
      element.style.left = '-9999px'
    })
}

// Check login on page load
window.onload = function () {
  checkLogin()
}
