/**
 * Simple Banking System - Data & Storage Engine
 * Manages persistent storage using LocalStorage with realistic seed data.
 */

const STORAGE_KEYS = {
    USERS: 'apex_bank_users_v2',
    SESSION: 'apex_bank_session_v2',
    THEME: 'apex_bank_theme_v2'
};

const DEFAULT_USERS = [
    {
        id: 'USR-101',
        accountNumber: '1001248590',
        fullName: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        phone: '+1 (555) 234-5678',
        pin: '1234',
        accountType: 'Savings Account',
        balance: 14250.75,
        currency: '$',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: '2024-01-15T10:30:00Z',
        cards: [
            {
                id: 'CRD-101',
                type: 'Debit',
                scheme: 'Visa',
                cardHolder: 'ALEX MORGAN',
                cardNumber: '4532 8920 1192 8821',
                maskedNumber: '•••• •••• •••• 8821',
                expiry: '09/28',
                cvv: '642',
                isFrozen: false,
                onlineEnabled: true,
                intlEnabled: true,
                dailyLimit: 3000,
                usedToday: 120,
                colorScheme: 'gradient-emerald'
            },
            {
                id: 'CRD-102',
                type: 'Credit (Platinum)',
                scheme: 'Mastercard',
                cardHolder: 'ALEX MORGAN',
                cardNumber: '5412 7701 9931 4402',
                maskedNumber: '•••• •••• •••• 4402',
                expiry: '12/29',
                cvv: '819',
                isFrozen: false,
                onlineEnabled: true,
                intlEnabled: false,
                dailyLimit: 8000,
                usedToday: 450,
                colorScheme: 'gradient-indigo'
            }
        ],
        fixedDeposits: [
            {
                id: 'FD-501',
                amount: 5000,
                tenureMonths: 12,
                interestRate: 7.5,
                startDate: '2024-02-01',
                maturityDate: '2025-02-01',
                maturityAmount: 5375,
                earnedInterest: 281.25,
                status: 'Active'
            }
        ],
        loans: [
            {
                id: 'LN-301',
                title: 'New Vehicle Loan',
                type: 'Car Loan',
                principal: 12000,
                balanceRemaining: 7450,
                interestRate: 6.8,
                tenureMonths: 36,
                monthlyEmi: 369.45,
                status: 'Active',
                nextDueDate: '2024-12-15'
            }
        ],
        transactions: [
            {
                id: 'TXN-9081',
                type: 'deposit',
                category: 'Salary',
                amount: 4500.00,
                sender: 'Apex Technologies Inc',
                recipient: 'Alex Morgan',
                accountNumber: '1001248590',
                date: '2024-11-20T09:15:00Z',
                status: 'Completed',
                reference: 'Payroll Deposit Nov 2024',
                icon: 'fa-building-columns'
            },
            {
                id: 'TXN-9080',
                type: 'transfer_out',
                category: 'Transfer',
                amount: 350.00,
                sender: 'Alex Morgan',
                recipient: 'Sophia Chen',
                recipientAccount: '1001928472',
                date: '2024-11-18T14:40:00Z',
                status: 'Completed',
                reference: 'Dinner bill split',
                icon: 'fa-arrow-up-right-from-square'
            },
            {
                id: 'TXN-9079',
                type: 'bill_pay',
                category: 'Utilities',
                amount: 142.50,
                sender: 'Alex Morgan',
                billerName: 'City Power & Electric',
                billerId: 'ELE-99823',
                date: '2024-11-15T11:20:00Z',
                status: 'Completed',
                reference: 'Electricity bill Oct-Nov',
                icon: 'fa-bolt'
            },
            {
                id: 'TXN-9078',
                type: 'withdrawal',
                category: 'Cash',
                amount: 200.00,
                sender: 'Alex Morgan',
                recipient: 'ATM Withdrawal - Downtown Branch',
                date: '2024-11-12T16:05:00Z',
                status: 'Completed',
                reference: 'ATM Cash Withdrawal',
                icon: 'fa-money-bill-transfer'
            },
            {
                id: 'TXN-9077',
                type: 'deposit',
                category: 'Interest',
                amount: 45.25,
                sender: 'Apex Bank Core System',
                recipient: 'Alex Morgan',
                date: '2024-11-01T00:01:00Z',
                status: 'Completed',
                reference: 'Monthly Savings Interest Credit',
                icon: 'fa-coins'
            },
            {
                id: 'TXN-9076',
                type: 'bill_pay',
                category: 'Internet',
                amount: 79.99,
                sender: 'Alex Morgan',
                billerName: 'Gigabit Fiber Internet',
                billerId: 'INT-33120',
                date: '2024-10-28T10:00:00Z',
                status: 'Completed',
                reference: 'Monthly Fiber Broadband',
                icon: 'fa-wifi'
            }
        ]
    },
    {
        id: 'USR-102',
        accountNumber: '1001928472',
        fullName: 'Sophia Chen',
        email: 'sophia.chen@example.com',
        phone: '+1 (555) 876-5432',
        pin: '1234',
        accountType: 'Checking Account',
        balance: 8420.50,
        currency: '$',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        createdAt: '2024-02-10T08:00:00Z',
        cards: [
            {
                id: 'CRD-201',
                type: 'Debit',
                scheme: 'Mastercard',
                cardHolder: 'SOPHIA CHEN',
                cardNumber: '5241 9081 2240 6719',
                maskedNumber: '•••• •••• •••• 6719',
                expiry: '05/27',
                cvv: '329',
                isFrozen: false,
                onlineEnabled: true,
                intlEnabled: true,
                dailyLimit: 4000,
                usedToday: 0,
                colorScheme: 'gradient-cyan'
            }
        ],
        fixedDeposits: [],
        loans: [],
        transactions: [
            {
                id: 'TXN-8012',
                type: 'transfer_in',
                category: 'Transfer',
                amount: 350.00,
                sender: 'Alex Morgan',
                senderAccount: '1001248590',
                recipient: 'Sophia Chen',
                date: '2024-11-18T14:40:00Z',
                status: 'Completed',
                reference: 'Dinner bill split',
                icon: 'fa-arrow-down-left'
            },
            {
                id: 'TXN-8011',
                type: 'deposit',
                category: 'Salary',
                amount: 3800.00,
                sender: 'Creative Studios LLC',
                recipient: 'Sophia Chen',
                date: '2024-11-15T09:00:00Z',
                status: 'Completed',
                reference: 'November Payroll',
                icon: 'fa-building-columns'
            }
        ]
    },
    {
        id: 'USR-103',
        accountNumber: '1001837194',
        fullName: 'Liam Davis',
        email: 'liam.davis@example.com',
        phone: '+1 (555) 432-1098',
        pin: '1234',
        accountType: 'Business Account',
        balance: 29500.00,
        currency: '$',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        createdAt: '2023-11-20T14:20:00Z',
        cards: [
            {
                id: 'CRD-301',
                type: 'Business Platinum',
                scheme: 'Visa',
                cardHolder: 'LIAM DAVIS',
                cardNumber: '4021 6650 9981 1204',
                maskedNumber: '•••• •••• •••• 1204',
                expiry: '11/29',
                cvv: '750',
                isFrozen: false,
                onlineEnabled: true,
                intlEnabled: true,
                dailyLimit: 15000,
                usedToday: 1200,
                colorScheme: 'gradient-gold'
            }
        ],
        fixedDeposits: [
            {
                id: 'FD-701',
                amount: 15000,
                tenureMonths: 24,
                interestRate: 8.2,
                startDate: '2024-01-10',
                maturityDate: '2026-01-10',
                maturityAmount: 17460,
                earnedInterest: 1025.00,
                status: 'Active'
            }
        ],
        loans: [],
        transactions: [
            {
                id: 'TXN-7041',
                type: 'deposit',
                category: 'Client Payment',
                amount: 8500.00,
                sender: 'Global Logistics Partners',
                recipient: 'Liam Davis',
                date: '2024-11-19T13:10:00Z',
                status: 'Completed',
                reference: 'Invoice #INV-2024-11',
                icon: 'fa-file-invoice-dollar'
            }
        ]
    }
];

