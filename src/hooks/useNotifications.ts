import { useState, useEffect } from 'react'
import { supabase } from '@/src/lib/supabase'
import { isConfigured } from '@/src/lib/supabase'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !isConfigured || !supabase) {
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Error fetching notifications:', error)
          return
        }

        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.read).length || 0)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev.slice(0, 49)])
            if (!newNotification.read) {
              setUnreadCount(prev => prev + 1)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            // Recalculate unread count
            setNotifications(current => {
              setUnreadCount(current.filter(n => !n.read).length)
              return current
            })
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    if (!isConfigured || !supabase || !userId) {
      console.warn('Supabase not configured or user not authenticated - cannot mark notification as read')
      return
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Silently fail if Supabase is not available
    }
  }

  const markAllAsRead = async () => {
    if (!isConfigured || !supabase || !userId) {
      console.warn('Supabase not configured or user not authenticated - cannot mark all notifications as read')
      return
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      // Silently fail if Supabase is not available
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  }
}