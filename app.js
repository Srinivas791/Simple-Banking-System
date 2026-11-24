/**
 * Simple Banking System - Main Application Controller
 * Handles Navigation, Event Listeners, Modals, Forms, State Sync, Toasts & Receipts.
 */

class BankingApp {
    constructor() {
        this.db = window.BankDB;
        this.banking = window.BankingEngine;
        this.cards = window.CardService;
        this.analytics = window.AnalyticsEngine;

        this.currentUser = null;
        this.isBalanceHidden = false;
        this.activeCardId = null;
    }

    init() {
        // Theme init
        this.initTheme();

        // Load active user
        this.currentUser = this.db.getCurrentUser();
        if (!this.currentUser) {
            const users = this.db.getUsers();
            if (users.length > 0) {
                this.currentUser = users[0];
                this.db.setSession(this.currentUser.id);
            }
        }

        // Setup DOM events
        this.bindEvents();

        // Render full interface
        this.renderAll();
    }

    /* ==========================================================================
       THEME MANAGEMENT
       ========================================================================== */
    initTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            const icon = document.querySelector('#themeToggleBtn i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem(STORAGE_KEYS.THEME, isLight ? 'light' : 'dark');
        const icon = document.querySelector('#themeToggleBtn i');
        if (icon) {
            if (isLight) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
        // Re-render charts with new theme colors
        if (this.currentUser) {
            this.analytics.renderCharts(this.currentUser.id);
        }
    }

    /* ==========================================================================
       NAVIGATION & TABS
       ========================================================================== */
    switchTab(tabId) {
        // Update sidebar active state
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            if (item.dataset.tab === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Show target pane
        const targetPane = document.getElementById(`${tabId}Tab`);
        if (targetPane) {
            targetPane.classList.add('active');
        }

        // Update Topbar Title
        const titleMap = {
            'dashboard': { title: 'Dashboard', sub: 'Welcome back, here is your financial overview.' },
            'transactions': { title: 'Account Statement', sub: 'Filter, view, and export detailed transaction history.' },
            'transfer': { title: 'Send & Transfer Funds', sub: 'Instant transfers within Apex Bank or external wire transfers.' },
            'bills': { title: 'Utility & Bill Payments', sub: 'Pay electricity, water, internet, and cellular bills with 0 fees.' },
            'cards': { title: 'Virtual Cards Manager', sub: 'View 3D cards, flip for CVV, manage freeze and limits.' },
            'deposits': { title: 'Fixed Deposits (FD)', sub: 'High-yield term deposits with guaranteed returns.' },
            'loans': { title: 'Credit & Loan Facilities', sub: 'Instant loan calculator, flexible tenure, and immediate disbursement.' },
            'analytics': { title: 'Analytics & Insights', sub: 'Visual cash flow charts and monthly spending breakdown.' },
            'settings': { title: 'Account Settings', sub: 'Update personal profile, security PIN, or reset database.' }
        };

        const topbarTitle = document.getElementById('topbarPageTitle');
        const topbarSub = document.getElementById('topbarSubText');
        if (topbarTitle && titleMap[tabId]) {
            topbarTitle.textContent = titleMap[tabId].title;
            topbarSub.textContent = titleMap[tabId].sub;
        }

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');

        // Tab-specific refreshes
        if (tabId === 'transactions') {
            this.renderTransactionsTable();
        } else if (tabId === 'analytics') {
            this.analytics.renderCharts(this.currentUser.id);
        } else if (tabId === 'cards') {
            this.renderCardsTab();
        } else if (tabId === 'deposits') {
            this.renderFixedDeposits();
            this.updateFdPreview();
        } else if (tabId === 'loans') {
            this.renderLoans();
            this.updateLoanCalculations();
        } else if (tabId === 'transfer') {
            this.renderTransferView();
        }
    }

    /* ==========================================================================
       USER SELECTION & SWITCHING
       ========================================================================== */
    populateUserSelector() {
        const select = document.getElementById('userAccountSelect');
        if (!select) return;

        const users = this.db.getUsers();
        select.innerHTML = '';

        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.fullName} (${u.accountType.split(' ')[0]}) - $${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            if (this.currentUser && u.id === this.currentUser.id) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }

    switchUser(userId) {
        const user = this.db.getUserById(userId);
        if (user) {
            this.currentUser = user;
            this.db.setSession(user.id);
            this.renderAll();
            this.showToast('Account Switched', `Logged in as ${user.fullName}`, 'info');
        }
    }

    /* ==========================================================================
       RENDERING LOGIC
       ========================================================================== */
    renderAll() {
        if (!this.currentUser) return;
        this.currentUser = this.db.getUserById(this.currentUser.id); // sync latest

        this.populateUserSelector();
        this.renderSidebarProfile();
        this.renderDashboard();
        this.renderTransactionsTable();
        this.renderCardsTab();
        this.renderFixedDeposits();
        this.renderLoans();
        this.renderSettings();
        this.analytics.renderCharts(this.currentUser.id);
    }

    renderSidebarProfile() {
        const u = this.currentUser;
        const nameEl = document.getElementById('sidebarUserName');
        const accEl = document.getElementById('sidebarUserAcc');
        const avatarEl = document.getElementById('sidebarUserAvatar');
        const countBadge = document.getElementById('sidebarTxCount');

        if (nameEl) nameEl.textContent = u.fullName;
        if (accEl) accEl.textContent = `# ${u.accountNumber}`;
        if (avatarEl) avatarEl.src = u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
        if (countBadge) countBadge.textContent = (u.transactions || []).length;

        // Print header info
        const printDate = document.getElementById('printDate');
        const printName = document.getElementById('printName');
        const printAcc = document.getElementById('printAccNum');
        if (printDate) printDate.textContent = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });
        if (printName) printName.textContent = u.fullName;
        if (printAcc) printAcc.textContent = u.accountNumber;
    }

