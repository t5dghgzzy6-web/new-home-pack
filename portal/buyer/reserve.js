// Reservation Form Logic

let currentStep = 1;
const totalSteps = 5;
let signaturePad = null;

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
    }

    // Initialize signature pad
    initSignaturePad();
});

function loadPlotInfo(plotId) {
    // In production, fetch from API
    const plots = {
        '1': { number: 'Plot 1', development: 'Greenfield Gardens', price: 425000 },
        '2': { number: 'Plot 2', development: 'Greenfield Gardens', price: 325000 },
        '3': { number: 'Plot 3', development: 'Greenfield Gardens', price: 285000 }
    };

    const plot = plots[plotId] || plots['1'];
    
    document.getElementById('plotInfo').textContent = 
        `Reserving ${plot.number}, ${plot.development} - £${plot.price.toLocaleString()}`;
    
    if (document.getElementById('agreementPlot')) {
        document.getElementById('agreementPlot').textContent = 
            `${plot.number}, ${plot.development}`;
    }

    // Store plot info for later
    sessionStorage.setItem('reservationPlot', JSON.stringify(plot));
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
        if (!input.value) {
            alert('Please fill in all required fields');
            input.focus();
            return false;
        }
    }

    // Special validation for step 4 (signature)
    if (step === 4) {
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
    // Collect form data
    const formData = new FormData(document.getElementById('reservationForm'));
    const data = Object.fromEntries(formData);
    
    // Add signature
    if (signaturePad) {
        data.signature = signaturePad.toDataURL();
    }

    // Get plot info
    const plot = JSON.parse(sessionStorage.getItem('reservationPlot') || '{}');
    data.plot = plot;

    // Get selected payment method
    const selectedPayment = document.querySelector('.payment-method.selected');
    data.paymentMethod = selectedPayment ? 
        (selectedPayment.textContent.includes('Card') ? 'card' : 'bank') : 'card';

    // In production, send to API
    console.log('Reservation Data:', data);

    // Store reservation
    const reservations = JSON.parse(localStorage.getItem('nhp_reservations') || '[]');
    reservations.push({
        ...data,
        reservationDate: new Date().toISOString(),
        status: 'pending-payment',
        reservationId: 'RES-' + Date.now()
    });
    localStorage.setItem('nhp_reservations', JSON.stringify(reservations));

    // Show success modal
    showSuccessModal(plot);
}

function showSuccessModal(plot) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 3rem; max-width: 500px; width: 90%; text-align: center;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">🎉</div>
            <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary-black);">Congratulations!</h2>
            <p style="font-size: 1.125rem; color: var(--gray-700); margin-bottom: 2rem;">
                You've successfully reserved ${plot.number} at ${plot.development}
            </p>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; text-align: left;">
                <h3 style="font-weight: 600; margin-bottom: 1rem;">What happens next?</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">1.</span> We'll send your reservation agreement by email
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">2.</span> Our sales team will contact you within 24 hours
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">3.</span> You have 28 days to exchange contracts
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">4.</span> Your solicitor will receive all documents
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
