// Payment Processing Functions
// Platform-agnostic payment integration ready for Stripe, GoCardless, or custom gateway

let selectedPaymentMethod = 'card';
let paymentGatewayInitialized = false;

// Initialize payment on page load
document.addEventListener('DOMContentLoaded', () => {
    calculateVAT();
    generatePaymentReference();
});

// Calculate and display VAT
function calculateVAT() {
    const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
    const reservationFee = plot.reservationFee || 2000;
    const vatRate = 0.20; // 20% VAT
    const vat = reservationFee * vatRate;
    const total = reservationFee + vat;
    
    if (document.getElementById('vatAmount')) {
        document.getElementById('vatAmount').textContent = vat.toFixed(2);
    }
    if (document.getElementById('totalWithVat')) {
        document.getElementById('totalWithVat').textContent = total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Generate unique payment reference
function generatePaymentReference() {
    const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
    const timestamp = Date.now().toString().slice(-6);
    const plotNum = plot.number ? plot.number.replace(/\D/g, '').padStart(2, '0') : '00';
    const ref = `REF-${plotNum}${timestamp}`;
    
    if (document.getElementById('paymentReference')) {
        document.getElementById('paymentReference').textContent = ref;
    }
    
    // Store for later use
    sessionStorage.setItem('paymentReference', ref);
    
    return ref;
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    const cardDiv = document.getElementById('paymentCard');
    const bankDiv = document.getElementById('paymentBank');
    const cardSection = document.getElementById('cardPaymentSection');
    const bankSection = document.getElementById('bankTransferSection');
    
    if (method === 'card') {
        cardDiv.classList.add('selected');
        bankDiv.classList.remove('selected');
        cardSection.style.display = 'block';
        bankSection.style.display = 'none';
        
        // Show card check, hide bank check
        cardDiv.querySelector('.payment-check').style.display = 'flex';
        cardDiv.querySelector('.payment-check').style.background = 'var(--primary-red)';
        cardDiv.querySelector('.payment-check').style.border = 'none';
        cardDiv.querySelector('.payment-check').innerHTML = '✓';
        
        bankDiv.querySelector('.payment-check').style.display = 'none';
        
        // Initialize payment gateway if not already done
        if (!paymentGatewayInitialized) {
            initializePaymentGateway();
        }
    } else {
        bankDiv.classList.add('selected');
        cardDiv.classList.remove('selected');
        bankSection.style.display = 'block';
        cardSection.style.display = 'none';
        
        // Show bank check, hide card check
        bankDiv.querySelector('.payment-check').style.display = 'flex';
        bankDiv.querySelector('.payment-check').style.background = 'var(--primary-red)';
        bankDiv.querySelector('.payment-check').style.border = 'none';
        bankDiv.querySelector('.payment-check').innerHTML = '✓';
        
        cardDiv.querySelector('.payment-check').style.display = 'flex';
        cardDiv.querySelector('.payment-check').style.background = 'transparent';
        cardDiv.querySelector('.payment-check').style.border = '2px solid var(--gray-300)';
        cardDiv.querySelector('.payment-check').innerHTML = '';
    }
    
    // Store selection
    sessionStorage.setItem('paymentMethod', method);
}

// Initialize payment gateway (Stripe, GoCardless, etc.)
function initializePaymentGateway() {
    const container = document.getElementById('paymentGatewayContainer');
    
    if (!container) return;
    
    // In production, this would initialize Stripe Elements or similar
    // For MVP, show integration-ready placeholder
    container.innerHTML = `
        <div style="padding: 1.5rem;">
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem;">Card Number</label>
                <div id="card-number-element" style="padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: 6px; background: white;">
                    <input type="text" placeholder="1234 5678 9012 3456" style="width: 100%; border: none; outline: none; font-size: 1rem;">
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem;">Expiry Date</label>
                    <div id="card-expiry-element" style="padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: 6px; background: white;">
                        <input type="text" placeholder="MM / YY" style="width: 100%; border: none; outline: none; font-size: 1rem;">
                    </div>
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem;">CVC</label>
                    <div id="card-cvc-element" style="padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: 6px; background: white;">
                        <input type="text" placeholder="123" style="width: 100%; border: none; outline: none; font-size: 1rem;">
                    </div>
                </div>
            </div>
            
            <div style="background: #E3F2FD; border: 1px solid #2196F3; padding: 0.75rem; border-radius: 6px; margin-top: 1rem;">
                <p style="font-size: 0.75rem; color: #1565C0; margin: 0;">
                    <strong>MVP Mode:</strong> This is a placeholder. In production, Stripe Elements or your chosen payment gateway will be loaded here with full PCI compliance.
                </p>
            </div>
        </div>
    `;
    
    paymentGatewayInitialized = true;
    
    /* PRODUCTION CODE (commented for MVP):
    
    // Example Stripe integration:
    const stripe = Stripe('YOUR_PUBLISHABLE_KEY');
    const elements = stripe.elements();
    
    const cardNumber = elements.create('cardNumber');
    cardNumber.mount('#card-number-element');
    
    const cardExpiry = elements.create('cardExpiry');
    cardExpiry.mount('#card-expiry-element');
    
    const cardCvc = elements.create('cardCvc');
    cardCvc.mount('#card-cvc-element');
    
    */
}

// Copy bank details to clipboard
function copyBankDetails() {
    const accountName = document.getElementById('bankAccountName').textContent;
    const sortCode = document.getElementById('bankSortCode').textContent;
    const accountNumber = document.getElementById('bankAccountNumber').textContent;
    const reference = document.getElementById('paymentReference').textContent;
    const amount = document.getElementById('totalWithVat').textContent;
    
    const details = `Bank Transfer Details
    
Account Name: ${accountName}
Sort Code: ${sortCode}
Account Number: ${accountNumber}
Payment Reference: ${reference}
Amount: £${amount}

⚠️ IMPORTANT: You must include the payment reference: ${reference}`;
    
    navigator.clipboard.writeText(details).then(() => {
        // Show success message
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Copied to Clipboard!';
        btn.style.background = '#4CAF50';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 3000);
    }).catch(err => {
        alert('Failed to copy. Please manually note down the details.');
    });
}

// Process payment
function proceedToAgreement() {
    const method = sessionStorage.getItem('paymentMethod') || 'card';
    
    if (method === 'card') {
        // In production, this would process the Stripe payment
        // For MVP, simulate payment processing
        processCardPayment();
    } else {
        // Bank transfer - just move to next step
        // Payment will be verified manually by admin
        sessionStorage.setItem('paymentStatus', 'pending-bank-transfer');
        nextStep();
    }
}

function processCardPayment() {
    // Show processing overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    overlay.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; text-align: center; max-width: 400px;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔄</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Processing Payment...</h3>
            <p style="font-size: 0.875rem; color: var(--gray-600);">Please wait while we securely process your payment</p>
            <div style="margin-top: 1.5rem;">
                <div style="width: 100%; height: 4px; background: var(--gray-200); border-radius: 2px; overflow: hidden;">
                    <div style="width: 60%; height: 100%; background: var(--primary-red); animation: progress 2s ease-in-out;"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Simulate payment processing
    setTimeout(() => {
        overlay.remove();
        
        // In production, handle Stripe response here
        /* PRODUCTION CODE:
        stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumber,
                billing_details: {
                    name: document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                }
            }
        }).then(function(result) {
            if (result.error) {
                // Show error
                alert('Payment failed: ' + result.error.message);
            } else {
                // Payment successful
                const paymentReceipt = createPaymentReceipt(result.paymentIntent);
                sessionStorage.setItem('paymentReceipt', JSON.stringify(paymentReceipt));
                sessionStorage.setItem('paymentStatus', 'completed');
                nextStep();
            }
        });
        */
        
        // MVP: Simulate success
        const paymentReceipt = createPaymentReceipt({
            id: 'pi_' + Date.now(),
            amount: parseFloat(document.getElementById('totalWithVat').textContent.replace(/,/g, '')) * 100,
            status: 'succeeded'
        });
        
        sessionStorage.setItem('paymentReceipt', JSON.stringify(paymentReceipt));
        sessionStorage.setItem('paymentStatus', 'completed');
        
        // Show success and move to next step
        showPaymentSuccess();
        
        setTimeout(() => {
            nextStep();
        }, 2000);
        
    }, 2000);
}

function showPaymentSuccess() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    overlay.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; text-align: center; max-width: 400px;">
            <div style="font-size: 4rem; margin-bottom: 1rem; color: #4CAF50;">✓</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #4CAF50;">Payment Successful!</h3>
            <p style="font-size: 0.875rem; color: var(--gray-600);">Your reservation fee has been processed</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.remove();
    }, 2000);
}

