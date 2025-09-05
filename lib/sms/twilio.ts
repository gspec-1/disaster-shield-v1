// Twilio SMS service for contractor notifications
import { Twilio } from 'twilio';

export interface SMSNotification {
  to: string;
  message: string;
}

export interface ContractorSMSData {
  contractorPhone: string;
  contractorName: string;
  companyName: string;
  projectId: string;
  projectAddress: string;
  projectCity: string;
  projectState: string;
  peril: string;
  description: string;
  contactName: string;
  contactPhone: string;
  preferredDate: string;
  preferredWindow: string;
  acceptUrl: string;
  declineUrl: string;
  reasons: string[];
}

export class TwilioSMSService {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = import.meta.env.TWILIO_AUTH_TOKEN || 'b637b70d4c0d157cdd6c03717d0c4b69';
    const fromNumber = import.meta.env.TWILIO_PHONE_NUMBER;

    // Check if running in Node.js environment (server-side)
    const isNodeEnvironment = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
    
    if (!accountSid || !authToken || !fromNumber || !isNodeEnvironment) {
      console.warn('Twilio credentials not configured. SMS notifications will be simulated.');
      this.client = null as any;
      this.fromNumber = '+15551234567'; // Fallback for simulation
    } else {
      this.client = new Twilio(accountSid, authToken);
      this.fromNumber = fromNumber;
    }
  }

  async sendContractorJobAlert(data: ContractorSMSData): Promise<boolean> {
    const message = this.generateJobAlertMessage(data);
    
    if (!this.client) {
      // Simulate SMS sending for development
      console.log('📱 SMS would be sent to:', data.contractorPhone);
      console.log('📱 Message:', message);
      console.log('📱 Accept URL:', data.acceptUrl);
      console.log('📱 Decline URL:', data.declineUrl);
      return true;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: data.contractorPhone,
      });

      console.log('SMS sent successfully:', result.sid);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  async sendJobFilledNotification(contractorPhone: string, contractorName: string, projectLocation: string): Promise<boolean> {
    const message = `Hi ${contractorName}, the job in ${projectLocation} has been filled by another contractor. More opportunities coming soon! - DisasterShield`;
    
    if (!this.client) {
      console.log('📱 Job filled SMS would be sent to:', contractorPhone);
      console.log('📱 Message:', message);
      return true;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: contractorPhone,
      });

      console.log('Job filled SMS sent:', result.sid);
      return true;
    } catch (error) {
      console.error('Failed to send job filled SMS:', error);
      return false;
    }
  }

  async sendJobAcceptedConfirmation(contractorPhone: string, contractorName: string, projectDetails: any): Promise<boolean> {
    const message = `🎉 Congratulations ${contractorName}! You've been assigned the ${projectDetails.peril} damage job at ${projectDetails.address}, ${projectDetails.city}. Contact: ${projectDetails.contactName} ${projectDetails.contactPhone}. Please reach out within 24 hours. - DisasterShield`;
    
    if (!this.client) {
      console.log('📱 Job accepted confirmation SMS would be sent to:', contractorPhone);
      console.log('📱 Message:', message);
      return true;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: contractorPhone,
      });

      console.log('Job accepted confirmation SMS sent:', result.sid);
      return true;
    } catch (error) {
      console.error('Failed to send job accepted confirmation SMS:', error);
      return false;
    }
  }

  async sendHomeownerMatchNotification(homeownerPhone: string, homeownerName: string, contractorName: string, companyName: string): Promise<boolean> {
    const message = `Good news ${homeownerName}! We've matched you with ${contractorName} from ${companyName} for your claim. They'll contact you within 24 hours to schedule inspection. Track progress at your DisasterShield portal. - DisasterShield`;
    
    if (!this.client) {
      console.log('📱 Homeowner match SMS would be sent to:', homeownerPhone);
      console.log('📱 Message:', message);
      return true;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: homeownerPhone,
      });

      console.log('Homeowner match SMS sent:', result.sid);
      return true;
    } catch (error) {
      console.error('Failed to send homeowner match SMS:', error);
      return false;
    }
  }

  private generateJobAlertMessage(data: ContractorSMSData): string {
    const urgentEmoji = data.peril === 'water' || data.peril === 'flood' ? '🚨' : '⚡';
    const reasonsText = data.reasons.length > 0 ? `\n\nWhy selected: ${data.reasons.slice(0, 2).join(', ')}` : '';
    
    return `${urgentEmoji} URGENT JOB - ${data.peril.toUpperCase()} DAMAGE

Hi ${data.contractorName}, new job in ${data.projectCity}, ${data.projectState}:

📍 ${data.projectAddress}
📞 ${data.contactName}: ${data.contactPhone}
📅 Preferred: ${new Date(data.preferredDate).toLocaleDateString()} (${data.preferredWindow})

💬 "${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}"${reasonsText}

⏰ FIRST TO RESPOND GETS THE JOB!

✅ ACCEPT: ${data.acceptUrl}
❌ DECLINE: ${data.declineUrl}

Expires in 48hrs. Respond now!
- DisasterShield`.trim();
  }
}

// Export singleton instance
export const smsService = new TwilioSMSService();