    renderDashboard() {
        const u = this.currentUser;

        // Hero Balance
        const balEl = document.getElementById('heroBalanceDisplay');
        if (balEl) {
            balEl.textContent = this.isBalanceHidden ? '••••••••••' : `$${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }

        const typeEl = document.getElementById('heroAccountType');
        if (typeEl) typeEl.textContent = u.accountType;

        const numEl = document.getElementById('heroAccountNumber');
        if (numEl) numEl.textContent = u.accountNumber;

        const holderEl = document.getElementById('heroAccountHolder');
        if (holderEl) holderEl.textContent = u.fullName;

        // Metrics
        const summary = this.analytics.getFinancialSummary(u.id);
        const inflowEl = document.getElementById('dashTotalInflow');
        const outflowEl = document.getElementById('dashTotalOutflow');
        const cardCountEl = document.getElementById('dashCardCount');

        if (inflowEl) inflowEl.textContent = `$${summary.totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (outflowEl) outflowEl.textContent = `$${summary.totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (cardCountEl) cardCountEl.textContent = `${(u.cards || []).length} Cards`;

        // Recent 5 Transactions
        const txList = document.getElementById('dashTransactionsList');
        if (txList) {
            txList.innerHTML = '';
            const recent = (u.transactions || []).slice(0, 5);

            if (recent.length === 0) {
                txList.innerHTML = `
                    <div style="text-align:center; padding:30px; color:var(--text-muted);">
                        <i class="fa-solid fa-receipt" style="font-size:2rem; margin-bottom:8px; opacity:0.5;"></i>
                        <p>No transactions yet. Try making a deposit or transfer!</p>
                    </div>
                `;
            } else {
                recent.forEach(tx => {
                    const row = this.createTxRowElement(tx);
                    txList.appendChild(row);
                });
            }
        }

        // Active Card Preview on Dashboard
        const cardPreview = document.getElementById('dashActiveCardPreview');
        if (cardPreview && u.cards && u.cards.length > 0) {
            const firstCard = u.cards[0];
            cardPreview.innerHTML = `
                <div class="virtual-card-perspective" onclick="this.classList.toggle('flipped')" title="Click to flip card">
                    <div class="virtual-card-inner">
                        <div class="card-face ${firstCard.colorScheme}">
                            <div class="card-front-top">
                                <span class="card-bank-name"><i class="fa-solid fa-building-columns"></i> APEX BANK</span>
                                <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase;">${firstCard.type}</span>
                            </div>
                            <div class="card-chip"></div>
                            <div class="card-number-display">${firstCard.cardNumber}</div>
                            <div class="card-front-bottom">
                                <div class="card-holder-col">
                                    <span class="card-label">Card Holder</span>
                                    <span class="card-val">${firstCard.cardHolder}</span>
                                </div>
                                <div class="card-holder-col">
                                    <span class="card-label">Expires</span>
                                    <span class="card-val">${firstCard.expiry}</span>
                                </div>
                                <div class="card-scheme-logo">${firstCard.scheme}</div>
                            </div>
                        </div>
                        <div class="card-face card-back ${firstCard.colorScheme}">
                            <div class="magnetic-strip"></div>
                            <div class="signature-strip-row">
                                <div class="signature-bar"></div>
                                <div class="cvv-box">${firstCard.cvv}</div>
                            </div>
                            <div class="card-back-meta">
                                Authorized Signature • Not Valid Unless Signed • Apex Global Financial Services
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Quick contacts list on dashboard
        const quickContactsList = document.getElementById('quickContactsList');
        if (quickContactsList) {
            quickContactsList.innerHTML = '';
            const otherUsers = this.db.getUsers().filter(user => user.id !== u.id);
            otherUsers.forEach(other => {
                const item = document.createElement('div');
                item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg-surface-elevated); border:1px solid var(--border-color); border-radius:var(--radius-md);';
                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${other.avatar}" style="width:34px; height:34px; border-radius:50%; object-fit:cover;">
                        <div>
                            <div style="font-size:0.85rem; font-weight:700;">${other.fullName}</div>
                            <div style="font-size:0.72rem; color:var(--text-muted);"># ${other.accountNumber}</div>
                        </div>
                    </div>
                    <button class="amount-chip" style="color:var(--primary); border-color:rgba(16,185,129,0.3);">
                        <i class="fa-solid fa-paper-plane"></i> Send
                    </button>
                `;
                item.querySelector('button').addEventListener('click', () => {
                    this.switchTab('transfer');
                    const accInput = document.getElementById('transferRecipientAcc');
                    if (accInput) {
                        accInput.value = other.accountNumber;
                        this.handleRecipientLookup(other.accountNumber);
                    }
                });
                quickContactsList.appendChild(item);
            });
        }
    }

    createTxRowElement(tx) {
        const isPositive = (tx.type === 'deposit' || tx.type === 'transfer_in');
        const sign = isPositive ? '+' : '-';
        const amtClass = isPositive ? 'positive' : 'negative';

        const row = document.createElement('div');
        row.className = 'transaction-row';
        row.innerHTML = `
            <div class="tx-left">
                <div class="tx-icon ${tx.type}">
                    <i class="fa-solid ${tx.icon || 'fa-receipt'}"></i>
                </div>
                <div class="tx-meta">
                    <span class="tx-title">${tx.reference || tx.category || 'Transaction'}</span>
                    <span class="tx-sub">${new Date(tx.date).toLocaleDateString()} • ${tx.sender ? (isPositive ? `From: ${tx.sender}` : `To: ${tx.recipient || tx.billerName || 'External'}`) : tx.category}</span>
                </div>
            </div>
            <div class="tx-right">
                <span class="tx-amount ${amtClass}">${sign}$${parseFloat(tx.amount).toFixed(2)}</span>
                <span class="tx-status-badge completed">${tx.status}</span>
            </div>
        `;

        row.addEventListener('click', () => this.showReceipt(tx));
        return row;
    }

    /* ==========================================================================
       STATEMENT & TRANSACTIONS TABLE
       ========================================================================== */
    renderTransactionsTable() {
        const u = this.currentUser;
        if (!u) return;

        const tbody = document.getElementById('fullTransactionsBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        const searchVal = (document.getElementById('txSearchInput')?.value || '').toLowerCase().trim();
        const typeFilter = document.getElementById('txTypeFilter')?.value || 'ALL';
        const sortFilter = document.getElementById('txSortFilter')?.value || 'NEWEST';

        let txs = [...(u.transactions || [])];

        // Search Filter
        if (searchVal) {
            txs = txs.filter(t => 
                (t.reference && t.reference.toLowerCase().includes(searchVal)) ||
                (t.id && t.id.toLowerCase().includes(searchVal)) ||
                (t.sender && t.sender.toLowerCase().includes(searchVal)) ||
                (t.recipient && t.recipient.toLowerCase().includes(searchVal)) ||
                (t.category && t.category.toLowerCase().includes(searchVal))
            );
        }

        // Type Filter
        if (typeFilter !== 'ALL') {
            if (typeFilter === 'transfer') {
                txs = txs.filter(t => t.type === 'transfer_in' || t.type === 'transfer_out');
            } else {
                txs = txs.filter(t => t.type === typeFilter);
            }
        }

        // Sorting
        if (sortFilter === 'NEWEST') {
            txs.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortFilter === 'OLDEST') {
            txs.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortFilter === 'HIGH') {
            txs.sort((a, b) => b.amount - a.amount);
        } else if (sortFilter === 'LOW') {
            txs.sort((a, b) => a.amount - b.amount);
        }

        if (txs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:36px; color:var(--text-muted);">
                        No transactions found matching your filter criteria.
                    </td>
                </tr>
            `;
            return;
        }

        txs.forEach(t => {
            const isPositive = (t.type === 'deposit' || t.type === 'transfer_in');
            const sign = isPositive ? '+' : '-';
            const color = isPositive ? 'var(--primary)' : 'var(--accent-rose)';

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                <td><code>${t.id}</code></td>
                <td>${new Date(t.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td><span class="amount-chip">${t.category || t.type}</span></td>
                <td><strong>${t.reference || 'Bank Operation'}</strong></td>
                <td>${isPositive ? (t.sender || 'Apex Core') : (t.recipient || t.billerName || 'External')}</td>
                <td><span class="tx-status-badge completed">${t.status}</span></td>
                <td style="text-align:right; font-weight:800; color:${color}; font-size:0.95rem;">
                    ${sign}$${parseFloat(t.amount).toFixed(2)}
                </td>
            `;
            tr.addEventListener('click', () => this.showReceipt(t));
            tbody.appendChild(tr);
        });
    }

    /* ==========================================================================
       TRANSFER TAB LOGIC
       ========================================================================== */
    renderTransferView() {
        const u = this.currentUser;
        if (!u) return;

        const balEl = document.getElementById('transferAvailableBalance');
        if (balEl) balEl.textContent = `$${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // Populate quick recipients
        const quickContainer = document.getElementById('transferQuickAccountsList');
        if (quickContainer) {
            quickContainer.innerHTML = '';
            const otherUsers = this.db.getUsers().filter(user => user.id !== u.id);

            otherUsers.forEach(other => {
                const btn = document.createElement('div');
                btn.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--bg-surface-elevated); border:1px solid var(--border-color); border-radius:var(--radius-md); cursor:pointer; transition:var(--transition);';
                btn.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${other.avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                        <div>
                            <div style="font-weight:700; font-size:0.9rem;">${other.fullName}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">Acc: ${other.accountNumber} • ${other.accountType.split(' ')[0]}</div>
                        </div>
                    </div>
                    <span style="font-size:0.8rem; font-weight:700; color:var(--primary);">Autofill <i class="fa-solid fa-arrow-right"></i></span>
                `;
                btn.addEventListener('click', () => {
                    const accInput = document.getElementById('transferRecipientAcc');
                    if (accInput) {
                        accInput.value = other.accountNumber;
                        this.handleRecipientLookup(other.accountNumber);
                    }
                });
                quickContainer.appendChild(btn);
            });
        }
    }

    handleRecipientLookup(accNum) {
        const resultEl = document.getElementById('recipientLookupResult');
        if (!resultEl) return;

        const clean = (accNum || '').trim();
        if (clean.length < 8) {
            resultEl.innerHTML = '';
            return;
        }

        if (clean === this.currentUser.accountNumber) {
            resultEl.innerHTML = '<span style="color:var(--accent-rose);"><i class="fa-solid fa-circle-xmark"></i> Cannot transfer to your own account.</span>';
            return;
        }

        const found = this.db.getUserByAccount(clean);
        if (found) {
            resultEl.innerHTML = `<span style="color:var(--primary);"><i class="fa-solid fa-circle-check"></i> Recipient Found: <strong>${found.fullName}</strong> (${found.accountType})</span>`;
        } else {
            resultEl.innerHTML = '<span style="color:var(--accent-amber);"><i class="fa-solid fa-triangle-exclamation"></i> Account not found in Apex Bank.</span>';
        }
    }

    /* ==========================================================================
       VIRTUAL CARDS TAB LOGIC
       ========================================================================== */
    renderCardsTab() {
        const u = this.currentUser;
        if (!u) return;

        const container = document.getElementById('cardsListContainer');
        if (!container) return;

        container.innerHTML = '';
        const cards = u.cards || [];

        if (cards.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fa-solid fa-credit-card" style="font-size:3rem; margin-bottom:12px; opacity:0.4;"></i>
                    <h3>No Virtual Cards Issued Yet</h3>
                    <p>Click "Issue New Virtual Card" above to create an instant card for online spending.</p>
                </div>
            `;
            document.getElementById('cardControlsPanel').style.display = 'none';
            return;
        }

        document.getElementById('cardControlsPanel').style.display = 'block';

        // Select first card if none selected
        if (!this.activeCardId || !cards.some(c => c.id === this.activeCardId)) {
            this.activeCardId = cards[0].id;
        }

        cards.forEach(card => {
            const isSelected = card.id === this.activeCardId;
            const cardWrapper = document.createElement('div');
            cardWrapper.style.position = 'relative';

            cardWrapper.innerHTML = `
                <div class="virtual-card-perspective ${card.isFrozen ? 'card-frozen-overlay' : ''}" id="cardEl_${card.id}" title="Click to flip and inspect CVV">
                    <div class="virtual-card-inner">
                        <!-- Front Face -->
                        <div class="card-face ${card.colorScheme}">
                            <div class="card-front-top">
                                <span class="card-bank-name"><i class="fa-solid fa-building-columns"></i> APEX BANK</span>
                                <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase;">${card.type}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div class="card-chip"></div>
                                ${card.isFrozen ? '<span style="background:var(--accent-rose); color:#fff; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-lock"></i> FROZEN</span>' : ''}
                            </div>
                            <div class="card-number-display">${card.cardNumber}</div>
                            <div class="card-front-bottom">
                                <div class="card-holder-col">
                                    <span class="card-label">Card Holder</span>
                                    <span class="card-val">${card.cardHolder}</span>
                                </div>
                                <div class="card-holder-col">
                                    <span class="card-label">Expires</span>
                                    <span class="card-val">${card.expiry}</span>
                                </div>
                                <div class="card-scheme-logo">${card.scheme}</div>
                            </div>
                        </div>

                        <!-- Back Face -->
                        <div class="card-face card-back ${card.colorScheme}">
                            <div class="magnetic-strip"></div>
                            <div class="signature-strip-row">
                                <div class="signature-bar"></div>
                                <div class="cvv-box">${card.cvv}</div>
                            </div>
                            <div class="card-back-meta">
                                3-Digit Security Code (CVV): <strong>${card.cvv}</strong><br>
                                Issued by Apex Global Financial System. For customer support call 1-800-APEX-BANK.
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                    <span style="font-size:0.85rem; font-weight:700; color:var(--text-secondary);">${card.type} (•••• ${card.cardNumber.slice(-4)})</span>
                    <button class="amount-chip select-card-btn" style="${isSelected ? 'background:var(--primary); color:#064E3B; font-weight:700;' : ''}">
                        ${isSelected ? '<i class="fa-solid fa-circle-check"></i> Managing' : 'Select'}
                    </button>
                </div>
            `;

            // Card Flip Interaction
            const cardPerspective = cardWrapper.querySelector('.virtual-card-perspective');
            cardPerspective.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    cardPerspective.classList.toggle('flipped');
                }
            });

            // Select Card for Controls
            cardWrapper.querySelector('.select-card-btn').addEventListener('click', () => {
                this.activeCardId = card.id;
                this.renderCardsTab();
            });

            container.appendChild(cardWrapper);
        });

        // Update active card control controls panel
        this.updateCardControlsUI();
    }

    updateCardControlsUI() {
        const u = this.currentUser;
        if (!u) return;

        const card = (u.cards || []).find(c => c.id === this.activeCardId);
        if (!card) return;

        const label = document.getElementById('selectedCardLabel');
        if (label) label.textContent = `${card.scheme} ${card.type} (•••• ${card.cardNumber.slice(-4)})`;

        const freezeToggle = document.getElementById('cardFreezeToggle');
        if (freezeToggle) freezeToggle.checked = card.isFrozen;

        const onlineToggle = document.getElementById('cardOnlineToggle');
        if (onlineToggle) onlineToggle.checked = card.onlineEnabled;

        const intlToggle = document.getElementById('cardIntlToggle');
        if (intlToggle) intlToggle.checked = card.intlEnabled;

        const limitSlider = document.getElementById('cardLimitSlider');
        const limitDisplay = document.getElementById('cardLimitDisplay');
        if (limitSlider && limitDisplay) {
            limitSlider.value = card.dailyLimit || 3000;
            limitDisplay.textContent = `$${(card.dailyLimit || 3000).toLocaleString()}`;
        }
    }

    /* ==========================================================================
       FIXED DEPOSITS TAB LOGIC
       ========================================================================== */
    renderFixedDeposits() {
        const u = this.currentUser;
        if (!u) return;

        const listEl = document.getElementById('activeFdList');
        if (!listEl) return;

        listEl.innerHTML = '';
        const fds = u.fixedDeposits || [];

        if (fds.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center; padding:30px; color:var(--text-muted);">
                    <i class="fa-solid fa-vault" style="font-size:2.5rem; margin-bottom:12px; opacity:0.4;"></i>
                    <p>No active Fixed Deposits. Open one on the left to earn up to 8.8% guaranteed yield!</p>
                </div>
            `;
            return;
        }

        fds.forEach(fd => {
            const item = document.createElement('div');
            item.style.cssText = 'background:var(--bg-surface-elevated); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px;';
            const isActive = fd.status === 'Active';

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div>
                        <h4 style="font-size:1rem; font-weight:800; color:var(--text-primary);">${fd.id} • ${fd.tenureMonths} Months Term</h4>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Matures on: ${fd.maturityDate}</span>
                    </div>
                    <span class="tx-status-badge ${isActive ? 'completed' : ''}" style="${!isActive ? 'background:rgba(244,63,94,0.15); color:var(--accent-rose);' : ''}">
                        ${fd.status}
                    </span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px; text-align:center; background:rgba(0,0,0,0.15); padding:10px; border-radius:8px;">
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">Principal</div>
                        <div style="font-weight:700;">$${fd.amount.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">Interest Rate</div>
                        <div style="font-weight:700; color:var(--primary);">${fd.interestRate}% APR</div>
                    </div>
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">Maturity Value</div>
                        <div style="font-weight:800; color:var(--text-primary);">$${fd.maturityAmount.toLocaleString()}</div>
                    </div>
                </div>
                ${isActive ? `
                    <button class="btn-secondary btn-close-fd" style="width:100%; font-size:0.8rem; padding:8px; color:var(--accent-rose); border-color:rgba(244,63,94,0.3);">
                        <i class="fa-solid fa-lock-open"></i> Premature Liquidation / Close FD
                    </button>
                ` : ''}
            `;

            if (isActive) {
                item.querySelector('.btn-close-fd').addEventListener('click', () => {
                    if (confirm(`Are you sure you want to liquidate Fixed Deposit ${fd.id}? Principal of $${fd.amount.toFixed(2)} will be credited back immediately.`)) {
                        const res = this.banking.liquidateFixedDeposit(u.id, fd.id);
                        if (res.success) {
                            this.showToast('Fixed Deposit Closed', res.message, 'success');
                            this.renderAll();
                        } else {
                            this.showToast('Error', res.message, 'error');
                        }
                    }
                });
            }

            listEl.appendChild(item);
        });
    }

    updateFdPreview() {
        const amtInput = document.getElementById('fdAmountInput');
        const tenureSelect = document.getElementById('fdTenureSelect');
        const previewInterest = document.getElementById('fdPreviewInterest');
        const previewMaturity = document.getElementById('fdPreviewMaturity');

        if (!amtInput || !tenureSelect || !previewInterest || !previewMaturity) return;

        const amount = parseFloat(amtInput.value) || 0;
        const tenure = parseInt(tenureSelect.value, 10) || 12;

        let rate = 5.0;
        if (tenure === 6) rate = 6.2;
        else if (tenure === 12) rate = 7.5;
        else if (tenure === 24) rate = 8.2;
        else if (tenure === 36) rate = 8.8;

        const interest = parseFloat((amount * (rate / 100) * (tenure / 12)).toFixed(2));
        const maturity = parseFloat((amount + interest).toFixed(2));

        previewInterest.textContent = `$${interest.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        previewMaturity.textContent = `$${maturity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    /* ==========================================================================
       LOANS & EMI CALCULATOR TAB LOGIC
       ========================================================================== */
    renderLoans() {
        const u = this.currentUser;
        if (!u) return;

        const listEl = document.getElementById('activeLoansList');
        if (!listEl) return;

        listEl.innerHTML = '';
        const loans = u.loans || [];

        if (loans.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center; padding:30px; color:var(--text-muted);">
                    <i class="fa-solid fa-landmark" style="font-size:2.5rem; margin-bottom:12px; opacity:0.4;"></i>
                    <p>No active loans on this account. Calculate EMI and apply for instant approval on the left!</p>
                </div>
            `;
            return;
        }

        loans.forEach(loan => {
            const item = document.createElement('div');
            item.style.cssText = 'background:var(--bg-surface-elevated); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px;';
            const isActive = loan.status === 'Active';

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div>
                        <h4 style="font-size:1rem; font-weight:800; color:var(--text-primary);">${loan.title}</h4>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Facility #${loan.id} • Next Due: ${loan.nextDueDate || 'Monthly'}</span>
                    </div>
                    <span class="tx-status-badge ${isActive ? 'completed' : ''}" style="${!isActive ? 'background:rgba(16,185,129,0.15); color:var(--primary);' : ''}">
                        ${loan.status}
                    </span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px; text-align:center; background:rgba(0,0,0,0.15); padding:10px; border-radius:8px;">
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">Principal</div>
                        <div style="font-weight:700;">$${loan.principal.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">Monthly EMI</div>
                        <div style="font-weight:700; color:var(--accent-blue);">$${loan.monthlyEmi.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">Remaining</div>
                        <div style="font-weight:800; color:var(--accent-rose);">$${loan.balanceRemaining.toLocaleString()}</div>
                    </div>
                </div>
                ${isActive ? `
                    <button class="btn-primary btn-repay-loan" style="width:100%; font-size:0.85rem; padding:8px; justify-content:center;">
                        <i class="fa-solid fa-money-bill-wave"></i> Pay Monthly EMI ($${loan.monthlyEmi.toFixed(2)})
                    </button>
                ` : ''}
            `;

            if (isActive) {
                item.querySelector('.btn-repay-loan').addEventListener('click', () => {
                    const pin = prompt(`Enter 4-digit Security PIN to authorize EMI payment of $${loan.monthlyEmi.toFixed(2)}:`);
                    if (pin !== null) {
                        const res = this.banking.repayLoan(u.id, loan.id, loan.monthlyEmi, pin);
                        if (res.success) {
                            this.showToast('EMI Paid', res.message, 'success');
                            this.renderAll();
                        } else {
                            this.showToast('Repayment Failed', res.message, 'error');
                        }
                    }
                });
            }

            listEl.appendChild(item);
        });
    }

    updateLoanCalculations() {
        const amtSlider = document.getElementById('loanAmountSlider');
        const tenureSlider = document.getElementById('loanTenureSlider');
        const typeSelect = document.getElementById('loanTypeSelect');

        if (!amtSlider || !tenureSlider) return;

        const amount = parseFloat(amtSlider.value);
        const tenure = parseInt(tenureSlider.value, 10);
        const loanType = typeSelect ? typeSelect.value : 'Personal Loan';

        const amtValLabel = document.getElementById('loanAmountSliderVal');
        const tenureValLabel = document.getElementById('loanTenureSliderVal');

        if (amtValLabel) amtValLabel.textContent = `$${amount.toLocaleString()}`;
        if (tenureValLabel) tenureValLabel.textContent = `${tenure} Months`;

        const rates = {
            'Personal Loan': 8.5,
            'Car Loan': 6.8,
            'Home Improvement Loan': 7.2,
            'Education Loan': 5.5
        };
        const rate = rates[loanType] || 7.5;

        const emiData = this.banking.calculateEmi(amount, rate, tenure);

        const emiLabel = document.getElementById('loanMonthlyEmi');
        const interestLabel = document.getElementById('loanTotalInterest');
        const payableLabel = document.getElementById('loanTotalPayable');

        if (emiLabel) emiLabel.textContent = `$${emiData.emi.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (interestLabel) interestLabel.textContent = `$${emiData.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (payableLabel) payableLabel.textContent = `$${emiData.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    /* ==========================================================================
       SETTINGS TAB LOGIC
       ========================================================================== */
    renderSettings() {
        const u = this.currentUser;
        if (!u) return;

        const nameInput = document.getElementById('settingsFullName');
        const emailInput = document.getElementById('settingsEmail');
        const phoneInput = document.getElementById('settingsPhone');
        const pinInput = document.getElementById('settingsPin');

        if (nameInput) nameInput.value = u.fullName || '';
        if (emailInput) emailInput.value = u.email || '';
        if (phoneInput) phoneInput.value = u.phone || '';
        if (pinInput) pinInput.value = u.pin || '';
    }

    /* ==========================================================================
       MODALS, RECEIPTS, & TOASTS
       ========================================================================== */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }

    openBillPayModal(type, provider, defaultId) {
        document.getElementById('billPayType').value = type;
        document.getElementById('billPayProvider').value = provider;
        document.getElementById('billPayConsumerId').value = defaultId;
        document.getElementById('billPayAmount').value = '';
        document.getElementById('billPayPin').value = '';
        document.getElementById('billPayModalTitle').innerHTML = `<i class="fa-solid fa-receipt"></i> Pay ${type} Bill`;
        this.openModal('billPayModal');
    }

    showReceipt(tx) {
        const modalBody = document.getElementById('receiptModalBody');
        if (!modalBody) return;

        const isPositive = (tx.type === 'deposit' || tx.type === 'transfer_in');
        const color = isPositive ? 'var(--primary)' : 'var(--accent-rose)';
        const sign = isPositive ? '+' : '-';

        modalBody.innerHTML = `
            <div style="text-align:center; padding:10px 0 20px; border-bottom:1px dashed var(--border-color);">
                <div style="width:54px; height:54px; border-radius:50%; background:rgba(16,185,129,0.15); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 12px;">
                    <i class="fa-solid fa-check"></i>
                </div>
                <h4 style="font-size:1.1rem; font-weight:800;">Transaction Successful</h4>
                <div style="font-size:2rem; font-weight:800; color:${color}; margin:6px 0;">
                    ${sign}$${parseFloat(tx.amount).toFixed(2)}
                </div>
                <p style="font-size:0.8rem; color:var(--text-muted);">${tx.reference || tx.category || 'Apex Bank Transfer'}</p>
            </div>

            <div style="padding:16px 0; display:flex; flex-direction:column; gap:10px; font-size:0.88rem;">
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Reference ID:</span>
                    <strong style="font-family:monospace;">${tx.id}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Date & Time:</span>
                    <span>${new Date(tx.date).toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Transaction Type:</span>
                    <span style="text-transform:capitalize;">${tx.type.replace('_', ' ')}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Category:</span>
                    <span>${tx.category || 'General'}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Sender:</span>
                    <span>${tx.sender || 'Apex Core Engine'}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Recipient / Provider:</span>
                    <span>${tx.recipient || tx.billerName || 'N/A'}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Status:</span>
                    <span class="tx-status-badge completed">${tx.status}</span>
                </div>
            </div>

            <div style="background:var(--bg-surface-elevated); padding:10px; border-radius:8px; font-size:0.75rem; color:var(--text-muted); text-align:center;">
                Official Digital Receipt • Apex Global Bank Core Ledger Verified
            </div>
        `;

        this.openModal('receiptModal');
    }

    showToast(title, message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconMap = {
            'success': 'fa-circle-check',
            'error': 'fa-circle-exclamation',
            'info': 'fa-circle-info'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${iconMap[type] || 'fa-bell'}"></i>
            </div>
            <div class="toast-content">
                <h5>${title}</h5>
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    triggerConfetti() {
        if (window.confetti) {
            window.confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    /* ==========================================================================
       EVENT BINDINGS
       ========================================================================== */
    bindEvents() {
        // Sidebar navigation clicks
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                if (tab) this.switchTab(tab);
            });
        });

        // Mobile menu toggle
        const mobToggle = document.getElementById('mobileMenuToggle');
        if (mobToggle) {
            mobToggle.addEventListener('click', () => {
                document.getElementById('sidebar')?.classList.toggle('mobile-open');
            });
        }

        // Theme Switcher
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // User Account Dropdown Selector
        const userSelect = document.getElementById('userAccountSelect');
        if (userSelect) {
            userSelect.addEventListener('change', (e) => {
                this.switchUser(e.target.value);
            });
        }

        // Sidebar user mini card -> open settings
        const userCard = document.getElementById('sidebarUserCard');
        if (userCard) {
            userCard.addEventListener('click', () => this.switchTab('settings'));
        }

        // Toggle Balance Eye Button
        const toggleEye = document.getElementById('toggleBalanceVisibility');
        if (toggleEye) {
            toggleEye.addEventListener('click', () => {
                this.isBalanceHidden = !this.isBalanceHidden;
                const eyeIcon = document.getElementById('eyeIcon');
                if (eyeIcon) {
                    eyeIcon.className = this.isBalanceHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
                }
                const balEl = document.getElementById('heroBalanceDisplay');
                if (balEl && this.currentUser) {
                    balEl.textContent = this.isBalanceHidden ? '••••••••••' : `$${this.currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                }
            });
        }

        // Copy Account Number button
        const copyBtn = document.getElementById('copyAccNumberBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    navigator.clipboard.writeText(this.currentUser.accountNumber).then(() => {
                        this.showToast('Copied!', `Account number ${this.currentUser.accountNumber} copied to clipboard.`, 'info');
                    });
                }
            });
        }

        // Dashboard quick action buttons
        document.getElementById('btnQuickDeposit')?.addEventListener('click', () => this.openModal('depositModal'));
        document.getElementById('btnQuickWithdraw')?.addEventListener('click', () => {
            const availEl = document.getElementById('withdrawAvailBalance');
            if (availEl && this.currentUser) {
                availEl.textContent = `$${this.currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            }
            this.openModal('withdrawModal');
        });
        document.getElementById('btnQuickTransfer')?.addEventListener('click', () => this.switchTab('transfer'));
        document.getElementById('btnQuickBills')?.addEventListener('click', () => this.switchTab('bills'));
        document.getElementById('dashViewAllTx')?.addEventListener('click', () => this.switchTab('transactions'));
        document.getElementById('dashManageCards')?.addEventListener('click', () => this.switchTab('cards'));

        // Modal Close Buttons
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });

        // Open New Account Modal
        document.getElementById('openNewAccountBtn')?.addEventListener('click', () => this.openModal('newAccountModal'));
        document.getElementById('btnIssueNewCard')?.addEventListener('click', () => this.openModal('issueCardModal'));

        // Forms Handling
        this.bindForms();

        // Transaction Search & Filter inputs
        document.getElementById('txSearchInput')?.addEventListener('input', () => this.renderTransactionsTable());
        document.getElementById('txTypeFilter')?.addEventListener('change', () => this.renderTransactionsTable());
        document.getElementById('txSortFilter')?.addEventListener('change', () => this.renderTransactionsTable());

        // CSV & Print
        document.getElementById('btnExportCSV')?.addEventListener('click', () => {
            if (this.currentUser) this.analytics.exportStatementCSV(this.currentUser.id);
        });
        document.getElementById('btnPrintStatement')?.addEventListener('click', () => window.print());

        // Card Controls Change Listeners
        const freezeToggle = document.getElementById('cardFreezeToggle');
        if (freezeToggle) {
            freezeToggle.addEventListener('change', () => {
                if (this.currentUser && this.activeCardId) {
                    const res = this.cards.toggleFreeze(this.currentUser.id, this.activeCardId);
                    this.showToast('Card Security', res.message, res.isFrozen ? 'info' : 'success');
                    this.renderCardsTab();
                }
            });
        }

        const onlineToggle = document.getElementById('cardOnlineToggle');
        if (onlineToggle) {
            onlineToggle.addEventListener('change', () => {
                if (this.currentUser && this.activeCardId) {
                    const res = this.cards.toggleOnline(this.currentUser.id, this.activeCardId);
                    this.showToast('Online Payments', res.message, 'info');
                }
            });
        }

        const intlToggle = document.getElementById('cardIntlToggle');
        if (intlToggle) {
            intlToggle.addEventListener('change', () => {
                if (this.currentUser && this.activeCardId) {
                    const res = this.cards.toggleInternational(this.currentUser.id, this.activeCardId);
                    this.showToast('International Usage', res.message, 'info');
                }
            });
        }

        const limitSlider = document.getElementById('cardLimitSlider');
        if (limitSlider) {
            limitSlider.addEventListener('input', (e) => {
                document.getElementById('cardLimitDisplay').textContent = `$${parseInt(e.target.value).toLocaleString()}`;
            });
            limitSlider.addEventListener('change', (e) => {
                if (this.currentUser && this.activeCardId) {
                    const res = this.cards.updateDailyLimit(this.currentUser.id, this.activeCardId, e.target.value);
                    this.showToast('Limit Updated', res.message, 'success');
                }
            });
        }

        // Live calculation inputs
        document.getElementById('fdAmountInput')?.addEventListener('input', () => this.updateFdPreview());
        document.getElementById('fdTenureSelect')?.addEventListener('change', () => this.updateFdPreview());

        document.getElementById('loanAmountSlider')?.addEventListener('input', () => this.updateLoanCalculations());
        document.getElementById('loanTenureSlider')?.addEventListener('input', () => this.updateLoanCalculations());
        document.getElementById('loanTypeSelect')?.addEventListener('change', () => this.updateLoanCalculations());

        // Transfer Mode Toggle (Internal vs External)
        const radioInternal = document.getElementById('radioInternal');
        const radioExternal = document.getElementById('radioExternal');
        if (radioInternal && radioExternal) {
            radioInternal.addEventListener('change', () => {
                document.getElementById('fieldInternalAcc').style.display = 'block';
                document.getElementById('externalBankFields').style.display = 'none';
            });
            radioExternal.addEventListener('change', () => {
                document.getElementById('fieldInternalAcc').style.display = 'none';
                document.getElementById('externalBankFields').style.display = 'block';
            });
        }

        // Transfer Recipient Account lookup on type
        document.getElementById('transferRecipientAcc')?.addEventListener('input', (e) => {
            this.handleRecipientLookup(e.target.value);
        });

        // Reset Database Button
        document.getElementById('btnResetDatabase')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the bank database? All changes will be restored to default demo data.')) {
                this.db.resetToDefault();
                this.currentUser = this.db.getCurrentUser();
                this.renderAll();
                this.showToast('System Reset', 'Database successfully restored to factory demo state.', 'success');
            }
        });
    }

    /* ==========================================================================
       FORM SUBMISSION LOGIC
       ========================================================================== */
    bindForms() {
        // 1. DEPOSIT FORM
        document.getElementById('depositForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const source = document.getElementById('depositSource').value;
            const category = document.getElementById('depositCategory').value;
            const amount = document.getElementById('depositAmount').value;
            const reference = document.getElementById('depositReference').value;

            const res = this.banking.deposit(this.currentUser.id, amount, category, reference, source);
            if (res.success) {
                this.closeAllModals();
                this.triggerConfetti();
                this.showToast('Deposit Complete', res.message, 'success');
                this.renderAll();
                this.showReceipt(res.transaction);
                document.getElementById('depositForm').reset();
            } else {
                this.showToast('Deposit Failed', res.message, 'error');
            }
        });

        // 2. WITHDRAW FORM
        document.getElementById('withdrawForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const method = document.getElementById('withdrawMethod').value;
            const amount = document.getElementById('withdrawAmount').value;
            const pin = document.getElementById('withdrawPin').value;

            const res = this.banking.withdraw(this.currentUser.id, amount, 'Cash', method, pin);
            if (res.success) {
                this.closeAllModals();
                this.showToast('Withdrawal Complete', res.message, 'success');
                this.renderAll();
                this.showReceipt(res.transaction);
                document.getElementById('withdrawForm').reset();
            } else {
                this.showToast('Withdrawal Failed', res.message, 'error');
            }
        });

        // 3. TRANSFER FORM
        document.getElementById('transferMoneyForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const isExternal = document.getElementById('radioExternal').checked;
            const amount = document.getElementById('transferAmount').value;
            const reference = document.getElementById('transferReference').value;
            const pin = document.getElementById('transferPin').value;

            let transferParams = {
                senderId: this.currentUser.id,
                amount: amount,
                reference: reference,
                pin: pin,
                isExternal: isExternal
            };

            if (isExternal) {
                transferParams.recipientAccount = 'EXT-WIRE-' + Math.floor(100000 + Math.random() * 900000);
                transferParams.externalBankName = document.getElementById('externalBankName').value;
                transferParams.externalRecipientName = document.getElementById('externalRecipientName').value;
            } else {
                transferParams.recipientAccount = document.getElementById('transferRecipientAcc').value;
            }

            const res = this.banking.transfer(transferParams);
            if (res.success) {
                this.triggerConfetti();
                this.showToast('Transfer Successful', res.message, 'success');
                this.renderAll();
                this.showReceipt(res.transaction);
                document.getElementById('transferMoneyForm').reset();
                document.getElementById('recipientLookupResult').innerHTML = '';
            } else {
                this.showToast('Transfer Failed', res.message, 'error');
            }
        });

        // 4. BILL PAY FORM
        document.getElementById('billPayForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const billType = document.getElementById('billPayType').value;
            const provider = document.getElementById('billPayProvider').value;
            const consumerId = document.getElementById('billPayConsumerId').value;
            const amount = document.getElementById('billPayAmount').value;
            const pin = document.getElementById('billPayPin').value;

            const res = this.banking.payBill(this.currentUser.id, {
                billType: billType,
                billerName: provider,
                billerId: consumerId,
                amount: amount,
                pin: pin,
                reference: `${billType} Bill #${consumerId}`
            });

            if (res.success) {
                this.closeAllModals();
                this.showToast('Bill Paid', res.message, 'success');
                this.renderAll();
                this.showReceipt(res.transaction);
                document.getElementById('billPayForm').reset();
            } else {
                this.showToast('Payment Failed', res.message, 'error');
            }
        });

        // 5. OPEN FIXED DEPOSIT FORM
        document.getElementById('openFdForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = document.getElementById('fdAmountInput').value;
            const tenure = document.getElementById('fdTenureSelect').value;
            const pin = document.getElementById('fdPinInput').value;

            const res = this.banking.openFixedDeposit(this.currentUser.id, {
                amount: amount,
                tenureMonths: tenure,
                pin: pin
            });

            if (res.success) {
                this.triggerConfetti();
                this.showToast('Fixed Deposit Created', res.message, 'success');
                this.renderAll();
                document.getElementById('openFdForm').reset();
                this.updateFdPreview();
            } else {
                this.showToast('FD Creation Failed', res.message, 'error');
            }
        });

