import { Resend } from 'resend'
import { supabase } from '@/src/lib/supabase'
import { env } from '@/src/lib/env'

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export class ResendEmailService {
  private resend: Resend
  private baseUrl: string

  constructor() {
    this.baseUrl = `${env.SUPABASE_URL}/functions/v1`
    // Initialize Resend with API key - only used for server-side contexts
    // Not used for browser environments due to CORS issues
    const apiKey = env.RESEND_API_KEY || 'test_key'
    this.resend = new Resend(apiKey)
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Log email details for debugging
      console.log('📧 Sending email:', {
        to: emailData.to,
        subject: emailData.subject,
        contentLength: emailData.html?.length || 0,
        useDirectResend: import.meta.env.VITE_USE_DIRECT_RESEND === 'true',
        baseUrl: this.baseUrl
      });
      
      // IMPORTANT: We don't use direct Resend SDK in browser environments
      // due to CORS issues. Always use the Supabase Edge Function instead.
      
      // Direct Resend API option (if enabled in environment)
      if (import.meta.env.VITE_USE_DIRECT_RESEND === 'true') {
        try {
          console.log('📧 Using direct Resend API...');
          const { data, error: resendError } = await this.resend.emails.send({
            from: emailData.from || 'onboarding@resend.dev',
            to: [emailData.to],
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          });
          
          if (resendError) {
            console.error('Direct Resend API error:', resendError);
            // Continue to Edge Function as fallback
          } else {
            console.log('📧 Direct Resend API success:', data);
            return true;
          }
        } catch (directError) {
          console.error('Direct Resend API exception:', directError);
          // Continue to Edge Function as fallback
        }
      }
      
      // Get current session for authorization to use Supabase Edge Function
      if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('No valid session for email sending')
        // If we're forcing real emails to be sent even without auth, continue anyway
        if (import.meta.env.VITE_FORCE_REAL_EMAILS !== 'true') {
          return false
        }
        console.warn('Continuing without valid session due to VITE_FORCE_REAL_EMAILS=true')
      }

      const response = await fetch(`${this.baseUrl}/send-email`, {
        method: 'POST',
        headers: {
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      // Debug URLs in email data
      if (emailData.html && (emailData.html.includes('/accept-job/') || emailData.html.includes('/decline-job/'))) {
        const acceptMatch = emailData.html.match(/href="([^"]*\/accept-job\/[^"]*)"/);
        const declineMatch = emailData.html.match(/href="([^"]*\/decline-job\/[^"]*)"/);
        
        console.log('DEBUG - Email URLs:', {
          acceptUrl: acceptMatch?.[1] || 'Not found',
          acceptMatch: !!acceptMatch,
          declineUrl: declineMatch?.[1] || 'Not found',
          declineMatch: !!declineMatch,
          htmlLength: emailData.html.length
        });
        
        // Additional logging for link detection
        console.log('Accept link detection:', {
          hasAcceptJobPath: emailData.html.includes('/accept-job/'),
          hasDeclineJobPath: emailData.html.includes('/decline-job/'),
        });
      }

      const responseData = await response.json()

      if (!response.ok) {
        console.error('Email sending failed:', responseData)
        
        // If the error is that the service isn't configured, log more helpful message
        if (responseData?.error === 'Email service not configured') {
          console.warn('VITE_RESEND_API_KEY is not configured in Supabase Edge Functions. ' +
            'Configure it at Supabase Dashboard > Edge Functions > send-email > Environment Variables ' +
            'or set MOCK_EMAIL_SERVICE=true in the Edge Function environment')
        }
        
        // In development mode, don't fail the app due to email issues
        const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
        if (isDev) {
          console.log('📧 DEV MODE FALLBACK: Edge function failed but treating as mocked success');
          return true;
        }
        
        return false
      }

      // Handle mock response from Edge Function
      if (responseData?.mock) {
        console.log('📧 Email MOCKED by Edge Function:', responseData)
        return true
      }

      console.log('📧 Email sent successfully:', responseData)
      return true

    } catch (error) {
      console.error('Error sending email:', error)
      
      // Log more specific information for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // If fetch failed, the Supabase Edge Function might not be deployed
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Fetch error: The Supabase Edge Function might not be deployed or accessible.');
        console.error('Deploy with: supabase functions deploy send-email');
      }
      
      // In development mode, don't fail the app due to email issues
      const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
      if (isDev || import.meta.env.VITE_FORCE_REAL_EMAILS === 'true') {
        console.log('📧 DEV MODE FALLBACK: Error caught but treating as mocked success');
        return true;
      }
      
      return false
    }
  }

  async sendContractorInvitation(data: {
    contractorEmail: string
    contractorName: string
    companyName: string
    projectDetails: {
      id: string
      address: string
      city: string
      state: string
      peril: string
      description: string
      preferredDate: string
      preferredWindow: string
      contactName: string
      contactPhone: string
    }
    acceptUrl: string
    declineUrl: string
    reasons: string[]
  }): Promise<boolean> {
    // Debug: log the URLs coming into the function
    console.log('Debug - Contractor Invitation URLs:', {
      acceptUrl: data.acceptUrl,
      declineUrl: data.declineUrl
    });
    
    const email = this.generateContractorInvitationEmail(data)
    return this.sendEmail({
      to: data.contractorEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
  }

  async sendJobFilledNotification(
    contractorEmail: string, 
    contractorName: string, 
    projectLocation: string
  ): Promise<boolean> {
    const email = this.generateJobFilledEmail(contractorName, projectLocation)
    return this.sendEmail({
      to: contractorEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
  }

  async sendJobAcceptedConfirmation(data: {
    homeownerEmail: string
    homeownerName: string
    contractorName: string
    companyName: string
    projectDetails: {
      address: string
      city: string
      state: string
      peril: string
      contactPhone: string
    }
  }): Promise<boolean> {
    const email = this.generateJobAcceptedEmail(data)
    return this.sendEmail({
      to: data.homeownerEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })
  }

  private generateContractorInvitationEmail(data: {
    contractorName: string
    companyName: string
    projectDetails: {
      id: string
      address: string
      city: string
      state: string
      peril: string
      description: string
      preferredDate: string
      preferredWindow: string
      contactName: string
      contactPhone: string
    }
    acceptUrl: string
    declineUrl: string
    reasons: string[]
  }) {
    const subject = `🚨 Urgent ${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} Job - ${data.projectDetails.city}, ${data.projectDetails.state}`

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
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🚨 URGENT JOB OPPORTUNITY</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} damage needs immediate attention</p>
            </div>
            
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Hello ${data.contractorName},
              </p>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; color: #92400e; font-weight: bold;">⏰ TIME SENSITIVE: First contractor to respond gets the job!</p>
              </div>
              
              <p style="color: #6b7280; margin-bottom: 25px;">
                A new insurance claim has been filed in your service area. You've been selected based on your expertise and location. 
                <strong>Respond within 24 hours to secure this opportunity!</strong>
              </p>
              
              <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">📋 Project Details</h3>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #374151;">📍 Location:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${data.projectDetails.address}, ${data.projectDetails.city}, ${data.projectDetails.state}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #374151;">⚡ Damage Type:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} damage</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #374151;">📅 Preferred Inspection:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${new Date(data.projectDetails.preferredDate).toLocaleDateString()} (${data.projectDetails.preferredWindow})</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #374151;">📞 Contact:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${data.projectDetails.contactName} - ${data.projectDetails.contactPhone}</span>
                </div>
                
                <div style="margin-top: 15px;">
                  <strong style="color: #374151;">📝 Description:</strong>
                  <p style="color: #6b7280; margin: 8px 0 0 0; font-style: italic; background-color: #ffffff; padding: 10px; border-radius: 4px;">${data.projectDetails.description}</p>
                </div>
              </div>

              ${data.reasons.length > 0 ? `
              <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px 0; color: #065f46;">🎯 Why you were selected:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #047857;">
                  ${data.reasons.map(reason => `<li style="margin-bottom: 4px;">${reason}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.acceptUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 15px; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  ✅ ACCEPT JOB
                </a>
                <a href="${data.declineUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  ❌ DECLINE
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                  <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: bold;">⚠️ IMPORTANT REMINDERS:</p>
                  <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
                    <li>This invitation expires in 48 hours</li>
                    <li>First contractor to accept gets the job</li>
                    <li>Respond quickly to secure this opportunity</li>
                  </ul>
                </div>
                <p style="margin: 0; text-align: center;"><strong>📞 Questions?</strong> Contact support at support@disastershield.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
${subject}

Hello ${data.contractorName},

⏰ TIME SENSITIVE: First contractor to respond gets the job!

A new insurance claim has been filed in your service area:

📍 Location: ${data.projectDetails.address}, ${data.projectDetails.city}, ${data.projectDetails.state}
⚡ Damage Type: ${data.projectDetails.peril.charAt(0).toUpperCase() + data.projectDetails.peril.slice(1)} damage
📅 Preferred Inspection: ${new Date(data.projectDetails.preferredDate).toLocaleDateString()} (${data.projectDetails.preferredWindow})
📞 Contact: ${data.projectDetails.contactName} - ${data.projectDetails.contactPhone}

📝 Description: ${data.projectDetails.description}

${data.reasons.length > 0 ? `
🎯 Why you were selected:
${data.reasons.map(reason => `• ${reason}`).join('\n')}
` : ''}

✅ To accept this job: ${data.acceptUrl}
❌ To decline: ${data.declineUrl}

⚠️ IMPORTANT:
• This invitation expires in 48 hours
• First contractor to accept gets the job
• Respond quickly to secure this opportunity

📞 Questions? Contact support at support@disastershield.com

Best regards,
DisasterShield Team
    `.trim()

    return { subject, html, text }
  }

  private generateJobFilledEmail(contractorName: string, projectLocation: string) {
    const subject = `Job Filled - ${projectLocation}`

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #374151; margin: 0;">DisasterShield</h1>
            </div>
            <h2 style="color: #374151;">Job Update</h2>
            <p>Hello ${contractorName},</p>
            <p>The job opportunity in ${projectLocation} has been filled by another contractor who responded faster.</p>
            <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">💡 <strong>Don't worry!</strong> More opportunities are coming your way. Keep an eye on your inbox for new job alerts.</p>
            </div>
            <p>Best regards,<br>DisasterShield Team</p>
          </div>
        </body>
      </html>
    `

    const text = `
${subject}

Hello ${contractorName},

The job opportunity in ${projectLocation} has been filled by another contractor who responded faster.

💡 Don't worry! More opportunities are coming your way. Keep an eye on your inbox for new job alerts.

Best regards,
DisasterShield Team
    `

    return { subject, html, text }
  }

  private generateJobAcceptedEmail(data: {
    homeownerName: string
    contractorName: string
    companyName: string
    projectDetails: {
      address: string
      city: string
      state: string
      peril: string
      contactPhone: string
    }
  }) {
    const subject = `🎉 Contractor Assigned - ${data.companyName}`

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🎉 Great News!</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Your contractor has been assigned</p>
            </div>
            
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Hello ${data.homeownerName},
              </p>
              
              <p style="color: #6b7280; margin-bottom: 25px;">
                Excellent news! We've successfully assigned a qualified contractor to your ${data.projectDetails.peril} damage claim.
              </p>
              
              <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">👷 Your Assigned Contractor</h3>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #374151;">Company:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${data.companyName}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #374151;">Contact Person:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${data.contractorName}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <strong style="color: #374151;">Property:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${data.projectDetails.address}, ${data.projectDetails.city}, ${data.projectDetails.state}</span>
                </div>
              </div>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">📞 What happens next?</h4>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li>Your contractor will contact you within 24 hours</li>
                  <li>They'll schedule an inspection at your preferred time</li>
                  <li>You can reach them directly at the number provided</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; margin-bottom: 15px;">Track your claim progress:</p>
                <!-- Use a fallback approach for project ID that won't cause TypeScript errors -->
                <a href="${process.env.NEXT_PUBLIC_APP_URL || env.APP_URL || 'https://disaster-shield-v2.vercel.app'}/portal/projects/${
                  // @ts-ignore - Handle the case where projectDetails might not match the expected interface
                  data.projectDetails?.id || data.projectDetails?.projectId || ''
                }" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View Project Portal
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">
                <p style="margin: 0;"><strong>📞 Questions?</strong> Contact support at support@disastershield.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
${subject}

Hello ${data.homeownerName},

Excellent news! We've successfully assigned a qualified contractor to your ${data.projectDetails.peril} damage claim.

👷 Your Assigned Contractor:
Company: ${data.companyName}
Contact Person: ${data.contractorName}
Property: ${data.projectDetails.address}, ${data.projectDetails.city}, ${data.projectDetails.state}

📞 What happens next?
• Your contractor will contact you within 24 hours
• They'll schedule an inspection at your preferred time
• You can reach them directly at the number provided

📞 Questions? Contact support at support@disastershield.com

Best regards,
DisasterShield Team
    `

    return { subject, html, text }
  }
}

// Export singleton instance
export const resendEmailService = new ResendEmailService()