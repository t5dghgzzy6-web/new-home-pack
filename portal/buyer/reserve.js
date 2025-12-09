// Reservation Form Logic

let currentStep = 1;
const totalSteps = 5;
let signaturePad = null;
let credasVerified = false; // Track Credas verification status
let connectedMortgageOffer = null; // Store connected mortgage offer

// Plot data with site plan positions
const plotsData = {
    '1': { 
        number: 'Plot 1', 
        development: 'Greenfield Gardens', 
        price: 425000,
        type: '4 Bedroom Detached',
        sqft: '1,850',
        status: 'Available',
        description: 'Premium corner plot with south-facing garden',
        reservationFee: 2000
    },
    '2': { 
        number: 'Plot 2', 
        development: 'Greenfield Gardens', 
        price: 325000,
        type: '3 Bedroom Semi-Detached',
        sqft: '1,200',
        status: 'Available',
        description: 'Family home with modern layout',
        reservationFee: 1500
    },
    '3': { 
        number: 'Plot 3', 
        development: 'Riverside Heights', 
        price: 245000,
        type: '2 Bedroom Semi-Detached',
        sqft: '950',
        status: 'Available',
        description: 'Perfect first home or investment',
        reservationFee: 1000
    },
    '4': { 
        number: 'Plot 4', 
        development: 'Greenfield Gardens', 
        price: 285000,
        type: '3 Bedroom Terraced',
        sqft: '1,100',
        status: 'Available',
        description: 'Modern terrace with low maintenance garden',
        reservationFee: 1500
    },
    '5': { 
        number: 'Plot 5', 
        development: 'Oakwood Manor', 
        price: 595000,
        type: '5 Bedroom Detached',
        sqft: '2,400',
        status: 'Available',
        description: 'Executive home with double garage',
        reservationFee: 3000
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (!user) return;

    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }

    // Get plot info from URL
    const urlParams = new URLSearchParams(window.location.search);
    const plotId = urlParams.get('plot');
    
    if (plotId) {
        loadPlotInfo(plotId);
        highlightPlotOnMap(plotId);
    }

    // Initialize signature pad
    initSignaturePad();
    
    // Add click handlers to site plan plots
    initSitePlanInteractivity();
    
    // Check if Credas verification was already completed
    if (sessionStorage.getItem('credasVerified') === 'true') {
        completeCredasVerification();
    }
    
    // Update minimum deposit when loaded
    updateMinDeposit();
    
    // Check for connected mortgage offer
    checkConnectedMortgageOffer();
});

// Check if user has connected a mortgage offer
function checkConnectedMortgageOffer() {
    const storedOffer = localStorage.getItem('nhp_selected_mortgage_offer');
    
    if (storedOffer) {
        try {
            connectedMortgageOffer = JSON.parse(storedOffer);
            displayConnectedMortgageOffer();
        } catch (error) {
            console.error('Error parsing mortgage offer:', error);
        }
    }
}

// Display connected mortgage offer in Step 2
function displayConnectedMortgageOffer() {
    if (!connectedMortgageOffer) return;
    
    // Show connected offer section
    const connectedSection = document.getElementById('connectedMortgageOffer');
    const noConnectedSection = document.getElementById('noConnectedMortgageOffer');
    
    if (connectedSection && noConnectedSection) {
        connectedSection.style.display = 'block';
        noConnectedSection.style.display = 'none';
        
        // Update offer summary
        const summaryText = `${connectedMortgageOffer.lender} • £${connectedMortgageOffer.loanAmount.toLocaleString()} • ${connectedMortgageOffer.interestRate}% ${connectedMortgageOffer.rateType}`;
        document.getElementById('connectedOfferSummary').textContent = summaryText;
        
        // Update offer details
        document.getElementById('offerLoanAmount').textContent = `£${connectedMortgageOffer.loanAmount.toLocaleString()}`;
        document.getElementById('offerMonthlyPayment').textContent = `£${connectedMortgageOffer.monthlyPayment.toLocaleString()}`;
        document.getElementById('offerLTV').textContent = `${connectedMortgageOffer.ltv}%`;
        
        // Pre-fill mortgage fields with offer data
        document.getElementById('mortgageLender').value = connectedMortgageOffer.lender;
        document.getElementById('mortgageAmount').value = connectedMortgageOffer.loanAmount;
        
        // Make fields read-only since they're from connected offer
        document.getElementById('mortgageLender').setAttribute('readonly', 'readonly');
        document.getElementById('mortgageAmount').setAttribute('readonly', 'readonly');
        
        // Hide file upload since we have the offer
        const fileGroup = document.getElementById('mortgageApproval').closest('.form-group');
        if (fileGroup) fileGroup.style.display = 'none';
    }
}

