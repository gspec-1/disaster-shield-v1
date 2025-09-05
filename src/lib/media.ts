import { supabase } from './supabase'

export interface MediaFile {
  id: string
  project_id: string
  user_id: string
  filename: string
  storage_path: string
  type: 'photo' | 'video' | 'audio'
  file_size: number
  mime_type: string
  room_tag?: string
  caption?: string
  created_at: string
  updated_at: string
  url?: string // Public URL for accessing the file
}

/**
 * Get all media files for a specific project
 */
export async function getProjectMedia(projectId: string): Promise<MediaFile[]> {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project media:', error)
      return []
    }

    // Add public URLs for each media file
    return data.map(media => ({
      ...media,
      url: supabase.storage.from('media').getPublicUrl(media.storage_path).data.publicUrl
    }))
  } catch (error) {
    console.error('Error fetching project media:', error)
    return []
  }
}

/**
 * Get media files by type for a project
 */
export async function getProjectMediaByType(
  projectId: string, 
  type: 'photo' | 'video' | 'audio'
): Promise<MediaFile[]> {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Error fetching project ${type} media:`, error)
      return []
    }

    // Add public URLs for each media file
    return data.map(media => ({
      ...media,
      url: supabase.storage.from('media').getPublicUrl(media.storage_path).data.publicUrl
    }))
  } catch (error) {
    console.error(`Error fetching project ${type} media:`, error)
    return []
  }
}

/**
 * Get total storage usage for a user across all projects
 */
export async function getUserStorageUsage(userId: string): Promise<{
  totalFiles: number
  totalSize: number
  byType: {
    photos: { count: number; size: number }
    videos: { count: number; size: number }
    audio: { count: number; size: number }
  }
}> {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('type, file_size')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user storage usage:', error)
      return {
        totalFiles: 0,
        totalSize: 0,
        byType: {
          photos: { count: 0, size: 0 },
          videos: { count: 0, size: 0 },
          audio: { count: 0, size: 0 }
        }
      }
    }

    const totalFiles = data.length
    const totalSize = data.reduce((sum, file) => sum + file.file_size, 0)
    
    const byType = data.reduce((acc, file) => {
      if (file.type === 'photo') {
        acc.photos.count++
        acc.photos.size += file.file_size
      } else if (file.type === 'video') {
        acc.videos.count++
        acc.videos.size += file.file_size
      } else if (file.type === 'audio') {
        acc.audio.count++
        acc.audio.size += file.file_size
      }
      return acc
    }, {
      photos: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      audio: { count: 0, size: 0 }
    })

    return { totalFiles, totalSize, byType }
  } catch (error) {
    console.error('Error fetching user storage usage:', error)
    return {
      totalFiles: 0,
      totalSize: 0,
      byType: {
        photos: { count: 0, size: 0 },
        videos: { count: 0, size: 0 },
        audio: { count: 0, size: 0 }
      }
    }
  }
}

/**
 * Delete a media file (both database record and storage file)
 */
export async function deleteMediaFile(mediaId: string): Promise<boolean> {
  try {
    // First get the media record to get the storage path
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('storage_path')
      .eq('id', mediaId)
      .single()

    if (fetchError || !media) {
      console.error('Error fetching media record:', fetchError)
      return false
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([media.storage_path])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (dbError) {
      console.error('Error deleting media record:', dbError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting media file:', error)
    return false
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file type icon based on MIME type
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  return '📄'
}
