// Email templates for contractor notifications
// Note: In production, integrate with Resend or similar service

export interface ContractorInviteData {
  contractorName: string;
  companyName: string;
  projectDetails: {
    id: string;
    address: string;
    city: string;
    state: string;
    peril: string;
    description: string;
    preferredDate: string;
    preferredWindow: string;
    contactName: string;
    contactPhone: string;
  };
  acceptUrl: string;
  declineUrl: string;
  reasons: string[];
}

export function generateContractorInviteEmail(data: ContractorInviteData): {
  subject: string;
  html: string;
  text: string;
} {
  // Debug: log the URLs coming into the template
  console.log('Template URLs:', {
    acceptUrl: data.acceptUrl,
    declineUrl: data.declineUrl
  });
  
  const subject = `New ${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} Job Opportunity - ${data.projectDetails.city}, ${data.projectDetails.state}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🚨 Urgent Job Opportunity</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} damage needs immediate attention</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
              Hello ${data.contractorName},
            </p>
            
            <p style="color: #6b7280; margin-bottom: 25px;">
              A new insurance claim has been filed in your service area. You've been selected based on your expertise and location. 
              <strong>Respond quickly to secure this job!</strong>
            </p>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Project Details</h3>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Location:</strong>
                <span style="color: #6b7280; margin-left: 8px;">${data.projectDetails.address}, ${data.projectDetails.city}, ${data.projectDetails.state}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Damage Type:</strong>
                <span style="color: #6b7280; margin-left: 8px;">${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} damage</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Preferred Inspection:</strong>
                <span style="color: #6b7280; margin-left: 8px;">${new Date(data.projectDetails.preferredDate).toLocaleDateString()} (${data.projectDetails.preferredWindow})</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Contact:</strong>
                <span style="color: #6b7280; margin-left: 8px;">${data.projectDetails.contactName} - ${data.projectDetails.contactPhone}</span>
              </div>
              
              <div style="margin-top: 15px;">
                <strong style="color: #374151;">Description:</strong>
                <p style="color: #6b7280; margin: 8px 0 0 0; font-style: italic;">${data.projectDetails.description}</p>
              </div>
            </div>

            ${data.reasons.length > 0 ? `
            <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
              <h4 style="margin: 0 0 10px 0; color: #065f46;">Why you were selected:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #047857;">
                ${data.reasons.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.acceptUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 15px; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                ✅ Accept Job
              </a>
              <a href="${data.declineUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                ❌ Decline
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 10px 0;"><strong>⏰ Time Sensitive:</strong> This invitation expires in 48 hours.</p>
              <p style="margin: 0 0 10px 0;"><strong>🏆 First Come, First Served:</strong> The first contractor to accept gets the job.</p>
              <p style="margin: 0;"><strong>📞 Questions?</strong> Contact support at support@disastershield.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
${subject}

Hello ${data.contractorName},

A new insurance claim has been filed in your service area:

Location: ${data.projectDetails.address}, ${data.projectDetails.city}, ${data.projectDetails.state}
Damage Type: ${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} damage
Preferred Inspection: ${new Date(data.projectDetails.preferredDate).toLocaleDateString()} (${data.projectDetails.preferredWindow})
Contact: ${data.projectDetails.contactName} - ${data.projectDetails.contactPhone}

Description: ${data.projectDetails.description}

${data.reasons.length > 0 ? `
Why you were selected:
${data.reasons.map(reason => `• ${reason}`).join('\n')}
` : ''}

To accept this job: ${data.acceptUrl}
To decline: ${data.declineUrl}

⏰ This invitation expires in 48 hours.
🏆 First contractor to accept gets the job.

Best regards,
DisasterShield Team
  `.trim();

  return { subject, html, text };
}

export function generateJobFilledNotification(contractorName: string, projectLocation: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Job Filled - ${projectLocation}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px;">
          <h2 style="color: #374151;">Job Update</h2>
          <p>Hello ${contractorName},</p>
          <p>The job opportunity in ${projectLocation} has been filled by another contractor.</p>
          <p>Don't worry - more opportunities are coming your way! Keep an eye on your inbox for new job alerts.</p>
          <p>Best regards,<br>DisasterShield Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${subject}

Hello ${contractorName},

The job opportunity in ${projectLocation} has been filled by another contractor.

Don't worry - more opportunities are coming your way! Keep an eye on your inbox for new job alerts.

Best regards,
DisasterShield Team
  `;

  return { subject, html, text };
}
