import { scoreContractors, selectTopContractors } from '../matching/algorithm'
import { generateAcceptToken } from '../tokens/secure'
import { resendEmailService } from '../email/resend-service'
import { supabase } from '@/src/lib/supabase'
import { env } from '@/src/lib/env'

export interface CompleteWorkflowParams {
  project: {
    id: string
    city: string
    state: string
    zip: string
    peril: string
    incident_at: string
    preferred_date: string
    preferred_window: string
    address: string
    description: string
    contact_name: string
    contact_phone: string
    contact_email: string
  }
  baseUrl?: string
}

export interface WorkflowResult {
  success: boolean
  matchedContractors: number
  emailsSent: number
  matchRequests: Array<{
    project_id: string
    contractor_id: string
    status: 'sent'
  }>
  errors: string[]
}

export async function executeCompleteWorkflow(params: CompleteWorkflowParams): Promise<WorkflowResult> {
  const errors: string[] = []
  let emailsSent = 0
  

  if (!supabase) {
    errors.push('Database connection not configured')
    return {
      success: false,
      matchedContractors: 0,
      emailsSent: 0,
      matchRequests: [],
      errors,
    }
  }

  try {
    // Get active contractors
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('*')
      .eq('capacity', 'active')

    if (contractorsError) {
      errors.push(`Failed to fetch contractors: ${contractorsError.message}`)
      return {
        success: false,
        matchedContractors: 0,
        emailsSent: 0,
        matchRequests: [],
        errors,
      }
    }

    if (!contractors || contractors.length === 0) {
      errors.push('No active contractors found')
      return {
        success: false,
        matchedContractors: 0,
        emailsSent: 0,
        matchRequests: [],
        errors,
      }
    }

    // Score and select top contractors
    const scoredContractors = scoreContractors(params.project, contractors)
    const topContractors = selectTopContractors(scoredContractors, Math.min(3, contractors.length))

    if (topContractors.length === 0) {
      errors.push(`No contractors matched the project criteria. Available contractors: ${contractors.length}, but none serve your area or handle ${params.project.peril} damage.`)
      return {
        success: false,
        matchedContractors: 0,
        emailsSent: 0,
        matchRequests: [],
        errors,
      }
    }

    // Generate match requests
    const matchRequests = topContractors.map(contractor => ({
      project_id: params.project.id,
      contractor_id: contractor.id,
      status: 'sent' as const,
    }))

    // Insert or upsert match requests into database (idempotent).
    // Use upsert on project_id + contractor_id to avoid duplicate key errors
    // and return the inserted/updated rows so callers can inspect them.
    const { data: insertedMatchRequests, error: matchError } = await supabase
      .from('match_requests')
      // supabase-js upsert onConflict expects a comma-separated string
      .upsert(matchRequests, { onConflict: 'project_id,contractor_id' })
      .select('*')

    if (matchError) {
      // Log the full error details for debugging (this won't be shown to users)
      console.error("Match request error:", matchError);
      
      // Handle different error types
      if (matchError.message && matchError.message.toLowerCase().includes('duplicate')) {
        // Handle duplicate key violations by fetching existing records instead
        const { data: existing, error: fetchErr } = await supabase
          .from('match_requests')
          .select('*')
          .eq('project_id', params.project.id)

        if (!fetchErr) {
          // Treat as non-fatal — proceed using existing rows
          // (keep errors list minimal, but note the duplicate)
          errors.push('Duplicate match requests detected; using existing records.')
        } else {
          errors.push(`Failed to recover match requests after duplicate error: ${fetchErr.message}`)
          return {
            success: false,
            matchedContractors: topContractors.length,
            emailsSent: 0,
            matchRequests: [],
            errors,
          }
        }
      } else if (matchError.code === '42501' || matchError.message?.includes('permission denied') || 
                (matchError.message?.includes('policy') && matchError.code === '403')) {
        // This is a 403/permission denied error - likely missing RLS policy for update
        errors.push(
          `Authorization error: Your database is missing the RLS policy to allow upserts on match_requests. ` + 
          `Run the migration SQL file (20250902000001_fix_match_requests_upsert.sql) in your Supabase dashboard.`
        )
        return {
          success: false,
          matchedContractors: topContractors.length,
          emailsSent: 0,
          matchRequests: [],
          errors,
        }
      } else {
        // Generic error handling
        errors.push(`Failed to create match requests: ${matchError.message}`)
        return {
          success: false,
          matchedContractors: topContractors.length,
          emailsSent: 0,
          matchRequests: [],
          errors,
        }
      }
    }

    // Send email invitations to contractors - don't let email failures stop the whole process
    let emailAttempts = 0;
    for (const contractor of topContractors) {
      const c: any = contractor
      emailAttempts++;
      
      try {
        // Generate secure tokens
        const acceptToken = generateAcceptToken({
          projectId: params.project.id,
          contractorId: contractor.id,
          action: 'accept'
        })
        
        const declineToken = generateAcceptToken({
          projectId: params.project.id,
          contractorId: contractor.id,
          action: 'decline'
        })
        
        // Create the URLs for the email
        const acceptUrl = `${params.baseUrl || env.APP_URL || 'https://disaster-shield-v2.vercel.app'}/accept-job/${acceptToken}`;
        const declineUrl = `${params.baseUrl || env.APP_URL || 'https://disaster-shield-v2.vercel.app'}/decline-job/${declineToken}`;

        // Send email invitation with delay to prevent rate limiting
        const emailSent = await resendEmailService.sendContractorInvitation({
          contractorEmail: c.email,
          contractorName: c.contact_name || c.contactName || c.name,
          companyName: c.company_name || c.companyName,
          projectDetails: {
            id: params.project.id,
            address: params.project.address,
            city: params.project.city,
            state: params.project.state,
            peril: params.project.peril,
            description: params.project.description,
            preferredDate: params.project.preferred_date,
            preferredWindow: params.project.preferred_window,
            contactName: params.project.contact_name,
            contactPhone: params.project.contact_phone,
          },
          acceptUrl: acceptUrl,
          declineUrl: declineUrl,
          reasons: (contractor as any).reasons || [],
        })

        if (emailSent) {
          emailsSent++
          console.log(`✅ Email sent successfully to ${c.email}`)
        } else {
          console.error(`❌ Failed to send email to ${c.email}`)
          // Silently collect error but don't fail the whole process
          errors.push(`Note: Email not sent to ${c.email || 'unknown'} - email service issue`)
        }
        
        // Add delay between emails to prevent rate limiting (except for the last email)
        if (emailAttempts < topContractors.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        // Collect error but don't fail the whole process
        errors.push(`Note: Email error for ${c?.email || 'unknown'}: ${error}`)
      }
    }

    // If all emails failed but we created match requests, note the issue but don't fail the whole workflow
    if (emailAttempts > 0 && emailsSent === 0) {
      console.warn("All emails failed to send. Check if email service is configured.");
      errors.push("All emails failed to send. The matching process succeeded, but contractors weren't notified. Configure email service or manually notify contractors.");
    }

    // Update project status to matched
    await supabase
      .from('projects')
      .update({ status: 'matched' })
      .eq('id', params.project.id)

    return {
      success: true,
      matchedContractors: topContractors.length,
      emailsSent,
      matchRequests,
      errors,
    }

  } catch (error) {
    errors.push(`Workflow execution failed: ${error}`)
    return {
      success: false,
      matchedContractors: 0,
      emailsSent: 0,
      matchRequests: [],
      errors,
    }
  }
}