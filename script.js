// Techno Mobile POS — Fixed & Improved

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
  { n: 'USB-C to Lightning Cable', p: 2800 },
  { n: 'Wireless Charger Pad', p: 5500 },
]

const defaultTerms = [
  {
    id: 'term1',
    text: 'Genuine products with 2 year warranty',
    selected: true,
  },
  { id: 'term2', text: 'Physical damage not covered', selected: true },
  {
    id: 'term3',
    text: 'Warranty valid with original invoice only',
    selected: true,
  },
  { id: 'term4', text: 'No refunds after 7 days of purchase', selected: false },
]

let _currentSubtotal = 0
let _currentDiscount = 0
let _currentPayment = 0
let _currentTotal = 0

// Initialize storage on first load
if (!localStorage.getItem(STORAGE_KEYS.INVENTORY))
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(defaultInventory))
if (!localStorage.getItem(STORAGE_KEYS.TERMS))
  localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(defaultTerms))

// ─── Storage Helpers ──────────────────────────────────────────────────────────
function loadInventory() {
  return (
    JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) || defaultInventory
  )
}
function saveInventory(inv) {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv))
}
function loadTerms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TERMS)) || defaultTerms
}
function saveTerms(terms) {
  localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(terms))
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.className = 'toast show' + (type ? ' ' + type : '')
  clearTimeout(t._timer)
  t._timer = setTimeout(() => (t.className = 'toast'), 3000)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
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
    document.getElementById('posSystem').style.display = 'flex'
    document.getElementById('loggedUser').innerText = username
    initializePOS()
  } else {
    errEl.style.display = 'flex'
    document.getElementById('password').value = ''
    // Shake animation
    const card = document.querySelector('.login-card')
    card.style.animation = 'none'
    card.offsetHeight // reflow
    card.style.animation = 'shakeX 0.5s ease'
  }
}

window.logout = function () {
  if (confirm('Logout from the system?')) {
    document.getElementById('loginPage').style.display = 'flex'
    document.getElementById('posSystem').style.display = 'none'
    document.getElementById('username').value = ''
    document.getElementById('password').value = ''
  }
}

// Shake animation for login error
const shakeStyle = document.createElement('style')
shakeStyle.textContent = `
@keyframes shakeX {
  0%,100%{transform:translateX(0)}
  15%{transform:translateX(-10px)}
  30%{transform:translateX(10px)}
  45%{transform:translateX(-8px)}
  60%{transform:translateX(8px)}
  75%{transform:translateX(-4px)}
  90%{transform:translateX(4px)}
}
`
document.head.appendChild(shakeStyle)

// ─── POS Init ─────────────────────────────────────────────────────────────────
function initializePOS() {
  // Apply saved theme
  _applyTheme(localStorage.getItem('techno_theme') || 'light')

  // Reset POS form
  document.getElementById('accGrid').innerHTML = ''
  document.getElementById('deviceArea').innerHTML = ''

  loadInventory().forEach((item) => addAcc(item.n, item.p, false))

  const now = new Date()
  document.getElementById('inDate').valueAsDate = now
  document.getElementById('liveDate').innerText = now.toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  )
  document.getElementById('inNo').innerText = generateInvoiceNumber()
  document.getElementById('inDiscount').value = 0
  document.getElementById('inPayment').value = 0
  // BUG FIX: Reset hidden status input and status buttons
  document.getElementById('invoiceStatus').value = 'pending'
  _syncStatusButtons('pending')

  displayTerms()
  recalc()
  updateDeviceEmptyState()

  if (typeof displayHistory === 'function') displayHistory()
  renderInventoryTab()
}

function generateInvoiceNumber() {
  const now = new Date()
  const rand = Math.floor(Math.random() * 900 + 100)
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${rand}`
}

// ─── Status Button Sync ───────────────────────────────────────────────────────
function _syncStatusButtons(value) {
  document.querySelectorAll('.status-opt-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === value)
  })
}

window.selectStatus = function (value) {
  document.getElementById('invoiceStatus').value = value
  _syncStatusButtons(value)
  // BUG FIX: Auto-fill payment on "paid"
  if (value === 'paid') {
    document.getElementById('inPayment').value = _currentTotal
    recalc()
  }
}

// ─── Terms ────────────────────────────────────────────────────────────────────
function displayTerms() {
  const container = document.getElementById('termsContainer')
  if (!container) return
  const terms = loadTerms()
  if (!terms.length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-file-contract"></i><p>No terms added yet. Click "Add Term" to add one.</p></div>`
    return
  }
  container.innerHTML = terms
    .map(
      (term) => `
    <div class="term-item">
      <input type="checkbox" ${term.selected ? 'checked' : ''} onchange="toggleTerm('${term.id}')">
      <input type="text" value="${_esc(term.text)}" onchange="updateTermText('${term.id}', this.value)" placeholder="Enter term text...">
      <button class="term-del-btn" onclick="deleteTerm('${term.id}')" title="Delete term"><i class="fas fa-trash"></i></button>
    </div>
  `,
    )
    .join('')
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
  showToast('Term added', 'success')
}

