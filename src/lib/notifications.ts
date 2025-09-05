import { supabase } from '@/src/lib/supabase'

export interface CreateNotificationData {
  user_id: string
  type: 'job_posted' | 'contractor_matched' | 'job_accepted' | 'job_declined' | 'payment_received' | 'project_updated' | 'inspection_scheduled'
  title: string
  message: string
  data?: any
}

export async function createNotification(notificationData: CreateNotificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function createJobPostedNotification(contractorUserId: string, projectData: any) {
  return createNotification({
    user_id: contractorUserId,
    type: 'job_posted',
    title: `🚨 New ${projectData.peril.charAt(0).toUpperCase() + projectData.peril.slice(1)} Job Available`,
    message: `Urgent job in ${projectData.city}, ${projectData.state}. ${projectData.description.substring(0, 100)}...`,
    data: {
      projectId: projectData.id,
      location: `${projectData.city}, ${projectData.state}`,
      peril: projectData.peril,
      url: `/contractor/browse-jobs`
    }
  })
}

export async function createContractorMatchedNotification(homeownerUserId: string, contractorData: any, projectData: any) {
  return createNotification({
    user_id: homeownerUserId,
    type: 'contractor_matched',
    title: '🤝 Contractor Matched!',
    message: `We've matched you with ${contractorData.company_name} for your ${projectData.peril} damage claim. They'll contact you within 24 hours.`,
    data: {
      projectId: projectData.id,
      contractorId: contractorData.id,
      contractorName: contractorData.company_name,
      url: `/portal/${projectData.id}`
    }
  })
}

export async function createJobAcceptedNotification(homeownerUserId: string, contractorData: any, projectData: any) {
  return createNotification({
    user_id: homeownerUserId,
    type: 'job_accepted',
    title: '✅ Contractor Assigned!',
    message: `${contractorData.company_name} has accepted your job and will contact you soon to schedule inspection.`,
    data: {
      projectId: projectData.id,
      contractorId: contractorData.id,
      contractorName: contractorData.company_name,
      url: `/portal/${projectData.id}`
    }
  })
}

export async function createJobDeclinedNotification(homeownerUserId: string, contractorData: any, projectData: any) {
  return createNotification({
    user_id: homeownerUserId,
    type: 'job_declined',
    title: 'Contractor Response',
    message: `${contractorData.company_name} is unable to take your job. We're finding other qualified contractors for you.`,
    data: {
      projectId: projectData.id,
      contractorId: contractorData.id,
      url: `/portal/${projectData.id}`
    }
  })
}

export async function createPaymentReceivedNotification(contractorUserId: string, projectData: any, amount: number) {
  return createNotification({
    user_id: contractorUserId,
    type: 'payment_received',
    title: '💰 Payment Received',
    message: `Payment of $${amount} received for project at ${projectData.address}. You can now begin work.`,
    data: {
      projectId: projectData.id,
      amount: amount,
      url: `/portal/${projectData.id}`
    }
  })
}

export async function createProjectUpdatedNotification(userId: string, projectData: any, updateType: string) {
  return createNotification({
    user_id: userId,
    type: 'project_updated',
    title: '📋 Project Updated',
    message: `Your project at ${projectData.address} has been updated: ${updateType}`,
    data: {
      projectId: projectData.id,
      updateType: updateType,
      url: `/portal/${projectData.id}`
    }
  })
}

export async function createInspectionScheduledNotification(userId: string, projectData: any, inspectionDate: string) {
  return createNotification({
    user_id: userId,
    type: 'inspection_scheduled',
    title: '📅 Inspection Scheduled',
    message: `Inspection scheduled for ${new Date(inspectionDate).toLocaleDateString()} at ${projectData.address}`,
    data: {
      projectId: projectData.id,
      inspectionDate: inspectionDate,
      url: `/portal/${projectData.id}`
    }
  })
}