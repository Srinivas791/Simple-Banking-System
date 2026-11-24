# 🏦 Apex Global Bank - Simple Banking System

A modern, responsive, and full-featured **Simple Banking System Website** crafted with clean HTML5, CSS3, and modern JavaScript. All functions, properties, calculations, and account state management work out of the box with zero external server dependencies or build steps.

---

## 🚀 Quick Start

1. Simply double-click **`index.html`** or right-click and choose **"Open with"** in your favorite browser (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).
2. Everything runs locally in your browser using persistent `localStorage` database management.

---

## 🔑 Pre-Seeded Demo Accounts

To make testing instantaneous, 3 demo user profiles are pre-loaded:

| Account Holder | Account Number | Account Type | Initial Balance | PIN |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Morgan** | `1001248590` | Savings Account | \$14,250.75 | `1234` |
| **Sophia Chen** | `1001928472` | Checking Account | \$8,420.50 | `1234` |
| **Liam Davis** | `1001837194` | Business Account | \$29,500.00 | `1234` |

> 💡 **Tip:** Use the **User Dropdown** in the top navigation bar to seamlessly switch between accounts and test live money transfers between them!

---

## 🌟 Key Functions & Properties

### 1. Account Opening & Management
- **Open New Bank Account**: Register with Full Name, Email, Phone, Account Type (Savings, Checking, Business), Initial Deposit, and 4-digit Security PIN. Auto-generates a unique 10-digit account number.
- **Switch Account**: 1-click switching between accounts via topbar dropdown.
- **Balance Masking**: Click the eye icon next to the balance to hide/unhide sensitive balance amounts.
- **Profile Settings**: Update personal contact information and change security PIN.
- **Factory Reset**: Option in Settings to restore initial seed database anytime.

### 2. Money Operations
- **Deposit Funds**:
  - Deposit via Wire, Cash Deposit Machine (CDM), Checks, or External Debit Cards.
  - Choose categories (Salary, Investment, Business, General).
  - Quick amount selector chips ($100, $500, $1,000, $5,000).
  - Instant balance credit and digital transaction receipt generation.
- **Withdraw Cash**:
  - Cash withdrawal via ATM or Branch Cashier.
  - Security check: Requires 4-digit PIN verification.
  - Balance validation: Blocks overdrafts or negative amounts.
- **Send & Transfer Money**:
  - **Internal Transfers**: Transfer directly to another Apex Bank member by account number. Real-time lookup displays recipient name before sending. Debits the sender and **instantly credits the recipient's balance and ledger**!
  - **External Wire**: Send funds to other financial institutions.
  - Quick transfer shortcuts for frequent contacts.
  - Celebration confetti effect upon successful transactions.
- **Bill Payments**:
  - Instant bill settlement for Electricity, Water, High-Speed Internet, and Mobile Recharge.
  - Automatic debit, receipt generation, and categorized ledger entries.

### 3. Virtual Cards & Security
- **3D Interactive Flip Cards**:
  - Click on any card to flip 180° in 3D perspective to reveal the magnetic strip and 3-digit CVV.
  - Metallic EMV chip, contactless emblem, cardholder name, and expiration dates.
- **Card Security Controls**:
  - **Freeze / Lock**: Toggle card freeze to prevent unauthorized charges.
  - **Online Transactions**: Toggle e-commerce payments on or off.
  - **International Usage**: Toggle overseas and foreign currency transactions.
  - **Daily Spending Limit Slider**: Adjust limit smoothly between \$100 and \$10,000.
- **Issue New Cards**: Issue virtual debit or titanium credit cards in multiple color themes (Emerald Jade, Deep Indigo, Cyber Cyan, Royal Gold).

### 4. Term Deposits & Credit Facilities
- **Fixed Deposits (FD)**:
  - Choose tenures: 6 Months (6.2% APR), 12 Months (7.5% APR), 24 Months (8.2% APR), or 36 Months (8.8% APR).
  - Live interactive interest and maturity amount preview.
  - Premature liquidation option with immediate return of principal.
- **Loan EMI Calculator & Disbursal**:
  - Interactive sliders for Loan Principal (\$1,000 – \$50,000) and Tenure (6 – 60 months).
  - Real-time monthly EMI, total interest, and total payable calculations.
  - Instant loan disbursal directly credited into the user's available balance upon PIN approval.
  - Loan repayment / EMI installment payment tracking.

### 5. Statements, Analytics & Exports
- **Comprehensive Ledger**:
  - Live search by description, transaction reference, ID, sender, or recipient.
  - Filter by category / type (Deposits, Withdrawals, Transfers, Bills).
  - Sort by Newest, Oldest, Highest Amount, or Lowest Amount.
- **Official Print / PDF Statement**:
  - Click **"Print Statement"** for a print-optimized, branded bank statement layout with bank header and watermark.
- **CSV Export**:
  - Export full statement to spreadsheet CSV with a single click.
- **Financial Analytics**:
  - Cash flow chart: Inflow vs. Outflow trend comparison.
  - Expense categorization doughnut chart.
  - Financial Health Score and Net Savings metric.

### 6. Design & Experience
- **Theme**: Dark fintech theme (default) and Light mode toggle.
- **Responsive**: Fully responsive design optimized for mobile phones, tablets, laptops, and wide desktops.
- **Notification System**: Toast alerts with automatic timeout and distinct color-coded icons.

---

## 📂 Project Architecture

```
Simple banking System/
│
├── index.html          # Main application structure, layouts & dialogs
├── README.md           # Documentation & user manual
│
├── css/
│   └── styles.css      # Modern fintech styling, 3D flip card, responsive rules
│
└── js/
    ├── data.js         # LocalStorage persistence & mock database seed
    ├── banking.js      # Core banking operations (Deposit, Withdraw, Transfer, Bills, FD, Loan)
    ├── cards.js        # Card management & security toggles
    ├── analytics.js    # Financial analytics & statement CSV exporter
    └── app.js          # App lifecycle, event bindings, UI rendering & toasts
```

---

## 🛡️ Security Note
This website demonstrates client-side banking simulation concepts. For production use, authentication, secrets, and monetary transactions must always be processed on secured server environments with cryptographic authentication.