window.toggleTerm = function (id) {
  const terms = loadTerms()
  const t = terms.find((t) => t.id === id)
  if (t) t.selected = !t.selected
  saveTerms(terms)
}

window.updateTermText = function (id, text) {
  const terms = loadTerms()
  const t = terms.find((t) => t.id === id)
  if (t) t.text = text
  saveTerms(terms)
}

window.deleteTerm = function (id) {
  if (confirm('Delete this term?')) {
    saveTerms(loadTerms().filter((t) => t.id !== id))
    displayTerms()
    showToast('Term deleted')
  }
}

// ─── Phone validation ─────────────────────────────────────────────────────────
window.validatePhone = function (input) {
  input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10)
}

// ─── Accessories ──────────────────────────────────────────────────────────────
window.addAcc = function (n = 'New Accessory', p = 0, shouldSave = true) {
  const accGrid = document.getElementById('accGrid')
  if (!accGrid) return

  // Remove empty hint if present
  const hint = document.getElementById('accEmptyHint')
  if (hint) hint.style.display = 'none'

  const div = document.createElement('div')
  div.className = 'pos-acc-card'
  div.innerHTML = `
    <input type="checkbox" class="pos-check"
      onchange="this.closest('.pos-acc-card').classList.toggle('checked',this.checked);recalc()">
    <div class="pos-acc-info">
      <input type="text" class="pos-acc-name"
        value="${_esc(n)}"
        oninput="saveInventoryToStorage()"
        placeholder="Item name">
      <div class="pos-acc-meta">
        <span>Qty</span>
        <input type="number" class="pos-qty" value="1" min="1" oninput="recalc()">
        <span>Rs.</span>
        <input type="number" class="pos-price" value="${p}" min="0" oninput="recalc();saveInventoryToStorage()">
      </div>
    </div>
    <button class="acc-delete-btn" onclick="deleteAccessory(this)" title="Remove item"><i class="fas fa-times"></i></button>
  `
  accGrid.appendChild(div)
  if (shouldSave) saveInventoryToStorage()
  recalc()
}

window.deleteAccessory = function (btn) {
  if (confirm('Remove this accessory from the list?')) {
    btn.closest('.pos-acc-card').remove()
    recalc()
    saveInventoryToStorage()
    // Show hint again if grid is empty
    const accGrid = document.getElementById('accGrid')
    const cards = accGrid.querySelectorAll('.pos-acc-card')
    const hint = document.getElementById('accEmptyHint')
    if (!cards.length && hint) hint.style.display = 'flex'
  }
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

// ─── Devices ──────────────────────────────────────────────────────────────────
window.addDevice = function () {
  const deviceArea = document.getElementById('deviceArea')
  if (!deviceArea) return

  const div = document.createElement('div')
  div.className = 'pos-device-row'
  div.innerHTML = `
    <input type="text" class="d-name" placeholder="iPhone 15 Pro, Samsung S24..." oninput="recalc()">
    <input type="text" class="d-storage" placeholder="128GB, 256GB..." oninput="recalc()">
    <input type="text" class="d-imei" placeholder="IMEI / Serial Number" oninput="recalc()">
    <input type="number" class="d-qty" value="1" min="1" oninput="recalc()">
    <input type="number" class="d-price" placeholder="0.00" min="0" step="1" oninput="recalc()">
    <button class="device-del-btn" onclick="removeDevice(this)" title="Remove"><i class="fas fa-trash-alt"></i></button>
  `
  deviceArea.appendChild(div)
  updateDeviceEmptyState()
  recalc()
  // Focus first field
  div.querySelector('.d-name').focus()
}

window.removeDevice = function (btn) {
  // BUG FIX: recalc was outside the if block before — now inside
  if (confirm('Remove this item?')) {
    btn.closest('.pos-device-row').remove()
    recalc()
    updateDeviceEmptyState()
  }
}

function updateDeviceEmptyState() {
  const deviceArea = document.getElementById('deviceArea')
  const emptyState = document.getElementById('deviceEmptyState')
  if (!deviceArea || !emptyState) return
  const hasRows = deviceArea.querySelectorAll('.pos-device-row').length > 0
  emptyState.classList.toggle('visible', !hasRows)
}

// ─── Recalc ───────────────────────────────────────────────────────────────────
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

  _currentSubtotal = sub
  _currentDiscount =
    parseFloat(document.getElementById('inDiscount').value) || 0
  _currentTotal = Math.max(0, sub - _currentDiscount)

  // BUG FIX: Clamp payment to total, but don't force update if user is typing
  let payment = parseFloat(document.getElementById('inPayment').value) || 0
  payment = Math.min(payment, _currentTotal)
  payment = Math.max(0, payment)
  _currentPayment = payment

  const balance = _currentTotal - payment

  const fmt = (n) =>
    'Rs. ' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  document.getElementById('liveSubtotal').innerText = fmt(sub)
  document.getElementById('liveDiscount').innerText =
    '- ' + fmt(_currentDiscount)
  document.getElementById('liveTotal').innerText = fmt(_currentTotal)
  document.getElementById('livePayment').innerText = fmt(payment)
  document.getElementById('liveBalance').innerText = fmt(balance)

  // Update payment input only if clamping occurred
  const payInput = document.getElementById('inPayment')
  if (parseFloat(payInput.value) > _currentTotal) payInput.value = payment

  // Balance color
  const balEl = document.getElementById('liveBalance')
  if (balance > 0) balEl.style.color = 'var(--danger)'
  else balEl.style.color = 'var(--secondary)'
}

