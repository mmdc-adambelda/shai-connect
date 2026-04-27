'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ChatMessage, Profile } from '@/types'
import clsx from 'clsx'

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'
  return (
    <div className={`${sz} rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold flex-shrink-0`}>
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${activeRoom}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room=eq.${activeRoom}`,
        },
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

  const switchRoom = async (room: string) => {
    setActiveRoom(room)
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
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Phase Chat Rooms</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time conversations by residential phase</p>
      </div>

      <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '460px' }}>
        {/* Room list */}
        <div className="w-52 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50">
          <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rooms</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {rooms.map(room => (
              <button
                key={room}
                onClick={() => switchRoom(room)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 text-sm transition-colors',
                  activeRoom === room
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', activeRoom === room ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600')} />
                  <span className="leading-tight text-xs">{room}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{activeRoom}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">● Live</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingRoom && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading messages…</div>
            )}
            {!loadingRoom && messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No messages yet. Say hello! 👋
              </div>
            )}
            {!loadingRoom && messages.map(msg => {
              const sender = msg.profiles as unknown as Profile
              const isMe = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={clsx('flex gap-2', isMe && 'flex-row-reverse')}>
                  {!isMe && <Avatar name={sender?.full_name || 'Resident'} />}
                  <div className={clsx('max-w-[65%]', isMe && 'items-end flex flex-col')}>
                    {!isMe && (
                      <p className="text-xs text-gray-400 mb-1">{sender?.full_name}</p>
                    )}
                    <div className={clsx(
                      'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                      isMe
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                    )}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            <input
              className="input flex-1"
              placeholder={`Message ${activeRoom}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
