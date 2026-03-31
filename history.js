// history.js — Invoice History v3.1 - Fully Fixed

// ─── CHART STATE ─────────────────────────────────────────────────────────────
let _chartMode = 'weekly'
let _chartInstance = null

// ─── MAIN DISPLAY ─────────────────────────────────────────────────────────────
window.displayHistory = function () {
  const query = (document.getElementById('historySearch')?.value || '')
    .toLowerCase()
    .trim()
  const statusFilter = document.getElementById('statusFilter')?.value || 'all'
  const allHistory = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )

  let filtered = allHistory
  if (query) {
    filtered = filtered.filter(
      (inv) =>
        (inv.customerName || '').toLowerCase().includes(query) ||
        (inv.invoiceNo || '').toLowerCase().includes(query) ||
        (inv.phone || '').includes(query),
    )
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter((inv) => (inv.status || 'paid') === statusFilter)
  }

  _renderStats(allHistory, filtered)
  _renderChart(allHistory)
  _renderList(filtered, allHistory)
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function _renderStats(allHistory, filtered) {
  const el = document.getElementById('historyStats')
  if (!el) return

  const totalRev = allHistory.reduce((s, inv) => s + (inv.total || 0), 0)
  const avg = allHistory.length ? totalRev / allHistory.length : 0
  const todayLabel = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const todayRev = allHistory
    .filter((inv) => inv.date === todayLabel)
    .reduce((s, inv) => s + (inv.total || 0), 0)
  const pendingInvs = allHistory.filter(
    (inv) => (inv.status || 'paid') === 'pending',
  )
  const pendingBal = pendingInvs.reduce((s, inv) => s + _balanceDue(inv), 0)

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Invoices</div>
      <div class="stat-value blue">${allHistory.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value green">Rs. ${_fmt(totalRev)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg. Invoice</div>
      <div class="stat-value">Rs. ${_fmt(avg)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Today's Revenue</div>
      <div class="stat-value" style="color:var(--warning)">Rs. ${_fmt(todayRev)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Balance</div>
      <div class="stat-value" style="color:var(--danger);font-size:17px">
        Rs. ${_fmt(pendingBal)}
        ${pendingInvs.length ? `<span style="font-size:12px;font-weight:500;color:var(--gray)">&nbsp;(${pendingInvs.length})</span>` : ''}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Showing</div>
      <div class="stat-value">${filtered.length} <span style="font-size:13px;font-weight:500;color:var(--gray)">/ ${allHistory.length}</span></div>
    </div>
  `
}

// ─── REVENUE CHART ────────────────────────────────────────────────────────────
function _renderChart(allHistory) {
  const container = document.getElementById('revenueChartContainer')
  if (!container) return
  if (allHistory.length === 0) {
    container.style.display = 'none'
    return
  }
  container.style.display = 'block'

  const canvas = document.getElementById('revenueChart')
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const labelColor = isDark ? '#94a3b8' : '#64748b'

  const { labels, paid, partial } = _buildChartData(allHistory, _chartMode)

  if (_chartInstance) {
    _chartInstance.destroy()
    _chartInstance = null
  }

  _chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Paid',
          data: paid,
          backgroundColor: isDark
            ? 'rgba(59,130,246,0.8)'
            : 'rgba(37,99,235,0.75)',
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: 'Partial / Pending',
          data: partial,
          backgroundColor: isDark
            ? 'rgba(251,191,36,0.7)'
            : 'rgba(245,158,11,0.65)',
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: labelColor,
            font: { family: 'DM Sans', size: 12 },
            boxWidth: 12,
            borderRadius: 4,
          },
        },
        tooltip: { callbacks: { label: (c) => ` Rs. ${_fmt(c.parsed.y)}` } },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: labelColor, font: { family: 'DM Sans', size: 11 } },
        },
        y: {
          stacked: true,
          grid: { color: gridColor },
          ticks: {
            color: labelColor,
            font: { family: 'Space Mono', size: 10 },
            callback: (v) =>
              'Rs.' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
          },
        },
      },
    },
  })
}

function _buildChartData(all, mode) {
  const now = new Date()
  const labels = [],
    paid = [],
    partial = []

  if (mode === 'daily') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const str = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      labels.push(
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      )
      const dayInvs = all.filter((inv) => inv.date === str)
      paid.push(
        dayInvs
          .filter((inv) => (inv.status || 'paid') === 'paid')
          .reduce((s, inv) => s + (inv.total || 0), 0),
      )
      partial.push(
        dayInvs
          .filter((inv) => (inv.status || 'paid') !== 'paid')
          .reduce((s, inv) => s + (inv.paidAmount || 0), 0),
      )
    }
  } else if (mode === 'weekly') {
    for (let i = 11; i >= 0; i--) {
      const ws = new Date(now)
      ws.setDate(ws.getDate() - ws.getDay() - i * 7)
      const we = new Date(ws)
      we.setDate(we.getDate() + 6)
      labels.push(`Wk ${12 - i}`)
      const invs = all.filter((inv) => {
        const d = _pDate(inv.date)
        return d && d >= ws && d <= we
      })
      paid.push(
        invs
          .filter((inv) => (inv.status || 'paid') === 'paid')
          .reduce((s, inv) => s + (inv.total || 0), 0),
      )
      partial.push(
        invs
          .filter((inv) => (inv.status || 'paid') !== 'paid')
          .reduce((s, inv) => s + (inv.paidAmount || 0), 0),
      )
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(
        d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      )
      const invs = all.filter((inv) => {
        const pd = _pDate(inv.date)
        return (
          pd &&
          pd.getMonth() === d.getMonth() &&
          pd.getFullYear() === d.getFullYear()
        )
      })
      paid.push(
        invs
          .filter((inv) => (inv.status || 'paid') === 'paid')
          .reduce((s, inv) => s + (inv.total || 0), 0),
      )
      partial.push(
        invs
          .filter((inv) => (inv.status || 'paid') !== 'paid')
          .reduce((s, inv) => s + (inv.paidAmount || 0), 0),
      )
    }
  }
  return { labels, paid, partial }
}

function _pDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

window.setChartMode = function (mode) {
  _chartMode = mode
  document
    .querySelectorAll('.chart-tab-btn')
    .forEach((b) => b.classList.toggle('active', b.dataset.mode === mode))
  const all = JSON.parse(localStorage.getItem('techno_invoice_history') || '[]')
  _renderChart(all)
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function _fmt(n) {
  return (n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function _balanceDue(inv) {
  if ((inv.status || 'paid') === 'paid') return 0
  return Math.max(0, (inv.total || 0) - (inv.paidAmount || 0))
}

function _paidAmount(inv) {
  const status = inv.status || 'paid'
  if (status === 'paid') return inv.total || 0
  return inv.paidAmount || 0
}

function _statusBadge(inv) {
  const s = inv.status || 'paid'
  if (s === 'paid')
    return `<span class="status-badge paid"><i class="fas fa-check-circle"></i> Paid</span>`
  if (s === 'cancelled')
    return `<span class="status-badge cancelled"><i class="fas fa-times-circle"></i> Cancelled</span>`
  const bal = _balanceDue(inv)
  return bal > 0
    ? `<span class="status-badge pending"><i class="fas fa-clock"></i> Pending · Rs.${_fmt(bal)}</span>`
    : `<span class="status-badge paid"><i class="fas fa-check-circle"></i> Paid</span>`
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── LIST ─────────────────────────────────────────────────────────────────────
function _renderList(filtered, allHistory) {
  const el = document.getElementById('historyList')
  if (!el) return

  if (filtered.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>No invoices found</p></div>`
    return
  }

  el.innerHTML = filtered
    .map((inv, idx) => {
      const realIdx = allHistory.findIndex(
        (h) =>
          h.invoiceNo === inv.invoiceNo &&
          h.customerName === inv.customerName &&
          h.date === inv.date,
      )
      const s = inv.status || 'paid'
      const bal = _balanceDue(inv)
      const phone = inv.phone && inv.phone !== 'Not Provided' ? inv.phone : ''
      const hasPhone = !!phone

      return `
    <div class="history-item ${s}" id="hist-item-${realIdx}">
      <div class="history-num">${realIdx + 1}</div>
      <div class="history-info">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <h4>${_esc(inv.customerName || 'Walk-in Customer')}</h4>
          ${_statusBadge(inv)}
        </div>
        <div class="history-meta">
          <span><i class="fas fa-hashtag"></i> ${_esc(inv.invoiceNo || 'N/A')}</span>
          <span><i class="fas fa-calendar-alt"></i> ${_esc(inv.date || 'N/A')}</span>
          ${phone ? `<span><i class="fas fa-phone"></i> ${_esc(phone)}</span>` : ''}
          ${s === 'pending' && bal > 0 ? `<span style="color:var(--danger);font-weight:600"><i class="fas fa-exclamation-circle"></i> Balance: Rs.${_fmt(bal)}</span>` : ''}
        </div>
      </div>
      <div class="history-amount">Rs. ${_fmt(inv.total || 0)}</div>
      <div class="history-actions">
        <button class="history-btn view" id="dl-btn-${realIdx}" onclick="viewInvoice(${realIdx})" title="Download PDF">
          <i class="fas fa-file-download"></i>
        </button>
        <button class="history-btn whatsapp ${hasPhone ? '' : 'no-phone'}" onclick="shareWhatsApp(${realIdx})" title="${hasPhone ? 'Share via WhatsApp' : 'Share via WhatsApp (no phone saved)'}">
          <i class="fab fa-whatsapp"></i>
        </button>
        <button class="history-btn status-toggle" onclick="openPaymentModal(${realIdx})" title="Manage Payment / Status">
          <i class="fas fa-credit-card"></i>
        </button>
        <button class="history-btn delete" onclick="deleteFromHistory(${realIdx})" title="Delete Invoice">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`
    })
    .join('')
}

// ─── PDF DOWNLOAD ─────────────────────────────────────────────────────────────
window.viewInvoice = function (index) {
  try {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    const inv = history[index]
    if (!inv) {
      showToast('Invoice not found', 'error')
      return
    }

    const s = inv.status || 'paid'
    const paid = _paidAmount(inv)
    const bal = _balanceDue(inv)

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
      '新闻报道<td colspan="4" style="text-align:center;padding:20px">No items found</td>\
      </tr>'
    document.getElementById('pdfSubTotal').innerText =
      `Rs. ${_fmt(inv.subtotal || 0)}`
    document.getElementById('pdfDiscount').innerText =
      `-Rs. ${_fmt(inv.discount || 0)}`
    document.getElementById('pdfGrandTotal').innerText =
      `Rs. ${_fmt(inv.total || 0)}`

    const pdfPs = document.getElementById('pdfPaymentStatus')
    if (pdfPs) {
      if (s === 'paid') {
        pdfPs.innerHTML = `
          <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:13px 18px;margin:0 0 14px 0;display:flex;justify-content:space-between;align-items:center;page-break-inside:avoid">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="color:#fff;font-size:16px">✓</span>
              </div>
              <div>
                <div style="color:#15803d;font-weight:800;font-size:13px;letter-spacing:0.5px">PAID IN FULL</div>
                <div style="color:#166534;font-size:11px;margin-top:2px">Payment received — Thank you!</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="color:#15803d;font-weight:800;font-size:16px;font-family:monospace">Rs. ${_fmt(paid)}</div>
              <div style="color:#166534;font-size:10px;margin-top:2px">Amount Paid</div>
            </div>
          </div>`
      } else if (s === 'pending' && bal > 0) {
        pdfPs.innerHTML = `
          <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:13px 18px;margin:0 0 14px 0;page-break-inside:avoid">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:20px">⏳</span>
                <span style="color:#92400e;font-weight:800;font-size:12px;letter-spacing:0.5px;text-transform:uppercase">Partial Payment — Balance Due</span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px">
              <span style="color:#78350f">Paid So Far: <strong style="font-family:monospace;font-size:13px">Rs. ${_fmt(paid)}</strong></span>
              <span style="color:#991b1b;font-weight:700">Balance Due: <strong style="font-family:monospace;font-size:13px">Rs. ${_fmt(bal)}</strong></span>
            </div>
          </div>`
      } else if (s === 'cancelled') {
        pdfPs.innerHTML = `
          <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:13px 18px;margin:0 0 14px 0;display:flex;align-items:center;gap:12px;page-break-inside:avoid">
            <div style="width:36px;height:36px;background:#dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span style="color:#fff;font-size:16px;font-weight:700">✕</span>
            </div>
            <div>
              <div style="color:#991b1b;font-weight:800;font-size:13px;letter-spacing:0.5px;text-transform:uppercase">Cancelled Invoice</div>
              <div style="color:#b91c1c;font-size:11px;margin-top:2px">This invoice has been voided and is no longer valid.</div>
            </div>
          </div>`
      } else {
        pdfPs.innerHTML = ''
      }
    }

    const terms = JSON.parse(localStorage.getItem('techno_terms') || '[]')
    const selected = terms.filter((t) => t.selected)
    const pdfTerms = document.getElementById('pdfTermsList')
    if (pdfTerms) {
      pdfTerms.innerHTML =
        selected.length === 0
          ? '<li style="color:#64748b"><i class="fas fa-info-circle"></i> No terms selected</li>'
          : selected
              .map(
                (t) =>
                  `<li><i class="fas fa-check-circle" style="color:#10b981"></i> ${_esc(t.text)}</li>`,
              )
              .join('')
    }

    const btn = document.getElementById(`dl-btn-${index}`)
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
    }

    setTimeout(() => {
      if (typeof generatePDFWithSettings === 'function')
        generatePDFWithSettings(inv.invoiceNo || 'invoice')
      setTimeout(() => {
        if (btn) {
          btn.disabled = false
          btn.innerHTML = '<i class="fas fa-file-download"></i>'
        }
      }, 3800)
    }, 300)
  } catch (err) {
    console.error('viewInvoice:', err)
    showToast('Error loading invoice', 'error')
  }
}

// ─── WHATSAPP SHARE ───────────────────────────────────────────────────────────
window.shareWhatsApp = function (index) {
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]
  if (!inv) {
    showToast('Invoice not found', 'error')
    return
  }

  const s = inv.status || 'paid'
  const paid = _paidAmount(inv)
  const bal = _balanceDue(inv)

  let itemsText = ''
  try {
    const tmp = document.createElement('table')
    tmp.innerHTML = inv.itemsHTML || ''
    tmp.querySelectorAll('tr').forEach((row) => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 4) {
        const name = cells[0].textContent.trim()
        const qty = cells[1].textContent.trim()
        const tot = cells[3].textContent.trim()
        if (name) itemsText += `  • ${name} ×${qty} — ${tot}\n`
      }
    })
  } catch (e) {}

  let statusBlock = ''
  if (s === 'paid') {
    statusBlock =
      `━━━━━━━━━━━━━━━━━\n` +
      `✅ *PAID IN FULL*\n` +
      `💳 Amount Paid: *Rs. ${_fmt(paid)}*`
  } else if (s === 'cancelled') {
    statusBlock =
      `━━━━━━━━━━━━━━━━━\n` +
      `❌ *CANCELLED*\n` +
      `This invoice has been voided.`
  } else {
    statusBlock =
      `━━━━━━━━━━━━━━━━━\n` +
      `⏳ *PARTIAL PAYMENT — BALANCE DUE*\n` +
      `💳 Paid So Far: *Rs. ${_fmt(paid)}*\n` +
      `⚠️ Balance Due: *Rs. ${_fmt(bal)}*\n` +
      `\nPlease settle the remaining balance at your earliest convenience.`
  }

  const discountLine =
    inv.discount && inv.discount > 0
      ? `🏷️ Discount: -Rs. ${_fmt(inv.discount)}\n`
      : ''

  const msg =
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📱 *TECHNO MOBILE*\n` +
    `   Authorized Retail & Repair\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🧾 *Invoice No:* ${inv.invoiceNo || 'N/A'}\n` +
    `📅 *Date:* ${inv.date || 'N/A'}\n` +
    `👤 *Customer:* ${inv.customerName || 'Walk-in Customer'}\n` +
    (inv.phone && inv.phone !== 'Not Provided'
      ? `📞 *Phone:* ${inv.phone}\n`
      : '') +
    `\n` +
    `🛒 *Items Purchased:*\n` +
    (itemsText || `  • (see invoice PDF)\n`) +
    `\n` +
    `💰 Subtotal: Rs. ${_fmt(inv.subtotal || 0)}\n` +
    discountLine +
    `💵 *Total: Rs. ${_fmt(inv.total || 0)}*\n` +
    `\n` +
    statusBlock +
    `\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🙏 _Thank you for choosing Techno Mobile!_`

  const raw = (inv.phone || '').replace(/\D/g, '')
  let intlPhone = ''
  if (raw.length >= 9) {
    intlPhone = raw.startsWith('0') ? '94' + raw.slice(1) : raw
  }

  const url = intlPhone
    ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`

  window.open(url, '_blank')
  showToast(
    intlPhone
      ? '✓ Opening WhatsApp chat...'
      : '✓ Opening WhatsApp (no phone — pick contact)',
    'success',
  )
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────
window.openPaymentModal = function (index) {
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]
  if (!inv) return

  const s = inv.status || 'paid'
  const paid = _paidAmount(inv)
  const bal = _balanceDue(inv)

  document.getElementById('pmInvoiceNo').innerText = inv.invoiceNo || 'N/A'
  document.getElementById('pmCustomerName').innerText =
    inv.customerName || 'Walk-in Customer'
  document.getElementById('pmTotal').innerText = `Rs. ${_fmt(inv.total || 0)}`
  document.getElementById('pmPaid').innerText = `Rs. ${_fmt(paid)}`
  document.getElementById('pmBalance').innerText = `Rs. ${_fmt(bal)}`

  document.getElementById('pmAmount').value = bal > 0 ? bal : ''
  document.getElementById('pmModalIndex').value = index

  document
    .querySelectorAll('.pm-status-btn')
    .forEach((b) => b.classList.toggle('active', b.dataset.status === s))

  const amtRow = document.getElementById('pmAmountRow')
  if (amtRow) amtRow.style.display = s === 'pending' ? 'flex' : 'none'

  document.getElementById('paymentModal').style.display = 'flex'
}

