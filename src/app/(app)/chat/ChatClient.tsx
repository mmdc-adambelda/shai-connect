'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ChatMessage, Profile } from '@/types'
import clsx from 'clsx'

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const dim = size === 'md' ? 36 : 28
  return (
    <div
      className="avatar font-bold flex-shrink-0"
      style={{ width: dim, height: dim, fontSize: dim * 0.35 }}
    >
      {initials}
    </div>
  )
}

export default function ChatClient({
  rooms,
  initialRoom,
  initialMessages,
  currentProfile,
  currentUserId,
}: {
  rooms: string[]
  initialRoom: string
  initialMessages: ChatMessage[]
  currentProfile: Profile | null
  currentUserId: string
}) {
  const [activeRoom, setActiveRoom] = useState(initialRoom)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingRoom, setLoadingRoom] = useState(false)
  const [roomPickerOpen, setRoomPickerOpen] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const resizeChatInput = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${activeRoom}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${activeRoom}` },
        async (payload) => {
          const { data: msgWithProfile } = await supabase
            .from('chat_messages')
            .select('*, profiles(id, full_name, unit)')
            .eq('id', payload.new.id)
            .single()
          if (msgWithProfile) {
            setMessages(prev => {
              if (prev.find(m => m.id === msgWithProfile.id)) return prev
              return [...prev, msgWithProfile]
            })
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeRoom])

  // Dismiss active message toolbar on outside click
  useEffect(() => {
    if (!activeMessageId) return
    const close = () => setActiveMessageId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMessageId])

  const switchRoom = async (room: string) => {
    setActiveRoom(room)
    setRoomPickerOpen(false)
    setLoadingRoom(true)
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles(id, full_name, unit)')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(50)
    setMessages(data || [])
    setLoadingRoom(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    await supabase.from('chat_messages').insert({
      room: activeRoom,
      sender_id: currentUserId,
      content: input.trim(),
    })
    setInput('')
    setSending(false)
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto'
      chatInputRef.current.focus()
    }
  }

  const updateMessage = async (id: string, content: string) => {
    if (!content.trim()) return
    await supabase.from('chat_messages').update({ content: content.trim() }).eq('id', id).eq('sender_id', currentUserId)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: content.trim() } : m))
    setEditingId(null)
  }

  const deleteMessage = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('id', id).eq('sender_id', currentUserId)
    setMessages(prev => prev.filter(m => m.id !== id))
    setActiveMessageId(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Phase Chat</h1>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time conversations with your neighbors</p>
      </div>

      <div className="card overflow-hidden flex flex-col chat-panel">

        {/* ── Chat header — room picker ── */}
        <div
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-soft)' }}
        >
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{activeRoom}</p>
            <p className="text-xs" style={{ color: 'var(--brand)' }}>● Live</p>
          </div>

          {rooms.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setRoomPickerOpen(v => !v)}
                className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                Switch Room <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {roomPickerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRoomPickerOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 card py-1 min-w-[160px]" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    {rooms.map(room => (
                      <button
                        key={room}
                        onClick={() => switchRoom(room)}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                        style={{
                          color: activeRoom === room ? 'var(--brand)' : 'var(--text-secondary)',
                          background: activeRoom === room ? 'var(--brand-xlight)' : 'transparent',
                          fontWeight: activeRoom === room ? 600 : 400,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: activeRoom === room ? 'var(--brand)' : 'var(--gray-300, #ccc)' }} />
                        {room}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingRoom && (
            <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading messages…
            </div>
          )}
          {!loadingRoom && messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
              No messages yet. Say hello! 👋
            </div>
          )}
          {!loadingRoom && messages.map(msg => {
            const sender = msg.profiles as unknown as Profile
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={clsx('flex gap-2.5', isMe && 'flex-row-reverse')}>
                {!isMe && <Avatar name={sender?.full_name || 'Resident'} />}
                <div className={clsx('max-w-[75%] sm:max-w-[65%]', isMe && 'items-end flex flex-col')}>
                  {!isMe && (
                    <p className="text-xs font-semibold mb-1 ml-1" style={{ color: 'var(--text-secondary)' }}>
                      {sender?.full_name}
                    </p>
                  )}

                  {/* Message bubble with hover/tap actions for own messages */}
                  <div className="group relative">
                    {/* Action toolbar — hover on desktop, tap on mobile */}
                    {isMe && editingId !== msg.id && (
                      <div
                        className={clsx(
                          'absolute -top-9 right-0 flex gap-0.5 px-2 py-1 rounded-lg shadow-md z-10 transition-opacity',
                          activeMessageId === msg.id
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                        )}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { setEditingId(msg.id); setEditContent(msg.content); setActiveMessageId(null) }}
                          className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >Edit</button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >Unsend</button>
                      </div>
                    )}

                    {editingId === msg.id ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          className="input text-sm"
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); updateMessage(msg.id, editContent) }
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => setEditingId(null)} className="btn-ghost py-1 px-2 text-xs">Cancel</button>
                          <button
                            onClick={() => updateMessage(msg.id, editContent)}
                            disabled={!editContent.trim()}
                            className="btn-primary py-1 px-2 text-xs"
                          >Save</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="px-3.5 py-2.5 text-sm leading-relaxed break-words"
                        style={{
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? 'var(--brand)' : 'var(--surface-3)',
                          color: isMe ? 'white' : 'var(--text-primary)',
                          wordBreak: 'break-word',
                          border: isMe ? 'none' : '1px solid var(--border)',
                          cursor: isMe ? 'pointer' : 'default',
                        }}
                        onClick={isMe ? e => {
                          e.stopPropagation()
                          setActiveMessageId(prev => prev === msg.id ? null : msg.id)
                        } : undefined}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div
          className="px-4 py-3 flex gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-soft)' }}
        >
          <textarea
            ref={chatInputRef}
            rows={1}
            className="input flex-1 min-w-0 text-base"
            placeholder={`Message ${activeRoom}… (Shift+Enter for new line)`}
            value={input}
            onChange={e => { setInput(e.target.value); resizeChatInput(e.target) }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            style={{ resize: 'none', overflowY: 'hidden', minHeight: '44px', maxHeight: '120px', lineHeight: '1.5', paddingTop: '10px', paddingBottom: '10px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full text-white flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
            style={{ background: 'var(--brand)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}
