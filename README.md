# 📱 Techno Mobile POS System

<div align="center">

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg)
![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg)
![PDF](https://img.shields.io/badge/PDF-Generation-red.svg)

**A Premium Point of Sale (POS) System for Mobile Retail & Repair Services**

[![Report Bug](https://img.shields.io/badge/Report_Bug-🐛-red?style=for-the-badge)](https://github.com/yourusername/techno-mobile-pos/issues)
[![Request Feature](https://img.shields.io/badge/Request_Feature-✨-blue?style=for-the-badge)](https://github.com/yourusername/techno-mobile-pos/issues)
[![Download](https://img.shields.io/badge/Download-Latest-239120?style=for-the-badge)](https://github.com/yourusername/techno-mobile-pos/archive/refs/heads/main.zip)

</div>

---

## 📸 **System Preview**

<div align="center">
  <img src="https://via.placeholder.com/1200x600/0f172a/2563eb?text=Techno+Mobile+POS+System" alt="POS System Preview" width="90%">
  <br>
  <em>Professional POS interface for mobile retail and repair services</em>
</div>

---

## ✨ **Key Features**

### 🎯 **Core Functionality**

| Feature                       | Description                                                |
| ----------------------------- | ---------------------------------------------------------- |
| 🔐 **Secure Login**           | Password-protected access with demo credentials            |
| 💼 **Professional Invoicing** | Save invoices instantly with a clean animated confirmation |
| 📱 **Accessory Management**   | Quick selection of accessories with quantity and price     |
| 📦 **Device & Custom Items**  | Add devices with storage, IMEI, and custom pricing         |
| 💰 **Discount Management**    | Apply discounts with real-time total calculation           |
| 📜 **Invoice History**        | View, search, and manage all past invoices                 |
| 📄 **PDF Export**             | Download beautifully formatted PDF invoices from History   |
| 📊 **Inventory Management**   | Full product catalog management                            |

### 🚀 **Advanced Features**

- ✅ **Real-time Calculations** — Subtotal updates instantly as you add items
- ✅ **Save & Download Workflow** — Save invoices first, download PDF anytime from History
- ✅ **Animated Save Confirmation** — Clean success overlay after saving each invoice
- ✅ **Terms & Conditions** — Customizable T&Cs with checkboxes
- ✅ **Search History** — Search by customer name, phone, or invoice number
- ✅ **Data Persistence** — All data stored locally in browser storage
- ✅ **Print-Ready PDFs** — Professional invoice templates ready for printing
- ✅ **Responsive Design** — Works on desktop, tablet, and mobile devices
- ✅ **Toast Notifications** — User-friendly feedback for all actions
- ✅ **Form Validation** — Phone number validation and input sanitization

---

## 🔄 **Invoice Workflow (v2.1)**

The billing flow has been improved for reliability and a cleaner user experience:

```
Fill Invoice Details
        ↓
Add Accessories / Devices
        ↓
Apply Discount (optional)
        ↓
Click  💾 Save Invoice
        ↓
✅ Success overlay appears
   ├── "View in History"  →  Goes to Invoice History tab
   └── "New Invoice"      →  Starts a fresh invoice
        ↓
Invoice History → Click  📄 Download PDF  →  PDF saved to device
```

> **Why this approach?**  
> Generating a PDF directly from the POS screen can produce inconsistent rendering across browsers. Saving first ensures all invoice data is safely stored, and the PDF is generated on-demand from History — giving you clean, consistent results every time.

---

## 🔐 **Default Login Credentials**

| Field        | Value         |
| ------------ | ------------- |
| **Username** | `DilkaRishan` |
| **Password** | `Dilka789`    |

> ⚠️ **Note**: These credentials are hardcoded for demo purposes. For production use, implement a proper backend authentication system.

---

## 🛠️ **Technologies Used**

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/LocalStorage-FFA500?style=for-the-badge&logo=javascript&logoColor=white)
![FontAwesome](https://img.shields.io/badge/Font_Awesome-528DD7?style=for-the-badge&logo=fontawesome&logoColor=white)

</div>

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (No frameworks!)
- **PDF Generation**: html2pdf.js library
- **Data Storage**: Browser LocalStorage (client-side only)
- **Icons**: Font Awesome 6
- **Fonts**: DM Sans, Space Mono (Google Fonts)

---

## 📦 **Installation**

### **Option 1: Quick Start (Download & Run)**

```bash
# Clone the repository
git clone https://github.com/yourusername/techno-mobile-pos.git

# Navigate to project folder
cd techno-mobile-pos

# Open index.html in your browser (double-click or use command)
# Windows:
start index.html

# Mac:
open index.html

# Linux:
xdg-open index.html
```

### **Option 2: Local Development Server**

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Then open: http://localhost:8000
```

---

## 📁 **Project Structure**

```
techno-mobile-pos/
│
├── index.html       # Main app shell — login, POS, history, inventory tabs
├── style.css        # All styling including responsive and PDF styles
├── script.js        # Core POS logic — saving, recalc, inventory, terms
└── history.js       # Invoice history — view, delete, PDF download
```

---

## 📋 **How to Use**

### 1. Login

Enter the credentials above to access the dashboard.

### 2. Create an Invoice

- Fill in customer name, phone number, and invoice date
- Check the accessories you want to include, adjust quantities as needed
- Add devices or custom items with IMEI/serial numbers
- Select the terms & conditions to apply
- Enter a discount amount if applicable and click **Apply**

### 3. Save the Invoice

Click the green **💾 Save Invoice** button. A success overlay will confirm the save and show the invoice number. Choose to view it in History or start a new invoice.

### 4. Download PDF

Navigate to **Invoice History**, find the saved invoice, and click **📄 Download PDF**. The PDF will be generated and downloaded instantly.

### 5. Manage Inventory

Go to the **Inventory** tab to add, edit, or remove products. Changes sync automatically to the accessories grid on the POS screen.

---

## 🗂️ **File Descriptions**

| File         | Purpose                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `index.html` | App layout, tabs, PDF template, and save-success overlay                |
| `style.css`  | Full styling including the animated save confirmation modal             |
| `script.js`  | POS logic: `saveInvoice()`, `recalc()`, inventory, terms, tab switching |
| `history.js` | `viewInvoice()` for PDF download, `deleteFromHistory()`, stats display  |

---

## 🔄 **Changelog**

### v2.1.0 — Save & Download Workflow

- 🟢 **New**: "Save Invoice" button replaces the direct "Download Invoice" button on the POS screen
- 🟢 **New**: Animated success overlay confirms save with invoice number
- 🟢 **New**: "Download PDF" button now lives in Invoice History for clean, reliable PDF generation
- 🟢 **New**: Save button styled in green to distinguish from download actions
- 🔵 **Improved**: History "View" button relabelled to "Download PDF" for clarity
- 🔵 **Improved**: Invoice form resets immediately after save (no delay waiting for PDF generation)

### v2.0.0 — Initial Release

- Full POS system with login, accessories, devices, and PDF invoicing
- Invoice history with search and stats
- Inventory management with live sync to POS grid
- Customizable terms & conditions
- Responsive sidebar layout

---

## ⚙️ **Configuration**

### Changing Login Credentials

Open `script.js` and find the login function:

```javascript
if (username === 'DilkaRishan' && password === 'Dilka789') {
```

Replace with your preferred username and password.

### Changing Business Name

Search for `Techno Mobile` across all files and replace with your business name. The brand icon `TM` in `index.html` should also be updated.

### Default Inventory

Edit the `defaultInventory` array at the top of `script.js`:

```javascript
const defaultInventory = [
  { n: 'iPhone 20W Power Adapter', p: 6500 },
  { n: 'MagSafe Charger', p: 14500 },
  // add your products here
]
```

### Default Terms & Conditions

Edit the `defaultTerms` array in `script.js`:

```javascript
const defaultTerms = [
  {
    id: 'term1',
    text: 'Genuine products with 2 year warranty',
    selected: true,
  },
  // add your terms here
]
```

---

## 🌐 **Browser Compatibility**

| Browser       | Support |
| ------------- | ------- |
| Chrome 90+    | ✅ Full |
| Firefox 88+   | ✅ Full |
| Edge 90+      | ✅ Full |
| Safari 14+    | ✅ Full |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ✅ Full |

> ⚠️ PDF generation relies on `html2pdf.js`. For best results, use Chrome or Edge when downloading invoices.

---

## 🤝 **Contributing**

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 **License**

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <strong>Techno Mobile POS</strong> &copy; 2026 — Built for mobile retail & repair professionals
</div>
