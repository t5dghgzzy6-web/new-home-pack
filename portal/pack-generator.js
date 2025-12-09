// Property Pack Generation with Signed Reservation Agreement

class PropertyPackGenerator {
    constructor() {
        this.packComponents = {
            titleDeeds: true,
            localSearches: true,
            planningDocuments: true,
            warranties: true,
            buildingRegs: true,
            energyCertificate: true,
            reservationAgreement: true, // NEW: Include signed reservation
            paymentReceipt: true // NEW: Include payment confirmation
        };
    }

    // Generate complete property pack including reservation agreement
    async generateCompletePack(plotId, reservationId = null) {
        const pack = {
            plotId: plotId,
            generatedDate: new Date().toISOString(),
            generatedBy: getCurrentUser()?.email || 'system',
            documents: []
        };

        // Add standard property documents
        pack.documents.push(
            this.generateDocument('Title Deeds', 'title_deeds.pdf'),
            this.generateDocument('Local Authority Searches', 'local_searches.pdf'),
            this.generateDocument('Planning Permissions', 'planning.pdf'),
            this.generateDocument('NHBC Warranty', 'warranty.pdf'),
            this.generateDocument('Building Regulations', 'building_regs.pdf'),
            this.generateDocument('Energy Performance Certificate', 'epc.pdf')
        );

        // If reservation exists, include signed agreement and receipt
        if (reservationId) {
            const reservation = this.getReservation(reservationId);
            
            if (reservation) {
                // Add signed reservation agreement
                pack.documents.push(
                    this.generateReservationAgreementDocument(reservation)
                );

                // Add payment receipt
                if (reservation.payment) {
                    pack.documents.push(
                        this.generatePaymentReceiptDocument(reservation.payment)
                    );
                }

                pack.reservationIncluded = true;
                pack.reservationId = reservationId;
                pack.reservationDate = reservation.reservationDate;
                pack.buyers = reservation.buyers;
            }
        }

        return pack;
    }

    // Generate reservation agreement document metadata
    generateReservationAgreementDocument(reservation) {
        const buyers = reservation.buyers || [
            { name: `${reservation.firstName} ${reservation.lastName}` }
        ];
        const buyerNames = buyers.map(b => b.name).join(' & ');

        return {
            name: 'Signed Reservation Agreement',
            filename: `Reservation_Agreement_${reservation.plot?.number.replace(' ', '_')}_${reservation.reservationId}.pdf`,
            type: 'legal',
            category: 'Reservation',
            signedDate: reservation.reservationDate,
            signatureMethod: reservation.signatures?.method || 'canvas',
            buyers: buyers,
            plot: reservation.plot,
            status: 'signed',
            description: `Fully signed reservation agreement for ${reservation.plot?.number} by ${buyerNames}`,
            metadata: {
                customTCs: reservation.customTCs || false,
                docuSignEnvelopeId: reservation.docuSignEnvelopeId || null,
                numberOfBuyers: buyers.length
            }
        };
    }

    // Generate payment receipt document metadata
    generatePaymentReceiptDocument(payment) {
        return {
            name: 'Reservation Fee Payment Receipt',
            filename: `Payment_Receipt_${payment.receiptNumber}.pdf`,
            type: 'financial',
            category: 'Payment',
            date: payment.paymentDate,
            amount: payment.grossAmount,
            description: `Payment receipt for reservation fee - ${payment.receiptNumber}`,
            metadata: {
                netAmount: payment.netAmount,
                vatAmount: payment.vatAmount,
                paymentMethod: payment.paymentMethod,
                reference: payment.reference
            }
        };
    }

    // Generate standard document metadata
    generateDocument(name, filename) {
        return {
            name: name,
            filename: filename,
            type: 'property',
            category: this.getCategoryForDocument(name),
            description: `Official ${name} for the property`
        };
    }

    // Get category for document
    getCategoryForDocument(name) {
        if (name.includes('Title')) return 'Legal';
        if (name.includes('Search')) return 'Searches';
        if (name.includes('Planning')) return 'Planning';
        if (name.includes('Warranty') || name.includes('NHBC')) return 'Warranty';
        if (name.includes('Building')) return 'Building Control';
        if (name.includes('Energy') || name.includes('EPC')) return 'Energy';
        return 'General';
    }

