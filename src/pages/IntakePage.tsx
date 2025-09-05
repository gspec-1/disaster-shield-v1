import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Upload, Calendar, FileText, CheckCircle, ChevronLeft, MapPin, AlertTriangle, DollarSign, Mic, X } from 'lucide-react'
import { IntakeFormData, IntakeSchema } from '@/src/lib/validation'
import { supabase } from '@/src/lib/supabase'
import { ZodError } from 'zod'
import { toast } from 'sonner'
import { scoreContractors, selectTopContractors } from '@/lib/matching/algorithm'
import { executeCompleteWorkflow } from '@/lib/workflow/complete'
import { createNotification } from '@/src/lib/notifications'
import NotificationBell from '@/src/components/NotificationBell'

export default function IntakePage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Media upload states
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string
    file: File
    preview: string
    type: 'photo' | 'video'
    storagePath?: string
  }>>([])
  const [voiceNote, setVoiceNote] = useState<{
    blob: Blob | null
    url: string | null
    storagePath?: string
  }>({ blob: null, url: null })

  // File upload functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    
    try {
      for (const file of Array.from(files)) {
        // Validate file type and size
        const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
        const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
        
        if (!isValidType) {
          toast.error(`File ${file.name} is not a supported format`)
          continue
        }
        
        if (!isValidSize) {
          toast.error(`File ${file.name} is too large (max 10MB)`)
          continue
        }

        // Create preview URL
        const preview = URL.createObjectURL(file)
        
        // Determine file type
        const type: 'photo' | 'video' = file.type.startsWith('image/') ? 'photo' : 'video'
        
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const storagePath = `media/${user.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, file)
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}`)
          continue
        }
        
        // Add to uploaded files
        const newFile = {
          id: fileName,
          file,
          preview,
          type,
          storagePath
        }
        
        setUploadedFiles(prev => [...prev, newFile])
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          media: {
            ...prev.media,
            uploads: [
              ...(prev.media?.uploads || []),
              {
                storagePath,
                type,
                roomTag: '',
                caption: ''
              }
            ]
          }
        }))
      }
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove) {
        // Revoke preview URL
        URL.revokeObjectURL(fileToRemove.preview)
        
        // Remove from Supabase storage
        if (fileToRemove.storagePath) {
          supabase.storage.from('media').remove([fileToRemove.storagePath])
        }
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          media: {
            ...prev.media,
            uploads: prev.media?.uploads?.filter(upload => upload.storagePath !== fileToRemove.storagePath) || []
          }
        }))
        
        return prev.filter(f => f.id !== fileId)
      }
      return prev
    })
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        setVoiceNote({
          blob: audioBlob,
          url: audioUrl
        })
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setAudioChunks(chunks)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const removeVoiceNote = () => {
    if (voiceNote.url) {
      URL.revokeObjectURL(voiceNote.url)
    }
    setVoiceNote({ blob: null, url: null })
  }

  const uploadVoiceNote = async () => {
    if (!voiceNote.blob || !user) return
    
    try {
      setUploadingFiles(true)
      
      const fileName = `voice-note-${Date.now()}.wav`
      const storagePath = `media/${user.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, voiceNote.blob)
      
      if (uploadError) {
        console.error('Voice note upload error:', uploadError)
        toast.error('Failed to upload voice note')
        return
      }
      
      setVoiceNote(prev => ({ ...prev, storagePath }))
      toast.success('Voice note uploaded successfully')
      
    } catch (error) {
      console.error('Voice note upload error:', error)
      toast.error('Failed to upload voice note')
    } finally {
      setUploadingFiles(false)
    }
  }

  const [formData, setFormData] = useState<Partial<IntakeFormData>>({
    contact: {
      fullName: '',
      phone: '',
      email: '',
    },
    address: {
      street: '',
      unit: '',
      city: '',
      state: '',
      zip: '',
    },
    incident: {
      peril: 'water',
      incidentAt: '',
      description: '',
    },
    media: {
      uploads: [],
    },
    insurance: {
      willFile: 'yes',
      carrierName: '',
      policyNumber: '',
    },
    schedule: {
      preferredDateISO: '',
      preferredWindow: '8-10',
    },
    consents: {
      shareAndContactOk: false,
      termsAccepted: false,
    },
  })

  const totalSteps = 4

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        navigate('/auth/login')
        return
      }

      // Get user profile to check role
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        setProfile(profileData)
        
        // Redirect contractors away from intake
        if (profileData?.role === 'contractor' || user.user_metadata?.role === 'contractor') {
          navigate('/contractor/dashboard')
          return
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        // If we can't get profile, check metadata
        if (user.user_metadata?.role === 'contractor') {
          navigate('/contractor/dashboard')
          return
        }
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Add +1 prefix if it's a 10-digit US number
    if (digits.length === 10) {
      return `+1${digits}`
    }
    
    // If it already has country code, ensure it starts with +
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    }
    
    // Return as-is if it doesn't match expected patterns
    return phone.startsWith('+') ? phone : `+${digits}`
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const validatedData = IntakeSchema.parse(formData)
      
      if (!user) {
        toast.error('You must be logged in to submit a claim')
        navigate('/auth/login')
        return
      }

      // Format phone number
      const formattedPhone = formatPhoneNumber(validatedData.contact.phone)

      // Create project record
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          contact_name: validatedData.contact.fullName,
          contact_phone: formattedPhone,
          contact_email: validatedData.contact.email,
          address: validatedData.address.street + (validatedData.address.unit ? ` ${validatedData.address.unit}` : ''),
          city: validatedData.address.city,
          state: validatedData.address.state,
          zip: validatedData.address.zip,
          peril: validatedData.incident.peril,
          incident_at: validatedData.incident.incidentAt,
          description: validatedData.incident.description,
          carrier_name: validatedData.insurance.carrierName || null,
          policy_number: validatedData.insurance.policyNumber || null,
          preferred_date: validatedData.schedule.preferredDateISO,
          preferred_window: validatedData.schedule.preferredWindow,
          metadata: {
            will_file_insurance: validatedData.insurance.willFile,
            share_contact_ok: validatedData.consents.shareAndContactOk,
            terms_accepted: validatedData.consents.termsAccepted,
            unit: validatedData.address.unit || null,
          },
        })
        .select()
        .single()

      if (projectError) {
        throw new Error(`Failed to create project: ${projectError.message}`)
      }

      // Execute contractor matching workflow
      await executeContractorMatching(project, validatedData, user)

      // Handle media uploads if any
      if (validatedData.media.uploads && validatedData.media.uploads.length > 0) {
        const mediaInserts = validatedData.media.uploads.map(upload => {
          const file = uploadedFiles.find(f => f.storagePath === upload.storagePath)
          return {
            project_id: project.id,
            user_id: user.id,
            filename: upload.storagePath.split('/').pop() || 'unknown',
            storage_path: upload.storagePath,
            type: upload.type,
            file_size: file?.file.size || 0,
            mime_type: file?.file.type || 'application/octet-stream',
            room_tag: upload.roomTag || null,
            caption: upload.caption || null,
          }
        })

        const { error: mediaError } = await supabase
          .from('media')
          .insert(mediaInserts)

        if (mediaError) {
          console.error('Failed to save media:', mediaError)
          // Don't fail the entire submission for media errors
        }
      }

      // Handle voice note - upload if not already uploaded
      if (voiceNote.blob) {
        let finalStoragePath = voiceNote.storagePath
        
        // If voice note wasn't uploaded yet, upload it now
        if (!voiceNote.storagePath) {
          console.log('Auto-uploading voice note during form submission...')
          
          const fileName = `voice-note-${Date.now()}.wav`
          const storagePath = `media/${user.id}/${fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(storagePath, voiceNote.blob)
          
          if (uploadError) {
            console.error('Failed to upload voice note during submission:', uploadError)
            toast.error('Voice note could not be saved')
          } else {
            finalStoragePath = storagePath
            console.log('Voice note uploaded successfully during submission')
          }
        }
        
        // Save voice note to database if we have a storage path
        if (finalStoragePath) {
          const { error: voiceError } = await supabase
            .from('media')
            .insert({
              project_id: project.id,
              user_id: user.id,
              filename: finalStoragePath.split('/').pop() || 'voice-note.wav',
              storage_path: finalStoragePath,
              type: 'audio',
              file_size: voiceNote.blob.size,
              mime_type: voiceNote.blob.type || 'audio/wav',
              room_tag: null,
              caption: 'Voice note recording',
            })

          if (voiceError) {
            console.error('Failed to save voice note to database:', voiceError)
            // Don't fail the entire submission for voice note errors
          } else {
            console.log('Voice note saved to database successfully')
          }
        }
      }

      toast.success('Claim submitted successfully!')
      navigate(`/matching/${project.id}`)
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors
        error.errors.forEach((err) => {
          const fieldPath = err.path.join('.')
          let stepNumber = 1
          
          // Determine which step the error is in
          if (fieldPath.startsWith('contact')) stepNumber = 1
          else if (fieldPath.startsWith('address')) stepNumber = 2
          else if (fieldPath.startsWith('incident')) stepNumber = 3
          else if (fieldPath.startsWith('media')) stepNumber = 4
          else if (fieldPath.startsWith('insurance')) stepNumber = 5
          else if (fieldPath.startsWith('schedule') || fieldPath.startsWith('consents')) stepNumber = 6
          
          toast.error(`Step ${stepNumber}: ${err.message}`)
        })
        
        // Navigate to the first step with an error
        const firstErrorStep = error.errors.reduce((minStep, err) => {
          const fieldPath = err.path.join('.')
          let stepNumber = 1
          
          if (fieldPath.startsWith('contact')) stepNumber = 1
          else if (fieldPath.startsWith('address')) stepNumber = 2
          else if (fieldPath.startsWith('incident')) stepNumber = 3
          else if (fieldPath.startsWith('media')) stepNumber = 4
          else if (fieldPath.startsWith('insurance')) stepNumber = 5
          else if (fieldPath.startsWith('schedule') || fieldPath.startsWith('consents')) stepNumber = 6
          
          return Math.min(minStep, stepNumber)
        }, 6)
        
        setCurrentStep(firstErrorStep)
      } else {
        console.error('Submission error:', error)
        toast.error('Failed to submit claim. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const executeContractorMatching = async (project: any, formData: IntakeFormData, user: any) => {
    try {
      console.log('Starting contractor matching workflow...')
      
      // Execute the complete workflow
      const workflowResult = await executeCompleteWorkflow({
        project: {
          id: project.id,
          city: formData.address.city,
          state: formData.address.state,
          zip: formData.address.zip,
          peril: formData.incident.peril,
          incident_at: formData.incident.incidentAt,
          preferred_date: formData.schedule.preferredDateISO,
          preferred_window: formData.schedule.preferredWindow,
          address: formData.address.street + (formData.address.unit ? ` ${formData.address.unit}` : ''),
          description: formData.incident.description,
          contact_name: formData.contact.fullName,
          contact_phone: formatPhoneNumber(formData.contact.phone),
          contact_email: formData.contact.email,
        },
        baseUrl: window.location.origin
      })

      if (workflowResult.success) {
        console.log(`Contractor matching successful: ${workflowResult.matchedContractors} contractors matched, ${workflowResult.emailsSent} emails sent`)
        
        // Notify homeowner about contractors found
        if (user && workflowResult.matchedContractors > 0) {
          await createNotification({
            user_id: user.id,
            type: 'contractor_matched',
            title: '🤝 Contractors Found!',
            message: `We've found ${workflowResult.matchedContractors} qualified contractors for your ${formData.incident.peril} damage claim. They'll be contacting you soon.`,
            data: {
              projectId: project.id,
              contractorCount: workflowResult.matchedContractors
            }
          })
        }
      } else {
        console.log('Contractor matching failed:', workflowResult.errors)
        // Notify homeowner that no contractors were found
        if (user) {
          await createNotification({
            user_id: user.id,
            type: 'project_updated',
            title: '📋 Claim Submitted Successfully',
            message: `Your ${formData.incident.peril} damage claim has been submitted. We're actively searching for qualified contractors in your area.`,
            data: {
              projectId: project.id
            }
          })
        }
      }

    } catch (error) {
      console.error('Error in contractor matching workflow:', error)
      // Don't fail the entire submission if matching fails
    }
  }

  // Remove the old manual matching logic and replace with proper workflow
  const executeContractorMatchingOld = async (project: any, formData: IntakeFormData, user: any) => {
    try {
      console.log('Starting contractor matching workflow...')
      
      // Get active contractors
      const { data: contractors, error: contractorsError } = await supabase
        .from('contractors')
        .select('*')
        .eq('capacity', 'active')

      if (contractorsError) {
        console.error('Error fetching contractors:', contractorsError)
        return
      }

      if (!contractors || contractors.length === 0) {
        console.log('No active contractors found')
        // Notify homeowner that no contractors are available
        if (user) {
          await createNotification({
            user_id: user.id,
            type: 'project_updated',
            title: '📋 Claim Submitted Successfully',
            message: `Your ${formData.incident.peril} damage claim has been submitted. We're actively searching for qualified contractors in your area.`,
            data: {
              projectId: project.id
            }
          })
        }
        return
      }

      // Use the existing matching algorithm
      const projectForMatching = {
        id: project.id,
        city: formData.address.city,
        state: formData.address.state,
        zip: formData.address.zip,
        peril: formData.incident.peril,
        incident_at: formData.incident.incidentAt,
        preferred_date: formData.schedule.preferredDateISO,
      }

      const scoredContractors = scoreContractors(projectForMatching, contractors)
      const rankedContractors = selectTopContractors(scoredContractors, 3)
      console.log('Ranked contractors:', rankedContractors)

      if (rankedContractors.length > 0) {
        // Create match requests for top contractors
        const matchRequests = rankedContractors.map(contractor => ({
          project_id: project.id,
          contractor_id: contractor.id,
          status: 'sent' as const,
        }))

        const { error: matchError } = await supabase
          .from('match_requests')
          .insert(matchRequests)

        if (!matchError) {
          console.log(`Created ${matchRequests.length} match requests`)
          
          // Update project status to matched
          await supabase
            .from('projects')
            .update({ status: 'matched' })
            .eq('id', project.id)

          // Send notifications to matched contractors
          for (const contractor of rankedContractors) {
            if ((contractor as any).user_id) {
              await createNotification({
                user_id: (contractor as any).user_id,
                type: 'job_posted',
                title: `🚨 New ${formData.incident.peril.charAt(0).toUpperCase() + formData.incident.peril.slice(1)} Job Available`,
                message: `Urgent job in ${formData.address.city}, ${formData.address.state}. ${formData.incident.description.substring(0, 100)}...`,
                data: {
                  projectId: project.id,
                  location: `${formData.address.city}, ${formData.address.state}`,
                  peril: formData.incident.peril
                }
              })
            }
          }
          
          // Notify homeowner about contractors found
          if (user) {
            await createNotification({
              user_id: user.id,
              type: 'contractor_matched',
              title: '📋 Contractors Found!',
              message: `We've found ${rankedContractors.length} qualified contractors for your ${formData.incident.peril} damage claim. They'll be contacting you soon.`,
              data: {
                projectId: project.id,
                contractorCount: rankedContractors.length
              }
            })
          }
        } else {
          console.error('Error creating match requests:', matchError)
        }
      } else {
        console.log('No contractors matched')
        // Notify homeowner that no contractors were found
        if (user) {
          await createNotification({
            user_id: user.id,
            type: 'project_updated',
            title: '📋 Claim Submitted Successfully',
            message: `Your ${formData.incident.peril} damage claim has been submitted. We're actively searching for qualified contractors in your area.`,
            data: {
              projectId: project.id
            }
          })
        }
      }
    } catch (error) {
      console.error('Error in contractor matching workflow:', error)
      // Don't fail the entire submission if matching fails
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Step 1: Contact Information & Property Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    value={formData.contact?.fullName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact!, fullName: e.target.value }
                    })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <Input
                    value={formData.contact?.phone || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact!, phone: e.target.value }
                    })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <Input
                    type="email"
                    value={formData.contact?.email || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact!, email: e.target.value }
                    })}
                    placeholder="your@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <Input
                    value={formData.address?.street || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address!, street: e.target.value }
                    })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit/Apt (Optional)</label>
                  <Input
                    value={formData.address?.unit || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address!, unit: e.target.value }
                    })}
                    placeholder="Apt 2B, Unit 5, etc."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <Input
                      value={formData.address?.city || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, city: e.target.value }
                      })}
                      placeholder="Tampa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State *</label>
                    <Input
                      value={formData.address?.state || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, state: e.target.value.toUpperCase() }
                      })}
                      placeholder="FL"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                    <Input
                      value={formData.address?.zip || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address!, zip: e.target.value }
                      })}
                      maxLength={5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Step 2: Incident Details & Media Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Incident Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type of Damage *</label>
                    <Select
                      value={formData.incident?.peril}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        incident: { ...formData.incident!, peril: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="water">Water Damage</SelectItem>
                        <SelectItem value="flood">Flood</SelectItem>
                        <SelectItem value="wind">Wind/Storm</SelectItem>
                        <SelectItem value="fire">Fire</SelectItem>
                        <SelectItem value="mold">Mold</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">When did this occur? *</label>
                    <Input
                      type="date"
                      value={formData.incident?.incidentAt || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        incident: { ...formData.incident!, incidentAt: e.target.value }
                      })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Areas Affected (Optional)</label>
                  <Input
                    value={formData.incident?.areas || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      incident: { ...formData.incident!, areas: e.target.value }
                    })}
                    placeholder="Kitchen, living room, basement, etc."
                  />
                </div>

                {(formData.incident?.peril === 'water' || formData.incident?.peril === 'flood') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Water Category</label>
                      <Select
                        value={formData.incident?.waterCategory}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          incident: { ...formData.incident!, waterCategory: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Category 1 - Clean water</SelectItem>
                          <SelectItem value="2">Category 2 - Gray water</SelectItem>
                          <SelectItem value="3">Category 3 - Black water</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Power Status</label>
                      <Select
                        value={formData.incident?.powerOn ? 'on' : 'off'}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          incident: { ...formData.incident!, powerOn: value === 'on' }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select power status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on">Power is ON</SelectItem>
                          <SelectItem value="off">Power is OFF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Square Footage Impacted (Optional)</label>
                  <Input
                    type="number"
                    value={formData.incident?.sqftImpacted || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      incident: { ...formData.incident!, sqftImpacted: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="Estimated square feet affected"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Describe the damage *</label>
                  <Textarea
                    value={formData.incident?.description || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      incident: { ...formData.incident!, description: e.target.value }
                    })}
                    placeholder="Please describe what happened and the extent of the damage..."
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.incident?.description?.length || 0}/500 characters (minimum 20 required)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Media Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Photo & Video Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Upload photos and videos of the damage (at least 1 required)
                  </p>
                  <input
                    type="file"
                    id="media-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFiles}
                  />
                  <label htmlFor="media-upload">
                    <Button 
                      variant="outline" 
                      asChild
                      disabled={uploadingFiles}
                    >
                      <span>
                        {uploadingFiles ? 'Uploading...' : 'Choose Files'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: JPG, PNG, MP4, MOV (Max 10MB each)
                  </p>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            {file.type === 'photo' ? (
                              <img
                                src={file.preview}
                                alt="Uploaded file"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={file.preview}
                                className="w-full h-full object-cover"
                                controls
                              />
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice Note Section */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Voice Note (Optional)</label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    {!voiceNote.url ? (
                      <div className="text-center">
                        <p className="text-gray-500 text-sm mb-3">Record a voice note to provide additional details</p>
                        <p className="text-xs text-gray-400 mb-3">
                          Voice notes will be automatically saved when you submit the form
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={uploadingFiles}
                        >
                          {isRecording ? (
                            <>
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
                              Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4 mr-2" />
                              Record Voice Note
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mic className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Voice Note Recorded</p>
                            <audio src={voiceNote.url} controls className="mt-1" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!voiceNote.storagePath && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={uploadVoiceNote}
                              disabled={uploadingFiles}
                            >
                              {uploadingFiles ? 'Uploading...' : 'Upload Now'}
                            </Button>
                          )}
                          {voiceNote.storagePath && (
                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              ✓ Uploaded
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={removeVoiceNote}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Step 3: Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Will you file an insurance claim? *</label>
                  <Select
                    value={formData.insurance?.willFile}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      insurance: { ...formData.insurance!, willFile: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unsure">Not sure yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.insurance?.willFile === 'yes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Insurance Carrier</label>
                      <Input
                        value={formData.insurance?.carrierName || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, carrierName: e.target.value }
                        })}
                        placeholder="State Farm, Allstate, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Policy Number</label>
                      <Input
                        value={formData.insurance?.policyNumber || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, policyNumber: e.target.value }
                        })}
                        placeholder="Policy number (optional)"
                      />
                    </div>
                  </div>
                )}
                {formData.insurance?.willFile === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Deductible Amount (Optional)</label>
                    <Input
                      type="number"
                      value={formData.insurance?.deductibleCents ? formData.insurance.deductibleCents / 100 : ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        insurance: { 
                          ...formData.insurance!, 
                          deductibleCents: e.target.value ? parseInt(e.target.value) * 100 : undefined 
                        }
                      })}
                      placeholder="1000"
                      min="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">Enter amount in dollars (e.g., 1000 for $1,000)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {/* Step 4: Schedule Inspection & Final Agreements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Inspection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Date *</label>
                    <Input
                      type="date"
                      value={formData.schedule?.preferredDateISO || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: { ...formData.schedule!, preferredDateISO: e.target.value }
                      })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time Window *</label>
                    <Select
                      value={formData.schedule?.preferredWindow}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        schedule: { ...formData.schedule!, preferredWindow: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8-10">8:00 AM - 10:00 AM</SelectItem>
                        <SelectItem value="10-12">10:00 AM - 12:00 PM</SelectItem>
                        <SelectItem value="12-2">12:00 PM - 2:00 PM</SelectItem>
                        <SelectItem value="2-4">2:00 PM - 4:00 PM</SelectItem>
                        <SelectItem value="4-6">4:00 PM - 6:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Final Agreements */}
            <Card>
              <CardHeader>
                <CardTitle>Final Agreements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="shareConsent"
                    checked={formData.consents?.shareAndContactOk || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      consents: { ...formData.consents!, shareAndContactOk: !!checked }
                    })}
                  />
                  <label htmlFor="shareConsent" className="text-sm leading-relaxed">
                    I consent to sharing my information with qualified contractors and receiving contact from them regarding my claim.
                  </label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="termsConsent"
                    checked={formData.consents?.termsAccepted || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      consents: { ...formData.consents!, termsAccepted: !!checked }
                    })}
                  />
                  <label htmlFor="termsConsent" className="text-sm leading-relaxed">
                    I accept the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/client/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            File Your Insurance Claim
          </h1>
          <p className="text-gray-600">
            Complete this form to get matched with qualified contractors in your area
          </p>
        </div>

        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={!formData.consents?.shareAndContactOk || !formData.consents?.termsAccepted || isSubmitting}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}