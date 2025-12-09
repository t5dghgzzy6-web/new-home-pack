// Section 3: Solicitor Details Functions

function toggleSolicitorFields() {
    const haveSolicitor = document.getElementById('haveSolicitor').value;
    const solicitorDetailsSection = document.getElementById('solicitorDetailsSection');
    const solicitorQuoteSection = document.getElementById('solicitorQuoteSection');
    
    if (haveSolicitor === 'yes') {
        solicitorDetailsSection.style.display = 'block';
        solicitorQuoteSection.style.display = 'none';
        
        // Make instructed solicitor fields required
        document.getElementById('solicitorFirm').required = true;
        document.getElementById('solicitorContact').required = true;
        document.getElementById('solicitorEmail').required = true;
        document.getElementById('solicitorPhone').required = true;
        
        // Remove required from own solicitor fields
        document.getElementById('ownSolicitorFirm').required = false;
        document.getElementById('ownSolicitorContact').required = false;
        document.getElementById('ownSolicitorEmail').required = false;
        document.getElementById('ownSolicitorPhone').required = false;
    } else if (haveSolicitor === 'no') {
        solicitorDetailsSection.style.display = 'none';
        solicitorQuoteSection.style.display = 'block';
        
        // Remove required from instructed solicitor fields
        document.getElementById('solicitorFirm').required = false;
        document.getElementById('solicitorContact').required = false;
        document.getElementById('solicitorEmail').required = false;
        document.getElementById('solicitorPhone').required = false;
        
        // Note: own solicitor fields are optional until user clicks to provide them
    } else {
        solicitorDetailsSection.style.display = 'none';
        solicitorQuoteSection.style.display = 'none';
    }
}

