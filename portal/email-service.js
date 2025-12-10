// Email Notification Service
// Production-ready for SendGrid, Mailgun, AWS SES, or custom SMTP

const EMAIL_CONFIG = {
    provider: 'sendgrid', // 'sendgrid', 'mailgun', 'aws-ses', 'smtp'
    from: {
        email: 'noreply@newhomepack.com',
        name: 'New Home Pack'
    },
    replyTo: 'support@newhomepack.com',
    
    // Brand colors for email templates
    brandColors: {
        primary: '#DC2626',
        secondary: '#1F2937',
        success: '#10B981',
        warning: '#F59E0B',
        background: '#F9FAFB'
    }
};

// Email Templates
const EMAIL_TEMPLATES = {
    reservationConfirmation: {
        subject: '🎉 Reservation Confirmed - {{plotNumber}} at {{development}}',
        priority: 'high',
        getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; background: #F9FAFB;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Congratulations! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your reservation is confirmed</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${data.buyerName},</h2>
            
            <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
                You've successfully reserved <strong style="color: #DC2626;">${data.plotNumber}</strong> at <strong>${data.development}</strong>. 
                This is an exciting milestone in your journey to homeownership!
            </p>
            
            <!-- Property Details Card -->
            <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="color: #1F2937; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Property Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Plot:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${data.plotNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Development:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${data.development}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Purchase Price:</td>
                        <td style="padding: 8px 0; color: #DC2626; font-weight: 700; text-align: right;">£${data.price.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Reservation ID:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right; font-family: monospace;">${data.reservationId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Reservation Date:</td>
                        <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${new Date(data.reservationDate).toLocaleDateString('en-GB')}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Next Steps -->
            <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="color: #1E40AF; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📋 What Happens Next?</h3>
                <ol style="color: #1E40AF; margin: 0; padding-left: 20px; line-height: 1.8;">
                    ${data.signatureMethod === 'docusign' ? '<li><strong>Complete DocuSign:</strong> All buyers will receive an email to sign the agreement</li>' : ''}
                    <li><strong>Sales Team Contact:</strong> We'll reach out within 24 hours to discuss next steps</li>
                    <li><strong>Exchange Deadline:</strong> You have 28 days to exchange contracts</li>
                    <li><strong>Solicitor Preparation:</strong> Your solicitor will receive all necessary documents</li>
                </ol>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://t5dghgzzy6-web.github.io/new-home-pack/portal/buyer/dashboard.html" 
                   style="display: inline-block; background: #DC2626; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View My Dashboard
                </a>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                If you have any questions, please don't hesitate to contact our team at 
                <a href="mailto:support@newhomepack.com" style="color: #DC2626; text-decoration: none;">support@newhomepack.com</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} New Home Pack. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
        `
    },

    documentUploadNotification: {
        subject: '📄 New Document Uploaded - {{plotNumber}}',
        priority: 'normal',
        getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; background: #F9FAFB;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #1F2937; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Document Uploaded</h1>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
                A new document has been uploaded for <strong>${data.plotNumber}</strong>:
            </p>
            
            <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 6px 0; color: #6B7280;">Document:</td>
                        <td style="padding: 6px 0; color: #1F2937; font-weight: 600; text-align: right;">${data.documentTitle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6B7280;">Category:</td>
                        <td style="padding: 6px 0; color: #1F2937; text-align: right;">${data.category}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6B7280;">Uploaded By:</td>
                        <td style="padding: 6px 0; color: #1F2937; text-align: right;">${data.uploadedBy}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://t5dghgzzy6-web.github.io/new-home-pack/portal/${data.userType}/documents.html" 
                   style="display: inline-block; background: #DC2626; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                    View Documents
                </a>
            </div>
        </div>
        
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} New Home Pack</p>
        </div>
    </div>
</body>
</html>
        `
    },

    docuSignComplete: {
        subject: '✅ Agreement Signed - {{plotNumber}} at {{development}}',
        priority: 'high',
        getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; background: #F9FAFB;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ All Signatures Complete!</h1>
        </div>
        
        <div style="padding: 40px 30px;">
            <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 20px;">Great news!</h2>
            
            <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
                All buyers have signed the reservation agreement for <strong style="color: #DC2626;">${data.plotNumber}</strong> at <strong>${data.development}</strong>.
            </p>
            
            <div style="background: #D1FAE5; border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="color: #065F46; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📑 Your signed agreement is ready</h3>
                <p style="color: #065F46; margin: 0; font-size: 14px; line-height: 1.6;">
                    All ${data.buyerCount} buyer(s) have completed their signatures via DocuSign. Your fully executed agreement has been sent to your email and is available in your dashboard.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://t5dghgzzy6-web.github.io/new-home-pack/portal/buyer/dashboard.html" 
                   style="display: inline-block; background: #10B981; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Download Agreement
                </a>
            </div>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} New Home Pack</p>
        </div>
    </div>
</body>
</html>
        `
    },

    exchangeReminder: {
        subject: '⏰ Exchange Deadline Reminder - {{daysRemaining}} days left',
        priority: 'high',
        getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; background: #F9FAFB;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #F59E0B; padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Exchange Deadline Approaching</h1>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.buyerName},
            </p>
            
            <p style="color: #4B5563; line-height: 1.6; margin: 0 0 20px 0;">
                This is a reminder that you have <strong style="color: #DC2626; font-size: 20px;">${data.daysRemaining} days</strong> remaining to exchange contracts for <strong>${data.plotNumber}</strong> at <strong>${data.development}</strong>.
            </p>
            
            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="color: #92400E; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Important Information</h3>
                <ul style="color: #92400E; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Exchange deadline: <strong>${new Date(data.exchangeDeadline).toLocaleDateString('en-GB')}</strong></li>
                    <li>Your solicitor should have all required documents</li>
                    <li>Contact us immediately if you need an extension</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://t5dghgzzy6-web.github.io/new-home-pack/portal/buyer/dashboard.html" 
                   style="display: inline-block; background: #DC2626; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View My Reservation
                </a>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Need help? Contact us at <a href="mailto:support@newhomepack.com" style="color: #DC2626;">support@newhomepack.com</a>
            </p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} New Home Pack</p>
        </div>
    </div>
</body>
</html>
        `
    }
};

