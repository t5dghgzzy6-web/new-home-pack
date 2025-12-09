// Plot Detail Page Logic

// Demo plot data (same as plots.js - in production, this would come from API)
const plots = [
    {
        id: 1, number: 'Plot 1', development: 'Greenfield Gardens', developmentSlug: 'greenfield',
        type: 'Detached', typeSlug: 'detached', bedrooms: 4, bathrooms: 3, price: 425000, sqft: 1850,
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
        ],
        downloads: 24, status: 'available',
        description: 'Stunning 4-bedroom detached home with spacious garden and driveway. This beautiful property features contemporary living spaces, high-quality finishes throughout, and a south-facing garden perfect for entertaining.',
        features: ['En-suite Master Bedroom', 'Private Garden', 'Double Driveway', 'Double Garage', 'Open-Plan Kitchen/Dining', 'Utility Room', 'Guest WC'],
        location: 'Greenfield Gardens is a prestigious development in the heart of Berkshire, offering excellent transport links to London and Reading. Local amenities include highly-rated schools, shopping centers, and beautiful countryside walks.',
        epc: 'B',
        councilTax: 'Band E',
        tenure: 'Freehold'
    },
    {
        id: 2, number: 'Plot 2', development: 'Greenfield Gardens', developmentSlug: 'greenfield',
        type: 'Semi-Detached', typeSlug: 'semi-detached', bedrooms: 3, bathrooms: 2, price: 325000, sqft: 1200,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
            'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80'
        ],
        downloads: 18, status: 'available',
        description: 'Modern 3-bedroom semi-detached home perfect for families. Features include contemporary kitchen, spacious living areas, and low-maintenance garden.',
        features: ['En-suite', 'Garden', 'Parking', 'Modern Kitchen'],
        location: 'Greenfield Gardens, Berkshire',
        epc: 'B', councilTax: 'Band D', tenure: 'Freehold'
    },
    // Add more plots as needed
];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const plotId = parseInt(urlParams.get('id'));
    const autodownload = urlParams.get('autodownload');
    
    if (plotId) {
        loadPlotDetails(plotId);
        loadRelatedPlots(plotId);
        
        // Auto-download if coming from login/signup
        if (autodownload === 'true') {
            setTimeout(() => {
                downloadPack(plotId);
            }, 500);
        }
    } else {
        window.location.href = 'plots.html';
    }
});

