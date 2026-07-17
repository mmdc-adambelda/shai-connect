'use client'

import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  ImagePlus, FileText, Loader2, X, Paperclip,
  MessageCircle, Share2, ChevronDown, ChevronUp, Send, MoreHorizontal, Info, Check,
  ArrowUp, Mail, Link2, Repeat2,
} from 'lucide-react'
import type { Post, Profile, Comment, ReactionType } from '@/types'
import clsx from 'clsx'
import { useReactions } from '@/hooks/useEngagement'
import AvatarUI from '@/components/ui/Avatar'

const PHASES = ['All Phases', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

const REACTIONS: { type: ReactionType; emoji: string; label: string; pastel: string }[] = [
  { type: 'like',  emoji: '👍', label: 'Like',  pastel: 'rgba(59,130,246,0.15)'  },
  { type: 'love',  emoji: '❤️', label: 'Love',  pastel: 'rgba(236,72,153,0.15)' },
  { type: 'haha',  emoji: '😂', label: 'Haha',  pastel: 'rgba(234,179,8,0.15)'  },
  { type: 'wow',   emoji: '😮', label: 'Wow',   pastel: 'rgba(139,92,246,0.15)' },
  { type: 'sad',   emoji: '😢', label: 'Sad',   pastel: 'rgba(14,165,233,0.15)' },
  { type: 'angry', emoji: '😡', label: 'Angry', pastel: 'rgba(239,68,68,0.15)'  },
]

function RoleBadge({ role }: { role: string }) {
  if (role === 'superadmin') return <span className="badge badge-red">Super Admin</span>
  if (role === 'admin') return <span className="badge badge-red">Admin</span>
  if (role === 'moderator') return <span className="badge badge-blue">Mod</span>
  return null
}

// ── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({
  post,
  currentProfile,
  currentUserId,
  onClose,
  onShareToFeed,
}: {
  post: Post
  currentProfile: Profile | null
  currentUserId: string
  onClose: () => void
  onShareToFeed: (content: string) => void
}) {
  const supabase = createClient()
  const author = post.profiles as unknown as Profile
  const [view, setView] = useState<'main' | 'dm'>('main')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [dmSearch, setDmSearch] = useState('')
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [chatShared, setChatShared] = useState(false)
  const [copied, setCopied] = useState(false)

  const excerpt = post.content.length > 130 ? post.content.slice(0, 130) + '…' : post.content
  const shareText = `📎 Shared from Community Feed\n"${excerpt}"\n— ${author?.full_name || 'Resident'} · ${post.phase_tag}`

  const loadProfiles = async () => {
    setLoadingProfiles(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, unit, phase, role, avatar_url')
      .neq('id', currentUserId)
      .order('full_name')
    setProfiles((data as Profile[]) || [])
    setLoadingProfiles(false)
  }

  const sendDM = async (recipientId: string) => {
    setSending(recipientId)
    await supabase.from('direct_messages').insert({
      sender_id: currentUserId,
      recipient_id: recipientId,
      content: shareText,
    })
    setSending(null)
    setSent(recipientId)
    setTimeout(() => setSent(null), 2000)
  }

  const shareToChat = async () => {
    if (!currentProfile?.phase) return
    await supabase.from('chat_messages').insert({
      room: currentProfile.phase,
      sender_id: currentUserId,
      content: shareText,
    })
    setChatShared(true)
    setTimeout(() => { setChatShared(false); onClose() }, 1500)
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/feed`
    try { await navigator.clipboard.writeText(url) } catch {}
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 1500)
  }

  const filtered = profiles.filter(p =>
    p.full_name.toLowerCase().includes(dmSearch.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          {view === 'dm' ? (
            <button
              onClick={() => setView('main')}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              <ChevronDown className="w-4 h-4 rotate-90" /> Send via Message
            </button>
          ) : (
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Share Post</h2>
          )}
          <button onClick={onClose} className="btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
        </div>

        {view === 'main' ? (
          <div className="p-4">
            {/* Post preview */}
            <div
              className="p-3 rounded-xl text-xs mb-3"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{author?.full_name || 'Resident'}</span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}>{post.phase_tag}</span>
              <p className="mt-1.5 leading-relaxed line-clamp-2">{excerpt}</p>
            </div>

            <div className="space-y-1.5">
              {/* Share to Feed */}
              <button
                onClick={() => { onShareToFeed(shareText); onClose() }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-xlight)' }}>
                  <Repeat2 className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Share to My Feed</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Post this to your Community Feed</p>
                </div>
              </button>

              {/* Send via DM */}
              <button
                onClick={() => { loadProfiles(); setView('dm') }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-xlight)' }}>
                  <Mail className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Send via Direct Message</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Share with a specific resident</p>
                </div>
              </button>

              {/* Share in Phase Chat */}
              <button
                onClick={shareToChat}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                style={{ background: chatShared ? 'var(--brand-xlight)' : '' }}
                onMouseEnter={e => { if (!chatShared) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { if (!chatShared) e.currentTarget.style.background = '' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: chatShared ? 'var(--brand)' : 'var(--brand-xlight)' }}>
                  {chatShared
                    ? <Check className="w-4 h-4 text-white" />
                    : <MessageCircle className="w-4 h-4" style={{ color: 'var(--brand)' }} />}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: chatShared ? 'var(--brand)' : 'var(--text-primary)' }}>
                    {chatShared ? 'Shared!' : 'Share in Phase Chat'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Post to {currentProfile?.phase || 'your phase'} room
                  </p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                style={{ background: copied ? 'var(--brand-xlight)' : '' }}
                onMouseEnter={e => { if (!copied) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { if (!copied) e.currentTarget.style.background = '' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: copied ? 'var(--brand)' : 'var(--brand-xlight)' }}>
                  {copied
                    ? <Check className="w-4 h-4 text-white" />
                    : <Link2 className="w-4 h-4" style={{ color: 'var(--brand)' }} />}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: copied ? 'var(--brand)' : 'var(--text-primary)' }}>
                    {copied ? 'Link Copied!' : 'Copy Link'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Copy the feed URL to clipboard</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* DM user picker */
          <div className="flex flex-col" style={{ maxHeight: 380 }}>
            <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <input
                className="input text-sm w-full"
                placeholder="Search residents…"
                value={dmSearch}
                onChange={e => setDmSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingProfiles && (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              {!loadingProfiles && filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => sendDM(p.id)}
                  disabled={!!sending}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ borderBottom: '1px solid var(--border-soft)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <AvatarUI name={p.full_name} avatarUrl={p.avatar_url} size={34} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.phase}</p>
                  </div>
                  {sent === p.id ? (
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--brand)' }}>
                      <Check className="w-3.5 h-3.5" /> Sent
                    </span>
                  ) : sending === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <Send className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>
              ))}
              {!loadingProfiles && filtered.length === 0 && (
                <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>No residents found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Reaction Bar ─────────────────────────────────────────────────────────────
function ReactionBar({
  postId,
  post,
  initialCounts,
  initialUserReaction,
  initialCommentCount,
  currentProfile,
  currentUserId,
  onShareToFeed,
}: {
  postId: string
  post: Post
  initialCounts: Record<string, number>
  initialUserReaction: ReactionType | null
  initialCommentCount: number
  currentProfile: Profile | null
  currentUserId: string
  onShareToFeed: (content: string) => void
}) {
  const { counts, userReaction, total, react, loading } = useReactions(postId, {
    counts: initialCounts,
    userReaction: initialUserReaction,
    total: Object.values(initialCounts).reduce((a, b) => a + b, 0),
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [showShareModal, setShowShareModal] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const topReactions = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type)!)
    .filter(Boolean)

  const currentReaction = REACTIONS.find((r) => r.type === userReaction)

  return (
    <>
      {(total > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between mb-2 px-1">
          {total > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center -space-x-0.5">
                {topReactions.map((r) => (
                  <span
                    key={r.type}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-xs leading-none"
                    style={{ background: r.pastel, border: '1.5px solid var(--surface)' }}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>{total}</span>
            </div>
          ) : <span />}

          {commentCount > 0 && (
            <button
              onClick={() => setShowComments(v => !v)}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
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
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  className="reaction-emoji"
                  title={r.label}
                  onClick={() => { react(r.type); setPickerOpen(false) }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = r.pastel }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '' }}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowComments((v) => !v)} className="reaction-btn">
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
          {commentCount > 0 && (
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {commentCount}
            </span>
          )}
        </button>

        <button onClick={() => setShowShareModal(true)} className="reaction-btn ml-auto">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {showComments && (
        <CommentsSection
          postId={postId}
          onCommentAdded={() => setCommentCount(c => c + 1)}
        />
      )}

      {showShareModal && (
        <ShareModal
          post={post}
          currentProfile={currentProfile}
          currentUserId={currentUserId}
          onClose={() => setShowShareModal(false)}
          onShareToFeed={onShareToFeed}
        />
      )}
    </>
  )
}

// ── Comments Section ─────────────────────────────────────────────────────────
function CommentsSection({ postId, onCommentAdded }: { postId: string; onCommentAdded: () => void }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments?limit=20`)
      const data = await res.json()
      setComments(data.comments ?? [])
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { loadComments() }, [])

  const submitComment = async (parentId?: string) => {
    const content = parentId ? replyText.trim() : text.trim()
    if (!content) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent_id: parentId ?? null }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setSubmitError(data.error ?? 'Failed to post comment. Please try again.')
        return
      }
      if (data.comment) {
        onCommentAdded()
        if (!parentId) {
          setComments((prev) => [...prev, { ...data.comment, replies: [] }])
          setText('')
        } else {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies ?? []), data.comment] }
                : c
            )
          )
          setReplyText('')
          setReplyingTo(null)
          setExpandedReplies((prev) => ({ ...prev, [parentId]: true }))
        }
      }
    } catch {
      setSubmitError('Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
      {loading && (
        <div className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading comments...
        </div>
      )}

      <div className="space-y-1">
        {comments.map((comment) => {
          const author = comment.profiles as unknown as Profile
          const hasReplies = (comment.replies?.length ?? 0) > 0
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
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
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
                        onClick={() =>
                          setExpandedReplies((p) => ({ ...p, [comment.id]: !p[comment.id] }))
                        }
                      >
                        {repliesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {comment.replies!.length}{' '}
                        {comment.replies!.length === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {repliesOpen && comment.replies && (
                <div className="ml-10 pl-3 space-y-1" style={{ borderLeft: '2px solid var(--border)' }}>
                  {comment.replies.map((reply) => {
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
                    placeholder={`Reply to ${
                      (comment.profiles as unknown as Profile)?.full_name?.split(' ')[0]
                    }...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
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
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {submitError && <p className="text-xs text-red-500 mt-2 px-1">{submitError}</p>}

      <div className="flex gap-2 mt-3">
        <input
          className="input text-sm py-2 flex-1"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => { setText(e.target.value); setSubmitError('') }}
          onKeyDown={(e) => {
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
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

// ── Post Card ────────────────────────────────────────────────────────────────
const PostCard = memo(function PostCard({
  post,
  currentUserId,
  currentProfile,
  onShareToFeed,
}: {
  post: Post
  currentUserId: string
  currentProfile: Profile | null
  onShareToFeed: (content: string) => void
}) {
  const author = post.profiles as unknown as Profile
  const [menuOpen, setMenuOpen] = useState(false)

  const reactionCounts: Record<string, number> = {}
  for (const rc of post.reaction_counts ?? []) {
    reactionCounts[rc.type] = rc.count
  }

  return (
    <div className="card animate-appear overflow-hidden">
      <div className="flex items-start gap-3" style={{ padding: '16px 18px 12px' }}>
        {/* Author avatar — clickable to profile */}
        <Link href={`/profile?userId=${author?.id}`} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
          <AvatarUI
            name={author?.full_name || 'Resident'}
            avatarUrl={author?.avatar_url}
            size={42}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Author name — clickable to profile */}
            <Link
              href={`/profile?userId=${author?.id}`}
              className="font-bold text-sm leading-tight hover:underline"
              style={{ color: 'var(--text-primary)' }}
            >
              {author?.full_name || 'Resident'}
            </Link>
            <RoleBadge role={author?.role || 'resident'} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
            <span className="text-xs" style={{ color: 'var(--border)' }}>·</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}
            >
              {post.phase_tag}
            </span>
          </div>
        </div>
        <div className="relative">
          <button className="btn-icon w-8 h-8" onClick={() => setMenuOpen((v) => !v)}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 card py-1 w-36" style={{ boxShadow: 'var(--shadow-lg)' }}>
                <button
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  Copy link
                </button>
                {post.author_id === currentUserId && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-500 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    Delete post
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <p
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{ color: 'var(--text-primary)', lineHeight: '1.7', padding: '0 18px 14px' }}
      >
        {post.content}
      </p>

      {post.image_url && post.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
        <div className="mb-0 overflow-hidden border-y" style={{ borderColor: 'var(--border-soft)' }}>
          <img src={post.image_url} alt="Post attachment" className="w-full object-cover max-h-96" />
        </div>
      )}

      {post.image_url && !post.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
        <div style={{ padding: '0 18px 14px' }}>
          <div
            onClick={() => window.open(post.image_url!, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand-xlight)')}
          >
            <Paperclip className="w-4 h-4" /> View attachment
          </div>
        </div>
      )}

      <div style={{ padding: '0 18px 4px' }}>
        <ReactionBar
          postId={post.id}
          post={post}
          initialCounts={reactionCounts}
          initialUserReaction={post.user_reaction ?? null}
          initialCommentCount={post.comment_count ?? 0}
          currentProfile={currentProfile}
          currentUserId={currentUserId}
          onShareToFeed={onShareToFeed}
        />
      </div>
    </div>
  )
})

// ── Compose Modal ────────────────────────────────────────────────────────────
function ComposeModal({
  currentProfile,
  currentUserId,
  onPost,
  onClose,
  initialContent = '',
}: {
  currentProfile: Profile | null
  currentUserId: string
  onPost: (post: Post) => void
  onClose: () => void
  initialContent?: string
}) {
  const [content, setContent] = useState(initialContent)
  const [phaseTag, setPhaseTag] = useState('All Phases')
  const [posting, setPosting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setFileError('File too large. Max 2MB.'); return }
    setFileError('')
    setSelectedFile(file)
  }

  const handlePost = async () => {
    if (!content.trim() || posting) return
    setPosting(true)
    let image_url = null
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()
      const path = `posts/${currentUserId}/${Date.now()}.${ext}`
      const { data: up, error: upErr } = await supabase.storage
        .from('shai-uploads')
        .upload(path, selectedFile, { upsert: true })
      if (!upErr && up) {
        const { data: urlData } = supabase.storage.from('shai-uploads').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }
    const { data, error } = await supabase
      .from('posts')
      .insert({ content: content.trim(), phase_tag: phaseTag, author_id: currentUserId, image_url })
      .select('*, profiles(id, full_name, unit, phase, role, avatar_url)')
      .single()
    if (!error && data) { onPost(data); onClose() }
    setPosting(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Create Post</h2>
          <button onClick={onClose} className="btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex gap-3 mb-4">
            <AvatarUI name={currentProfile?.full_name || 'Me'} avatarUrl={currentProfile?.avatar_url} size={42} />
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{currentProfile?.full_name}</p>
              <select className="input py-1 text-xs mt-1 w-auto" value={phaseTag} onChange={(e) => setPhaseTag(e.target.value)}>
                {PHASES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <textarea
            className="w-full resize-none text-sm leading-relaxed outline-none bg-transparent"
            style={{ color: 'var(--text-primary)', minHeight: 120 }}
            placeholder={`What's on your mind, ${currentProfile?.full_name?.split(' ')[0] || 'neighbor'}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          {selectedFile && (
            <div className="mt-2 flex items-center gap-2 text-xs p-2.5 rounded-lg"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="ml-auto btn-icon w-5 h-5 flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {selectedFile && !content.trim() && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-medium"
              style={{ background: '#FEF9EC', border: '1px solid #F3D77A', color: '#854D0E' }}>
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} />
              <span>A caption is required when sharing a photo or file. Write something above to enable posting.</span>
            </div>
          )}

          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}

          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileSelect} />
        </div>

        <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="flex gap-1">
            <button type="button" onClick={() => { if (photoInputRef.current) { photoInputRef.current.value = ''; photoInputRef.current.click() } }}
              className="btn-ghost py-2 px-3 text-xs gap-1.5">
              <ImagePlus className="w-4 h-4" /> Photo
            </button>
            <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click() } }}
              className="btn-ghost py-2 px-3 text-xs gap-1.5">
              <FileText className="w-4 h-4" /> File
            </button>
          </div>
          <button
            onClick={handlePost}
            disabled={posting || !content.trim()}
            className="btn-primary gap-2"
            title={!content.trim() ? 'Add a caption to post' : undefined}
          >
            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Feed Client (root) ───────────────────────────────────────────────────────
export default function FeedClient({
  posts: initial,
  currentProfile,
  currentUserId,
  highlightPostId,
}: {
  posts: Post[]
  currentProfile: Profile | null
  currentUserId: string
  highlightPostId?: string
}) {
  const [posts, setPosts] = useState(initial)
  const [showCompose, setShowCompose] = useState(false)
  const [composeQuote, setComposeQuote] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [highlightActive, setHighlightActive] = useState(!!highlightPostId)

  // Scroll to and briefly highlight a post opened from search
  useEffect(() => {
    if (!highlightPostId) return
    const el = document.getElementById(`post-${highlightPostId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timeout = setTimeout(() => setHighlightActive(false), 3000)
    return () => clearTimeout(timeout)
  }, [highlightPostId])

  // Track scroll of the app's main element for back-to-top button (mobile only)
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const onScroll = () => setShowBackToTop(main.scrollTop > 400)
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  // FAB button → open compose modal
  useEffect(() => {
    const handler = () => { setComposeQuote(''); setShowCompose(true) }
    window.addEventListener('shai:fab', handler)
    return () => window.removeEventListener('shai:fab', handler)
  }, [])

  const scrollToTop = () => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShareToFeed = (quote: string) => {
    setComposeQuote(quote)
    setShowCompose(true)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Community Feed
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Share updates with your neighbors
          </p>
        </div>
        <button onClick={() => { setComposeQuote(''); setShowCompose(true) }} className="btn-primary">
          <span className="text-base leading-none">+</span> New Post
        </button>
      </div>

      <div
        className="card mb-5"
        style={{ borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}
      >
        {/* What's on your mind */}
        <div
          className="flex gap-3 items-center cursor-pointer mb-3"
          onClick={() => { setComposeQuote(''); setShowCompose(true) }}
        >
          <AvatarUI name={currentProfile?.full_name || 'Me'} avatarUrl={currentProfile?.avatar_url} size={38} />
          <div
            className="flex-1 px-4 py-2.5 text-sm rounded-full transition-colors font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'text' }}
          >
            What&apos;s on your mind, {currentProfile?.full_name?.split(' ')[0] || 'neighbor'}?
          </div>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Quick-action buttons */}
        <div className="flex items-center gap-1 mt-2.5 -mx-1">
          <button
            onClick={() => { setComposeQuote(''); setShowCompose(true) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <ImagePlus className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
            <span className="hidden xs:inline">Photo</span>
          </button>
          <button
            onClick={() => { setComposeQuote(''); setShowCompose(true) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#2563eb' }} />
            <span className="hidden xs:inline">File</span>
          </button>
          <button
            onClick={() => { setComposeQuote(''); setShowCompose(true) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
            <span className="hidden xs:inline">Discuss</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="card p-14 text-center">
            <p className="text-4xl mb-4">🌿</p>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No posts yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Be the first to share something with the community!
            </p>
          </div>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            id={`post-${post.id}`}
            style={highlightActive && post.id === highlightPostId
              ? { boxShadow: '0 0 0 3px var(--brand)', borderRadius: 'var(--radius-lg)', transition: 'box-shadow 0.3s' }
              : { transition: 'box-shadow 0.3s' }}
          >
            <PostCard
              post={post}
              currentUserId={currentUserId}
              currentProfile={currentProfile}
              onShareToFeed={handleShareToFeed}
            />
          </div>
        ))}
      </div>

      {/* Back-to-top button — mobile only, appears after scrolling 400px, floats above bottom nav */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="md:hidden fixed right-4 z-30 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ background: 'var(--brand)', color: 'white', bottom: 'calc(56px + env(safe-area-inset-bottom) + 80px)' }}
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {showCompose && (
        <ComposeModal
          currentProfile={currentProfile}
          currentUserId={currentUserId}
          onPost={(p) => setPosts([p, ...posts])}
          onClose={() => { setShowCompose(false); setComposeQuote('') }}
          initialContent={composeQuote}
        />
      )}
    </div>
  )
}
