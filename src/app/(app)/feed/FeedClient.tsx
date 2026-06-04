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
  if (role === 'admin') return <span className="badge badge-red">Admin</span>
  if (role === 'moderator') return <span className="badge badge-blue">Mod</span>
  return null
}

function ReactionBar({
  postId,
  initialCounts,
  initialUserReaction,
}: {
  postId: string
  initialCounts: Record<string, number>
  initialUserReaction: ReactionType | null
}) {
  const { counts, userReaction, total, react, loading } = useReactions(postId, {
    counts: initialCounts,
    userReaction: initialUserReaction,
    total: Object.values(initialCounts).reduce((a, b) => a + b, 0),
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const topReactions = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type)!)
    .filter(Boolean)

  const currentReaction = REACTIONS.find((r) => r.type === userReaction)

  return (
    <>
      {total > 0 && (
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <div className="flex -space-x-0.5">
            {topReactions.map((r) => (
              <span key={r.type} className="text-sm leading-none">
                {r.emoji}
              </span>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {total}
          </span>
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
              onMouseEnter={() => {
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
              }}
              onMouseLeave={() => {
                hoverTimeout.current = setTimeout(() => setPickerOpen(false), 150)
              }}
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  className="reaction-emoji"
                  title={r.label}
                  onClick={() => {
                    react(r.type)
                    setPickerOpen(false)
                  }}
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
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments?limit=20`)
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
                    <p
                      className="text-xs font-semibold mb-0.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {author?.full_name || 'Resident'}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
                    >
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
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = 'var(--brand)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'var(--text-muted)')
                      }
                      onClick={() => {
                        setReplyingTo(
                          replyingTo === comment.id ? null : comment.id
                        )
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
                          setExpandedReplies((p) => ({
                            ...p,
                            [comment.id]: !p[comment.id],
                          }))
                        }
                      >
                        {repliesOpen ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        {comment.replies!.length}{' '}
                        {comment.replies!.length === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {repliesOpen && comment.replies && (
                <div
                  className="ml-10 pl-3 space-y-1"
                  style={{ borderLeft: '2px solid var(--border)' }}
                >
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
                          <div
                            className="comment-bubble"
                            style={{ borderRadius: '0 10px 10px 10px' }}
                          >
                            <p
                              className="text-xs font-semibold mb-0.5"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {replyAuthor?.full_name || 'Resident'}
                            </p>
                            <p
                              className="text-sm"
                              style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
                            >
                              {reply.content}
                            </p>
                          </div>
                          <p
                            className="text-[10px] mt-1 ml-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {formatDistanceToNow(new Date(reply.created_at), {
                              addSuffix: true,
                            })}
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
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {submitError && (
        <p className="text-xs text-red-500 mt-2 px-1">{submitError}</p>
      )}

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
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

function PostCard({
  post,
  currentUserId,
}: {
  post: Post
  currentUserId: string
}) {
  const author = post.profiles as unknown as Profile
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
          <button className="btn-icon w-8 h-8" onClick={() => setMenuOpen((v) => !v)}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-9 z-20 card py-1 w-36"
                style={{ boxShadow: 'var(--shadow-lg)' }}
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--surface-2)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  Copy link
                </button>
                {post.author_id === currentUserId && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-500 transition-colors"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#fee2e2')
                    }
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
        className="text-sm leading-relaxed whitespace-pre-wrap mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        {post.content}
      </p>

      {post.image_url && post.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
        <div
          className="mb-3 overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <img
            src={post.image_url}
            alt="Post attachment"
            className="w-full object-cover max-h-80"
          />
        </div>
      )}

      {post.image_url && !post.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
        <div
          onClick={() => window.open(post.image_url!, '_blank', 'noopener,noreferrer')}
          className="mb-3 flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand-xlight)')}
        >
          <Paperclip className="w-4 h-4" /> View attachment
        </div>
      )}

      <ReactionBar
        postId={post.id}
        initialCounts={reactionCounts}
        initialUserReaction={post.user_reaction ?? null}
      />
    </div>
  )
}

function ComposeModal({
  currentProfile,
  currentUserId,
  onPost,
  onClose,
}: {
  currentProfile: Profile | null
  currentUserId: string
  onPost: (post: Post) => void
  onClose: () => void
}) {
  const [content, setContent] = useState('')
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
    if (file.size > 2 * 1024 * 1024) {
      setFileError('File too large. Max 2MB.')
      return
    }
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
        const { data: urlData } = supabase.storage
          .from('shai-uploads')
          .getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }
    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: content.trim(),
        phase_tag: phaseTag,
        author_id: currentUserId,
        image_url,
      })
      .select('*, profiles(id, full_name, unit, phase, role, avatar_url)')
      .single()
    if (!error && data) {
      onPost(data)
      onClose()
    }
    setPosting(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-soft)' }}
        >
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Create Post
          </h2>
          <button onClick={onClose} className="btn-icon w-7 h-7">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex gap-3 mb-4">
            <AvatarUI
              name={currentProfile?.full_name || 'Me'}
              avatarUrl={currentProfile?.avatar_url}
              size={42}
            />
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {currentProfile?.full_name}
              </p>
              <select
                className="input py-1 text-xs mt-1 w-auto"
                value={phaseTag}
                onChange={(e) => setPhaseTag(e.target.value)}
              >
                {PHASES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            className="w-full resize-none text-sm leading-relaxed outline-none bg-transparent"
            style={{ color: 'var(--text-primary)', minHeight: 120 }}
            placeholder={`What's on your mind, ${
              currentProfile?.full_name?.split(' ')[0] || 'neighbor'
            }?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          {selectedFile && (
            <div
              className="mt-2 flex items-center gap-2 text-xs p-2 rounded-lg"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="ml-auto btn-icon w-5 h-5 flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border-soft)' }}
        >
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                if (photoInputRef.current) {
                  photoInputRef.current.value = ''
                  photoInputRef.current.click()
                }
              }}
              className="btn-ghost py-2 px-3 text-xs gap-1.5"
            >
              <ImagePlus className="w-4 h-4" /> Photo
            </button>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                  fileInputRef.current.click()
                }
              }}
              className="btn-ghost py-2 px-3 text-xs gap-1.5"
            >
              <FileText className="w-4 h-4" /> File
            </button>
          </div>
          <button
            onClick={handlePost}
            disabled={posting || !content.trim()}
            className="btn-primary gap-2"
          >
            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Post
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FeedClient({
  posts: initial,
  currentProfile,
  currentUserId,
}: {
  posts: Post[]
  currentProfile: Profile | null
  currentUserId: string
}) {
  const [posts, setPosts] = useState(initial)
  const [showCompose, setShowCompose] = useState(false)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Community Feed
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Share updates with your neighbors
          </p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary">
          <span className="text-base leading-none">+</span> New Post
        </button>
      </div>

      <div
        className="card p-3.5 mb-5 flex gap-3 items-center cursor-pointer transition-all hover:shadow-md"
        onClick={() => setShowCompose(true)}
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        <AvatarUI
          name={currentProfile?.full_name || 'Me'}
          avatarUrl={currentProfile?.avatar_url}
          size={38}
        />
        <div
          className="flex-1 px-4 py-2.5 text-sm rounded-full transition-colors"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text-muted)',
            cursor: 'text',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'var(--surface-3)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'var(--surface-2)')
          }
        >
          What&apos;s on your mind,{' '}
          {currentProfile?.full_name?.split(' ')[0] || 'neighbor'}?
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="card p-14 text-center">
            <p className="text-4xl mb-4">🌿</p>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              No posts yet
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Be the first to share something with the community!
            </p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))}
      </div>

      {showCompose && (
        <ComposeModal
          currentProfile={currentProfile}
          currentUserId={currentUserId}
          onPost={(p) => setPosts([p, ...posts])}
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  )
}
