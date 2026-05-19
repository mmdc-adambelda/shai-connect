'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import {
  ImagePlus, FileText, Loader2, X, Paperclip,
  MessageCircle, Share2, ChevronDown, ChevronUp, Send, MoreHorizontal
} from 'lucide-react'
import type { Post, Profile, Comment, ReactionType } from '@/types'
import clsx from 'clsx'
import { useReactions } from '@/hooks/useEngagement'
import AvatarUI from '@/components/ui/Avatar'

const PHASES = ['All Phases', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like',  emoji: '👍', label: 'Like'  },
  { type: 'love',  emoji: '❤️', label: 'Love'  },
  { type: 'haha',  emoji: '😂', label: 'Haha'  },
  { type: 'wow',   emoji: '😮', label: 'Wow'   },
  { type: 'sad',   emoji: '😢', label: 'Sad'   },
  { type: 'angry', emoji: '😡', label: 'Angry' },
]

function RoleBadge({ role }: { role: string }) {
  if (role === 'superadmin') return <span className="badge badge-red">Super Admin</span>
  if (role === 'admin')      return <span className="badge badge-red">Admin</span>
  if (role === 'moderator')  return <span className="badge badge-blue">Mod</span>
  return null
}

function ReactionBar({ postId, initialCounts, initialUserReaction }: {
  postId: string
  initialCounts: Record<string, number>
  initialUserReaction: ReactionType | null
}) {
  const { counts, userReaction, total, react, loading } = useReactions(postId, {
    counts: initialCounts,
    userReaction: initialUserReaction,
    total: Object.values(initialCounts).reduce((a, b) => a + b, 0),
  })
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [showComments, setShowComments] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const topReactions = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTIONS.find(r => r.type === type)!)
    .filter(Boolean)

  const currentReaction = REACTIONS.find(r => r.type === userReaction)

  return (
    <>
      {total > 0 && (
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <div className="flex -space-x-0.5">
            {topReactions.map(r => (
              <span key={r.type} className="text-sm leading-none">{r.emoji}</span>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{total}</span>
        </div>
      )}

      <div className="divider mb-1" />

      <div className="flex items-center gap-0.5 pt-1 relative">
        <div
          className="relative"
          onMouseEnter={() => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
            hoverTimeout.current = setTimeout(() => setPickerOpen(true), 350)
          }}
          onMouseLeave={() => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
            hoverTimeout.current = setTimeout(() => setPickerOpen(false), 200)
          }}
        >
          <button
            onClick={() => react(userReaction || 'like')}
            disabled={loading}
            className={clsx('reaction-btn', userReaction && 'active')}
          >
            <span className="text-base leading-none">
              {currentReaction ? currentReaction.emoji : '👍'}
            </span>
            <span>{currentReaction ? currentReaction.label : 'Like'}</span>
          </button>

          {pickerOpen && (
            <div
              className="reaction-picker absolute bottom-full left-0 mb-2 z-20"
              onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current) }}
              onMouseLeave={() => { hoverTimeout.current = setTimeout(() => setPickerOpen(false), 150) }}
            >
              {REACTIONS.map(r => (
                <button key={r.type} className="reaction-emoji" title={r.label}
                  onClick={() => { react(r.type); setPickerOpen(false) }}>
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowComments(v => !v)} className="reaction-btn">
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        <button className="reaction-btn ml-auto">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {showComments && <CommentsSection postId={postId} />}
    </>
  )
}

function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments]               = useState<Comment[]>([])
  const [loading, setLoading]                 = useState(false)
  const [loaded, setLoaded]                   = useState(false)
  const [text, setText]                       = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo]           = useState<string | null>(null)
  const [replyText, setReplyText]             = useState('')

  const loadComments = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/posts/${postId}/comments?limit=20`)
      const data = await res.json()
      setComments(data.comments ?? [])
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [postId, loading])

  if (!loaded && !loading) loadComments()

  const submitComment = async (parentId?: string) => {
    const content = parentId ? replyText.trim() : text.trim()
    if (!content) return
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent_id: parentId ?? null }),
      })
      const data = await res.json()
      if (data.comment) {
        if (!parentId) {
          setComments(prev => [...prev, { ...data.comment, replies: [] }])
          setText('')
        } else {
          setComments(prev => prev.map(c =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies ?? []), data.comment] }
              : c
          ))
          setReplyText('')
          setReplyingTo(null)
          setExpandedReplies(prev => ({ ...prev, [parentId]: true }))
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
      {loading && (
        <div className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading comments…
        </div>
      )}

      <div className="space-y-1">
        {comments.map(comment => {
          const author      = comment.profiles as unknown as Profile
          const hasReplies  = (comment.replies?.length ?? 0) > 0
          const repliesOpen = expandedReplies[comment.id]

          return (
            <div key={comment.id} className="animate-appear">
              <div className="flex gap-2.5 py-1.5">
                <AvatarUI
                  name={author?.full_name || 'Resident'}
                  avatarUrl={author?.avatar_url}
                  size={30}
                />
                <div className="flex-1 min-w-0">
                  <div className="comment-bubble">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {author?.full_name || 'Resident'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-1">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    <button
                      className="text-[11px] font-semibold transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                        setReplyText('')
                      }}
                    >
                      Reply
                    </button>
                    {hasReplies && (
                      <button
                        className="flex items-center gap-1 text-[11px] font-semibold"
                        style={{ color: 'var(--brand)' }}
                        onClick={() => setExpandedReplies(p => ({ ...p, [comment.id]: !p[comment.id] }))}
                      >
                        {repliesOpen
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />}
                        {comment.replies!.length}{' '}
                        {comment.replies!.length === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {repliesOpen && comment.replies && (
                <div className="ml-10 pl-3 space-y-1" style={{ borderLeft: '2px solid var(--border)' }}>
                  {comment.replies.map(reply => {
                    const replyAuthor = reply.profiles as unknown as Profile
                    return (
                      <div key={reply.id} className="flex gap-2 py-1.5 animate-appear">
                        <AvatarUI
                          name={replyAuthor?.full_name || 'Resident'}
                          avatarUrl={replyAuthor?.avatar_url}
                          size={26}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="comment-bubble" style={{ borderRadius: '0 10px 10px 10px' }}>
                            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                              {replyAuthor?.full_name || 'Resident'}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {reply.content}
                            </p>
                          </div>
                          <p className="text-[10px] mt-1 ml-1" style={{ color: 'var(--text-muted)' }}>
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {replyingTo === comment.id && (
                <div className="ml-10 mt-1.5 flex gap-2 animate-appear">
                  <input
                    className="input text-sm py-2 flex-1"
                    placeholder={`Reply to ${(comment.profiles as unknown as Profile)?.full_name?.split(' ')[0]}…`}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submitComment(comment.id)
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="btn-icon"
                    disabled={!replyText.trim() || submitting}
                    onClick={() => submitComment(comment.id)}
                    style={{
                      background: replyText.trim() ? 'var(--brand)' : undefined,
                      color: replyText.trim() ? 'white' : undefined,
                    }}
                  >
                    {submitting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          className="input text-sm py-2 flex-1"
          placeholder="Write a comment…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submitComment()
            }
          }}
        />
        <button
          className="btn-icon"
          disabled={!text.trim() || submitting}
          onClick={() => submitComment()}
          style={{
            background: text.trim() ? 'var(--brand)' : undefined,
            color: text.trim() ? 'white' : undefined,
          }}
        >
          {submitting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const author    = post.profiles as unknown as Profile
  const [menuOpen, setMenuOpen] = useState(false)

  const reactionCounts: Record<string, number> = {}
  for (const rc of post.reaction_counts ?? []) {
    reactionCounts[rc.type] = rc.count
  }

  return (
    <div className="card animate-appear" style={{ padding: '20px' }}>
      <div className="flex items-start gap-3 mb-3">
        <AvatarUI
          name={author?.full_name || 'Resident'}
          avatarUrl={author?.avatar_url}
          size={42}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {author?.full_name || 'Resident'}
            </span>
            <RoleBadge role={author?.role || 'resident'} />
            <span className="badge badge-gray text-[10px]">{post.phase_tag}</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {author?.unit} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="relative">