// Remove connected mortgage offer
function removeMortgageOffer() {
    if (confirm('Are you sure you want to disconnect this mortgage offer? You can reconnect it later from the mortgage page.')) {
        connectedMortgageOffer = null;
        localStorage.removeItem('nhp_selected_mortgage_offer');
        
        // Show no connected offer section
        document.getElementById('connectedMortgageOffer').style.display = 'none';
        document.getElementById('noConnectedMortgageOffer').style.display = 'block';
        
        // Clear and make fields editable
        document.getElementById('mortgageLender').value = '';
        document.getElementById('mortgageAmount').value = '';
        document.getElementById('mortgageLender').removeAttribute('readonly');
        document.getElementById('mortgageAmount').removeAttribute('readonly');
        
        // Show file upload again
        const fileGroup = document.getElementById('mortgageApproval').closest('.form-group');
        if (fileGroup) fileGroup.style.display = 'block';
    }
}

// Redirect to mortgage page to connect lender
function redirectToMortgagePage() {
    // Store current form data
    saveFormProgress();
    
    // Redirect to mortgage page
    window.location.href = 'mortgage.html';
}

// Save form progress to resume later
function saveFormProgress() {
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        addressLine1: document.getElementById('addressLine1').value,
        addressLine2: document.getElementById('addressLine2').value,
        city: document.getElementById('city').value,
        county: document.getElementById('county').value,
        postcode: document.getElementById('postcode').value,
        purchaseType: document.getElementById('purchaseType').value,
        depositAmount: document.getElementById('depositAmount').value,
        depositSource: document.getElementById('depositSource').value
    };
    
    localStorage.setItem('nhp_reservation_progress', JSON.stringify(formData));
}

// Restore form progress
function restoreFormProgress() {
    const savedData = localStorage.getItem('nhp_reservation_progress');
    
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            
            Object.keys(formData).forEach(key => {
                const field = document.getElementById(key);
                if (field && formData[key]) {
                    field.value = formData[key];
                }
            });
            
            // Trigger change events to update dependent fields
            if (formData.purchaseType) {
                updatePurchaseTypeFields();
            }
            if (formData.depositSource) {
                updateSourceFields();
            }
        } catch (error) {
            console.error('Error restoring form progress:', error);
        }
    }
}

function loadPlotInfo(plotId) {
    const plot = plotsData[plotId] || plotsData['1'];
    
    document.getElementById('plotInfo').textContent = 
        `Reserving ${plot.number}, ${plot.development} - £${plot.price.toLocaleString()}`;
    
    if (document.getElementById('agreementPlot')) {
        document.getElementById('agreementPlot').textContent = 
            `${plot.number}, ${plot.development}`;
    }

    // Update plot details card
    updatePlotDetailsCard(plot);
    
    // Update reservation fee
    if (document.getElementById('reservationFee')) {
        document.getElementById('reservationFee').textContent = 
            `£${plot.reservationFee.toLocaleString()}`;
    }

    // Store plot info for later
    sessionStorage.setItem('reservationPlot', JSON.stringify(plot));
}

