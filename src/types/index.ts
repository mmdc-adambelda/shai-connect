export type Role = 'admin' | 'moderator' | 'resident'

export interface Profile {
  id: string
  full_name: string
  unit: string
  phase: string
  role: Role
  avatar_url?: string | null
  bio?: string | null
  created_at: string
}

export interface Post {
  id: string
  content: string
  phase_tag: string
  author_id: string
  image_url?: string | null
  created_at: string
  updated_at?: string
  profiles?: Profile
  // Aggregates joined from DB
  reaction_counts?: ReactionCount[]
  comment_count?: number
  user_reaction?: ReactionType | null
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  type: ReactionType
  created_at: string
}

export interface ReactionCount {
  type: ReactionType
  count: number
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  profiles?: Profile
  replies?: Comment[]
  reply_count?: number
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// ── Types for existing pages (chat, messages, announcements) ──

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  profiles?: Profile
}

export interface Announcement {
  id: string
  title: string
  content: string
  author_id: string
  phase_tag?: string | null
  pinned?: boolean
  created_at: string
  profiles?: Profile
}
