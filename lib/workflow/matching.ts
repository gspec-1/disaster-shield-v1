import { scoreContractors, selectTopContractors } from '../matching/algorithm';
import { generateAcceptToken } from '../tokens/secure';
import { resendEmailService } from '../email/resend-service';

// Re-export from complete workflow
export { executeCompleteWorkflow } from './complete';

export interface MatchingWorkflowParams {
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
    email: string;
    name: string;
    contact_name: string;
    company_name: string;
    service_areas: string[];
    trades: string[];  // Changed from services to trades to match algorithm.ts
    peril_types: string[];
    state: string;
    zip: string;
    distance: number;
    rating: number;
    capacity: string;
    calendly_url?: string;
  }>;
  baseUrl: string;
}

export interface MatchingResult {
  selectedContractors: Array<{
    contractorId: string;
    score: number;
    reasons: string[];
    email: {
      to: string;
      subject: string;
      html: string;
      text: string;
    };
    acceptToken: string;
    declineToken: string;
  }>;
  matchRequests: Array<{
    project_id: string;
    contractor_id: string;
    status: 'sent';
  }>;
}

export function executeMatchingWorkflow(params: MatchingWorkflowParams): MatchingResult {
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
    
    // Create email info for the return structure
    // (actual email will be sent separately by the workflow)
    const emailSubject = `New ${params.project.peril.charAt(0).toUpperCase() + params.project.peril.slice(1)} Job Opportunity - ${params.project.city}, ${params.project.state}`;
    
    const contractorData = params.contractors.find(c => c.id === contractor.id) || {
      email: `contractor-${contractor.id}@example.com`,
      contact_name: "Contractor",
      company_name: "Company"
    };
    
    return {
      contractorId: contractor.id,
      score: contractor.score,
      reasons: contractor.reasons || [],
      email: {
        to: contractorData.email,
        subject: emailSubject,
        html: "Email will be sent via resendEmailService",
        text: "Email will be sent via resendEmailService",
      },
      acceptToken,
      declineToken,
    };
  });
  
  // Generate match requests for database
  const matchRequests = selectedContractors.map(contractor => ({
    project_id: params.project.id,
    contractor_id: contractor.contractorId,
    status: 'sent' as const,
  }));
  
  return {
    selectedContractors,
    matchRequests,
  };
}