function updatePlotDetailsCard(plot) {
    if (document.getElementById('selectedPlotNumber')) {
        document.getElementById('selectedPlotNumber').textContent = plot.number;
    }
    if (document.getElementById('selectedDevelopment')) {
        document.getElementById('selectedDevelopment').textContent = plot.development;
    }
    if (document.getElementById('selectedType')) {
        document.getElementById('selectedType').textContent = plot.type;
    }
    if (document.getElementById('selectedPrice')) {
        document.getElementById('selectedPrice').textContent = `£${plot.price.toLocaleString()}`;
    }
    if (document.getElementById('selectedSqft')) {
        document.getElementById('selectedSqft').textContent = plot.sqft + ' sq ft';
    }
}

function highlightPlotOnMap(plotId) {
    // Remove existing highlights
    document.querySelectorAll('.plot-marker').forEach(marker => {
        const rect = marker.querySelector('rect');
        if (rect) {
            rect.setAttribute('fill', '#e8e8e8');
            rect.setAttribute('stroke', '#999');
            rect.setAttribute('stroke-width', '2');
        }
        // Remove any existing star
        const existingStar = marker.querySelector('circle[fill="#FFD700"]');
        if (existingStar) {
            existingStar.remove();
        }
        const existingStarText = marker.querySelector('text:last-child');
        if (existingStarText && existingStarText.textContent === '★') {
            existingStarText.remove();
        }
    });
    
    // Highlight selected plot
    const selectedPlot = document.getElementById(`plot${plotId}`);
    if (selectedPlot) {
        const rect = selectedPlot.querySelector('rect');
        if (rect) {
            rect.setAttribute('fill', '#DC2626');
            rect.setAttribute('stroke', '#B71C1C');
            rect.setAttribute('stroke-width', '3');
            
            // Change text color to white
            selectedPlot.querySelectorAll('text').forEach(text => {
                text.setAttribute('fill', 'white');
            });
            
            // Add star indicator
            const rectBounds = rect.getBBox();
            const starX = rectBounds.x + rectBounds.width - 10;
            const starY = rectBounds.y + 10;
            
            const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            star.setAttribute('cx', starX);
            star.setAttribute('cy', starY);
            star.setAttribute('r', '8');
            star.setAttribute('fill', '#FFD700');
            star.setAttribute('stroke', '#FFA500');
            star.setAttribute('stroke-width', '2');
            
            const starText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            starText.setAttribute('x', starX);
            starText.setAttribute('y', starY + 4);
            starText.setAttribute('text-anchor', 'middle');
            starText.setAttribute('font-size', '10');
            starText.setAttribute('fill', '#000');
            starText.textContent = '★';
            
            selectedPlot.appendChild(star);
            selectedPlot.appendChild(starText);
        }
    }
}

function initSitePlanInteractivity() {
    document.querySelectorAll('.plot-marker').forEach(marker => {
        marker.addEventListener('click', function() {
            const plotId = this.getAttribute('data-plot');
            const plot = plotsData[plotId];
            
            if (plot) {
                // Update URL without reload
                const url = new URL(window.location);
                url.searchParams.set('plot', plotId);
                window.history.pushState({}, '', url);
                
                // Update display
                loadPlotInfo(plotId);
                highlightPlotOnMap(plotId);
            }
        });
        
        // Add hover effect
        marker.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        marker.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });
}

