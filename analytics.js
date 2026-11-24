/**
 * Simple Banking System - Analytics & Statement Reporting
 * Handles financial calculations, chart visualizations, and account statement exports.
 */

class AnalyticsService {
    constructor(db) {
        this.db = db;
        this.cashflowChart = null;
        this.categoryChart = null;
    }

    getFinancialSummary(userId) {
        const user = this.db.getUserById(userId);
        if (!user) return { totalInflow: 0, totalOutflow: 0, netSavings: 0, healthScore: 0 };

        const txs = user.transactions || [];
        let totalInflow = 0;
        let totalOutflow = 0;

        txs.forEach(tx => {
            const amt = parseFloat(tx.amount) || 0;
            if (tx.type === 'deposit' || tx.type === 'transfer_in') {
                totalInflow += amt;
            } else if (tx.type === 'withdrawal' || tx.type === 'transfer_out' || tx.type === 'bill_pay') {
                totalOutflow += amt;
            }
        });

        const netSavings = totalInflow - totalOutflow;
        // Health score calculation (ratio of balance + savings)
        let healthScore = 75;
        if (user.balance > 10000) healthScore += 15;
        else if (user.balance < 500) healthScore -= 25;
        if (totalOutflow > totalInflow) healthScore -= 10;
        healthScore = Math.max(20, Math.min(99, healthScore));

        return {
            balance: user.balance,
            totalInflow: parseFloat(totalInflow.toFixed(2)),
            totalOutflow: parseFloat(totalOutflow.toFixed(2)),
            netSavings: parseFloat(netSavings.toFixed(2)),
            healthScore: healthScore
        };
    }

    getCategoryBreakdown(userId) {
        const user = this.db.getUserById(userId);
        if (!user) return {};

        const categories = {};
        const expenseTypes = ['withdrawal', 'transfer_out', 'bill_pay'];

        (user.transactions || []).forEach(tx => {
            if (expenseTypes.includes(tx.type)) {
                const cat = tx.category || 'General';
                categories[cat] = (categories[cat] || 0) + (parseFloat(tx.amount) || 0);
            }
        });

        return categories;
    }

    /**
     * Render or update analytics charts
     */
    renderCharts(userId) {
        const user = this.db.getUserById(userId);
        if (!user) return;

        const summary = this.getFinancialSummary(userId);
        const categories = this.getCategoryBreakdown(userId);

        // Update DOM labels if present
        const inflowEl = document.getElementById('statTotalInflow');
        const outflowEl = document.getElementById('statTotalOutflow');
        const netSavingsEl = document.getElementById('statNetSavings');
        const healthScoreEl = document.getElementById('statHealthScore');

        if (inflowEl) inflowEl.textContent = `$${summary.totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (outflowEl) outflowEl.textContent = `$${summary.totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (netSavingsEl) {
            netSavingsEl.textContent = `$${Math.abs(summary.netSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            netSavingsEl.className = summary.netSavings >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold';
        }
        if (healthScoreEl) healthScoreEl.textContent = `${summary.healthScore}/100`;

        // Render Category Doughnut Chart
        const catCanvas = document.getElementById('categoryPieChart');
        if (catCanvas && window.Chart) {
            const catLabels = Object.keys(categories);
            const catValues = Object.values(categories);

            if (this.categoryChart) {
                this.categoryChart.destroy();
            }

            const colors = [
                '#10b981', '#6366f1', '#f59e0b', '#ef4444', 
                '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'
            ];

            this.categoryChart = new Chart(catCanvas, {
                type: 'doughnut',
                data: {
                    labels: catLabels.length ? catLabels : ['No Expenses Yet'],
                    datasets: [{
                        data: catValues.length ? catValues : [1],
                        backgroundColor: catLabels.length ? colors.slice(0, catLabels.length) : ['#334155'],
                        borderWidth: 2,
                        borderColor: document.body.classList.contains('light-mode') ? '#ffffff' : '#1e293b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: document.body.classList.contains('light-mode') ? '#334155' : '#cbd5e1',
                                boxWidth: 12,
                                padding: 12,
                                font: { size: 11, family: 'Inter, sans-serif' }
                            }
                        }
                    },
                    cutout: '68%'
                }
            });
        }

        // Render Cash Flow Bar Chart
        const flowCanvas = document.getElementById('cashflowBarChart');
        if (flowCanvas && window.Chart) {
            if (this.cashflowChart) {
                this.cashflowChart.destroy();
            }

            // Group recent months or weeks
            this.cashflowChart = new Chart(flowCanvas, {
                type: 'bar',
                data: {
                    labels: ['Aug', 'Sep', 'Oct', 'Nov'],
                    datasets: [
                        {
                            label: 'Income / Inflow',
                            data: [3200, 4100, 3900, summary.totalInflow],
                            backgroundColor: '#10b981',
                            borderRadius: 6
                        },
                        {
                            label: 'Expenses / Outflow',
                            data: [2100, 2450, 2800, summary.totalOutflow],
                            backgroundColor: '#ef4444',
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: document.body.classList.contains('light-mode') ? '#334155' : '#cbd5e1',
                                boxWidth: 12,
                                font: { size: 12, family: 'Inter, sans-serif' }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: document.body.classList.contains('light-mode') ? '#64748b' : '#94a3b8' }
                        },
                        y: {
                            grid: { color: document.body.classList.contains('light-mode') ? '#e2e8f0' : '#334155' },
                            ticks: {
                                color: document.body.classList.contains('light-mode') ? '#64748b' : '#94a3b8',
                                callback: val => `$${val}`
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Export Statement as CSV
     */
    exportStatementCSV(userId) {
        const user = this.db.getUserById(userId);
        if (!user || !user.transactions || !user.transactions.length) {
            alert('No transactions available to export.');
            return;
        }

        const headers = ['Transaction ID', 'Date & Time', 'Type', 'Category', 'Description/Reference', 'Amount ($)', 'Sender', 'Recipient', 'Status'];
        const rows = user.transactions.map(t => [
            `"${t.id}"`,
            `"${new Date(t.date).toLocaleString()}"`,
            `"${t.type}"`,
            `"${t.category || ''}"`,
            `"${(t.reference || '').replace(/"/g, '""')}"`,
            (t.type === 'deposit' || t.type === 'transfer_in' ? `+${t.amount}` : `-${t.amount}`),
            `"${(t.sender || '').replace(/"/g, '""')}"`,
            `"${(t.recipient || t.billerName || '').replace(/"/g, '""')}"`,
            `"${t.status}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `ApexBank_Statement_${user.accountNumber}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Global Analytics instance
window.AnalyticsEngine = new AnalyticsService(window.BankDB);