function loadPlotDetails(id) {
    const plot = plots.find(p => p.id === id);
    
    if (!plot) {
        window.location.href = 'plots.html';
        return;
    }
    
    // Update page title and breadcrumb
    document.getElementById('pageTitle').textContent = `${plot.number} - ${plot.development} - New Home Pack`;
    document.getElementById('breadcrumbPlot').textContent = plot.number;
    
    // Render plot details
    const content = document.getElementById('plotContent');
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem;">
            <!-- Left Column - Images -->
            <div>
                <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;">
                    <img id="mainImage" src="${plot.image}" alt="${plot.number}" style="width: 100%; height: 500px; object-fit: cover;">
                    <div style="position: absolute; top: 1rem; left: 1rem; background: var(--primary-red); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 700; font-size: 1.125rem;">
                        £${plot.price.toLocaleString()}
                    </div>
                    <div style="position: absolute; top: 1rem; right: 1rem; background: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                        ${plot.bedrooms} Bed ${plot.type}
                    </div>
                </div>
                
                <!-- Gallery Thumbnails -->
                ${plot.gallery ? `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                        ${plot.gallery.map((img, idx) => `
                            <img src="${img}" alt="View ${idx + 1}" 
                                style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: border 0.2s;"
                                onclick="changeMainImage('${img}')"
                                onmouseover="this.style.borderColor='var(--primary-red)'"
                                onmouseout="this.style.borderColor='transparent'">
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Key Features -->
                <div style="margin-top: 2rem; padding: 1.5rem; background: var(--gray-50); border-radius: 12px;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary-black);">Key Features</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">🛏️</span>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">Bedrooms</div>
                                <div style="font-weight: 600;">${plot.bedrooms}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">🚿</span>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">Bathrooms</div>
                                <div style="font-weight: 600;">${plot.bathrooms}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">📏</span>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">Floor Area</div>
                                <div style="font-weight: 600;">${plot.sqft} sq ft</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">⚡</span>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">EPC Rating</div>
                                <div style="font-weight: 600;">${plot.epc || 'B'}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">💰</span>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">Council Tax</div>
                                <div style="font-weight: 600;">${plot.councilTax || 'Band D'}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">📜</span>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">Tenure</div>
                                <div style="font-weight: 600;">${plot.tenure || 'Freehold'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Column - Details -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div>
                        <h1 style="font-size: 2.5rem; font-weight: 800; color: var(--primary-black); margin-bottom: 0.5rem;">${plot.number}</h1>
                        <p style="font-size: 1.125rem; color: var(--gray-600);">${plot.development}</p>
                    </div>
                    <span style="background: #D1FAE5; color: #065F46; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                        AVAILABLE
                    </span>
                </div>
                
                <div style="padding: 1.5rem; background: var(--primary-red); color: white; border-radius: 12px; margin-bottom: 2rem;">
                    <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">Property Price</div>
                    <div style="font-size: 2.5rem; font-weight: 800;">£${plot.price.toLocaleString()}</div>
                    <div style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.5rem;">
                        Stamp Duty: £${calculateStampDuty(plot.price).toLocaleString()}
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <button class="btn btn-primary btn-full" onclick="downloadPack(${plot.id})">
                        📥 Download Pack
                    </button>
                    <button class="btn btn-secondary btn-full" onclick="bookViewing(${plot.id})">
                        📅 Book Viewing
                    </button>
                </div>
                
                <div style="text-align: center; padding: 1rem; background: var(--gray-50); border-radius: 8px; margin-bottom: 2rem;">
                    <div style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.25rem;">Pack Downloads</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-red);">${plot.downloads}</div>
                </div>
                
                <button class="btn btn-primary btn-full" onclick="reservePlot(${plot.id})" style="background: var(--accent-gold); border-color: var(--accent-gold);">
                    ⭐ Reserve This Plot
                </button>
                
                <!-- Description -->
                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--gray-200);">
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Description</h2>
                    <p style="line-height: 1.8; color: var(--gray-700);">${plot.description}</p>
                </div>
                
                <!-- Features List -->
                <div style="margin-top: 2rem;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Property Features</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        ${plot.features.map(feature => `
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="color: var(--accent-green); font-weight: 700;">✓</span>
                                <span style="color: var(--gray-700);">${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Location -->
                ${plot.location ? `
                    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--gray-200);">
                        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Location</h2>
                        <p style="line-height: 1.8; color: var(--gray-700);">${plot.location}</p>
                    </div>
                ` : ''}
                
                <!-- Contact -->
                <div style="margin-top: 2rem; padding: 1.5rem; background: var(--gray-50); border-radius: 12px;">
                    <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem;">Interested in this property?</h3>
                    <p style="color: var(--gray-600); margin-bottom: 1rem; font-size: 0.875rem;">Get in touch with our sales team for more information or to arrange a viewing.</p>
                    <div style="display: flex; gap: 1rem;">
                        <a href="tel:+441234567890" class="btn btn-secondary" style="text-decoration: none; flex: 1; text-align: center;">📞 Call Us</a>
                        <a href="mailto:hello@newhomepack.com" class="btn btn-secondary" style="text-decoration: none; flex: 1; text-align: center;">✉️ Email</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- What's Included in the Pack -->
        <div style="padding: 2rem; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; color: white;">
            <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; text-align: center;">What's Included in the Property Pack?</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <div>
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
                    <h4 style="font-weight: 600; margin-bottom: 0.5rem;">Legal Documents</h4>
                    <p style="opacity: 0.8; font-size: 0.875rem;">Draft contract, title evidence, planning permissions</p>
                </div>
                <div>
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏗️</div>
                    <h4 style="font-weight: 600; margin-bottom: 0.5rem;">Build Warranties</h4>
                    <p style="opacity: 0.8; font-size: 0.875rem;">NHBC certificate, snagging procedures, guarantees</p>
                </div>
                <div>
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📐</div>
                    <h4 style="font-weight: 600; margin-bottom: 0.5rem;">Plot Specifications</h4>
                    <p style="opacity: 0.8; font-size: 0.875rem;">Floor plans, boundaries, specifications</p>
                </div>
                <div>
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">💰</div>
                    <h4 style="font-weight: 600; margin-bottom: 0.5rem;">Cost Breakdown</h4>
                    <p style="opacity: 0.8; font-size: 0.875rem;">Service charges, ground rent, management fees</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn btn-primary btn-large" onclick="downloadPack(${plot.id})">Download Complete Pack Now</button>
            </div>
        </div>
    `;
}

function changeMainImage(imageSrc) {
    document.getElementById('mainImage').src = imageSrc;
}

function calculateStampDuty(price) {
    // Simplified UK stamp duty calculation for first-time buyers
    if (price <= 425000) return 0;
    if (price <= 625000) return (price - 425000) * 0.05;
    return 10000 + (price - 625000) * 0.05;
}

function downloadPack(id) {
    const plot = plots.find(p => p.id === id);
    
    // Check if user is logged in
    const user = getCurrentUser();
    
    if (!user) {
        // Not logged in - redirect to signup with return info
        if (confirm(`To download the complete property pack for ${plot.number}, please create a free account or sign in.\n\nYou'll get instant access to:\n✓ All legal documents\n✓ Floor plans & specifications\n✓ NHBC warranty details\n✓ Service charge information\n✓ And more...\n\nClick OK to create account or Cancel to sign in.`)) {
            window.location.href = `portal/signup.html?plot=${id}&action=download`;
        } else {
            window.location.href = `portal/login.html?plot=${id}&action=download`;
        }
        return;
    }
    
    // User is logged in - proceed with download
    performPackDownload(plot);
}