    // Get reservation from storage
    getReservation(reservationId) {
        const reservations = JSON.parse(localStorage.getItem('nhp_reservations') || '[]');
        return reservations.find(r => r.reservationId === reservationId);
    }

    // Send pack via email to all parties
    async sendPackByEmail(pack, recipients) {
        const emailData = {
            to: recipients.buyers || [],
            cc: recipients.solicitors || [],
            bcc: recipients.developer || [],
            subject: this.generateEmailSubject(pack),
            body: this.generateEmailBody(pack),
            attachments: pack.documents.map(doc => ({
                filename: doc.filename,
                contentType: 'application/pdf',
                content: 'base64_encoded_content' // In production, actual file content
            }))
        };

        /* Production implementation:
        const response = await fetch('/api/send-property-pack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        
        return await response.json();
        */

        // Simulate email sending
        console.log('Property Pack Email:', emailData);
        
        // Track delivery
        this.trackPackDelivery(pack, recipients);
        
        return {
            success: true,
            sentTo: recipients.buyers?.length || 0,
            sentAt: new Date().toISOString(),
            packId: pack.plotId + '-' + Date.now()
        };
    }

    // Generate email subject
    generateEmailSubject(pack) {
        if (pack.reservationIncluded) {
            return `Complete Property Pack & Signed Reservation Agreement - ${pack.plotId}`;
        }
        return `Property Information Pack - ${pack.plotId}`;
    }

    // Generate email body
    generateEmailBody(pack) {
        const buyerNames = pack.buyers ? pack.buyers.map(b => b.name).join(' and ') : 'Valued Customer';
        const reservationSection = pack.reservationIncluded ? `

Your Signed Reservation Agreement:
- Reservation Date: ${new Date(pack.reservationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
- Signed by: ${pack.buyers.map(b => b.name).join(', ')}
- Method: ${pack.documents.find(d => d.category === 'Reservation')?.signatureMethod === 'docusign' ? 'DocuSign E-Signature' : 'Electronic Signature'}

This legally binding agreement confirms your reservation and will be forwarded to your solicitor.
` : '';

        return `
Dear ${buyerNames},

Thank you for your interest in ${pack.plotId}. Please find attached your complete property information pack.
${reservationSection}
Documents Included:
${pack.documents.map((doc, index) => `${index + 1}. ${doc.name}`).join('\n')}

All documents are provided in PDF format and can be shared with your solicitor and mortgage lender.

Key Information:
- Pack Generated: ${new Date(pack.generatedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
- Total Documents: ${pack.documents.length}
- Property Reference: ${pack.plotId}

If you have any questions or require additional information, please don't hesitate to contact us.

Kind regards,
New Home Pack Team

---
This email and any attachments are confidential and intended solely for the addressee(s). 
If you have received this email in error, please notify the sender immediately and delete it.
        `.trim();
    }

    // Track pack delivery
    trackPackDelivery(pack, recipients) {
        const deliveries = JSON.parse(localStorage.getItem('nhp_pack_deliveries') || '[]');
        
        deliveries.push({
            packId: pack.plotId + '-' + Date.now(),
            plotId: pack.plotId,
            reservationId: pack.reservationId,
            deliveredTo: recipients,
            deliveredAt: new Date().toISOString(),
            documentsCount: pack.documents.length,
            includesReservation: pack.reservationIncluded || false,
            deliveredBy: getCurrentUser()?.email
        });
        
        localStorage.setItem('nhp_pack_deliveries', JSON.stringify(deliveries));
    }

    // Download pack as ZIP
    async downloadPackAsZip(pack) {
        // In production, this would create actual ZIP file
        showNotification('Preparing property pack for download...', 'info');
        
        setTimeout(() => {
            console.log('Property Pack ZIP Contents:', pack);
            showNotification(`Property pack with ${pack.documents.length} documents ready`, 'success');
            
            /* Production implementation using JSZip:
            const zip = new JSZip();
            const folder = zip.folder(`Property_Pack_${pack.plotId}`);
            
            // Add each document to ZIP
            for (const doc of pack.documents) {
                const content = await fetchDocumentContent(doc);
                folder.file(doc.filename, content);
            }
            
            // Generate ZIP and trigger download
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Property_Pack_${pack.plotId}_${Date.now()}.zip`;
            a.click();
            */
        }, 1500);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PropertyPackGenerator;
}

// Utility function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#D32F2F'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Helper to get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('nhp_current_user') || sessionStorage.getItem('nhp_current_user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}
