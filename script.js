// script.js - Techno Mobile POS — Improved

const STORAGE_KEYS = {
  INVOICE_HISTORY: 'techno_invoice_history',
  INVENTORY: 'techno_inventory',
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

// ---------- INIT ----------
if (!localStorage.getItem(STORAGE_KEYS.INVENTORY))
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(defaultInventory))
if (!localStorage.getItem(STORAGE_KEYS.TERMS))
  localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(defaultTerms))

// ---------- STORAGE HELPERS ----------
function loadInventory() {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) ||
      defaultInventory
    )
  } catch {
    return defaultInventory
  }
}
function saveInventory(inv) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv))
}

function loadTerms() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TERMS)) || defaultTerms
  } catch {
    return defaultTerms
  }
}
function saveTerms(terms) {
  localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(terms))
}

// ---------- TOAST ----------
function showToast(msg, type = '') {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.className = 'toast show' + (type ? ' ' + type : '')
  clearTimeout(t._timer)
  t._timer = setTimeout(() => {
    t.className = 'toast'
  }, 2800)
}

// ---------- AUTH ----------
window.togglePassword = function () {
  const pw = document.getElementById('password')
  const icon = document.getElementById('pwEyeIcon')
  if (pw.type === 'password') {
    pw.type = 'text'
    icon.className = 'fas fa-eye-slash'
  } else {
    pw.type = 'password'
    icon.className = 'fas fa-eye'
  }
}

window.login = function () {
  const username = document.getElementById('username').value.trim()
  const password = document.getElementById('password').value
  const errEl = document.getElementById('loginError')
  if (username === 'DilkaRishan' && password === 'Dilka789') {
    errEl.style.display = 'none'
    document.getElementById('loginPage').style.display = 'none'
    const sys = document.getElementById('posSystem')
    sys.style.display = 'flex'
    sys.classList.add('visible')
    document.getElementById('loggedUser').innerText = username
    initializePOS()
  } else {
    errEl.style.display = 'flex'
    document.getElementById('password').value = ''
    document.getElementById('password').focus()
  }
}

window.logout = function () {
  document.getElementById('loginPage').style.display = 'flex'
  document.getElementById('posSystem').style.display = 'none'
  document.getElementById('posSystem').classList.remove('visible')
  document.getElementById('username').value = ''
  document.getElementById('password').value = ''
  document.getElementById('loginError').style.display = 'none'
}

// ---------- INIT POS ----------
function initializePOS() {
  const accGrid = document.getElementById('accGrid')
  if (accGrid) accGrid.innerHTML = ''
  const deviceArea = document.getElementById('deviceArea')
  if (deviceArea) deviceArea.innerHTML = ''

  loadInventory().forEach((item) => addAcc(item.n, item.p, false))

  const dateInput = document.getElementById('inDate')
  if (dateInput) dateInput.valueAsDate = new Date()

  const liveDate = document.getElementById('liveDate')
  if (liveDate)
    liveDate.innerText = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  document.getElementById('inNo').innerText = generateInvoiceNumber()
  document.getElementById('inDiscount').value = 0

  displayTerms()
  recalc()
  if (typeof displayHistory === 'function') displayHistory()
  renderInventoryTab()
}