function performPackDownload(plot) {
    // Track download
    const downloads = JSON.parse(localStorage.getItem('nhp_downloads') || '[]');
    downloads.push({
        plotId: plot.id,
        plotNumber: plot.number,
        development: plot.development,
        downloadDate: new Date().toISOString(),
        price: plot.price
    });
    localStorage.setItem('nhp_downloads', JSON.stringify(downloads));
    
    // Show download modal
    showDownloadModal(plot);
}

function showDownloadModal(plot) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">Pack Download Started!</h2>
                <p style="color: var(--gray-600);">Your property pack for ${plot.number} is being prepared</p>
            </div>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h3 style="font-weight: 600; margin-bottom: 1rem;">What's included:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">✓</span> Legal Pack (Title, Searches, Planning)
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">✓</span> Floor Plans & Specifications
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">✓</span> NHBC Certificate & Warranties
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">✓</span> Service Charges & Management Info
                    </li>
                    <li style="padding: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--primary-red);">✓</span> Energy Performance Certificate
                    </li>
                </ul>
            </div>
            
            <div style="background: linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
                <p style="margin: 0; font-size: 0.875rem;">💡 In production, your PDF would download automatically</p>
            </div>
            
            <div style="display: flex; gap: 1rem;">
                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove(); window.location.href='portal/buyer/dashboard.html';" 
                    style="flex: 1; padding: 0.75rem; background: var(--primary-red); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    View My Dashboard
                </button>
                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove();" 
                    style="flex: 1; padding: 0.75rem; background: var(--gray-200); color: var(--primary-black); border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    Continue Browsing
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function getCurrentUser() {
    const sessionUser = sessionStorage.getItem('nhp_user');
    const localUser = localStorage.getItem('nhp_user');
    
    if (sessionUser) return JSON.parse(sessionUser);
    if (localUser) return JSON.parse(localUser);
    
    return null;
}

function bookViewing(id) {
    const plot = plots.find(p => p.id === id);
    alert(`Book a viewing of ${plot.number}\n\nYou can:\n• Visit our show home\n• Arrange a site visit\n• Schedule a virtual tour\n\nPlease create an account or sign in to book.`);
    window.location.href = `portal/signup.html?plot=${id}&action=viewing`;
}

function reservePlot(id) {
    const plot = plots.find(p => p.id === id);
    alert(`Reserve ${plot.number} - ${plot.development}\n\nPrice: £${plot.price.toLocaleString()}\n\nTo reserve this plot, you'll need to:\n1. Create an account\n2. Complete the reservation form\n3. Provide source of funds\n4. Pay reservation fee\n\nLet's get started!`);
    window.location.href = `portal/signup.html?plot=${id}&action=reserve`;
}

function loadRelatedPlots(currentPlotId) {
    const currentPlot = plots.find(p => p.id === currentPlotId);
    if (!currentPlot) return;
    
    // Find similar plots (same development or similar price range)
    const relatedPlots = plots
        .filter(p => p.id !== currentPlotId)
        .filter(p => 
            p.developmentSlug === currentPlot.developmentSlug || 
            Math.abs(p.price - currentPlot.price) < 100000
        )
        .slice(0, 3);
    
    const container = document.getElementById('relatedPlots');
    container.innerHTML = relatedPlots.map(plot => `
        <div class="feature-card" style="cursor: pointer;" onclick="window.location.href='plot-detail.html?id=${plot.id}'">
            <div style="position: relative; overflow: hidden; border-radius: 8px 8px 0 0; margin: -1.5rem -1.5rem 1rem -1.5rem;">
                <img src="${plot.image}" alt="${plot.number}" style="width: 100%; height: 180px; object-fit: cover;">
                <div style="position: absolute; bottom: 1rem; left: 1rem; background: var(--primary-red); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 700;">
                    £${plot.price.toLocaleString()}
                </div>
            </div>
            <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">${plot.number}</h3>
            <p style="color: var(--gray-600); font-size: 0.875rem; margin-bottom: 1rem;">${plot.development}</p>
            <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--gray-700);">
                <span>🛏️ ${plot.bedrooms} Beds</span>
                <span>🚿 ${plot.bathrooms} Baths</span>
                <span>📏 ${plot.sqft} sq ft</span>
            </div>
        </div>
    `).join('');
}
