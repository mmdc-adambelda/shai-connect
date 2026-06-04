export type Role = 'resident' | 'moderator' | 'admin' | 'superadmin'

export interface BoardResolution {
  id: string
  resolution_number: string
  title: string
  description: string | null
  pdf_url: string | null
  approval_date: string
  uploaded_by: string | null
  created_at: string
  updated_at: string
  published: boolean
  profiles?: { full_name: string }
}

export interface FinancialReport {
  id: string
  title: string
  year: number
  report_type: string
  pdf_url: string | null
  uploaded_by: string | null
  created_at: string
  published: boolean
}

export interface Profile {
  id: string
  full_name: string
  unit: string
  block_no: number | null
  lot_no: number | null
  phase: string
  role: Role
  project_code: string | null
  is_verified: boolean
  avatar_url?: string | null
  bio?: string | null
  hoa_balance?: number | null
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

export interface SupportTicket {
  id: string
  user_id: string
  type: 'bug' | 'feature' | 'feedback'
  subject: string
  description: string
  status: 'open' | 'resolved'
  created_at: string
  profiles?: { full_name: string; unit: string }
}

export interface ChatMessage {
  id: string
  room_id: string
  room: string
  sender_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  profiles?: Profile
  sender?: Profile
  recipient?: Profile
}

export interface Announcement {
  id: string
  title: string
  body: string
  content: string
  author_id: string
  created_by?: string
  phase_tag?: string | null
  pinned: boolean
  category: string
  image_url?: string | null
  created_at: string
  profiles?: Profile
}
