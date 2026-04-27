'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ThumbsUp, MessageCircle, Share2, ImagePlus, FileText, Loader2, X, Paperclip } from 'lucide-react'
import type { Post, Profile } from '@/types'
import clsx from 'clsx'

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold flex-shrink-0 border-2 border-brand-200 dark:border-brand-800`}>
      {initials}
    </div>
  )
}

function roleBadge(role: string) {
  if (role === 'admin') return <span className="badge badge-red">Admin</span>
  if (role === 'moderator') return <span className="badge badge-blue">Moderator</span>
  return null
}

const PHASES = ['All Phases', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

export default function FeedClient({
  posts: initialPosts,
  currentProfile,
  currentUserId,
}: {
  posts: Post[]
  currentProfile: Profile | null
  currentUserId: string
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [content, setContent] = useState('')
  const [phaseTag, setPhaseTag] = useState('All Phases')
  const [posting, setPosting] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFileError('File too large. Maximum size is 2MB.')
      return
    }
    setFileError('')
    setSelectedFile(file)
  }

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)

    let image_url = null

    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()
      const path = `posts/${currentUserId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shai-uploads')
        .upload(path, selectedFile, { upsert: true })
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('shai-uploads').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({ content: content.trim(), phase_tag: phaseTag, author_id: currentUserId, image_url })
      .select('*, profiles(id, full_name, unit, phase, role)')
      .single()

    if (!error && data) {
      setPosts([data, ...posts])
      setContent('')
      setSelectedFile(null)
      setShowCompose(false)
    }
    setPosting(false)
  }

  const toggleLike = (postId: string) => {
    setLiked(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Community Feed</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Share updates with your neighbors</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary flex items-center gap-2">
          <span className="text-lg leading-none">+</span> New Post
        </button>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCompose(false)}>
          <div className="card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Create a Post</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-3 mb-3">
              <Avatar name={currentProfile?.full_name || 'Me'} />
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{currentProfile?.full_name}</p>
                <select className="input mt-1 py-1 text-xs w-auto" value={phaseTag} onChange={e => setPhaseTag(e.target.value)}>
                  {PHASES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="What's on your mind?"
              value={content}
              onChange={e => setContent(e.target.value)}
              autoFocus
            />
            {selectedFile && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-sm text-brand-700 dark:text-brand-400">
                <Paperclip className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            )}
            {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={handleFileSelect} />
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2">
                <button type="button" onClick={() => { if(photoInputRef.current){ photoInputRef.current.value=''; photoInputRef.current.click(); }}} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded-md hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                  <ImagePlus className="w-4 h-4" /> Photo
                </button>
                <button type="button" onClick={() => { if(fileInputRef.current){ fileInputRef.current.value=''; fileInputRef.current.click(); }}} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded-md hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                  <FileText className="w-4 h-4" /> File
                </button>
              </div>
              <button onClick={handlePost} disabled={posting || !content.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-4 mb-4 flex gap-3 items-center cursor-pointer" onClick={() => setShowCompose(true)}>
        <Avatar name={currentProfile?.full_name || 'Me'} size="sm" />
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-400 dark:text-gray-500">
          What's on your mind, {currentProfile?.full_name?.split(' ')[0] || 'neighbor'}?
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📰</p>
            <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share something!</p>
          </div>
        )}
        {posts.map(post => {
          const author = post.profiles as unknown as Profile
          const isLiked = liked[post.id]
          return (
            <div key={post.id} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <Avatar name={author?.full_name || 'Resident'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{author?.full_name || 'Resident'}</span>
                    {roleBadge(author?.role || 'resident')}
                    <span className="badge badge-green text-[10px]">{post.phase_tag}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {author?.unit} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {post.image_url && post.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <img src={post.image_url} alt="Post attachment" className="mt-3 rounded-lg max-h-72 w-full object-cover border border-gray-100 dark:border-gray-800" />
              )}
              {post.image_url && !post.image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-brand-600 dark:text-brand-400 hover:underline">
                  <Paperclip className="w-4 h-4" /> View attachment
                </a>
              )}
              <div className="flex gap-1 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => toggleLike(post.id)} className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors', isLiked ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                  <ThumbsUp className={clsx('w-3.5 h-3.5', isLiked && 'fill-current')} />
                  {isLiked ? 'Liked' : 'Like'}
                </button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> Comment
                </button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-auto">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
