// history.js — Invoice History v3.0 Fixed

// BUG FIX: Default chart mode matches the "active" button in HTML (daily)
let _chartMode = 'daily'
let _chartInstance = null

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

// ─── Stats ────────────────────────────────────────────────────────────────────
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
      <div class="stat-value" style="color:var(--danger)">
        Rs. ${_fmt(pendingBal)}${pendingInvs.length ? `<span style="font-size:12px"> (${pendingInvs.length})</span>` : ''}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Showing</div>
      <div class="stat-value">${filtered.length} <span style="font-size:14px;font-weight:500">/ ${allHistory.length}</span></div>
    </div>
  `
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function _renderChart(allHistory) {
  const container = document.getElementById('revenueChartContainer')
  if (!container) return
  if (!allHistory.length) {
    container.style.display = 'none'
    return
  }
  container.style.display = 'block'

  const canvas = document.getElementById('revenueChart')
  if (!canvas) return

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const labelColor = isDark ? '#94a3b8' : '#64748b'

  const { labels, paid, partial } = _buildChartData(allHistory, _chartMode)

  if (_chartInstance) _chartInstance.destroy()

  _chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Paid',
          data: paid,
          backgroundColor: isDark
            ? 'rgba(16,185,129,0.75)'
            : 'rgba(5,150,105,0.7)',
          borderRadius: 6,
        },
        {
          label: 'Partial / Pending',
          data: partial,
          backgroundColor: isDark
            ? 'rgba(251,191,36,0.7)'
            : 'rgba(245,158,11,0.65)',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: labelColor,
            font: { family: 'Outfit', size: 12, weight: '600' },
          },
        },
        tooltip: {
          callbacks: {
            label: (c) => ` Rs. ${_fmt(c.parsed.y)}`,
          },
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          padding: 12,
          cornerRadius: 10,
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: labelColor, font: { family: 'Outfit', size: 11 } },
        },
        y: {
          stacked: true,
          grid: { color: gridColor },
          ticks: {
            color: labelColor,
            font: { family: 'Outfit', size: 11 },
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
      ws.setHours(0, 0, 0, 0)
      const we = new Date(ws)
      we.setDate(we.getDate() + 6)
      we.setHours(23, 59, 59, 999)
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
    // monthly
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
  return isNaN(d.getTime()) ? null : d
}

window.setChartMode = function (mode) {
  _chartMode = mode
  document
    .querySelectorAll('.chart-tab-btn')
    .forEach((b) => b.classList.toggle('active', b.dataset.mode === mode))
  const all = JSON.parse(localStorage.getItem('techno_invoice_history') || '[]')
  _renderChart(all)
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function _fmt(n) {
  return (n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function _balanceDue(inv) {
  if ((inv.status || 'paid') === 'paid' || inv.status === 'cancelled') return 0
  return Math.max(0, (inv.total || 0) - (inv.paidAmount || 0))
}

function _paidAmount(inv) {
  return (inv.status || 'paid') === 'paid'
    ? inv.total || 0
    : inv.paidAmount || 0
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

// ─── Render List ──────────────────────────────────────────────────────────────
function _renderList(filtered, allHistory) {
  const el = document.getElementById('historyList')
  if (!el) return

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>No invoices found. Try adjusting your search or filters.</p></div>`
    return
  }

  el.innerHTML = filtered
    .map((inv) => {
      // BUG FIX: Use a more reliable index lookup that won't fail on duplicate names
      const realIdx = allHistory.findIndex(
        (h) => h.invoiceNo === inv.invoiceNo && h.savedAt === inv.savedAt,
      )
      // Fallback if savedAt not available (old records)
      const idx =
        realIdx >= 0
          ? realIdx
          : allHistory.findIndex(
              (h) =>
                h.invoiceNo === inv.invoiceNo &&
                h.customerName === inv.customerName &&
                h.date === inv.date,
            )

      const phone = inv.phone && inv.phone !== 'Not Provided' ? inv.phone : ''
      return `<div class="history-item ${inv.status || 'paid'}" id="hist-item-${idx}">
        <div class="history-num">${idx + 1}</div>
        <div class="history-info">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <h4>${_esc(inv.customerName || 'Walk-in Customer')}</h4>
            ${_statusBadge(inv)}
          </div>
          <div class="history-meta">
            <span><i class="fas fa-hashtag"></i> ${_esc(inv.invoiceNo || 'N/A')}</span>
            <span><i class="fas fa-calendar-alt"></i> ${_esc(inv.date || 'N/A')}</span>
            ${phone ? `<span><i class="fas fa-phone"></i> ${_esc(phone)}</span>` : ''}
          </div>
        </div>
        <div class="history-amount">Rs. ${_fmt(inv.total || 0)}</div>
        <div class="history-actions">
          <button class="history-btn view" onclick="printInvoice(${idx})" title="Print / Save as PDF">
            <i class="fas fa-print"></i>
          </button>
          <button class="history-btn whatsapp" onclick="shareWhatsApp(${idx})" title="Share via WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="history-btn status-toggle" onclick="openPaymentModal(${idx})" title="Manage Payment">
            <i class="fas fa-credit-card"></i>
          </button>
          <button class="history-btn delete" onclick="deleteFromHistory(${idx})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`
    })
    .join('')
}

