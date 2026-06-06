'use client'

import { useState, useCallback } from 'react'
import type { ReactionType } from '@/types'

interface ReactionState {
  counts: Record<string, number>
  userReaction: ReactionType | null
  total: number
}

export function useReactions(
  postId: string,
  initial: ReactionState
) {
  const [state, setState] = useState<ReactionState>(initial)
  const [loading, setLoading] = useState(false)

  const react = useCallback(async (type: ReactionType) => {
    if (loading) return

    // Optimistic update
    const prev = { ...state }
    setState(s => {
      const newCounts = { ...s.counts }
      const currentType = s.userReaction

      if (currentType === type) {
        // Toggle off
        newCounts[type] = Math.max(0, (newCounts[type] ?? 1) - 1)
        if (newCounts[type] === 0) delete newCounts[type]
        return { counts: newCounts, userReaction: null, total: s.total - 1 }
      }

      if (currentType) {
        // Switch reaction
        newCounts[currentType] = Math.max(0, (newCounts[currentType] ?? 1) - 1)
        if (newCounts[currentType] === 0) delete newCounts[currentType]
      }
      newCounts[type] = (newCounts[type] ?? 0) + 1
      return {
        counts: newCounts,
        userReaction: type,
        total: currentType ? s.total : s.total + 1,
      }
    })

    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) {
        // Rollback on error
        setState(prev)
      }
    } catch {
      setState(prev)
    } finally {
      setLoading(false)
    }
  }, [postId, state, loading])

  return { ...state, react, loading }
}

export function useFollow(targetUserId: string, initialIsFollowing: boolean) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)

  const toggle = useCallback(async () => {
    if (loading) return
    const prev = isFollowing
    setIsFollowing(!prev) // optimistic
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: prev ? 'DELETE' : 'POST',
      })
      if (!res.ok) setIsFollowing(prev) // rollback
    } catch {
      setIsFollowing(prev)
    } finally {
      setLoading(false)
    }
  }, [targetUserId, isFollowing, loading])

  return { isFollowing, setIsFollowing, toggle, loading }
}
