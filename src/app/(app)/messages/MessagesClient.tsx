'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Plus, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { DirectMessage, Profile } from '@/types'
import clsx from 'clsx'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold flex-shrink-0`}>
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

  // Build conversation list from messages
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeUserId) return
    loadThread(activeUserId)
  }, [activeUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  // Realtime subscription
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
  }

  const startNewDM = async (profile: Profile) => {
    setShowNewDM(false)
    if (!convos.find(c => c.profile.id === profile.id)) {
      setConvos(prev => [{ profile, lastMessage: {} as DirectMessage }, ...prev])
    }
    setActiveUserId(profile.id)
  }

  const activeConvo = convos.find(c => c.profile.id === activeUserId)

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Private Messages</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Secure one-on-one conversations</p>
      </div>

      {showNewDM && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewDM(false)}>
          <div className="card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">New Message</h2>
              <button onClick={() => setShowNewDM(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Select a resident to message:</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {allProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => startNewDM(p)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <Avatar name={p.full_name} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.full_name}</p>
                    <p className="text-xs text-gray-400">{p.unit}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '460px' }}>
        {/* Conversation list */}
        <div className="w-56 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <button onClick={() => setShowNewDM(true)} className="w-full btn-ghost flex items-center gap-1.5 justify-center text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> New Message
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convos.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No conversations yet</p>
            )}
            {convos.map(({ profile, lastMessage }) => (
              <button
                key={profile.id}
                onClick={() => setActiveUserId(profile.id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 p-3 border-b border-gray-50 dark:border-gray-800/50 text-left transition-colors',
                  activeUserId === profile.id
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <Avatar name={profile.full_name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{lastMessage?.content || 'Start a conversation'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeConvo ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation or start a new one
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <Avatar name={activeConvo.profile.full_name} size="md" />
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{activeConvo.profile.full_name}</p>
                  <p className="text-xs text-gray-400">{activeConvo.profile.unit}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">No messages yet. Say hello!</p>
                )}
                {thread.map(msg => {
                  const isMe = msg.sender_id === currentUserId
                  return (
                    <div key={msg.id} className={clsx('flex gap-2', isMe && 'flex-row-reverse')}>
                      <div className={clsx(
                        'max-w-[70%] px-3 py-2 rounded-2xl text-sm',
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                      )}>
                        {msg.content}
                        <p className={clsx('text-[10px] mt-1', isMe ? 'text-brand-200' : 'text-gray-400')}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={`Message ${activeConvo.profile.full_name}…`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage() } }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0"
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