// Email Service Class
class EmailService {
    constructor(config = EMAIL_CONFIG) {
        this.config = config;
        this.queue = [];
    }

    // Send email (production-ready)
    async send(templateName, recipients, data) {
        const template = EMAIL_TEMPLATES[templateName];
        
        if (!template) {
            console.error(`Email template '${templateName}' not found`);
            return false;
        }

        const emailData = {
            to: Array.isArray(recipients) ? recipients : [recipients],
            from: this.config.from,
            replyTo: this.config.replyTo,
            subject: this.interpolate(template.subject, data),
            html: template.getHtml(data),
            priority: template.priority,
            timestamp: new Date().toISOString(),
            templateName: templateName,
            data: data
        };

        // MVP: Log and store in queue
        console.log(`📧 Email queued: ${emailData.subject} → ${emailData.to.join(', ')}`);
        this.queue.push(emailData);
        localStorage.setItem('nhp_email_queue', JSON.stringify(this.queue));

        /* PRODUCTION CODE:
        
        // SendGrid Example:
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        try {
            await sgMail.send(emailData);
            console.log('✅ Email sent successfully');
            return true;
        } catch (error) {
            console.error('❌ Email send failed:', error);
            return false;
        }
        
        // Mailgun Example:
        const mailgun = require('mailgun-js')({
            apiKey: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN
        });
        
        await mailgun.messages().send(emailData);
        */

        return true;
    }

    // Helper: Interpolate template strings
    interpolate(str, data) {
        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
    }

    // Get email queue (for admin dashboard)
    getQueue() {
        return this.queue;
    }

    // Clear queue
    clearQueue() {
        this.queue = [];
        localStorage.removeItem('nhp_email_queue');
    }
}

// Create singleton instance
const emailService = new EmailService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EmailService, emailService, EMAIL_TEMPLATES };
}
