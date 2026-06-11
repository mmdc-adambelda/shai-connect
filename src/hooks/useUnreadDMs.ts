'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadDMs(userId: string | null | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('read', false)
      setCount(c ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`unread-dm:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${userId}`,
      }, () => fetchCount())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${userId}`,
      }, () => fetchCount())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return count
}
