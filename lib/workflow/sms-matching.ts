// SMS-based contractor matching workflow
import { scoreContractors, selectTopContractors } from '../matching/algorithm';
import { generateAcceptToken } from '../tokens/secure';
import { supabase } from '@/src/lib/supabase'
import { TwilioSMSService } from '../sms/twilio'

export interface SMSMatchingWorkflowParams {
  project: {
    id: string;
    city: string;
    state: string;
    zip: string;
    peril: string;
    incident_at: string;
    preferred_date: string;
    preferred_window: string;
    address: string;
    description: string;
    contact_name: string;
    contact_phone: string;
  };
  contractors: Array<{
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    service_areas: string[];
    trades: string[];
    capacity: string;
    calendly_url?: string;
  }>;
  baseUrl: string;
  sendSMS?: boolean;
}

export interface SMSMatchingResult {
  success: boolean;
  matchedContractors: number;
  smsSent: number;
  matchRequests: Array<{
    project_id: string;
    contractor_id: string;
    status: 'sent';
  }>;
  errors: string[];
}

export async function executeSMSMatchingWorkflow(params: SMSMatchingWorkflowParams): Promise<SMSMatchingResult> {
  const errors: string[] = [];
  let smsSent = 0;

  try {
    // Score all contractors
    const scoredContractors = scoreContractors(params.project, params.contractors);
    
    // Select top 3 contractors
    const topContractors = selectTopContractors(scoredContractors, 3);
    
    const selectedContractors = topContractors.map(contractor => {
      // Generate secure tokens
      const acceptToken = generateAcceptToken({
        projectId: params.project.id,
        contractorId: contractor.id,
        action: 'accept'
      });
      
      const declineToken = generateAcceptToken({
        projectId: params.project.id,
        contractorId: contractor.id,
        action: 'decline'
      });
      
      return {
        contractorId: contractor.id,
        score: contractor.score,
        reasons: contractor.reasons,
        phone: contractor.phone,
        acceptToken,
        declineToken,
        contractor,
      };
    });

    // Send SMS notifications if enabled
    if (params.sendSMS && selectedContractors.length > 0) {
      for (const contractorData of selectedContractors) {
        try {
          const smsData: ContractorSMSData = {
            contractorPhone: contractorData.phone,
            contractorName: contractorData.contractor.contact_name,
            companyName: contractorData.contractor.company_name,
            projectId: params.project.id,
            projectAddress: params.project.address,
            projectCity: params.project.city,
            projectState: params.project.state,
            peril: params.project.peril,
            description: params.project.description,
            contactName: params.project.contact_name,
            contactPhone: params.project.contact_phone,
            preferredDate: params.project.preferred_date,
            preferredWindow: params.project.preferred_window,
            acceptUrl: `${params.baseUrl}/accept-job/${contractorData.acceptToken}`,
            declineUrl: `${params.baseUrl}/decline-job/${contractorData.declineToken}`,
            reasons: contractorData.reasons,
          };

          const smsSentSuccess = await smsService.sendContractorJobAlert(smsData);
          if (smsSentSuccess) {
            smsSent++;
          } else {
            errors.push(`Failed to send SMS to ${contractorData.phone}`);
          }
        } catch (error) {
          errors.push(`SMS error for ${contractorData.phone}: ${error}`);
        }
      }
    }

    // Generate match requests for database
    const matchRequests = selectedContractors.map(contractor => ({
      project_id: params.project.id,
      contractor_id: contractor.contractorId,
      status: 'sent' as const,
    }));

    return {
      success: true,
      matchedContractors: selectedContractors.length,
      smsSent,
      matchRequests,
      errors,
    };

  } catch (error) {
    errors.push(`SMS workflow execution failed: ${error}`);
    return {
      success: false,
      matchedContractors: 0,
      smsSent: 0,
      matchRequests: [],
      errors,
    };
  }
}

// Helper function to notify other contractors when a job is filled
export async function notifyJobFilledViaSMS(
  projectId: string,
  winningContractorId: string,
  allContractors: Array<{ phone: string; name: string; contractorId: string }>,
  projectLocation: string
): Promise<void> {
  const otherContractors = allContractors.filter(c => c.contractorId !== winningContractorId);
  
  for (const contractor of otherContractors) {
    try {
      await smsService.sendJobFilledNotification(
        contractor.phone,
        contractor.name,
        projectLocation
      );
    } catch (error) {
      console.error(`Failed to send job filled SMS to ${contractor.phone}:`, error);
    }
  }
}