window.applyDiscount = function () {
  let discount = parseFloat(document.getElementById('inDiscount').value) || 0
  if (discount < 0) discount = 0
  if (discount > _currentSubtotal) {
    showToast('Discount cannot exceed subtotal', 'error')
    discount = _currentSubtotal
  }
  document.getElementById('inDiscount').value = discount
  recalc()
  if (discount > 0)
    showToast(`Discount of Rs. ${discount.toLocaleString()} applied`, 'success')
}

window.updatePayment = function () {
  let payment = parseFloat(document.getElementById('inPayment').value) || 0
  if (payment < 0) payment = 0
  if (payment > _currentTotal) payment = _currentTotal
  document.getElementById('inPayment').value = payment
  recalc()
}

window.setFullPayment = function () {
  document.getElementById('inPayment').value = _currentTotal
  recalc()
}

// BUG FIX: Replaced old updatePaymentStatus (which referenced select element) with selectStatus
window.updatePaymentStatus = function () {
  // Legacy shim — kept for compatibility
  const val = document.getElementById('invoiceStatus').value
  selectStatus(val)
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
window.switchTab = function (tab) {
  const tabs = ['pos', 'history', 'inventory']
  const titles = {
    pos: 'Point of Sale',
    history: 'Invoice History',
    inventory: 'Inventory',
  }

  tabs.forEach((t) => {
    document.getElementById(t + 'Tab').style.display =
      t === tab ? 'block' : 'none'
    document
      .getElementById('nav' + t.charAt(0).toUpperCase() + t.slice(1))
      .classList.toggle('active', t === tab)
    // Mobile bottom nav
    const mobileNav = document.getElementById(
      'mobileNav' + t.charAt(0).toUpperCase() + t.slice(1),
    )
    if (mobileNav) mobileNav.classList.toggle('active', t === tab)
  })

  // Update mobile title
  const mobileTitle = document.getElementById('mobileTabTitle')
  if (mobileTitle) mobileTitle.innerText = titles[tab] || ''

  if (tab === 'history' && typeof displayHistory === 'function')
    displayHistory()
  if (tab === 'inventory') renderInventoryTab()

  // Close mobile sidebar
  closeMobileSidebar()
}

// ─── Mobile Sidebar ───────────────────────────────────────────────────────────
window.toggleMobileSidebar = function () {
  const sidebar = document.querySelector('.pos-sidebar')
  const overlay = document.getElementById('mobileSidebarOverlay')
  sidebar.classList.toggle('mobile-open')
  overlay.classList.toggle('active')
}
window.closeMobileSidebar = function () {
  const sidebar = document.querySelector('.pos-sidebar')
  const overlay = document.getElementById('mobileSidebarOverlay')
  sidebar.classList.remove('mobile-open')
  overlay.classList.remove('active')
}

// ─── Inventory Tab ────────────────────────────────────────────────────────────
function renderInventoryTab() {
  const tbody = document.getElementById('inventoryTableBody')
  if (!tbody) return
  const inventory = loadInventory()
  if (!inventory.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="fas fa-boxes"></i><p>No products in inventory. Click "Add Product" to get started.</p></div></td></tr>`
    return
  }
  tbody.innerHTML = inventory
    .map(
      (item, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:12px;font-weight:700;width:40px">${i + 1}</td>
      <td>
        <input class="inv-name-input"
          value="${_esc(item.n)}"
          onchange="updateInventoryItem(${i},'n',this.value)"
          placeholder="Product name">
      </td>
      <td style="text-align:right;width:160px">
        <input class="inv-price-input" type="number"
          value="${item.p}" min="0"
          onchange="updateInventoryItem(${i},'p',this.value)">
      </td>
      <td style="text-align:center;width:60px">
        <button class="inv-del-btn" onclick="deleteInventoryItem(${i})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
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
  syncInventoryToAccGrid()
  showToast('Product added', 'success')
}

window.updateInventoryItem = function (index, field, value) {
  const inventory = loadInventory()
  if (inventory[index]) {
    inventory[index][field] = field === 'p' ? Number(value) : value
    saveInventory(inventory)
    syncInventoryToAccGrid()
  }
}

window.deleteInventoryItem = function (index) {
  if (confirm('Delete this product?')) {
    const inventory = loadInventory()
    inventory.splice(index, 1)
    saveInventory(inventory)
    renderInventoryTab()
    syncInventoryToAccGrid()
    showToast('Product deleted')
  }
}

function syncInventoryToAccGrid() {
  const accGrid = document.getElementById('accGrid')
  if (accGrid) {
    accGrid.innerHTML = ''
    const hint = document.getElementById('accEmptyHint')
    if (hint) {
      hint.style.display = 'none'
      accGrid.appendChild(hint)
    }
    loadInventory().forEach((item) => addAcc(item.n, item.p, false))
    // Show hint if no items
    if (hint && !accGrid.querySelector('.pos-acc-card')) {
      hint.style.display = 'flex'
    }
  }
}

// ─── Save Invoice ─────────────────────────────────────────────────────────────
window.saveInvoice = function () {
  // Validate: at least one item
  const hasCheckedAcc =
    document.querySelectorAll('.pos-acc-card .pos-check:checked').length > 0
  const hasDevice = Array.from(
    document.querySelectorAll('.pos-device-row'),
  ).some((row) => row.querySelector('.d-name')?.value.trim())
  if (!hasCheckedAcc && !hasDevice) {
    showToast('Please add at least one item to the invoice', 'error')
    return
  }

  const invoiceNo = document.getElementById('inNo').innerText
  const customerName =
    document.getElementById('inName').value.trim() || 'Walk-in Customer'
  const customerPhone =
    document.getElementById('inPhone').value.trim() || 'Not Provided'
  const discount = parseFloat(document.getElementById('inDiscount').value) || 0
  const paymentReceived =
    parseFloat(document.getElementById('inPayment').value) || 0
  const status = document.getElementById('invoiceStatus').value || 'pending'
  const dateInput = document.getElementById('inDate').value
  const formattedDate = dateInput
    ? new Date(dateInput + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

  // Build items HTML
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
        <td style="text-align:left">${_esc(name)}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:right">Rs. ${price.toLocaleString()}.00</td>
        <td style="text-align:right">Rs. ${total.toLocaleString()}.00</td>
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
    const total = qty * price
    subtotal += total
    const desc =
      _esc(name) +
      (storage ? ` (${_esc(storage)})` : '') +
      (imei ? ` — IMEI: ${_esc(imei)}` : '')
    itemsHTML += `<tr>
      <td style="text-align:left">${desc}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">Rs. ${price.toLocaleString()}.00</td>
      <td style="text-align:right">Rs. ${total.toLocaleString()}.00</td>
    </tr>`
  })

  if (!itemsHTML) {
    showToast('No valid items found', 'error')
    return
  }

  const totalAmount = Math.max(0, subtotal - discount)
  // BUG FIX: For paid status, set paidAmount = total. For cancelled, paidAmount = 0.
  let finalPaidAmount
  if (status === 'paid') finalPaidAmount = totalAmount
  else if (status === 'cancelled') finalPaidAmount = 0
  else finalPaidAmount = Math.min(Math.max(0, paymentReceived), totalAmount)

  // Save to history
  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
  )
  history.unshift({
    invoiceNo,
    customerName,
    phone: customerPhone,
    date: formattedDate,
    total: totalAmount,
    itemsHTML,
    subtotal,
    discount,
    status,
    paidAmount: finalPaidAmount,
    savedAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history))

  // Show success overlay
  document.getElementById('saveSuccessInvNo').innerText = invoiceNo
  document.getElementById('saveSuccessOverlay').style.display = 'flex'

  // Reset form
  document.getElementById('inNo').innerText = generateInvoiceNumber()
  document.getElementById('inName').value = ''
  document.getElementById('inPhone').value = ''
  document.getElementById('inDiscount').value = 0
  document.getElementById('inPayment').value = 0
  document.getElementById('invoiceStatus').value = 'pending'
  _syncStatusButtons('pending')
  document.getElementById('inDate').valueAsDate = new Date()
  document.getElementById('liveDate').innerText = new Date().toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  )
  document.querySelectorAll('.pos-acc-card .pos-check').forEach((cb) => {
    cb.checked = false
    cb.closest('.pos-acc-card').classList.remove('checked')
  })
  document.getElementById('deviceArea').innerHTML = ''
  updateDeviceEmptyState()
  recalc()
}

// BUG FIX: closeSaveSuccess now properly switches tab for 'pos' destination
window.closeSaveSuccess = function (destination) {
  document.getElementById('saveSuccessOverlay').style.display = 'none'
  if (destination === 'history') switchTab('history')
  else switchTab('pos')
}

// ─── History helpers ──────────────────────────────────────────────────────────
window.searchHistory = function () {
  if (typeof displayHistory === 'function') displayHistory()
}

window.clearHistory = function () {
  if (confirm('Clear ALL invoice history? This cannot be undone.')) {
    localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, '[]')
    if (typeof displayHistory === 'function') displayHistory()
    showToast('All history cleared')
  }
}

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (document.getElementById('posTab').style.display !== 'none')
      saveInvoice()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '1') {
    e.preventDefault()
    switchTab('pos')
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '2') {
    e.preventDefault()
    switchTab('history')
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '3') {
    e.preventDefault()
    switchTab('inventory')
  }
})

// ─── Dark Mode ────────────────────────────────────────────────────────────────
// BUG FIX: Was wrapped in broken IIFE syntax before — now a clean IIFE
;(function initDarkMode() {
  _applyTheme(localStorage.getItem('techno_theme') || 'light')
})()

function _applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('techno_theme', theme)
  const icon = document.getElementById('darkModeIcon')
  const iconMobile = document.getElementById('darkModeIconMobile')
  const cls = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'
  if (icon) icon.className = cls
  if (iconMobile) iconMobile.className = cls
}

window.toggleDarkMode = function () {
  const current = document.documentElement.getAttribute('data-theme') || 'light'
  _applyTheme(current === 'dark' ? 'light' : 'dark')
  if (
    typeof displayHistory === 'function' &&
    document.getElementById('historyTab')?.style.display !== 'none'
  )
    displayHistory()
}

// ─── Backup & Restore ─────────────────────────────────────────────────────────
window.backupData = function () {
  const backup = {
    version: '3.0',
    exportedAt: new Date().toISOString(),
    data: {
      [STORAGE_KEYS.INVOICE_HISTORY]: JSON.parse(
        localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY) || '[]',
      ),
      [STORAGE_KEYS.INVENTORY]: JSON.parse(
        localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]',
      ),
      [STORAGE_KEYS.TERMS]: JSON.parse(
        localStorage.getItem(STORAGE_KEYS.TERMS) || '[]',
      ),
    },
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
  )
  a.download = `TM_Backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  showToast('Backup downloaded!', 'success')
}

window.restoreData = function () {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target.result)
        if (!backup.data) throw new Error('Invalid format')
        if (
          confirm(
            'Restore backup? This will REPLACE all current data and reload the page.',
          )
        ) {
          Object.entries(backup.data).forEach(([key, val]) =>
            localStorage.setItem(key, JSON.stringify(val)),
          )
          showToast('Data restored! Reloading...', 'success')
          setTimeout(() => location.reload(), 1200)
        }
      } catch (err) {
        showToast('Invalid backup file', 'error')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

window.openSettingsModal = function () {
  document.getElementById('settingsModal').style.display = 'flex'
}
window.closeSettingsModal = function () {
  document.getElementById('settingsModal').style.display = 'none'
}

// ─── On Load ──────────────────────────────────────────────────────────────────
window.onload = () => {
  document.getElementById('loginPage').style.display = 'flex'
  document.getElementById('posSystem').style.display = 'none'
  // Pre-focus username
  setTimeout(() => {
    const u = document.getElementById('username')
    if (u) u.focus()
  }, 100)
}
