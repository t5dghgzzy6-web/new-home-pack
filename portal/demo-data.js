// Demo Data Generator for New Home Pack
// Uses real team member names for personalized testing

function generateDemoData() {
    console.log('🎬 Generating demo data with team names...');
    
    // Team members
    const teamMembers = [
        { firstName: 'Louise', lastName: 'Melling', email: 'louise.melling@example.com' },
        { firstName: 'Ruth', lastName: 'Beeton', email: 'ruth.beeton@example.com' },
        { firstName: 'Linda', lastName: 'Belshaw', email: 'linda.belshaw@example.com' },
        { firstName: 'Amy', lastName: 'Short', email: 'amy.short@example.com' },
        { firstName: 'Jo', lastName: 'Wright', email: 'jo.wright@example.com' },
        { firstName: 'Nat', lastName: 'Croll', email: 'nat.croll@example.com' },
        { firstName: 'Simon', lastName: 'Priestley', email: 'simon.priestley@example.com' },
        { firstName: 'Michael', lastName: 'Clark', email: 'michael.clark@example.com' }
    ];
    
    // Development names
    const developments = [
        'Riverside Gardens',
        'Meadow View',
        'Oak Heights',
        'Cedar Park',
        'Willow Brook',
        'Maple Ridge'
    ];
    
    // Create 8 reservations - one for each team member
    const today = new Date();
    const reservations = [];
    
    teamMembers.forEach((member, index) => {
        // Vary the reservation dates to create different deadline scenarios
        let daysAgo;
        if (index === 0) daysAgo = 21; // 7 days until deadline
        else if (index === 1) daysAgo = 25; // 3 days until deadline
        else if (index === 2) daysAgo = 27; // 1 day until deadline
        else if (index === 3) daysAgo = 14; // 14 days until deadline
        else if (index === 4) daysAgo = 10; // 18 days until deadline
        else if (index === 5) daysAgo = 5;  // 23 days until deadline
        else if (index === 6) daysAgo = 2;  // 26 days until deadline (almost at deadline)
        else daysAgo = 28; // At deadline today!
        
        const reservationDate = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        
        const reservation = {
            id: `RES-${1000 + index}`,
            reservationDate: reservationDate.getTime(),
            buyerName: `${member.firstName} ${member.lastName}`,
            buyerEmail: member.email,
            buyerPhone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`,
            plotNumber: `${10 + index}`,
            developmentName: developments[index % developments.length],
            price: 350000 + (index * 25000), // Prices from £350k to £525k
            depositPaid: true,
            depositAmount: 5000,
            solicitorName: index % 2 === 0 ? 'Harrison & Co Solicitors' : 'Thompson Legal Services',
            solicitorEmail: index % 2 === 0 ? 'conveyancing@harrison-solicitors.com' : 'legal@thompson-legal.com',
            solicitorPhone: index % 2 === 0 ? '01234 567890' : '01234 567891',
            status: 'reserved',
            documents: {
                identityVerified: true,
                proofOfFunds: true,
                mortgageOffer: index > 2 ? true : false,
                surveyComplete: index > 4 ? true : false
            }
        };
        
        reservations.push(reservation);
        localStorage.setItem(`nhp_reservation_${reservation.id}`, JSON.stringify(reservation));
    });
    
    console.log(`✅ Created ${reservations.length} reservations`);
    
    // Create some leads for the sales dashboard
    const leadStatuses = ['new', 'contacted', 'viewing_scheduled', 'offer_made', 'converted'];
    const leadSources = ['Website', 'Rightmove', 'Walk-in', 'Referral', 'Estate Agent'];
    
    const leads = teamMembers.slice(0, 5).map((member, index) => {
        return {
            id: `LEAD-${2000 + index}`,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            phone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`,
            status: leadStatuses[index],
            source: leadSources[index],
            budget: `£${300 + (index * 50)},000 - £${400 + (index * 50)},000`,
            development: developments[index],
            plot: index < 3 ? `Plot ${15 + index}` : '',
            notes: `Initial contact made. ${member.firstName} is interested in ${developments[index]}.`,
            created: new Date(today.getTime() - ((7 - index) * 24 * 60 * 60 * 1000)).getTime(),
            lastContact: new Date(today.getTime() - (index * 24 * 60 * 60 * 1000)).getTime()
        };
    });
    
    localStorage.setItem('nhp_leads', JSON.stringify(leads));
    console.log(`✅ Created ${leads.length} sales leads`);
    
    // Create some enquiries for the solicitor dashboard
    const enquiryTypes = [
        'Missing Information',
        'Title Issue',
        'Search Query',
        'Mortgage Condition',
        'Lease Clarification'
    ];
    
    const enquiries = reservations.slice(0, 4).map((res, index) => {
        return {
            id: `ENQ-${3000 + index}`,
            reservationId: res.id,
            buyerName: res.buyerName,
            plotNumber: res.plotNumber,
            type: enquiryTypes[index],
            priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
            status: index < 2 ? 'pending' : 'responded',
            question: `Query regarding ${enquiryTypes[index].toLowerCase()} for ${res.developmentName} Plot ${res.plotNumber}`,
            created: new Date(today.getTime() - ((5 - index) * 24 * 60 * 60 * 1000)).getTime(),
            responses: index >= 2 ? [{
                from: 'Solicitor',
                message: 'We have reviewed this and will provide an update shortly.',
                timestamp: new Date(today.getTime() - ((4 - index) * 24 * 60 * 60 * 1000)).getTime()
            }] : []
        };
    });
    
    enquiries.forEach(enq => {
        localStorage.setItem(`nhp_enquiry_${enq.id}`, JSON.stringify(enq));
    });
    
    console.log(`✅ Created ${enquiries.length} enquiries`);
    
    // Summary
    const summary = {
        reservations: reservations.length,
        leads: leads.length,
        enquiries: enquiries.length,
        teamMembers: teamMembers.map(m => `${m.firstName} ${m.lastName}`)
    };
    
    console.log('📊 Demo Data Summary:', summary);
    console.log('');
    console.log('🎯 Exchange Deadlines:');
    reservations.forEach(res => {
        const resDate = new Date(res.reservationDate);
        const deadline = new Date(resDate);
        deadline.setDate(deadline.getDate() + 28);
        const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const urgency = daysRemaining <= 1 ? '🔴 CRITICAL' : 
                       daysRemaining <= 3 ? '🟠 URGENT' : 
                       daysRemaining <= 7 ? '🟡 WARNING' : '✅';
        console.log(`${urgency} ${res.buyerName} - Plot ${res.plotNumber}: ${daysRemaining} days remaining`);
    });
    
    return summary;
}

function clearDemoData() {
    console.log('🗑️ Clearing demo data...');
    
    // Clear reservations
    for (let i = 1000; i < 1010; i++) {
        localStorage.removeItem(`nhp_reservation_RES-${i}`);
        localStorage.removeItem(`nhp_reminders_RES-${i}`);
    }
    
    // Clear leads
    localStorage.removeItem('nhp_leads');
    
    // Clear enquiries
    for (let i = 3000; i < 3010; i++) {
        localStorage.removeItem(`nhp_enquiry_ENQ-${i}`);
    }
    
    // Clear automation logs
    localStorage.removeItem('nhp_reminder_log');
    localStorage.removeItem('nhp_email_queue');
    
    console.log('✅ Demo data cleared');
}

// Auto-generate on page load if requested
if (window.location.search.includes('demo=true')) {
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            generateDemoData();
            console.log('✅ Demo data auto-generated. Remove ?demo=true from URL to prevent this.');
        }, 1000);
    });
}

// Export for console use
window.generateDemoData = generateDemoData;
window.clearDemoData = clearDemoData;

console.log('💡 Demo data generator loaded. Use:');
console.log('   generateDemoData() - Create demo data with team names');
console.log('   clearDemoData() - Remove all demo data');
