'use client'

import { usePathname } from 'next/navigation'
import { PenLine } from 'lucide-react'

export default function FAB() {
  const pathname = usePathname()
  const isFeed = pathname === '/feed' || pathname.startsWith('/feed/')
  if (!isFeed) return null

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('shai:fab'))}
      aria-label="New Post"
      className="md:hidden fixed right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      style={{
        background: 'var(--brand)',
        color: 'white',
        bottom: 'calc(56px + env(safe-area-inset-bottom) + 14px)',
        boxShadow: '0 4px 18px rgba(31,93,66,0.40)',
      }}
    >
      <PenLine className="w-6 h-6" strokeWidth={2} />
    </button>
  )
}
