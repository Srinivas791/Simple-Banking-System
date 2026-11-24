/**
 * Simple Banking System - Core Banking Engine
 * Handles Deposits, Withdrawals, Transfers, Bill Payments, Fixed Deposits & Loans.
 */

class BankingService {
    constructor(db) {
        this.db = db;
    }

    /**
     * Validate user transaction PIN
     */
    verifyPin(user, pin) {
        if (!user) return { success: false, message: 'User not found' };
        if (!pin || pin.trim() !== String(user.pin).trim()) {
            return { success: false, message: 'Invalid 4-digit Security PIN. Please try again.' };
        }
        return { success: true };
    }

    /**
     * Deposit money into account
     */
    deposit(userId, amount, category = 'Deposit', reference = 'Manual Deposit', source = 'Bank Transfer') {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'Account not found.' };

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return { success: false, message: 'Please enter a valid positive deposit amount.' };
        }

        if (numAmount < 5) {
            return { success: false, message: 'Minimum deposit amount is $5.00.' };
        }

        if (numAmount > 100000) {
            return { success: false, message: 'Single deposit limit exceeded (Maximum $100,000.00).' };
        }

        user.balance = parseFloat((user.balance + numAmount).toFixed(2));

        const iconMap = {
            'Salary': 'fa-building-columns',
            'Cash': 'fa-money-bill-1-wave',
            'Business': 'fa-briefcase',
            'Investment': 'fa-chart-line',
            'Refund': 'fa-rotate-left',
            'Deposit': 'fa-circle-arrow-down'
        };

        const tx = {
            id: this.db.generateTxId(),
            type: 'deposit',
            category: category,
            amount: numAmount,
            sender: source,
            recipient: user.fullName,
            accountNumber: user.accountNumber,
            date: new Date().toISOString(),
            status: 'Completed',
            reference: reference || 'Account Funds Deposit',
            icon: iconMap[category] || 'fa-circle-arrow-down'
        };

        user.transactions.unshift(tx);
        this.db.updateUser(user);

        return {
            success: true,
            message: `Successfully deposited $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}!`,
            newBalance: user.balance,
            transaction: tx
        };
    }

    /**
     * Withdraw money from account
     */
    withdraw(userId, amount, category = 'Cash', reference = 'ATM Withdrawal', pin) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'Account not found.' };

        const pinCheck = this.verifyPin(user, pin);
        if (!pinCheck.success) return pinCheck;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return { success: false, message: 'Please enter a valid positive withdrawal amount.' };
        }

        if (numAmount < 10) {
            return { success: false, message: 'Minimum withdrawal amount is $10.00.' };
        }

        if (numAmount > user.balance) {
            return { 
                success: false, 
                message: `Insufficient funds. Your available balance is $${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.` 
            };
        }

        user.balance = parseFloat((user.balance - numAmount).toFixed(2));

        const tx = {
            id: this.db.generateTxId(),
            type: 'withdrawal',
            category: category,
            amount: numAmount,
            sender: user.fullName,
            recipient: 'Cash Withdrawal / ATM',
            accountNumber: user.accountNumber,
            date: new Date().toISOString(),
            status: 'Completed',
            reference: reference || 'ATM Cash Withdrawal',
            icon: 'fa-money-bill-transfer'
        };

        user.transactions.unshift(tx);
        this.db.updateUser(user);

        return {
            success: true,
            message: `Successfully withdrawn $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}!`,
            newBalance: user.balance,
            transaction: tx
        };
    }

    /**
     * Fund Transfer (Internal to Bank user or External Transfer)
     */
    transfer({
        senderId, 
        recipientAccount, 
        amount, 
        reference = '', 
        pin, 
        isExternal = false, 
        externalBankName = '', 
        externalRecipientName = ''
    }) {
        const sender = this.db.getUserById(senderId);
        if (!sender) return { success: false, message: 'Sender account not found.' };

        const pinCheck = this.verifyPin(sender, pin);
        if (!pinCheck.success) return pinCheck;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return { success: false, message: 'Please enter a valid transfer amount.' };
        }

        if (numAmount < 1) {
            return { success: false, message: 'Minimum transfer amount is $1.00.' };
        }

        if (numAmount > sender.balance) {
            return {
                success: false,
                message: `Insufficient funds. Available balance: $${sender.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
            };
        }

        const txId = this.db.generateTxId();
        const dateIso = new Date().toISOString();

        if (isExternal) {
            if (!externalRecipientName || !externalRecipientName.trim()) {
                return { success: false, message: 'Please provide recipient full name for external transfer.' };
            }
            if (!externalBankName || !externalBankName.trim()) {
                return { success: false, message: 'Please specify the recipient bank name.' };
            }

            // Debit sender
            sender.balance = parseFloat((sender.balance - numAmount).toFixed(2));
            const senderTx = {
                id: txId,
                type: 'transfer_out',
                category: 'External Transfer',
                amount: numAmount,
                sender: sender.fullName,
                recipient: externalRecipientName.trim(),
                recipientAccount: recipientAccount.trim(),
                externalBank: externalBankName.trim(),
                date: dateIso,
                status: 'Completed',
                reference: reference || `External Wire to ${externalBankName}`,
                icon: 'fa-arrow-up-right-from-square'
            };

            sender.transactions.unshift(senderTx);
            this.db.updateUser(sender);

            return {
                success: true,
                message: `Successfully transferred $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${externalRecipientName}!`,
                transaction: senderTx,
                newBalance: sender.balance
            };
        }

        // Internal Transfer
        const cleanAcc = recipientAccount.trim();
        if (cleanAcc === sender.accountNumber) {
            return { success: false, message: 'Cannot transfer funds to your own account number.' };
        }

        const recipient = this.db.getUserByAccount(cleanAcc);
        if (!recipient) {
            return { 
                success: false, 
                message: `Recipient account number "${cleanAcc}" does not exist in Apex Bank directory.` 
            };
        }

        // Debit Sender
        sender.balance = parseFloat((sender.balance - numAmount).toFixed(2));
        const senderTx = {
            id: txId,
            type: 'transfer_out',
            category: 'Direct Transfer',
            amount: numAmount,
            sender: sender.fullName,
            recipient: recipient.fullName,
            recipientAccount: recipient.accountNumber,
            date: dateIso,
            status: 'Completed',
            reference: reference || `Payment to ${recipient.fullName}`,
            icon: 'fa-arrow-up-right-from-square'
        };
        sender.transactions.unshift(senderTx);
        this.db.updateUser(sender);

        // Credit Recipient immediately
        recipient.balance = parseFloat((recipient.balance + numAmount).toFixed(2));
        const recipientTx = {
            id: txId,
            type: 'transfer_in',
            category: 'Direct Transfer',
            amount: numAmount,
            sender: sender.fullName,
            senderAccount: sender.accountNumber,
            recipient: recipient.fullName,
            date: dateIso,
            status: 'Completed',
            reference: reference || `Payment from ${sender.fullName}`,
            icon: 'fa-arrow-down-left'
        };
        recipient.transactions.unshift(recipientTx);
        this.db.updateUser(recipient);

        return {
            success: true,
            message: `Successfully sent $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${recipient.fullName}!`,
            transaction: senderTx,
            recipientName: recipient.fullName,
            newBalance: sender.balance
        };
    }

    /**
     * Pay utility or service bill
     */
    payBill(userId, { billType, billerName, billerId, amount, pin, reference }) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'Account not found.' };

        const pinCheck = this.verifyPin(user, pin);
        if (!pinCheck.success) return pinCheck;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return { success: false, message: 'Please enter a valid bill amount.' };
        }

        if (numAmount > user.balance) {
            return { success: false, message: 'Insufficient balance to pay this bill.' };
        }

        user.balance = parseFloat((user.balance - numAmount).toFixed(2));

        const iconMap = {
            'Electricity': 'fa-bolt',
            'Water': 'fa-faucet-drip',
            'Internet': 'fa-wifi',
            'Mobile': 'fa-mobile-screen-button',
            'CreditCard': 'fa-credit-card',
            'Insurance': 'fa-shield-halved'
        };

        const tx = {
            id: this.db.generateTxId(),
            type: 'bill_pay',
            category: billType,
            amount: numAmount,
            sender: user.fullName,
            billerName: billerName || `${billType} Provider`,
            billerId: billerId || 'BIL-' + Math.floor(10000 + Math.random() * 90000),
            date: new Date().toISOString(),
            status: 'Completed',
            reference: reference || `${billType} Bill Settlement`,
            icon: iconMap[billType] || 'fa-receipt'
        };

        user.transactions.unshift(tx);
        this.db.updateUser(user);

        return {
            success: true,
            message: `Bill of $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} paid successfully to ${tx.billerName}!`,
            transaction: tx,
            newBalance: user.balance
        };
    }

    /**
     * Fixed Deposit (FD)
     */
    openFixedDeposit(userId, { amount, tenureMonths, pin }) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'Account not found.' };

        const pinCheck = this.verifyPin(user, pin);
        if (!pinCheck.success) return pinCheck;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 100) {
            return { success: false, message: 'Minimum Fixed Deposit amount is $100.00.' };
        }

        if (numAmount > user.balance) {
            return { success: false, message: 'Insufficient balance to create Fixed Deposit.' };
        }

        const tenure = parseInt(tenureMonths, 10);
        let rate = 5.0;
        if (tenure === 6) rate = 6.2;
        else if (tenure === 12) rate = 7.5;
        else if (tenure === 24) rate = 8.2;
        else if (tenure === 36) rate = 8.8;

        const totalInterest = parseFloat((numAmount * (rate / 100) * (tenure / 12)).toFixed(2));
        const maturityAmount = parseFloat((numAmount + totalInterest).toFixed(2));

        const startDate = new Date();
        const maturityDate = new Date();
        maturityDate.setMonth(maturityDate.getMonth() + tenure);

        // Deduct from liquid balance
        user.balance = parseFloat((user.balance - numAmount).toFixed(2));

        const fdId = 'FD-' + Math.floor(100 + Math.random() * 900);
        const newFd = {
            id: fdId,
            amount: numAmount,
            tenureMonths: tenure,
            interestRate: rate,
            startDate: startDate.toISOString().split('T')[0],
            maturityDate: maturityDate.toISOString().split('T')[0],
            maturityAmount: maturityAmount,
            earnedInterest: totalInterest,
            status: 'Active'
        };

        if (!user.fixedDeposits) user.fixedDeposits = [];
        user.fixedDeposits.unshift(newFd);

        // Record transaction
        const tx = {
            id: this.db.generateTxId(),
            type: 'fd_created',
            category: 'Investment',
            amount: numAmount,
            sender: user.fullName,
            recipient: `Fixed Deposit (#${fdId})`,
            date: new Date().toISOString(),
            status: 'Completed',
            reference: `Opened ${tenure}M FD @ ${rate}% APR`,
            icon: 'fa-vault'
        };
        user.transactions.unshift(tx);
        this.db.updateUser(user);

        return {
            success: true,
            message: `Fixed Deposit of $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} created successfully!`,
            fixedDeposit: newFd,
            newBalance: user.balance
        };
    }

    /**
     * Early liquidation / closure of Fixed Deposit
     */
    liquidateFixedDeposit(userId, fdId) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'Account not found.' };

        const fdIndex = (user.fixedDeposits || []).findIndex(f => f.id === fdId && f.status === 'Active');
        if (fdIndex === -1) {
            return { success: false, message: 'Active Fixed Deposit not found.' };
        }

        const fd = user.fixedDeposits[fdIndex];
        // 98% principal returned if liquidated early, or full amount
        const refundAmount = fd.amount;
        user.balance = parseFloat((user.balance + refundAmount).toFixed(2));
        fd.status = 'Liquidated';

        const tx = {
            id: this.db.generateTxId(),
            type: 'deposit',
            category: 'Investment Liquidation',
            amount: refundAmount,
            sender: `Fixed Deposit (#${fd.id})`,
            recipient: user.fullName,
            date: new Date().toISOString(),
            status: 'Completed',
            reference: `FD Liquidation Payout`,
            icon: 'fa-piggy-bank'
        };

        user.transactions.unshift(tx);
        this.db.updateUser(user);

        return {
            success: true,
            message: `Fixed Deposit ${fd.id} closed. $${refundAmount.toFixed(2)} credited back to balance.`,
            newBalance: user.balance
        };
    }

    /**
     * Loan EMI Calculation
     */
    calculateEmi(principal, annualRate, tenureMonths) {
        const p = parseFloat(principal);
        const r = (parseFloat(annualRate) / 12) / 100;
        const n = parseInt(tenureMonths, 10);

        if (p <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 };

        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - p;

        return {
            emi: parseFloat(emi.toFixed(2)),
            totalInterest: parseFloat(totalInterest.toFixed(2)),
            totalPayment: parseFloat(totalPayment.toFixed(2))
        };
    }

    /**
     * Apply for loan with instant simulated underwriting & credit
     */
    applyLoan(userId, { loanType, amount, tenureMonths, pin }) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'Account not found.' };

        const pinCheck = this.verifyPin(user, pin);
        if (!pinCheck.success) return pinCheck;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 500) {
            return { success: false, message: 'Minimum loan amount is $500.00.' };
        }

        if (numAmount > 50000) {
            return { success: false, message: 'Maximum instant personal loan amount is $50,000.00.' };
        }

        const rates = {
            'Personal Loan': 8.5,
            'Car Loan': 6.8,
            'Home Improvement Loan': 7.2,
            'Education Loan': 5.5
        };
        const interestRate = rates[loanType] || 7.5;
        const tenure = parseInt(tenureMonths, 10);
        const emiCalc = this.calculateEmi(numAmount, interestRate, tenure);

        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const loanId = 'LN-' + Math.floor(100 + Math.random() * 900);
        const newLoan = {
            id: loanId,
            title: `${loanType} Facility`,
            type: loanType,
            principal: numAmount,
            balanceRemaining: numAmount,
            interestRate: interestRate,
            tenureMonths: tenure,
            monthlyEmi: emiCalc.emi,
            status: 'Active',
            disbursedDate: new Date().toISOString().split('T')[0],
            nextDueDate: nextMonth.toISOString().split('T')[0]
        };

        if (!user.loans) user.loans = [];
        user.loans.unshift(newLoan);

        // Disburse loan funds immediately into user's account balance
        user.balance = parseFloat((user.balance + numAmount).toFixed(2));

        const tx = {
            id: this.db.generateTxId(),
            type: 'deposit',
            category: 'Loan Disbursement',
            amount: numAmount,
            sender: `Apex Credit Services (#${loanId})`,
            recipient: user.fullName,
            date: new Date().toISOString(),
            status: 'Completed',
            reference: `Instant Loan Approval & Disbursal`,
            icon: 'fa-hand-holding-dollar'
        };

        user.transactions.unshift(tx);
        this.db.updateUser(user);

        return {
            success: true,
            message: `Congratulations! Your ${loanType} of $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been approved and credited!`,
            loan: newLoan,
            newBalance: user.balance
        };
    }

    /**
     * Repay loan installment
     */
    repayLoan(userId, loanId, repaymentAmount, pin) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'Account not found.' };

        const pinCheck = this.verifyPin(user, pin);
        if (!pinCheck.success) return pinCheck;

        const loan = (user.loans || []).find(l => l.id === loanId && l.status === 'Active');
        if (!loan) return { success: false, message: 'Active loan not found.' };

        const amount = parseFloat(repaymentAmount);
        if (isNaN(amount) || amount <= 0) {
            return { success: false, message: 'Please enter a valid repayment amount.' };
        }

        if (amount > user.balance) {
            return { success: false, message: 'Insufficient balance to repay loan.' };
        }

        const payAmount = Math.min(amount, loan.balanceRemaining);
        user.balance = parseFloat((user.balance - payAmount).toFixed(2));
        loan.balanceRemaining = parseFloat((loan.balanceRemaining - payAmount).toFixed(2));

        if (loan.balanceRemaining <= 0) {
            loan.status = 'Paid Off';
        }

        const tx = {
            id: this.db.generateTxId(),
            type: 'withdrawal',
            category: 'Loan Repayment',
            amount: payAmount,
            sender: user.fullName,
            recipient: `Apex Credit Services (${loan.id})`,
            date: new Date().toISOString(),
            status: 'Completed',
            reference: `EMI / Principal Repayment`,
            icon: 'fa-handshake'
        };

        user.transactions.unshift(tx);
        this.db.updateUser(user);

        return {
            success: true,
            message: `Paid $${payAmount.toFixed(2)} towards ${loan.title}. Remaining balance: $${loan.balanceRemaining.toFixed(2)}`,
            loan: loan,
            newBalance: user.balance
        };
    }
}

// Global banking engine instance
window.BankingEngine = new BankingService(window.BankDB);