class BankDatabase {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            this.seedData();
        }
        // If no active session, default to first user for smooth instant preview
        if (!localStorage.getItem(STORAGE_KEYS.SESSION)) {
            const users = this.getUsers();
            if (users.length > 0) {
                this.setSession(users[0].id);
            }
        }
    }

    seedData() {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }

    resetToDefault() {
        this.seedData();
        const users = this.getUsers();
        if (users.length > 0) {
            this.setSession(users[0].id);
        }
        return true;
    }

    getUsers() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USERS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to read users from localStorage:', e);
            return [];
        }
    }

    saveUsers(users) {
        try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            return true;
        } catch (e) {
            console.error('Failed to save users to localStorage:', e);
            return false;
        }
    }

    getUserById(userId) {
        const users = this.getUsers();
        return users.find(u => u.id === userId) || null;
    }

    getUserByAccount(accountNumber) {
        const users = this.getUsers();
        return users.find(u => u.accountNumber === accountNumber) || null;
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    updateUser(updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            this.saveUsers(users);
            return true;
        }
        return false;
    }

    addUser(userData) {
        const users = this.getUsers();
        users.push(userData);
        this.saveUsers(users);
        return userData;
    }

    // Session Management
    getSession() {
        return localStorage.getItem(STORAGE_KEYS.SESSION);
    }

    setSession(userId) {
        localStorage.setItem(STORAGE_KEYS.SESSION, userId);
    }

    clearSession() {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    getCurrentUser() {
        const userId = this.getSession();
        if (!userId) return null;
        return this.getUserById(userId);
    }

    // Generators
    generateAccountNumber() {
        let accNum;
        const users = this.getUsers();
        do {
            accNum = '100' + Math.floor(1000000 + Math.random() * 9000000);
        } while (users.some(u => u.accountNumber === accNum));
        return accNum;
    }

    generateTxId() {
        return 'TXN-' + Math.floor(1000 + Math.random() * 9000);
    }

    generateCardNumber() {
        const p1 = '4' + Math.floor(100 + Math.random() * 900);
        const p2 = Math.floor(1000 + Math.random() * 9000);
        const p3 = Math.floor(1000 + Math.random() * 9000);
        const p4 = Math.floor(1000 + Math.random() * 9000);
        return `${p1} ${p2} ${p3} ${p4}`;
    }

    generateCVV() {
        return String(Math.floor(100 + Math.random() * 900));
    }
}

// Global database instance
window.BankDB = new BankDatabase();
