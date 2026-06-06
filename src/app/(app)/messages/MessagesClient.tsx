'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Plus, X, ChevronLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { DirectMessage, Profile } from '@/types'
import clsx from 'clsx'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0 text-white`}
      style={{ background: 'var(--brand)' }}>
      {initials(name)}
    </div>
  )
}

export default function MessagesClient({
  messages: allMessages,
  allProfiles,
  currentProfile,
  currentUserId,
}: {
  messages: DirectMessage[]
  allProfiles: Profile[]
  currentProfile: Profile | null
  currentUserId: string
}) {
  const supabase = createClient()

  const conversationMap = new Map<string, { profile: Profile; lastMessage: DirectMessage }>()
  allMessages.forEach(msg => {
    const other = msg.sender_id === currentUserId
      ? (msg.recipient as unknown as Profile)
      : (msg.sender as unknown as Profile)
    if (!other) return
    if (!conversationMap.has(other.id)) {
      conversationMap.set(other.id, { profile: other, lastMessage: msg })
    }
  })
  const conversations = Array.from(conversationMap.values())

  const [activeUserId, setActiveUserId] = useState<string | null>(conversations[0]?.profile.id || null)
  const [thread, setThread] = useState<DirectMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewDM, setShowNewDM] = useState(false)
  const [convos, setConvos] = useState(conversations)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const bottomRef = useRef<HTMLDivElement>(null)
  const dmInputRef = useRef<HTMLTextAreaElement>(null)

  const resizeDmInput = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  useEffect(() => {
    if (!activeUserId) return
    loadThread(activeUserId)
  }, [activeUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  useEffect(() => {
    const channel = supabase
      .channel('direct_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, async payload => {
        const msg = payload.new as DirectMessage
        const isRelevant = msg.sender_id === currentUserId || msg.recipient_id === currentUserId
        if (!isRelevant) return
        const otherId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id
        if (otherId === activeUserId) {
          const { data } = await supabase
            .from('direct_messages')
            .select('*, sender:profiles!direct_messages_sender_id_fkey(id, full_name, unit, role), recipient:profiles!direct_messages_recipient_id_fkey(id, full_name, unit, role)')
            .eq('id', msg.id)
            .single()
          if (data) setThread(prev => [...prev, data])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeUserId])

  const loadThread = async (userId: string) => {
    const { data } = await supabase
      .from('direct_messages')
      .select('*, sender:profiles!direct_messages_sender_id_fkey(id, full_name, unit, role), recipient:profiles!direct_messages_recipient_id_fkey(id, full_name, unit, role)')
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
    setThread(data || [])
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeUserId || sending) return
    setSending(true)
    await supabase.from('direct_messages').insert({
      sender_id: currentUserId,
      recipient_id: activeUserId,
      content: input.trim(),
    })
    setInput('')
    setSending(false)
    if (dmInputRef.current) {
      dmInputRef.current.style.height = 'auto'
      dmInputRef.current.focus()
    }
  }

  const startNewDM = async (profile: Profile) => {
    setShowNewDM(false)
    if (!convos.find(c => c.profile.id === profile.id)) {
      setConvos(prev => [{ profile, lastMessage: {} as DirectMessage }, ...prev])
    }
    setActiveUserId(profile.id)
    setMobileView('thread')
  }

  const selectConvo = (userId: string) => {
    setActiveUserId(userId)
    setMobileView('thread')
  }

  const activeConvo = convos.find(c => c.profile.id === activeUserId)

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Private Messages</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Secure one-on-one conversations</p>
      </div>

      {showNewDM && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewDM(false)}>
          <div className="card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>New Message</h2>
              <button onClick={() => setShowNewDM(false)} className="btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Select a resident to message:</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {allProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => startNewDM(p)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar name={p.full_name} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.unit}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '460px' }}>

        {/* ── Conversation list ── */}
        <div className={clsx(
          'flex-shrink-0 flex flex-col',
          'border-r',
          'md:w-64',
          // mobile: full-width when viewing list, hidden when viewing thread
          mobileView === 'list' ? 'flex w-full' : 'hidden md:flex',
        )} style={{ borderColor: 'var(--border-soft)' }}>
          <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <button
              onClick={() => setShowNewDM(true)}
              className="w-full btn-ghost flex items-center gap-1.5 justify-center text-sm py-2.5"
            >
              <Plus className="w-4 h-4" /> New Message
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convos.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
            )}
            {convos.map(({ profile, lastMessage }) => (
              <button
                key={profile.id}
                onClick={() => selectConvo(profile.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                  activeUserId === profile.id ? 'border-l-2' : 'border-l-2 border-transparent'
                )}
                style={{
                  borderBottom: '1px solid var(--border-soft)',
                  borderLeftColor: activeUserId === profile.id ? 'var(--brand)' : 'transparent',
                  background: activeUserId === profile.id ? 'var(--brand-xlight)' : 'transparent',
                }}
              >
                <Avatar name={profile.full_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {lastMessage?.content || 'Start a conversation'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Thread ── */}
        <div className={clsx(
          'flex-1 flex-col overflow-hidden',
          mobileView === 'thread' ? 'flex' : 'hidden md:flex',
        )}>
          {!activeConvo ? (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Select a conversation or start a new one
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div
                className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border-soft)' }}
              >
                {/* Back button — mobile only */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden btn-icon w-8 h-8 flex-shrink-0 -ml-1"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <Avatar name={activeConvo.profile.full_name} size="md" />
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{activeConvo.profile.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeConvo.profile.unit}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ overscrollBehaviorY: 'contain' }}>
                {thread.length === 0 && (
                  <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>No messages yet. Say hello!</p>
                )}
                {thread.map(msg => {
                  const isMe = msg.sender_id === currentUserId
                  return (
                    <div key={msg.id} className={clsx('flex gap-2', isMe && 'flex-row-reverse')}>
                      <div
                        className="max-w-[75%] sm:max-w-[65%] px-4 py-2.5 text-sm leading-relaxed break-words"
                        style={{
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe ? 'var(--brand)' : 'var(--surface-2)',
                          color: isMe ? 'white' : 'var(--text-primary)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                        <p className="text-[10px] mt-1" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div
                className="px-4 py-3 flex gap-2 flex-shrink-0"
                style={{ borderTop: '1px solid var(--border-soft)' }}
              >
                <textarea
                  ref={dmInputRef}
                  rows={1}
                  className="input flex-1 min-w-0 text-base"
                  placeholder={`Message ${activeConvo.profile.full_name}… (Shift+Enter for new line)`}
                  value={input}
                  onChange={e => { setInput(e.target.value); resizeDmInput(e.target) }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  style={{ resize: 'none', overflowY: 'hidden', minHeight: '44px', maxHeight: '120px', lineHeight: '1.5', paddingTop: '10px', paddingBottom: '10px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-colors"
                  style={{ background: 'var(--brand)' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