        // 6. APPLY LOAN FORM
        document.getElementById('applyLoanForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const loanType = document.getElementById('loanTypeSelect').value;
            const amount = document.getElementById('loanAmountSlider').value;
            const tenure = document.getElementById('loanTenureSlider').value;
            const pin = document.getElementById('loanPinInput').value;

            const res = this.banking.applyLoan(this.currentUser.id, {
                loanType: loanType,
                amount: amount,
                tenureMonths: tenure,
                pin: pin
            });

            if (res.success) {
                this.triggerConfetti();
                this.showToast('Loan Disbursed', res.message, 'success');
                this.renderAll();
                document.getElementById('applyLoanForm').reset();
                this.updateLoanCalculations();
            } else {
                this.showToast('Application Failed', res.message, 'error');
            }
        });

        // 7. OPEN NEW ACCOUNT FORM
        document.getElementById('newAccountForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('newAccFullName').value;
            const email = document.getElementById('newAccEmail').value;
            const phone = document.getElementById('newAccPhone').value;
            const accountType = document.getElementById('newAccType').value;
            const deposit = parseFloat(document.getElementById('newAccDeposit').value);
            const pin = document.getElementById('newAccPin').value;

            if (pin.length !== 4) {
                this.showToast('Validation Error', 'PIN must be exactly 4 digits.', 'error');
                return;
            }

            const newAccNum = this.db.generateAccountNumber();
            const newId = 'USR-' + Math.floor(200 + Math.random() * 800);

            const newUser = {
                id: newId,
                accountNumber: newAccNum,
                fullName: fullName,
                email: email,
                phone: phone,
                pin: pin,
                accountType: accountType,
                balance: deposit,
                currency: '$',
                status: 'Active',
                avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
                createdAt: new Date().toISOString(),
                cards: [
                    {
                        id: 'CRD-' + Math.floor(100 + Math.random() * 900),
                        type: 'Debit',
                        scheme: 'Visa',
                        cardHolder: fullName.toUpperCase(),
                        cardNumber: this.db.generateCardNumber(),
                        maskedNumber: '•••• •••• •••• 9912',
                        expiry: '11/29',
                        cvv: this.db.generateCVV(),
                        isFrozen: false,
                        onlineEnabled: true,
                        intlEnabled: true,
                        dailyLimit: 3000,
                        usedToday: 0,
                        colorScheme: 'gradient-emerald'
                    }
                ],
                fixedDeposits: [],
                loans: [],
                transactions: [
                    {
                        id: this.db.generateTxId(),
                        type: 'deposit',
                        category: 'Initial Deposit',
                        amount: deposit,
                        sender: 'Apex Account Opening Desk',
                        recipient: fullName,
                        date: new Date().toISOString(),
                        status: 'Completed',
                        reference: 'Opening Account Initial Credit',
                        icon: 'fa-building-columns'
                    }
                ]
            };

            this.db.addUser(newUser);
            this.closeAllModals();
            this.switchUser(newId);
            this.triggerConfetti();
            this.showToast('Account Created!', `Welcome to Apex Bank, ${fullName}! Your Account Number is ${newAccNum}.`, 'success');
            document.getElementById('newAccountForm').reset();
        });

        // 8. ISSUE CARD FORM
        document.getElementById('issueCardForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const cardType = document.getElementById('newCardType').value;
            const scheme = document.getElementById('newCardScheme').value;
            const theme = document.getElementById('newCardTheme').value;

            const res = this.cards.issueNewCard(this.currentUser.id, {
                cardType: cardType,
                scheme: scheme,
                colorScheme: theme
            });

            if (res.success) {
                this.closeAllModals();
                this.triggerConfetti();
                this.showToast('Card Issued', res.message, 'success');
                this.activeCardId = res.card.id;
                this.renderAll();
                document.getElementById('issueCardForm').reset();
            } else {
                this.showToast('Card Issue Failed', res.message, 'error');
            }
        });

        // 9. PROFILE SETTINGS FORM
        document.getElementById('profileSettingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('settingsFullName').value;
            const email = document.getElementById('settingsEmail').value;
            const phone = document.getElementById('settingsPhone').value;
            const pin = document.getElementById('settingsPin').value;

            if (pin.length !== 4) {
                this.showToast('Error', 'PIN must be exactly 4 digits.', 'error');
                return;
            }

            this.currentUser.fullName = name;
            this.currentUser.email = email;
            this.currentUser.phone = phone;
            this.currentUser.pin = pin;

            // Also update cardholder names on virtual cards
            (this.currentUser.cards || []).forEach(c => {
                c.cardHolder = name.toUpperCase();
            });

            this.db.updateUser(this.currentUser);
            this.renderAll();
            this.showToast('Profile Updated', 'Your profile details and security PIN were saved successfully.', 'success');
        });
    }
}

// Instantiate and launch App on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    window.App = new BankingApp();
    window.App.init();
});