function generateInvoiceNumber() {
  const now = new Date()
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`
}

// ---------- TERMS ----------
function displayTerms() {
  const container = document.getElementById('termsContainer')
  if (!container) return
  const terms = loadTerms()
  if (terms.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><i class="fas fa-file-contract"></i><p>No terms added. Click "Add Term" to create one.</p></div>'
    return
  }
  container.innerHTML = terms
    .map(
      (term) => `
    <div class="term-item">
      <input type="checkbox" ${term.selected ? 'checked' : ''} onchange="toggleTerm('${term.id}')">
      <input type="text" value="${term.text.replace(/"/g, '&quot;')}" onchange="updateTermText('${term.id}', this.value)">
      <button class="term-del-btn" onclick="deleteTerm('${term.id}')"><i class="fas fa-trash"></i></button>
    </div>
  `,
    )
    .join('')
}

window.addNewTerm = function () {
  const terms = loadTerms()
  terms.push({
    id: 'term_' + Date.now(),
    text: 'New term and condition',
    selected: true,
  })
  saveTerms(terms)
  displayTerms()
}

window.toggleTerm = function (id) {
  const terms = loadTerms()
  const t = terms.find((t) => t.id === id)
  if (t) {
    t.selected = !t.selected
    saveTerms(terms)
  }
}

window.updateTermText = function (id, text) {
  const terms = loadTerms()
  const t = terms.find((t) => t.id === id)
  if (t) {
    t.text = text
    saveTerms(terms)
  }
}

window.deleteTerm = function (id) {
  if (!confirm('Delete this term?')) return
  saveTerms(loadTerms().filter((t) => t.id !== id))
  displayTerms()
  showToast('Term deleted')
}

function getSelectedTermsHTML() {
  const selected = loadTerms().filter((t) => t.selected)
  if (selected.length === 0)
    return '<li style="color:#64748b"><i class="fas fa-info-circle"></i> No terms selected</li>'
  return selected
    .map(
      (t) =>
        `<li><i class="fas fa-check-circle" style="color:#10b981"></i> ${t.text}</li>`,
    )
    .join('')
}

// ---------- ACCESSORIES ----------
window.validatePhone = function (input) {
  input.value = input.value.replace(/[^0-9]/g, '')
  if (input.value.length > 10) input.value = input.value.slice(0, 10)
}

window.addAcc = function (n = 'New Accessory', p = 0, shouldSave = true) {
  const accGrid = document.getElementById('accGrid')
  if (!accGrid) return
  const div = document.createElement('div')
  div.className = 'pos-acc-card'
  div.innerHTML = `
    <input type="checkbox" class="pos-check" onchange="this.closest('.pos-acc-card').classList.toggle('checked',this.checked);recalc()">
    <div class="pos-acc-info">
      <input type="text" class="pos-acc-name" value="${n.replace(/"/g, '&quot;')}" oninput="recalc();saveInventoryToStorage()">
      <div class="pos-acc-meta">
        <input type="number" class="pos-qty" value="1" min="1" oninput="recalc()">
        <span style="font-size:11px;color:var(--gray)">Rs.</span>
        <input type="number" class="pos-price" value="${p}" oninput="recalc();saveInventoryToStorage()">
      </div>
    </div>
    <button class="acc-delete-btn" onclick="deleteAccessory(this)"><i class="fas fa-times"></i></button>
  `
  accGrid.appendChild(div)
  if (shouldSave) saveInventoryToStorage()
  recalc()
}

window.deleteAccessory = function (button) {
  if (!confirm('Delete this accessory?')) return
  button.closest('.pos-acc-card').remove()
  recalc()
  saveInventoryToStorage()
  showToast('Accessory removed')
}

function saveInventoryToStorage() {
  const inventory = []
  document.querySelectorAll('.pos-acc-card').forEach((card) => {
    const nameInput = card.querySelector('.pos-acc-name')
    const priceInput = card.querySelector('.pos-price')
    if (nameInput && priceInput)
      inventory.push({
        n: nameInput.value || 'New Accessory',
        p: Number(priceInput.value) || 0,
      })
  })
  saveInventory(inventory)
  renderInventoryTab()
}

// ---------- DEVICES ----------
window.addDevice = function () {
  const deviceArea = document.getElementById('deviceArea')
  const div = document.createElement('div')
  div.className = 'pos-device-row'
  div.innerHTML = `
    <input type="text" class="d-name" placeholder="Device Model" oninput="recalc()">
    <input type="text" class="d-storage" placeholder="Storage" oninput="recalc()">
    <input type="text" class="d-imei" placeholder="IMEI / Serial" oninput="recalc()">
    <input type="number" class="d-qty" value="1" min="1" oninput="recalc()">
    <input type="number" class="d-price price-input" placeholder="Price" oninput="recalc()">
    <button class="device-del-btn" onclick="if(confirm('Remove this item?')){this.parentElement.remove();recalc();showToast('Item removed')}" title="Remove">
      <i class="fas fa-times"></i>
    </button>
  `
  deviceArea.appendChild(div)
  div.querySelector('.d-name').focus()
  recalc()
}

// ---------- RECALC ----------
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
  const total = Math.max(0, sub - discount)

  const fmt = (n) =>
    'Rs. ' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  document.getElementById('liveSubtotal').innerText = fmt(sub)
  document.getElementById('liveDiscount').innerText = '- ' + fmt(discount)
  document.getElementById('liveTotal').innerText = fmt(total)
}

window.applyDiscount = function () {
  const discountInput = document.getElementById('inDiscount')
  let discount = parseFloat(discountInput.value) || 0
  if (discount < 0) discount = 0
  discountInput.value = discount
  recalc()
  showToast('Discount applied', 'success')
}

// ---------- TAB SWITCH ----------
window.switchTab = function (tab) {
  const tabs = ['pos', 'history', 'inventory']
  tabs.forEach((t) => {
    const panel = document.getElementById(t + 'Tab')
    const nav = document.getElementById(
      'nav' + t.charAt(0).toUpperCase() + t.slice(1),
    )
    if (panel) panel.style.display = t === tab ? 'block' : 'none'
    if (nav) nav.classList.toggle('active', t === tab)
  })
  if (tab === 'history' && typeof displayHistory === 'function')
    displayHistory()
  if (tab === 'inventory') renderInventoryTab()
}

// ---------- INVENTORY TAB ----------
function renderInventoryTab() {
  const tbody = document.getElementById('inventoryTableBody')
  if (!tbody) return
  const inventory = loadInventory()
  if (inventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="fas fa-boxes"></i><p>No products in inventory</p></div></td></tr>`
    return
  }
  tbody.innerHTML = inventory
    .map(
      (item, i) => `
    <tr>
      <td style="color:var(--gray);font-size:12px;width:40px">${i + 1}</td>
      <td><input class="inv-name-input" value="${item.n.replace(/"/g, '&quot;')}" onchange="updateInventoryItem(${i},'n',this.value)"></td>
      <td style="text-align:right"><input class="inv-price-input" type="number" value="${item.p}" onchange="updateInventoryItem(${i},'p',this.value)"></td>
      <td style="text-align:center">
        <button class="inv-del-btn" onclick="deleteInventoryItem(${i})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `,
    )
    .join('')
}

