import { supabase } from '@/src/lib/supabase'

export interface FNOLSubmissionData {
  projectId: string
  insuranceCompanyId: string
  policyNumber: string
  lossDate: string
  lossTime?: string
  causeOfLoss?: string
  areasAffected?: string
  estimatedDamage?: string
  emergencyRepairs?: string
  preventedFurtherDamage?: string
  policeReport?: boolean
  policeReportNumber?: string
  witnesses?: string
  additionalNotes?: string
}

export interface FNOLSubmissionResult {
  success: boolean
  claimNumber?: string
  acknowledgmentReference?: string
  error?: string
  apiResponse?: any
}

export interface InsuranceCompany {
  id: string
  name: string
  display_name: string
  api_endpoint?: string
  api_key_encrypted?: string
  api_headers: any
  supported_perils: string[]
  is_active: boolean
  requires_manual_submission: boolean
}

/**
 * Submit FNOL via insurance company API
 */
export async function submitFNOLViaAPI(
  data: FNOLSubmissionData,
  company: InsuranceCompany
): Promise<FNOLSubmissionResult> {
  try {
    if (!company.api_endpoint) {
      throw new Error('API endpoint not configured for this insurance company')
    }

    // Prepare API payload based on company
    const payload = prepareAPIPayload(data, company)

    // Make API request
    const response = await fetch(company.api_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...company.api_headers
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const apiResponse = await response.json()

    // Parse response based on company
    const result = parseAPIResponse(apiResponse, company)

    // Update FNOL record with API response
    await updateFNOLRecord(data.projectId, {
      status: result.success ? 'acknowledged' : 'failed',
      fnol_number: result.claimNumber,
      acknowledgment_reference: result.acknowledgmentReference,
      api_response: apiResponse,
      error_message: result.error,
      submission_date: new Date().toISOString(),
      acknowledgment_date: result.success ? new Date().toISOString() : undefined
    })

    return result

  } catch (error) {
    console.error('FNOL API submission error:', error)
    
    // Update FNOL record with error
    await updateFNOLRecord(data.projectId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      submission_date: new Date().toISOString()
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Prepare API payload based on insurance company requirements
 */
function prepareAPIPayload(data: FNOLSubmissionData, company: InsuranceCompany): any {
  // Get project data
  const projectData = getProjectData(data.projectId)
  
  // Base payload structure
  const basePayload = {
    policy_number: data.policyNumber,
    loss_date: data.lossDate,
    loss_time: data.lossTime,
    cause_of_loss: data.causeOfLoss,
    areas_affected: data.areasAffected,
    estimated_damage: data.estimatedDamage,
    emergency_repairs: data.emergencyRepairs,
    prevented_further_damage: data.preventedFurtherDamage,
    police_report: data.policeReport,
    police_report_number: data.policeReportNumber,
    witnesses: data.witnesses,
    additional_notes: data.additionalNotes,
    submission_timestamp: new Date().toISOString()
  }

  // Company-specific payload formatting
  switch (company.name) {
    case 'liberty_mutual':
      return {
        ...basePayload,
        // Liberty Mutual specific fields
        claim_type: 'property',
        notification_method: 'api'
      }

    case 'state_farm':
      return {
        ...basePayload,
        // State Farm specific fields
        claim_category: 'property_damage',
        submission_source: 'third_party'
      }

    case 'allstate':
      return {
        ...basePayload,
        // Allstate specific fields
        claim_origin: 'api',
        third_party_submission: true
      }

    default:
      return basePayload
  }
}

/**
 * Parse API response based on insurance company
 */
function parseAPIResponse(response: any, company: InsuranceCompany): FNOLSubmissionResult {
  switch (company.name) {
    case 'liberty_mutual':
      return {
        success: response.status === 'success',
        claimNumber: response.claim_number,
        acknowledgmentReference: response.reference_id,
        error: response.error_message,
        apiResponse: response
      }

    case 'state_farm':
      return {
        success: response.acknowledged === true,
        claimNumber: response.claim_id,
        acknowledgmentReference: response.acknowledgment_number,
        error: response.error,
        apiResponse: response
      }

    case 'allstate':
      return {
        success: response.success === true,
        claimNumber: response.claimNumber,
        acknowledgmentReference: response.acknowledgmentId,
        error: response.errorMessage,
        apiResponse: response
      }

    default:
      // Generic response parsing
      return {
        success: response.success === true || response.status === 'success',
        claimNumber: response.claim_number || response.claimNumber || response.claim_id,
        acknowledgmentReference: response.acknowledgment_reference || response.acknowledgmentReference,
        error: response.error || response.error_message,
        apiResponse: response
      }
  }
}

/**
 * Get project data for API submission
 */
async function getProjectData(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update FNOL record with submission results
 */
async function updateFNOLRecord(projectId: string, updates: any) {
  const { error } = await supabase
    .from('fnol_records')
    .update(updates)
    .eq('project_id', projectId)

  if (error) throw error
}

/**
 * Generate FNOL document for manual submission
 */
export async function generateFNOLDocument(data: FNOLSubmissionData): Promise<string> {
  try {
    // Get project and company data
    const [projectData, companyData] = await Promise.all([
      getProjectData(data.projectId),
      supabase.from('insurance_companies').select('*').eq('id', data.insuranceCompanyId).single()
    ])

    if (companyData.error) throw companyData.error

    // Generate document content
    const documentContent = generateDocumentContent(data, projectData.data, companyData.data)

    // Create document in storage
    const fileName = `fnol-${data.projectId}-${Date.now()}.pdf`
    const storagePath = `fnol-documents/${fileName}`

    // For now, we'll store the content as JSON and generate PDF later
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, JSON.stringify(documentContent, null, 2))

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath)

    return urlData.publicUrl

  } catch (error) {
    console.error('Error generating FNOL document:', error)
    throw error
  }
}

/**
 * Generate document content for FNOL
 */
function generateDocumentContent(
  data: FNOLSubmissionData,
  project: any,
  company: InsuranceCompany
): any {
  return {
    title: 'First Notice of Loss (FNOL)',
    insurance_company: company.display_name,
    generated_date: new Date().toISOString(),
    policyholder: {
      name: project.contact_name,
      phone: project.contact_phone,
      email: project.contact_email,
      policy_number: data.policyNumber
    },
    property: {
      address: project.address,
      city: project.city,
      state: project.state,
      zip: project.zip
    },
    loss: {
      date: data.lossDate,
      time: data.lossTime,
      type: project.peril,
      description: project.description,
      cause: data.causeOfLoss,
      areas_affected: data.areasAffected,
      estimated_damage: data.estimatedDamage
    },
    emergency_actions: {
      repairs: data.emergencyRepairs,
      prevention: data.preventedFurtherDamage,
      police_report: data.policeReport,
      police_report_number: data.policeReportNumber
    },
    additional: {
      witnesses: data.witnesses,
      notes: data.additionalNotes
    }
  }
}

/**
 * Get insurance companies with API support
 */
export async function getInsuranceCompaniesWithAPI(): Promise<InsuranceCompany[]> {
  const { data, error } = await supabase
    .from('insurance_companies')
    .select('*')
    .eq('is_active', true)
    .eq('requires_manual_submission', false)

  if (error) throw error
  return data || []
}

/**
 * Get all insurance companies
 */
export async function getAllInsuranceCompanies(): Promise<InsuranceCompany[]> {
  const { data, error } = await supabase
    .from('insurance_companies')
    .select('*')
    .eq('is_active', true)
    .order('display_name')

  if (error) throw error
  return data || []
}
