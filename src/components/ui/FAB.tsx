'use client'

import { usePathname } from 'next/navigation'
import { PenLine, MessageCirclePlus } from 'lucide-react'

export default function FAB() {
  const pathname = usePathname()

  const isFeed     = pathname === '/feed' || pathname.startsWith('/feed/')
  const isMessages = pathname === '/messages' || pathname.startsWith('/messages/')

  if (!isFeed && !isMessages) return null

  const Icon  = isFeed ? PenLine : MessageCirclePlus
  const label = isFeed ? 'New Post' : 'New Message'

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('shai:fab'))
  }

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className="md:hidden fixed right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      style={{
        background: 'var(--brand)',
        color: 'white',
        bottom: 'calc(56px + env(safe-area-inset-bottom) + 14px)',
        boxShadow: '0 4px 18px rgba(31,93,66,0.40)',
      }}
    >
      <Icon className="w-6 h-6" strokeWidth={2} />
    </button>
  )
}