window.addInventoryItem = function () {
  const inventory = loadInventory()
  inventory.push({ n: 'New Product', p: 0 })
  saveInventory(inventory)
  renderInventoryTab()
  showToast('Product added')
  // Sync to acc grid
  syncInventoryToAccGrid()
}

window.updateInventoryItem = function (index, field, value) {
  const inventory = loadInventory()
  if (!inventory[index]) return
  inventory[index][field] = field === 'p' ? Number(value) : value
  saveInventory(inventory)
  syncInventoryToAccGrid()
}

window.deleteInventoryItem = function (index) {
  if (!confirm('Delete this product?')) return
  const inventory = loadInventory()
  inventory.splice(index, 1)
  saveInventory(inventory)
  renderInventoryTab()
  syncInventoryToAccGrid()
  showToast('Product deleted')
}

function syncInventoryToAccGrid() {
  // Refresh POS accessories from inventory
  const accGrid = document.getElementById('accGrid')
  if (!accGrid) return
  accGrid.innerHTML = ''
  loadInventory().forEach((item) => addAcc(item.n, item.p, false))
}

// ---------- PDF GENERATION ----------
window.generatePremiumPDF = function () {
  const hasAccessories =
    document.querySelectorAll('.pos-acc-card .pos-check:checked').length > 0
  const hasDevices = Array.from(
    document.querySelectorAll('.pos-device-row'),
  ).some((row) => row.querySelector('.d-name')?.value.trim())

  if (!hasAccessories && !hasDevices) {
    showToast('Please add at least one item', 'error')
    return
  }

  const invoiceNo = document.getElementById('inNo').innerText
  const customerName =
    document.getElementById('inName').value.trim() || 'Walk-in Customer'
  const customerPhone =
    document.getElementById('inPhone').value.trim() || 'Not Provided'
  const discount = parseFloat(document.getElementById('inDiscount').value) || 0

  document.getElementById('pdfCustomerName').innerText = customerName
  document.getElementById('pdfCustomerPhone').innerText = customerPhone
  document.getElementById('pdfInvoiceDisplay').innerText = invoiceNo

  const formattedDate = new Date().toLocaleDateString('en-US', {
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
        <td style="text-align:left">${name}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:right">Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right">Rs. ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>`
    }
  })

  document.querySelectorAll('.pos-device-row').forEach((row) => {
    const name = row.querySelector('.d-name').value?.trim()
    if (!name) return
    const storage = row.querySelector('.d-storage').value?.trim()
    const imei = row.querySelector('.d-imei').value?.trim()
    const qty = Number(row.querySelector('.d-qty').value) || 1
    const price = Number(row.querySelector('.d-price').value) || 0
    if (price === 0) return
    const total = qty * price
    subtotal += total
    let desc = name
    if (storage) desc += ` (${storage})`
    if (imei) desc += ` — IMEI: ${imei}`
    itemsHTML += `<tr>
      <td style="text-align:left">${desc}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right">Rs. ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    </tr>`
  })

  if (!itemsHTML) {
    showToast('No valid items found', 'error')
    return
  }

  document.getElementById('pdfItemsBody').innerHTML = itemsHTML
  document.getElementById('pdfSubTotal').innerText =
    `Rs. ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  document.getElementById('pdfDiscount').innerText =
    `-Rs. ${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  document.getElementById('pdfGrandTotal').innerText =
    `Rs. ${(subtotal - discount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  document.getElementById('pdfTermsList').innerHTML = getSelectedTermsHTML()

  // Save to history
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

  showToast('Generating PDF…')
  generatePDFWithSettings(invoiceNo)

  // Reset for new invoice
  setTimeout(() => {
    document.getElementById('inNo').innerText = generateInvoiceNumber()
    document.getElementById('inName').value = ''
    document.getElementById('inPhone').value = ''
    document.getElementById('inDiscount').value = 0
    document.querySelectorAll('.pos-acc-card .pos-check').forEach((cb) => {
      cb.checked = false
      cb.closest('.pos-acc-card').classList.remove('checked')
    })
    document.getElementById('deviceArea').innerHTML = ''
    recalc()
  }, 800)
}

window.generatePDFWithSettings = function (filename) {
  const element = document.getElementById('invoice-premium')
  if (!element) return

  element.style.position = 'static'
  element.style.left = '0'
  element.style.display = 'block'
  element.style.visibility = 'visible'

  if (typeof html2pdf === 'undefined') {
    alert('PDF library not loaded. Please refresh.')
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    return
  }

  const opt = {
    margin: [0.3, 0.3, 0.3, 0.3],
    filename: `TM_${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      letterRendering: true,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' },
  }

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.visibility = 'hidden'
      showToast('Invoice downloaded!', 'success')
    })
    .catch((err) => {
      console.error(err)
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      showToast('PDF generation failed', 'error')
    })
}