function showOwnSolicitorFields() {
    const ownSolicitorFields = document.getElementById('ownSolicitorFields');
    ownSolicitorFields.style.display = 'block';
    
    // Make own solicitor fields required
    document.getElementById('ownSolicitorFirm').required = true;
    document.getElementById('ownSolicitorContact').required = true;
    document.getElementById('ownSolicitorEmail').required = true;
    document.getElementById('ownSolicitorPhone').required = true;
    
    // Scroll to the fields
    ownSolicitorFields.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openQuoteCalculator() {
    // Get plot data for the quote calculator
    const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
    
    // In production, this would open a modal or redirect to quote calculator
    // For now, show a modal with the quote calculator interface
    showQuoteCalculatorModal(plot);
}

function showQuoteCalculatorModal(plot) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto; padding: 2rem;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove();" 
                style="position: absolute; top: 1rem; right: 1rem; background: var(--gray-200); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; color: var(--gray-600);">
                ×
            </button>
            
            <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary-black);">
                Get Your Conveyancing Quote
            </h2>
            <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 2rem;">
                Instant quotes from approved solicitors for ${plot.number}, ${plot.development}
            </p>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Property Details</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.875rem;">
                    <div>
                        <span style="color: var(--gray-600);">Plot:</span>
                        <strong style="display: block; margin-top: 0.25rem;">${plot.number}</strong>
                    </div>
                    <div>
                        <span style="color: var(--gray-600);">Development:</span>
                        <strong style="display: block; margin-top: 0.25rem;">${plot.development}</strong>
                    </div>
                    <div>
                        <span style="color: var(--gray-600);">Purchase Price:</span>
                        <strong style="display: block; margin-top: 0.25rem;">£${plot.price.toLocaleString()}</strong>
                    </div>
                    <div>
                        <span style="color: var(--gray-600);">Property Type:</span>
                        <strong style="display: block; margin-top: 0.25rem;">New Build</strong>
                    </div>
                </div>
            </div>
            
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem;">Approved Solicitors</h3>
            
            <div id="quoteResults">
                ${generateMockQuotes(plot.price)}
            </div>
            
            <div style="background: #E8F5E9; border: 1px solid #4CAF50; padding: 1rem; border-radius: 8px; margin-top: 2rem;">
                <p style="font-size: 0.875rem; color: #2E7D32; margin: 0;">
                    <strong>💡 Note:</strong> These quotes include all legal fees, searches, and disbursements for new build conveyancing. 
                    No hidden costs. Click "Select" to proceed with your chosen solicitor.
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateMockQuotes(purchasePrice) {
    // Calculate fee based on purchase price tiers
    let baseFee = 850;
    if (purchasePrice > 500000) baseFee = 1200;
    else if (purchasePrice > 400000) baseFee = 1050;
    else if (purchasePrice > 300000) baseFee = 950;
    
    const disbursements = 450; // Typical searches and registration fees
    
    const firms = [
        {
            name: 'Taylor Rose Conveyancing',
            rating: 4.8,
            reviews: 2847,
            legalFee: baseFee,
            disbursements: disbursements,
            specialties: ['New Build Specialist', 'Help to Buy', 'Shared Ownership'],
            turnaround: '6-8 weeks'
        },
        {
            name: 'Conveyancing Direct',
            rating: 4.7,
            reviews: 1923,
            legalFee: baseFee + 100,
            disbursements: disbursements,
            specialties: ['New Build Expert', 'First Time Buyers', 'Same Day Service'],
            turnaround: '5-7 weeks'
        },
        {
            name: 'Premier Property Lawyers',
            rating: 4.9,
            reviews: 3251,
            legalFee: baseFee + 200,
            disbursements: disbursements,
            specialties: ['Premium Service', 'New Build Luxury', 'Dedicated Solicitor'],
            turnaround: '4-6 weeks'
        }
    ];
    
    return firms.map(firm => {
        const total = firm.legalFee + firm.disbursements;
        return `
            <div style="border: 2px solid var(--gray-200); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary-red)'" onmouseout="this.style.borderColor='var(--gray-200)'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1; min-width: 250px;">
                        <h4 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">${firm.name}</h4>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <div style="color: #FFC107;">★★★★★</div>
                            <span style="font-size: 0.875rem; color: var(--gray-600);">${firm.rating} (${firm.reviews} reviews)</span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;">
                            ${firm.specialties.map(s => `<span style="background: var(--gray-100); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; color: var(--gray-700);">${s}</span>`).join('')}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Total Quote</div>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-red);">£${total.toLocaleString()}</div>
                        <div style="font-size: 0.75rem; color: var(--gray-600); margin-top: 0.25rem;">${firm.turnaround} typical</div>
                    </div>
                </div>
                
                <div style="background: var(--gray-50); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; font-size: 0.875rem;">
                        <div>
                            <span style="color: var(--gray-600);">Legal Fees:</span>
                            <strong style="display: block;">£${firm.legalFee.toLocaleString()}</strong>
                        </div>
                        <div>
                            <span style="color: var(--gray-600);">Searches & Disbursements:</span>
                            <strong style="display: block;">£${firm.disbursements.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
                
                <button onclick="selectSolicitor('${firm.name}', ${total})" 
                    style="width: 100%; padding: 0.75rem; background: var(--primary-red); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    Select ${firm.name}
                </button>
            </div>
        `;
    }).join('');
}

function selectSolicitor(firmName, quote) {
    // Store selection
    sessionStorage.setItem('selectedSolicitor', JSON.stringify({
        firm: firmName,
        quote: quote,
        timestamp: new Date().toISOString()
    }));
    
    // Close modal
    const modal = document.querySelector('div[style*="position: fixed"]');
    if (modal) modal.remove();
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = 'position: fixed; top: 2rem; right: 2rem; background: #4CAF50; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;';
    successMsg.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">✓</span>
            <div>
                <strong style="display: block; margin-bottom: 0.25rem;">${firmName} Selected</strong>
                <span style="font-size: 0.875rem; opacity: 0.9;">Quote: £${quote.toLocaleString()} - We'll send you their contact details</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.remove();
    }, 5000);
}