window.closePaymentModal = function () {
  document.getElementById('paymentModal').style.display = 'none'
}

window.pmSetStatus = function (status) {
  document
    .querySelectorAll('.pm-status-btn')
    .forEach((b) => b.classList.toggle('active', b.dataset.status === status))
  const amtRow = document.getElementById('pmAmountRow')
  if (amtRow) amtRow.style.display = status === 'pending' ? 'flex' : 'none'
}

window.savePayment = function () {
  const index = parseInt(document.getElementById('pmModalIndex').value)
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]
  if (!inv) return

  const activeBtn = document.querySelector('.pm-status-btn.active')
  const newStatus = activeBtn ? activeBtn.dataset.status : 'paid'
  const amtInput = parseFloat(document.getElementById('pmAmount').value) || 0

  if (newStatus === 'paid') {
    inv.status = 'paid'
    inv.paidAmount = inv.total || 0
  } else if (newStatus === 'cancelled') {
    inv.status = 'cancelled'
  } else {
    if (amtInput < 0) {
      showToast('Amount cannot be negative', 'error')
      return
    }
    const currentPaid = inv.paidAmount || 0
    const remaining = (inv.total || 0) - currentPaid
    if (amtInput > remaining + 0.01) {
      showToast('Amount exceeds balance due', 'error')
      return
    }

    const newPaid = parseFloat((currentPaid + amtInput).toFixed(2))
    inv.paidAmount = newPaid
    inv.status = newPaid >= (inv.total || 0) ? 'paid' : 'pending'
  }

  inv.lastPaymentAt = new Date().toISOString()
  history[index] = inv
  localStorage.setItem('techno_invoice_history', JSON.stringify(history))
  closePaymentModal()
  displayHistory()

  const msg =
    inv.status === 'paid'
      ? '✅ Marked as Paid in Full!'
      : inv.status === 'cancelled'
        ? '❌ Invoice cancelled'
        : `⏳ Rs. ${_fmt(amtInput)} payment recorded`

  showToast(msg, 'success')
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
window.deleteFromHistory = function (index) {
  if (!confirm('Delete this invoice? This cannot be undone.')) return
  try {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    history.splice(index, 1)
    localStorage.setItem('techno_invoice_history', JSON.stringify(history))
    displayHistory()
    showToast('Invoice deleted')
  } catch (err) {
    console.error(err)
    showToast('Error deleting invoice', 'error')
  }
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
window.exportHistoryCSV = function () {
  const all = JSON.parse(localStorage.getItem('techno_invoice_history') || '[]')
  if (!all.length) {
    showToast('No invoices to export', 'error')
    return
  }

  const hdr = [
    'Invoice No',
    'Customer',
    'Phone',
    'Date',
    'Subtotal',
    'Discount',
    'Total',
    'Status',
    'Paid',
    'Balance',
  ]
  const rows = all.map((inv) => [
    inv.invoiceNo || '',
    inv.customerName || 'Walk-in Customer',
    inv.phone || '',
    inv.date || '',
    _fmt(inv.subtotal || 0),
    _fmt(inv.discount || 0),
    _fmt(inv.total || 0),
    inv.status || 'paid',
    _fmt(_paidAmount(inv)),
    _fmt(_balanceDue(inv)),
  ])

  const csv = [hdr, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `TM_History_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  showToast('Exported as CSV!', 'success')
}
