/// <reference path="./shims.d.ts" />
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FNOLSubmissionRequest {
  project_id: string
  insurance_company_id: string
  submission_method: 'api' | 'manual' | 'email' | 'fax'
  policy_number: string
  loss_date: string
  loss_time?: string
  cause_of_loss?: string
  areas_affected?: string
  estimated_damage?: string
  emergency_repairs?: string
  prevented_further_damage?: string
  police_report?: boolean
  police_report_number?: string
  witnesses?: string
  additional_notes?: string
  submission_notes?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📋 FNOL submission started:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    })

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const requestData: FNOLSubmissionRequest = await req.json()
    console.log('📋 FNOL request data:', {
      project_id: requestData.project_id,
      insurance_company_id: requestData.insurance_company_id,
      submission_method: requestData.submission_method
    })

    // Validate required fields
    if (!requestData.project_id || !requestData.insurance_company_id || !requestData.policy_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: project_id, insurance_company_id, policy_number' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get project data
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', requestData.project_id)
      .single()

    if (projectError) {
      console.error('📋 Project fetch error:', projectError)
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get insurance company data
    const { data: companyData, error: companyError } = await supabase
      .from('insurance_companies')
      .select('*')
      .eq('id', requestData.insurance_company_id)
      .single()

    if (companyError) {
      console.error('📋 Insurance company fetch error:', companyError)
      return new Response(
        JSON.stringify({ error: 'Insurance company not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📋 Company data:', {
      name: companyData.name,
      display_name: companyData.display_name,
      requires_manual: companyData.requires_manual_submission,
      has_api_endpoint: !!companyData.api_endpoint
    })

    // Create FNOL record
    const { data: fnolRecord, error: fnolError } = await supabase
      .from('fnol_records')
      .insert({
        project_id: requestData.project_id,
        insurance_company_id: requestData.insurance_company_id,
        submission_method: requestData.submission_method,
        status: 'pending',
        submission_notes: requestData.submission_notes
      })
      .select()
      .single()

    if (fnolError) {
      console.error('📋 FNOL record creation error:', fnolError)
      return new Response(
        JSON.stringify({ error: 'Failed to create FNOL record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📋 FNOL record created:', fnolRecord.id)

    // Handle API submission if company supports it
    if (requestData.submission_method === 'api' && companyData.api_endpoint && !companyData.requires_manual_submission) {
      try {
        console.log('📋 Attempting API submission to:', companyData.api_endpoint)
        
        const apiPayload = prepareAPIPayload(requestData, projectData, companyData)
        console.log('📋 API payload prepared:', {
          payload_keys: Object.keys(apiPayload),
          company: companyData.name
        })

        const apiResponse = await fetch(companyData.api_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...companyData.api_headers
          },
          body: JSON.stringify(apiPayload)
        })

        console.log('📋 API response status:', apiResponse.status)

        if (!apiResponse.ok) {
          throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}`)
        }

        const apiResponseData = await apiResponse.json()
        console.log('📋 API response data:', apiResponseData)

        // Parse response and update FNOL record
        const result = parseAPIResponse(apiResponseData, companyData)
        
        const { error: updateError } = await supabase
          .from('fnol_records')
          .update({
            status: result.success ? 'acknowledged' : 'failed',
            fnol_number: result.claimNumber,
            acknowledgment_reference: result.acknowledgmentReference,
            api_response: apiResponseData,
            error_message: result.error,
            submission_date: new Date().toISOString(),
            acknowledgment_date: result.success ? new Date().toISOString() : undefined
          })
          .eq('id', fnolRecord.id)

        if (updateError) {
          console.error('📋 FNOL record update error:', updateError)
        }

        // Update project FNOL status
        await supabase
          .from('projects')
          .update({ fnol_status: result.success ? 'acknowledged' : 'failed' })
          .eq('id', requestData.project_id)

        return new Response(
          JSON.stringify({
            success: result.success,
            fnol_id: fnolRecord.id,
            claim_number: result.claimNumber,
            acknowledgment_reference: result.acknowledgmentReference,
            error: result.error,
            api_response: apiResponseData
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (apiError) {
        console.error('📋 API submission error:', apiError)
        
        // Update FNOL record with error
        await supabase
          .from('fnol_records')
          .update({
            status: 'failed',
            error_message: apiError instanceof Error ? apiError.message : 'Unknown API error',
            submission_date: new Date().toISOString()
          })
          .eq('id', fnolRecord.id)

        // Update project FNOL status
        await supabase
          .from('projects')
          .update({ fnol_status: 'failed' })
          .eq('id', requestData.project_id)

        return new Response(
          JSON.stringify({
            success: false,
            fnol_id: fnolRecord.id,
            error: apiError instanceof Error ? apiError.message : 'Unknown API error'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      // Manual submission - just update project status
      await supabase
        .from('projects')
        .update({ fnol_status: 'pending' })
        .eq('id', requestData.project_id)

      return new Response(
        JSON.stringify({
          success: true,
          fnol_id: fnolRecord.id,
          message: 'FNOL record created for manual submission'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('📋 FNOL submission error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Prepare API payload based on insurance company requirements
 */
function prepareAPIPayload(
  requestData: FNOLSubmissionRequest,
  projectData: any,
  companyData: any
): any {
  const basePayload = {
    policy_number: requestData.policy_number,
    loss_date: requestData.loss_date,
    loss_time: requestData.loss_time,
    cause_of_loss: requestData.cause_of_loss,
    areas_affected: requestData.areas_affected,
    estimated_damage: requestData.estimated_damage,
    emergency_repairs: requestData.emergency_repairs,
    prevented_further_damage: requestData.prevented_further_damage,
    police_report: requestData.police_report,
    police_report_number: requestData.police_report_number,
    witnesses: requestData.witnesses,
    additional_notes: requestData.additional_notes,
    submission_timestamp: new Date().toISOString(),
    // Project data
    policyholder: {
      name: projectData.contact_name,
      phone: projectData.contact_phone,
      email: projectData.contact_email
    },
    property: {
      address: projectData.address,
      city: projectData.city,
      state: projectData.state,
      zip: projectData.zip
    },
    loss: {
      type: projectData.peril,
      description: projectData.description,
      incident_date: projectData.incident_at
    }
  }

  // Company-specific payload formatting
  switch (companyData.name) {
    case 'liberty_mutual':
      return {
        ...basePayload,
        claim_type: 'property',
        notification_method: 'api'
      }

    case 'state_farm':
      return {
        ...basePayload,
        claim_category: 'property_damage',
        submission_source: 'third_party'
      }

    case 'allstate':
      return {
        ...basePayload,
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
function parseAPIResponse(response: any, companyData: any): {
  success: boolean
  claimNumber?: string
  acknowledgmentReference?: string
  error?: string
} {
  switch (companyData.name) {
    case 'liberty_mutual':
      return {
        success: response.status === 'success',
        claimNumber: response.claim_number,
        acknowledgmentReference: response.reference_id,
        error: response.error_message
      }

    case 'state_farm':
      return {
        success: response.acknowledged === true,
        claimNumber: response.claim_id,
        acknowledgmentReference: response.acknowledgment_number,
        error: response.error
      }

    case 'allstate':
      return {
        success: response.success === true,
        claimNumber: response.claimNumber,
        acknowledgmentReference: response.acknowledgmentId,
        error: response.errorMessage
      }

    default:
      // Generic response parsing
      return {
        success: response.success === true || response.status === 'success',
        claimNumber: response.claim_number || response.claimNumber || response.claim_id,
        acknowledgmentReference: response.acknowledgment_reference || response.acknowledgmentReference,
        error: response.error || response.error_message
      }
  }
}