function nextStep() {
    // Validate current step
    if (!validateStep(currentStep)) {
        return;
    }

    // Mark current step as completed
    const currentStepEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    if (currentStepEl) {
        currentStepEl.classList.remove('active');
        currentStepEl.classList.add('completed');
    }

    // Move to next step
    currentStep++;
    if (currentStep > totalSteps) {
        currentStep = totalSteps;
        return;
    }

    // Show next section
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelector(`.form-section[data-section="${currentStep}"]`).classList.add('active');

    // Update step indicator
    const nextStepEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    if (nextStepEl) {
        nextStepEl.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep() {
    // Mark current step as not active
    const currentStepEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    if (currentStepEl) {
        currentStepEl.classList.remove('active');
    }

    // Move to previous step
    currentStep--;
    if (currentStep < 1) {
        currentStep = 1;
        return;
    }

    // Show previous section
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelector(`.form-section[data-section="${currentStep}"]`).classList.add('active');

    // Update step indicator
    const prevStepEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    if (prevStepEl) {
        prevStepEl.classList.remove('completed');
        prevStepEl.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
    const section = document.querySelector(`.form-section[data-section="${step}"]`);
    const inputs = section.querySelectorAll('input[required], select[required], textarea[required]');
    
    for (let input of inputs) {
        // Skip validation for conditionally hidden fields
        const parent = input.closest('.form-group') || input.closest('#mortgageFields') || input.closest('#sourceDetailsFields');
        if (parent && parent.style.display === 'none') {
            continue;
        }
        
        if (!input.value) {
            alert('Please fill in all required fields');
            input.focus();
            return false;
        }
    }

    // Special validation for step 2 (Source of Funds)
    if (step === 2) {
        // AML verification made optional for testing
        // In production, uncomment this validation:
        /*
        if (!credasVerified) {
            alert('Please complete the AML verification before continuing');
            document.getElementById('credasVerifyBtn').focus();
            return false;
        }
        */
        
        // Validate deposit amount
        const depositAmount = parseFloat(document.getElementById('depositAmount').value);
        const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
        const minDeposit = plot.price ? plot.price * 0.1 : 0;
        
        if (depositAmount < minDeposit) {
            alert(`Deposit must be at least 10% of the purchase price (£${minDeposit.toLocaleString()})`);
            document.getElementById('depositAmount').focus();
            return false;
        }
        
        // Validate mortgage amount if applicable
        const purchaseType = document.getElementById('purchaseType').value;
        if (purchaseType === 'mortgage' || purchaseType === 'mixed') {
            const mortgageAmount = parseFloat(document.getElementById('mortgageAmount').value || 0);
            if (depositAmount + mortgageAmount < plot.price) {
                alert('Deposit + Mortgage amount must equal or exceed the purchase price');
                return false;
            }
        }
    }

    // Special validation for step 5 (signature)
    if (step === 5) {
        if (!signaturePad || signaturePad.isEmpty()) {
            alert('Please provide your signature');
            return false;
        }
        if (!document.getElementById('agreeTerms').checked) {
            alert('Please agree to the terms and conditions');
            return false;
        }
    }

    return true;
}

// Step 2: Source of Funds Helper Functions

function updatePurchaseTypeFields() {
    const purchaseType = document.getElementById('purchaseType').value;
    const mortgageFields = document.getElementById('mortgageFields');
    
    if (purchaseType === 'mortgage' || purchaseType === 'mixed') {
        mortgageFields.style.display = 'block';
        // Make mortgage fields required
        document.getElementById('mortgageLender').required = true;
        document.getElementById('mortgageAmount').required = true;
        document.getElementById('mortgageApproval').required = true;
    } else {
        mortgageFields.style.display = 'none';
        // Remove required attribute
        document.getElementById('mortgageLender').required = false;
        document.getElementById('mortgageAmount').required = false;
        document.getElementById('mortgageApproval').required = false;
    }
}

function updateSourceFields() {
    const depositSource = document.getElementById('depositSource').value;
    const sourceDetailsFields = document.getElementById('sourceDetailsFields');
    
    // Show additional details field for all sources
    if (depositSource) {
        sourceDetailsFields.style.display = 'block';
        document.getElementById('sourceDetails').required = true;
    } else {
        sourceDetailsFields.style.display = 'none';
        document.getElementById('sourceDetails').required = false;
    }
}

function updateMinDeposit() {
    const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
    if (plot.price) {
        const minDeposit = plot.price * 0.1;
        const minDepositEl = document.getElementById('minDeposit');
        if (minDepositEl) {
            minDepositEl.textContent = minDeposit.toLocaleString();
        }
    }
}

function initiateCredasVerification() {
    // In production, this would redirect to Credas OAuth flow
    // For MVP, simulate the verification process
    
    const btn = document.getElementById('credasVerifyBtn');
    const status = document.getElementById('credasStatus');
    
    // Disable button
    btn.disabled = true;
    btn.textContent = '🔄 Connecting to verification service...';
    
    // Simulate API call
    setTimeout(() => {
        // In production, this would be:
        // window.location.href = 'https://api.credas.co.uk/auth/verify?client_id=XXX&redirect_uri=...';
        // OR open in popup window
        
        // For MVP, show modal explaining the process
        showCredasMockFlow();
    }, 1000);
}

function showCredasMockFlow() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔒</div>
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Identity Verification</h2>
                <p style="color: var(--gray-600); font-size: 0.875rem;">Secure AML & Identity Verification</p>
            </div>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <p style="font-size: 0.875rem; line-height: 1.6; color: var(--gray-700); margin-bottom: 1rem;">
                    <strong>In production, you would be redirected to our verification partner to:</strong>
                </p>
                <ul style="font-size: 0.875rem; line-height: 1.8; color: var(--gray-700); margin-left: 1.5rem;">
                    <li>Verify your identity (passport/driving license)</li>
                    <li>Confirm your address</li>
                    <li>Upload bank statements (last 3 months)</li>
                    <li>Provide source of funds documentation</li>
                </ul>
            </div>
            
            <div style="background: #D4EDDA; border: 1px solid #C3E6CB; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <p style="font-size: 0.875rem; color: #155724; margin: 0;">
                    <strong>MVP Mode:</strong> Verification simulated. In production, this integrates with a third-party verification API.
                </p>
            </div>
            
            <div style="display: flex; gap: 1rem;">
                <button onclick="completeCredasVerification(); this.closest('div[style*=\\'position: fixed\\']').remove();" 
                    style="flex: 1; padding: 0.75rem; background: var(--primary-red); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    ✓ Simulate Verification Complete
                </button>
                <button onclick="cancelCredasVerification(); this.closest('div[style*=\\'position: fixed\\']').remove();" 
                    style="flex: 1; padding: 0.75rem; background: var(--gray-200); color: var(--primary-black); border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function completeCredasVerification() {
    credasVerified = true;
    
    const btn = document.getElementById('credasVerifyBtn');
    const status = document.getElementById('credasStatus');
    
    // Update status indicator
    status.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #10B981;"></div>
            <div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #10B981;">✓ Verification Complete</div>
                <div style="font-size: 0.75rem; color: var(--gray-600);">Verified on ${new Date().toLocaleDateString()}</div>
            </div>
        </div>
    `;
    
    // Update button
    btn.disabled = true;
    btn.style.background = 'var(--accent-green)';
    btn.innerHTML = '✓ Verification Complete';
    
    // Store verification in session
    sessionStorage.setItem('credasVerified', 'true');
    sessionStorage.setItem('credasVerifiedDate', new Date().toISOString());
}

function cancelCredasVerification() {
    const btn = document.getElementById('credasVerifyBtn');
    btn.disabled = false;
    btn.textContent = '🔒 Begin Verification';
}

function validateAndContinueStep2() {
    if (validateStep(2)) {
        nextStep();
    }
}

function toggleSolicitorFields() {
    const checkbox = document.getElementById('haveSolicitor');
    const fields = document.getElementById('solicitorFields');
    const inputs = fields.querySelectorAll('input');

    if (checkbox.checked) {
        fields.style.display = 'block';
        inputs.forEach(input => input.required = true);
    } else {
        fields.style.display = 'none';
        inputs.forEach(input => {
            input.required = false;
            input.value = '';
        });
    }
}

function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    const container = document.getElementById('signaturePad');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    signaturePad = {
        isEmpty: function() {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return !imageData.data.some(channel => channel !== 0);
        },
        clear: function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        toDataURL: function() {
            return canvas.toDataURL();
        }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
        isDrawing = true;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    });

    canvas.addEventListener('touchend', stopDrawing);

    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    }

    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    }

    function stopDrawing() {
        isDrawing = false;
    }
}

function clearSignature() {
    if (signaturePad) {
        signaturePad.clear();
    }
}

function selectPayment(method) {
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

function submitReservation() {
    // Validate agreement checkbox
    if (!document.getElementById('agreeTerms').checked) {
        showNotification('You must agree to the terms and conditions', 'error');
        return;
    }

    // Validate signatures based on selected method
    if (!validateSignatures()) {
        return;
    }

    // Show loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    loadingOverlay.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 3rem; text-align: center; max-width: 400px;">
            <div class="spinner" style="margin: 0 auto 1.5rem; width: 50px; height: 50px; border: 4px solid var(--gray-200); border-top-color: var(--primary-red); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3 style="font-weight: 600; margin-bottom: 0.5rem;">Processing Reservation...</h3>
            <p style="font-size: 0.875rem; color: var(--gray-600);">Please wait while we process your reservation</p>
        </div>
    `;
    document.body.appendChild(loadingOverlay);

    // Collect form data
    const formData = new FormData(document.getElementById('reservationForm'));
    const data = Object.fromEntries(formData);
    
    // Get plot info
    const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
    data.plot = plot;

    // Get payment info
    const receipt = JSON.parse(localStorage.getItem('nhp_last_payment_receipt') || '{}');
    data.payment = receipt;

    // Get all buyers
    const primaryName = document.getElementById('firstName')?.value + ' ' + document.getElementById('lastName')?.value;
    const primaryEmail = document.getElementById('email')?.value;
    
    data.buyers = [
        { number: 1, name: primaryName, email: primaryEmail, role: 'primary' },
        ...buyers
    ];

    // Get signatures data
    const signaturesData = getAllSignaturesData();
    data.signatures = signaturesData;

    // Add metadata
    data.reservationDate = new Date().toISOString();
    data.reservationId = 'RES-' + Date.now();
    data.status = selectedSignatureMethod === 'docusign' ? 'pending-signatures' : 'pending-payment';
    data.customTCs = customTCsLoaded;

    // If DocuSign, send to DocuSign
    if (selectedSignatureMethod === 'docusign') {
        const envelope = sendToDocuSign(data);
        data.docuSignEnvelopeId = envelope.envelopeId;
    }

    // Store reservation
    const reservations = JSON.parse(localStorage.getItem('nhp_reservations') || '[]');
    reservations.push(data);
    localStorage.setItem('nhp_reservations', JSON.stringify(reservations));

    // Remove loading overlay
    setTimeout(() => {
        loadingOverlay.remove();
        
        // Show success modal
        showSuccessModal(plot, selectedSignatureMethod);
    }, 2000);
}

function showSuccessModal(plot, signatureMethod) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    const docuSignMessage = signatureMethod === 'docusign' ? `
        <div style="background: #E8F5E9; border: 1px solid #4CAF50; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="font-size: 0.875rem; color: #2E7D32; margin: 0;">
                📧 <strong>DocuSign invitations sent!</strong> All buyers will receive an email to review and sign the agreement.
            </p>
        </div>
    ` : '';

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 3rem; max-width: 500px; width: 90%; text-align: center;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">🎉</div>
            <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary-black);">Congratulations!</h2>
            <p style="font-size: 1.125rem; color: var(--gray-700); margin-bottom: 2rem;">
                You've successfully reserved ${plot.number} at ${plot.development}
            </p>
            
            ${docuSignMessage}
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; text-align: left;">
                <h3 style="font-weight: 600; margin-bottom: 1rem;">What happens next?</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${signatureMethod === 'docusign' ? `
                        <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: var(--primary-red);">1.</span> All buyers complete DocuSign signature
                        </li>
                        <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: var(--primary-red);">2.</span> We'll send your signed agreement by email
                        </li>
                    ` : `
                        <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: var(--primary-red);">1.</span> We'll send your reservation agreement by email
                        </li>
                    `}
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">${signatureMethod === 'docusign' ? '3' : '2'}.</span> Our sales team will contact you within 24 hours
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">${signatureMethod === 'docusign' ? '4' : '3'}.</span> You have 28 days to exchange contracts
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">${signatureMethod === 'docusign' ? '5' : '4'}.</span> Your solicitor will receive all documents
                    </li>
                </ul>
            </div>
            
            <button onclick="window.location.href='dashboard.html';" 
                style="width: 100%; padding: 1rem; background: var(--primary-red); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer;">
                View My Dashboard
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