// Create payment receipt with tax breakdown
function createPaymentReceipt(paymentIntent) {
    const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
    const user = JSON.parse(localStorage.getItem('nhp_user') || '{}');
    const reservationFee = plot.reservationFee || 2000;
    const vatRate = 0.20;
    const netAmount = reservationFee;
    const vatAmount = reservationFee * vatRate;
    const grossAmount = reservationFee + vatAmount;
    
    const receipt = {
        receiptId: 'REC-' + Date.now(),
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString(),
        paymentMethod: sessionStorage.getItem('paymentMethod') || 'card',
        paymentReference: sessionStorage.getItem('paymentReference'),
        
        // Customer details
        customer: {
            name: user.name,
            email: user.email,
            userId: user.id
        },
        
        // Property details
        property: {
            plot: plot.number,
            development: plot.development,
            price: plot.price
        },
        
        // Financial breakdown
        financial: {
            netAmount: netAmount,
            vatRate: vatRate,
            vatAmount: vatAmount,
            grossAmount: grossAmount,
            currency: 'GBP'
        },
        
        // Tax treatment
        taxTreatment: {
            vatApplied: true,
            vatNumber: 'GB123456789', // Developer's VAT number
            taxPoint: new Date().toISOString(),
            description: 'Reservation fee for new build property - Standard rated supply'
        },
        
        // Status
        status: paymentIntent.status || 'succeeded',
        
        // Audit trail
        metadata: {
            ipAddress: 'xxx.xxx.xxx.xxx', // Would be captured server-side
            userAgent: navigator.userAgent,
            platform: 'New Home Pack Portal'
        }
    };
    
    // Store in localStorage for admin access
    const allReceipts = JSON.parse(localStorage.getItem('nhp_payment_receipts') || '[]');
    allReceipts.push(receipt);
    localStorage.setItem('nhp_payment_receipts', JSON.stringify(allReceipts));
    
    return receipt;
}

// Download receipt as PDF (placeholder - would use PDF library in production)
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
}