// ─── Print Invoice ────────────────────────────────────────────────────────────
window.printInvoice = function (index) {
  try {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    const inv = history[index]
    if (!inv) {
      showToast('Invoice not found', 'error')
      return
    }

    // Populate print template
    document.getElementById('printCustomerName').innerText =
      inv.customerName || 'Walk-in Customer'
    document.getElementById('printCustomerPhone').innerText =
      inv.phone || 'Not Provided'
    document.getElementById('printInvoiceNo').innerText = inv.invoiceNo || 'N/A'
    document.getElementById('printDate').innerText =
      inv.date || new Date().toLocaleDateString()
    document.getElementById('printItemsBody').innerHTML =
      inv.itemsHTML ||
      '<tr><td colspan="4" style="text-align:center;padding:20px">No items found</td></tr>'
    document.getElementById('printSubTotal').innerText =
      `Rs. ${_fmt(inv.subtotal || 0)}`
    document.getElementById('printDiscount').innerText =
      `-Rs. ${_fmt(inv.discount || 0)}`
    document.getElementById('printGrandTotal').innerText =
      `Rs. ${_fmt(inv.total || 0)}`

    // Payment status block
    const s = inv.status || 'paid'
    const paid = _paidAmount(inv)
    const bal = _balanceDue(inv)
    const statusDiv = document.getElementById('printPaymentStatus')

    if (s === 'paid') {
      statusDiv.innerHTML = `<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:13px 18px;margin:0 0 14px;display:flex;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:16px">✓</span></div>
          <div><div style="color:#15803d;font-weight:800">PAID IN FULL</div><div style="color:#166534;font-size:11px">Payment received — Thank you!</div></div>
        </div>
        <div style="text-align:right"><div style="color:#15803d;font-weight:800">Rs. ${_fmt(paid)}</div><div style="color:#166534;font-size:10px">Amount Paid</div></div>
      </div>`
    } else if (s === 'pending' && bal > 0) {
      statusDiv.innerHTML = `<div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:13px 18px;margin:0 0 14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">⏳</span><span style="color:#92400e;font-weight:800">PARTIAL PAYMENT — BALANCE DUE</span></div>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#78350f">Paid: <strong>Rs. ${_fmt(paid)}</strong></span>
          <span style="color:#991b1b;font-weight:700">Balance: <strong>Rs. ${_fmt(bal)}</strong></span>
        </div>
      </div>`
    } else if (s === 'cancelled') {
      statusDiv.innerHTML = `<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:13px 18px;margin:0 0 14px;display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;background:#dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:16px">✕</span></div>
        <div><div style="color:#991b1b;font-weight:800">CANCELLED</div><div style="color:#b91c1c;font-size:11px">This invoice has been voided.</div></div>
      </div>`
    } else {
      statusDiv.innerHTML = ''
    }

    // Terms
    const terms = JSON.parse(localStorage.getItem('techno_terms') || '[]')
    const selected = terms.filter((t) => t.selected)
    document.getElementById('printTermsList').innerHTML = !selected.length
      ? '<li>No terms selected</li>'
      : selected
          .map(
            (t) =>
              `<li><i class="fas fa-check-circle" style="color:#10b981"></i> ${_esc(t.text)}</li>`,
          )
          .join('')

    // Open print window
    const printContent = document.getElementById('printTemplate').innerHTML
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('Pop-up blocked! Please allow pop-ups and try again.', 'error')
      return
    }
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${inv.invoiceNo}</title>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Outfit',sans-serif;background:#f8fafc;padding:24px}
        .invoice-wrap{max-width:210mm;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12)}
        .print-header{background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 28px;color:white}
        .print-header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;flex-wrap:wrap;gap:14px}
        .print-brand{display:flex;align-items:center;gap:16px}
        .print-brand-icon{width:52px;height:52px;background:white;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:22px;font-weight:800}
        .print-brand-text h1{font-size:22px;font-weight:800;color:white;margin:0}
        .print-brand-text p{font-size:10px;opacity:0.8;margin:3px 0 0}
        .print-badge{background:rgba(255,255,255,0.15);padding:10px 22px;border-radius:40px;border:1px solid rgba(255,255,255,0.2)}
        .print-badge h2{font-size:20px;font-weight:700;margin:0;color:white}
        .print-info{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .print-bill-to,.print-invoice-details{background:rgba(255,255,255,0.1);padding:14px 16px;border-radius:10px}
        .print-invoice-details{display:flex;justify-content:space-between;gap:20px}
        .print-label{font-size:9px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.8;margin-bottom:5px;font-weight:700}
        .print-value{font-size:14px;font-weight:700}
        .print-phone{font-size:12px;opacity:0.9;margin-top:4px}
        .print-body{padding:24px 28px;background:white}
        .print-table{width:100%;border-collapse:collapse;margin:14px 0}
        .print-table th{background:#f8fafc;padding:12px;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;text-align:left}
        .print-table th:nth-child(2),.print-table th:nth-child(3),.print-table th:nth-child(4){text-align:right}
        .print-table td{padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:13px}
        .print-table td:nth-child(2),.print-table td:nth-child(3),.print-table td:nth-child(4){text-align:right}
        .print-totals{display:flex;justify-content:flex-end;margin:18px 0}
        .print-totals-box{width:280px;background:#f8fafc;padding:16px 20px;border-radius:12px}
        .print-total-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #cbd5e1;font-size:13px}
        .print-grand-total{display:flex;justify-content:space-between;padding:12px 0 0;margin-top:8px;border-top:2px solid #1e293b;font-size:16px;font-weight:800}
        .print-grand-total span:last-child{color:#2563eb;font-size:18px}
        .print-footer{display:grid;grid-template-columns:1.5fr 1fr;gap:20px;margin-top:24px;padding-top:20px;border-top:2px solid #e2e8f0}
        .print-thankyou h3{font-size:15px;font-weight:700;color:#1e293b;margin:0 0 8px}
        .print-thankyou p{font-size:11px;color:#64748b;line-height:1.5;margin:0}
        .print-terms{background:#f8fafc;padding:14px 18px;border-radius:12px}
        .print-terms h4{font-size:12px;font-weight:700;color:#1e293b;margin:0 0 10px}
        .print-terms ul{list-style:none;padding:0;margin:0}
        .print-terms li{font-size:11px;color:#475569;margin-bottom:7px;display:flex;align-items:flex-start;gap:6px;line-height:1.4}
        .print-btn{display:block;margin:20px auto 0;padding:12px 32px;background:#2563eb;color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif}
        @media print{body{padding:0;background:white}.print-btn{display:none}.invoice-wrap{box-shadow:none;border-radius:0}.print-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
        @page{size:A4;margin:12mm}
      </style>
      </head>
      <body>
        <div class="invoice-wrap">${printContent}</div>
        <button class="print-btn" onclick="window.print()"><i class="fas fa-print"></i> Print / Save as PDF</button>
        <script>setTimeout(()=>window.print(),600)<\/script>
      </body></html>`)
    printWindow.document.close()
    showToast('Opening print preview...', 'success')
  } catch (err) {
    console.error(err)
    showToast('Error loading invoice', 'error')
  }
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
window.shareWhatsApp = function (index) {
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]
  if (!inv) {
    showToast('Invoice not found', 'error')
    return
  }

  let itemsText = ''
  try {
    const tmp = document.createElement('table')
    tmp.innerHTML = inv.itemsHTML || ''
    tmp.querySelectorAll('tr').forEach((row) => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 4)
        itemsText += `  • ${cells[0].textContent.trim()} ×${cells[1].textContent.trim()} — ${cells[3].textContent.trim()}\n`
    })
  } catch (e) {}

  const s = inv.status || 'paid'
  const paid = _paidAmount(inv)
  const bal = _balanceDue(inv)
  const statusBlock =
    s === 'paid'
      ? `✅ PAID IN FULL - Amount: Rs. ${_fmt(paid)}`
      : s === 'cancelled'
        ? `❌ CANCELLED`
        : `⏳ PARTIAL PAYMENT - Paid: Rs. ${_fmt(paid)} | Balance: Rs. ${_fmt(bal)}`

  const msg = `📱 TECHNO MOBILE\n━━━━━━━━━━━━━━━━━━━━━\n🧾 Invoice: ${inv.invoiceNo}\n📅 Date: ${inv.date}\n👤 Customer: ${inv.customerName || 'Walk-in Customer'}${inv.phone && inv.phone !== 'Not Provided' ? `\n📞 Phone: ${inv.phone}` : ''}\n\n🛒 Items:\n${itemsText}\n💰 Subtotal: Rs. ${_fmt(inv.subtotal || 0)}${inv.discount ? `\n🏷️ Discount: -Rs. ${_fmt(inv.discount)}` : ''}\n💵 TOTAL: Rs. ${_fmt(inv.total || 0)}\n\n${statusBlock}\n\n🙏 Thank you for choosing Techno Mobile!`

  const raw = (inv.phone || '').replace(/\D/g, '')
  const intlPhone =
    raw.length >= 9 ? (raw.startsWith('0') ? '94' + raw.slice(1) : raw) : ''

  window.open(
    `https://wa.me/${intlPhone || ''}?text=${encodeURIComponent(msg)}`,
    '_blank',
  )
  showToast('Opening WhatsApp...', 'success')
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
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

  const amountInput = document.getElementById('pmAmount')
  if (amountInput) {
    amountInput.value = ''
    amountInput.placeholder =
      bal > 0 ? `Enter amount (max Rs. ${_fmt(bal)})` : 'No balance due'
    amountInput.max = bal
    amountInput.min = 0
  }

  document.getElementById('pmModalIndex').value = index

  document.querySelectorAll('.pm-status-btn').forEach((btn) => {
    btn.classList.remove('active')
    if (btn.dataset.status === s) btn.classList.add('active')
  })

  const amtRow = document.getElementById('pmAmountRow')
  if (amtRow)
    amtRow.style.display = s === 'pending' && bal > 0 ? 'flex' : 'none'

  const hintEl = document.querySelector('.pm-hint')
  if (hintEl) {
    hintEl.innerHTML =
      bal > 0 && s === 'pending'
        ? `<i class="fas fa-info-circle"></i> Current balance: Rs. ${_fmt(bal)}. Enter amount to pay now.`
        : `<i class="fas fa-check-circle"></i> No balance remaining.`
  }

  document.getElementById('paymentModal').style.display = 'flex'
}

window.closePaymentModal = function () {
  document.getElementById('paymentModal').style.display = 'none'
  const pmAmount = document.getElementById('pmAmount')
  if (pmAmount) pmAmount.value = ''
}

window.pmSetStatus = function (status) {
  document.querySelectorAll('.pm-status-btn').forEach((btn) => {
    btn.classList.remove('active')
    if (btn.dataset.status === status) btn.classList.add('active')
  })

  const amtRow = document.getElementById('pmAmountRow')
  const index = parseInt(document.getElementById('pmModalIndex').value)
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]

  if (amtRow && inv) {
    const bal = _balanceDue(inv)
    if (status === 'pending' && bal > 0) {
      amtRow.style.display = 'flex'
      document.getElementById('pmAmount').placeholder =
        `Enter amount (max Rs. ${_fmt(bal)})`
      document.getElementById('pmAmount').max = bal
      const hint = document.querySelector('.pm-hint')
      if (hint)
        hint.innerHTML = `<i class="fas fa-info-circle"></i> Current balance: Rs. ${_fmt(bal)}. Enter amount to pay now.`
    } else {
      amtRow.style.display = 'none'
      const hint = document.querySelector('.pm-hint')
      if (hint) {
        if (status === 'paid')
          hint.innerHTML = `<i class="fas fa-check-circle"></i> Invoice will be marked as paid in full.`
        else if (status === 'cancelled')
          hint.innerHTML = `<i class="fas fa-times-circle"></i> Invoice will be cancelled.`
        else
          hint.innerHTML = `<i class="fas fa-info-circle"></i> No changes to payment.`
      }
    }
  }
}

window.savePayment = function () {
  const index = parseInt(document.getElementById('pmModalIndex').value)
  const history = JSON.parse(
    localStorage.getItem('techno_invoice_history') || '[]',
  )
  const inv = history[index]
  if (!inv) {
    showToast('Invoice not found', 'error')
    return
  }

  const activeBtn = document.querySelector('.pm-status-btn.active')
  const newStatus = activeBtn ? activeBtn.dataset.status : 'pending'
  const amtInput = parseFloat(document.getElementById('pmAmount').value) || 0
  const currentPaid = inv.paidAmount || 0
  const totalAmount = inv.total || 0

  if (newStatus === 'paid') {
    inv.status = 'paid'
    inv.paidAmount = totalAmount
    showToast('✅ Invoice marked as Paid in Full!', 'success')
  } else if (newStatus === 'cancelled') {
    inv.status = 'cancelled'
    showToast('Invoice cancelled', 'success')
  } else if (newStatus === 'pending') {
    if (amtInput <= 0) {
      showToast('Please enter a valid payment amount', 'error')
      return
    }
    if (amtInput > totalAmount - currentPaid) {
      showToast(
        `Amount exceeds remaining balance of Rs. ${_fmt(totalAmount - currentPaid)}`,
        'error',
      )
      return
    }
    inv.paidAmount = parseFloat((currentPaid + amtInput).toFixed(2))
    if (inv.paidAmount >= totalAmount - 0.01) {
      inv.status = 'paid'
      inv.paidAmount = totalAmount
      showToast(`✅ Payment recorded! Invoice fully paid.`, 'success')
    } else {
      inv.status = 'pending'
      showToast(
        `⏳ Payment of Rs. ${_fmt(amtInput)} recorded. Remaining: Rs. ${_fmt(totalAmount - inv.paidAmount)}`,
        'success',
      )
    }
  }

  inv.lastPaymentAt = new Date().toISOString()
  history[index] = inv
  localStorage.setItem('techno_invoice_history', JSON.stringify(history))
  closePaymentModal()
  displayHistory()
}

// ─── Delete & Export ──────────────────────────────────────────────────────────
window.deleteFromHistory = function (index) {
  if (confirm('Delete this invoice? This cannot be undone.')) {
    const history = JSON.parse(
      localStorage.getItem('techno_invoice_history') || '[]',
    )
    history.splice(index, 1)
    localStorage.setItem('techno_invoice_history', JSON.stringify(history))
    displayHistory()
    showToast('Invoice deleted')
  }
}

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

  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `TM_History_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  showToast('Exported as CSV!', 'success')
}