// ---------- HISTORY ----------
window.clearHistory = function () {
  if (!confirm('Clear all invoice history? This cannot be undone.')) return
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, '[]')
  if (typeof displayHistory === 'function') displayHistory()
  showToast('History cleared')
}

window.searchHistory = function () {
  const q = document.getElementById('historySearch')?.value.toLowerCase().trim()
  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
  )
  const filtered = q
    ? history.filter(
        (inv) =>
          (inv.customerName || '').toLowerCase().includes(q) ||
          (inv.invoiceNo || '').toLowerCase().includes(q) ||
          (inv.phone || '').includes(q),
      )
    : history
  renderHistoryList(filtered)
}

function renderHistoryList(history) {
  const historyList = document.getElementById('historyList')
  if (!historyList) return

  // Stats
  const statsEl = document.getElementById('historyStats')
  if (statsEl) {
    const allHistory = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
    )
    const total = allHistory.reduce((s, inv) => s + (inv.total || 0), 0)
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Invoices</div><div class="stat-value blue">${allHistory.length}</div></div>
      <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value green">Rs. ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
      <div class="stat-card"><div class="stat-label">Showing</div><div class="stat-value">${history.length}</div></div>
    `
  }

  if (history.length === 0) {
    historyList.innerHTML =
      '<div class="empty-state"><i class="fas fa-receipt"></i><p>No invoices found</p></div>'
    return
  }

  historyList.innerHTML = history
    .map(
      (inv, index) => `
    <div class="history-item">
      <div class="history-num">${index + 1}</div>
      <div class="history-info">
        <h4>${inv.customerName || 'Walk-in Customer'}</h4>
        <div class="history-meta">
          <span><i class="fas fa-hashtag"></i> ${inv.invoiceNo || 'N/A'}</span>
          <span><i class="fas fa-calendar"></i> ${inv.date || 'N/A'}</span>
          ${inv.phone && inv.phone !== 'Not Provided' ? `<span><i class="fas fa-phone"></i> ${inv.phone}</span>` : ''}
        </div>
      </div>
      <div class="history-amount">Rs. ${(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="history-actions">
        <button class="history-btn view" onclick="viewInvoice(${index})"><i class="fas fa-eye"></i> View</button>
        <button class="history-btn delete" onclick="deleteFromHistory(${index})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `,
    )
    .join('')
}

// ---------- ENTER KEY FOR DISCOUNT ----------
document.addEventListener('DOMContentLoaded', () => {
  const discountInput = document.getElementById('inDiscount')
  if (discountInput)
    discountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        applyDiscount()
      }
    })
})

window.onload = () => {
  document.getElementById('loginPage').style.display = 'flex'
  document.getElementById('posSystem').style.display = 'none'
}
