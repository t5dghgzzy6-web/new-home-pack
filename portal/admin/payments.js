// Admin Payment History Dashboard

document.addEventListener('DOMContentLoaded', () => {
    loadPaymentHistory();
    calculateSummaries();
});

function loadPaymentHistory() {
    const receipts = JSON.parse(localStorage.getItem('nhp_payment_receipts') || '[]');
    
    if (receipts.length === 0) {
        document.getElementById('paymentsTableContainer').innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">No Payments Yet</h3>
                <p style="font-size: 0.875rem;">Payment receipts will appear here once buyers complete reservations.</p>
            </div>
        `;
        return;
    }
    
    renderPaymentsTable(receipts);
}

function renderPaymentsTable(receipts) {
    const container = document.getElementById('paymentsTableContainer');
    
    const html = `
        <div style="overflow-x: auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Receipt ID</th>
                        <th>Date & Time</th>
                        <th>Customer</th>
                        <th>Property</th>
                        <th>Method</th>
                        <th>Net Amount</th>
                        <th>VAT (20%)</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${receipts.map(receipt => `
                        <tr>
                            <td>
                                <div style="font-family: monospace; font-weight: 600; color: var(--primary-red);">
                                    ${receipt.receiptId}
                                </div>
                                ${receipt.paymentReference ? `
                                    <div style="font-size: 0.75rem; color: var(--gray-600); margin-top: 0.25rem;">
                                        Ref: ${receipt.paymentReference}
                                    </div>
                                ` : ''}
                            </td>
                            <td>
                                <div>${new Date(receipt.timestamp).toLocaleDateString('en-GB')}</div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">
                                    ${new Date(receipt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </td>
                            <td>
                                <div style="font-weight: 600;">${receipt.customer.name}</div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">${receipt.customer.email}</div>
                            </td>
                            <td>
                                <div style="font-weight: 600;">${receipt.property.plot}</div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">${receipt.property.development}</div>
                            </td>
                            <td>
                                ${receipt.paymentMethod === 'card' 
                                    ? '<span style="display: inline-flex; align-items: center; gap: 0.25rem;"><span>💳</span> Card</span>' 
                                    : '<span style="display: inline-flex; align-items: center; gap: 0.25rem;"><span>🏦</span> Bank Transfer</span>'}
                            </td>
                            <td style="font-weight: 600;">£${receipt.financial.netAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            <td style="color: var(--gray-600);">£${receipt.financial.vatAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            <td style="font-weight: 700; font-size: 1.125rem;">£${receipt.financial.grossAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            <td>${getStatusBadge(receipt.status)}</td>
                            <td>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button onclick="viewReceipt('${receipt.receiptId}')" class="btn btn-secondary btn-small" title="View Receipt">
                                        👁️
                                    </button>
                                    <button onclick="downloadReceipt('${receipt.receiptId}')" class="btn btn-secondary btn-small" title="Download">
                                        📥
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function getStatusBadge(status) {
    const badges = {
        'succeeded': '<span class="badge badge-success">✓ Completed</span>',
        'pending-bank-transfer': '<span class="badge badge-warning">⏳ Pending</span>',
        'failed': '<span class="badge badge-error">✗ Failed</span>',
        'refunded': '<span class="badge badge-neutral">↩️ Refunded</span>'
    };
    return badges[status] || '<span class="badge badge-neutral">' + status + '</span>';
}

function calculateSummaries() {
    const receipts = JSON.parse(localStorage.getItem('nhp_payment_receipts') || '[]');
    
    // Total received (completed payments only)
    const completedReceipts = receipts.filter(r => r.status === 'succeeded');
    const totalReceived = completedReceipts.reduce((sum, r) => sum + r.financial.grossAmount, 0);
    document.getElementById('totalReceived').textContent = '£' + totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 });
    
    // This month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyReceipts = completedReceipts.filter(r => new Date(r.timestamp) >= startOfMonth);
    const monthlyTotal = monthlyReceipts.reduce((sum, r) => sum + r.financial.grossAmount, 0);
    document.getElementById('monthlyTotal').textContent = '£' + monthlyTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 });
    
    // Pending
    const pendingReceipts = receipts.filter(r => r.status === 'pending-bank-transfer');
    const pendingTotal = pendingReceipts.reduce((sum, r) => sum + r.financial.grossAmount, 0);
    document.getElementById('pendingTotal').textContent = '£' + pendingTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 });
    document.getElementById('pendingCount').textContent = pendingReceipts.length + ' transfer' + (pendingReceipts.length !== 1 ? 's' : '');
    
    // VAT collected
    const vatCollected = completedReceipts.reduce((sum, r) => sum + r.financial.vatAmount, 0);
    document.getElementById('vatCollected').textContent = '£' + vatCollected.toLocaleString('en-GB', { minimumFractionDigits: 2 });
    
    // Monthly change (placeholder for demo)
    const monthlyChange = monthlyReceipts.length > 0 ? '+' + monthlyReceipts.length * 15 : '0';
    document.getElementById('monthlyChange').textContent = monthlyChange + '%';
    if (monthlyReceipts.length > 0) {
        document.getElementById('monthlyChange').classList.add('positive');
    }
}

function filterPayments() {
    const receipts = JSON.parse(localStorage.getItem('nhp_payment_receipts') || '[]');
    const statusFilter = document.getElementById('filterStatus').value;
    const methodFilter = document.getElementById('filterMethod').value;
    const searchTerm = document.getElementById('searchTerm').value.toLowerCase();
    
    let filtered = receipts;
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Apply method filter
    if (methodFilter !== 'all') {
        filtered = filtered.filter(r => r.paymentMethod === methodFilter);
    }
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(r => {
            return r.receiptId.toLowerCase().includes(searchTerm) ||
                   r.customer.name.toLowerCase().includes(searchTerm) ||
                   r.customer.email.toLowerCase().includes(searchTerm) ||
                   r.property.plot.toLowerCase().includes(searchTerm) ||
                   r.property.development.toLowerCase().includes(searchTerm) ||
                   (r.paymentReference && r.paymentReference.toLowerCase().includes(searchTerm));
        });
    }
    
    renderPaymentsTable(filtered);
}

function viewReceipt(receiptId) {
    const receipts = JSON.parse(localStorage.getItem('nhp_payment_receipts') || '[]');
    const receipt = receipts.find(r => r.receiptId === receiptId);
    
    if (!receipt) {
        alert('Receipt not found');
        return;
    }
    
    // Create modal to display receipt
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto; padding: 2rem;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove();" 
                style="position: absolute; top: 1rem; right: 1rem; background: var(--gray-200); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; color: var(--gray-600);">
                ×
            </button>
            
            <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 2px solid var(--gray-200);">
                <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">Payment Receipt</h2>
                <div style="font-family: monospace; font-size: 1.125rem; color: var(--gray-600);">${receipt.receiptId}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--gray-700);">Customer Details</h3>
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; font-size: 0.875rem;">
                        <div style="margin-bottom: 0.75rem;">
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Name:</div>
                            <div style="font-weight: 600;">${receipt.customer.name}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Email:</div>
                            <div style="font-weight: 600;">${receipt.customer.email}</div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--gray-700);">Property Details</h3>
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; font-size: 0.875rem;">
                        <div style="margin-bottom: 0.75rem;">
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Plot:</div>
                            <div style="font-weight: 600;">${receipt.property.plot}</div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Development:</div>
                            <div style="font-weight: 600;">${receipt.property.development}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Purchase Price:</div>
                            <div style="font-weight: 600;">£${receipt.property.price.toLocaleString('en-GB')}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--dark-red) 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; opacity: 0.9;">Financial Breakdown</h3>
                <div style="display: grid; gap: 0.75rem; font-size: 0.875rem;">
                    <div style="display: flex; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.2);">
                        <span>Reservation Fee (Net):</span>
                        <strong style="font-size: 1rem;">£${receipt.financial.netAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>VAT (${(receipt.financial.vatRate * 100).toFixed(0)}%):</span>
                        <strong>£${receipt.financial.vatAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.2); font-size: 1.25rem;">
                        <strong>Total Paid:</strong>
                        <strong>£${receipt.financial.grossAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</strong>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--gray-700);">Payment Information</h3>
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; font-size: 0.875rem;">
                        <div style="margin-bottom: 0.75rem;">
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Method:</div>
                            <div style="font-weight: 600;">${receipt.paymentMethod === 'card' ? '💳 Card Payment' : '🏦 Bank Transfer'}</div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Date:</div>
                            <div style="font-weight: 600;">${new Date(receipt.timestamp).toLocaleString('en-GB')}</div>
                        </div>
                        ${receipt.paymentReference ? `
                            <div>
                                <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Reference:</div>
                                <div style="font-weight: 600; font-family: monospace;">${receipt.paymentReference}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--gray-700);">Tax Treatment</h3>
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; font-size: 0.875rem;">
                        <div style="margin-bottom: 0.75rem;">
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">VAT Status:</div>
                            <div style="font-weight: 600;">${receipt.taxTreatment.vatApplied ? '✓ VAT Applied' : 'No VAT'}</div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">VAT Number:</div>
                            <div style="font-weight: 600; font-family: monospace;">${receipt.taxTreatment.vatNumber}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray-600); font-size: 0.75rem; margin-bottom: 0.25rem;">Tax Point:</div>
                            <div style="font-weight: 600;">${new Date(receipt.taxTreatment.taxPoint).toLocaleDateString('en-GB')}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: #E8F5E9; border: 1px solid #4CAF50; padding: 1rem; border-radius: 8px; margin-bottom: 2rem;">
                <div style="font-size: 0.75rem; color: #2E7D32;">
                    <strong>Description:</strong> ${receipt.taxTreatment.description}
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="downloadReceipt('${receipt.receiptId}')" class="btn btn-primary">
                    📥 Download Receipt
                </button>
                <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove();" class="btn btn-secondary">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function downloadReceipt(receiptId) {
    const receipts = JSON.parse(localStorage.getItem('nhp_payment_receipts') || '[]');
    const receipt = receipts.find(r => r.receiptId === receiptId);
    
    if (!receipt) {
        alert('Receipt not found');
        return;
    }
    
    // In production, this would generate a proper PDF
    // For MVP, download as JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipt, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `receipt-${receiptId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    // Show confirmation
    const msg = document.createElement('div');
    msg.style.cssText = 'position: fixed; top: 2rem; right: 2rem; background: #4CAF50; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;';
    msg.innerHTML = '<strong>✓ Receipt Downloaded</strong>';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function exportPayments() {
    const receipts = JSON.parse(localStorage.getItem('nhp_payment_receipts') || '[]');
    
    if (receipts.length === 0) {
        alert('No payments to export');
        return;
    }
    
    // Create CSV
    const headers = ['Receipt ID', 'Date', 'Time', 'Customer Name', 'Customer Email', 'Plot', 'Development', 'Payment Method', 'Net Amount', 'VAT', 'Gross Amount', 'Status', 'Payment Reference'];
    
    const rows = receipts.map(r => [
        r.receiptId,
        new Date(r.timestamp).toLocaleDateString('en-GB'),
        new Date(r.timestamp).toLocaleTimeString('en-GB'),
        r.customer.name,
        r.customer.email,
        r.property.plot,
        r.property.development,
        r.paymentMethod,
        r.financial.netAmount,
        r.financial.vatAmount,
        r.financial.grossAmount,
        r.status,
        r.paymentReference || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Show confirmation
    const msg = document.createElement('div');
    msg.style.cssText = 'position: fixed; top: 2rem; right: 2rem; background: #4CAF50; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;';
    msg.innerHTML = '<strong>✓ CSV Exported</strong>';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function refreshPayments() {
    loadPaymentHistory();
    calculateSummaries();
    
    // Show confirmation
    const msg = document.createElement('div');
    msg.style.cssText = 'position: fixed; top: 2rem; right: 2rem; background: #2196F3; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;';
    msg.innerHTML = '<strong>🔄 Refreshed</strong>';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}
