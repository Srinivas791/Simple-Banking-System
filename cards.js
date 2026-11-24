/**
 * Simple Banking System - Virtual Card Management
 * Manages virtual debit/credit cards, security toggles, limits and ordering new cards.
 */

class CardService {
    constructor(db) {
        this.db = db;
    }

    getCards(userId) {
        const user = this.db.getUserById(userId);
        return user ? (user.cards || []) : [];
    }

    getCardById(userId, cardId) {
        const cards = this.getCards(userId);
        return cards.find(c => c.id === cardId) || null;
    }

    toggleFreeze(userId, cardId) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'User not found' };

        const card = (user.cards || []).find(c => c.id === cardId);
        if (!card) return { success: false, message: 'Card not found' };

        card.isFrozen = !card.isFrozen;
        this.db.updateUser(user);

        return {
            success: true,
            isFrozen: card.isFrozen,
            message: card.isFrozen ? 'Card has been locked and frozen for security.' : 'Card has been unlocked and is ready for use.'
        };
    }

    toggleOnline(userId, cardId) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'User not found' };

        const card = (user.cards || []).find(c => c.id === cardId);
        if (!card) return { success: false, message: 'Card not found' };

        card.onlineEnabled = !card.onlineEnabled;
        this.db.updateUser(user);

        return {
            success: true,
            onlineEnabled: card.onlineEnabled,
            message: card.onlineEnabled ? 'Online transactions enabled.' : 'Online transactions disabled.'
        };
    }

    toggleInternational(userId, cardId) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'User not found' };

        const card = (user.cards || []).find(c => c.id === cardId);
        if (!card) return { success: false, message: 'Card not found' };

        card.intlEnabled = !card.intlEnabled;
        this.db.updateUser(user);

        return {
            success: true,
            intlEnabled: card.intlEnabled,
            message: card.intlEnabled ? 'International usage enabled.' : 'International usage disabled.'
        };
    }

    updateDailyLimit(userId, cardId, limit) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'User not found' };

        const card = (user.cards || []).find(c => c.id === cardId);
        if (!card) return { success: false, message: 'Card not found' };

        const numLimit = parseFloat(limit);
        if (isNaN(numLimit) || numLimit < 100 || numLimit > 25000) {
            return { success: false, message: 'Daily limit must be between $100 and $25,000.' };
        }

        card.dailyLimit = numLimit;
        this.db.updateUser(user);

        return {
            success: true,
            dailyLimit: numLimit,
            message: `Daily spending limit updated to $${numLimit.toLocaleString()}.`
        };
    }

    issueNewCard(userId, { cardType = 'Debit', scheme = 'Visa', colorScheme = 'gradient-indigo' }) {
        const user = this.db.getUserById(userId);
        if (!user) return { success: false, message: 'User not found' };

        if (!user.cards) user.cards = [];
        if (user.cards.length >= 5) {
            return { success: false, message: 'Maximum virtual card limit (5) reached for this account.' };
        }

        const rawNumber = this.db.generateCardNumber();
        const last4 = rawNumber.split(' ')[3];
        const now = new Date();
        const expMonth = String(now.getMonth() + 1).padStart(2, '0');
        const expYear = String(now.getFullYear() + 4).slice(-2);

        const newCard = {
            id: 'CRD-' + Math.floor(100 + Math.random() * 900),
            type: cardType,
            scheme: scheme,
            cardHolder: user.fullName.toUpperCase(),
            cardNumber: rawNumber,
            maskedNumber: `•••• •••• •••• ${last4}`,
            expiry: `${expMonth}/${expYear}`,
            cvv: this.db.generateCVV(),
            isFrozen: false,
            onlineEnabled: true,
            intlEnabled: true,
            dailyLimit: 3000,
            usedToday: 0,
            colorScheme: colorScheme
        };

        user.cards.push(newCard);
        this.db.updateUser(user);

        return {
            success: true,
            card: newCard,
            message: `New ${scheme} ${cardType} Card issued successfully!`
        };
    }
}

// Global Card Service instance
window.CardService = new CardService(window.BankDB);
