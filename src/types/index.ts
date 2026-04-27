export type Role = 'resident' | 'moderator' | 'admin'

export interface Profile {
  id: string
  full_name: string
  unit: string
  phase: string
  role: Role
  avatar_url?: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  category: string
  pinned: boolean
  created_by: string
  created_at: string
  profiles?: Profile
}

export interface Post {
  id: string
  author_id: string
  content: string
  phase_tag: string
  image_url?: string
  created_at: string
  profiles?: Profile
  reactions?: Reaction[]
  _reaction_count?: number
  _comment_count?: number
}

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  type: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface ChatMessage {
  id: string
  room: string
  sender_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
  recipient?: Profile
}

export interface Follow {
  follower_id: string
  following_id: string
}
