-- ============================================================
-- SHAI Connect – Full Migration
-- Run this in your Supabase SQL Editor (replaces schema.sql)
-- ============================================================

-- ── 1. PROFILES (extend existing) ──────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS bio         TEXT,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW();

-- ── 2. POSTS (extend existing) ─────────────────────────────
-- Posts table assumed to already exist with:
--   id, content, phase_tag, author_id, image_url, created_at
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 3. REACTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('like','love','haha','wow','sad','angry')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate reactions per user per post
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);

-- ── 4. COMMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- NULL means top-level comment; non-null means reply to a comment
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only allow one level of nesting (parent must be a top-level comment)
CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- ── 5. FOLLOWS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  -- Prevent self-follow
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ── 6. RLS POLICIES ─────────────────────────────────────────
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows   ENABLE ROW LEVEL SECURITY;

-- Reactions: anyone authenticated can read; only owner can write
CREATE POLICY "reactions_select" ON reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert" ON reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions_delete" ON reactions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reactions_update" ON reactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Comments: authenticated read; owner insert/delete; no external edits
CREATE POLICY "comments_select" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete" ON comments FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "comments_update" ON comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- Follows: authenticated read; owner insert/delete
CREATE POLICY "follows_select" ON follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete" ON follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- ── 7. HELPER VIEWS (avoid N+1) ─────────────────────────────
-- Aggregated reaction counts per post (used in feed query)
CREATE OR REPLACE VIEW post_reaction_counts AS
  SELECT
    post_id,
    type,
    COUNT(*) AS count
  FROM reactions
  GROUP BY post_id, type;

-- Aggregated comment count per post
CREATE OR REPLACE VIEW post_comment_counts AS
  SELECT
    post_id,
    COUNT(*) AS count
  FROM comments
  WHERE parent_id IS NULL  -- only top-level comments count
  GROUP BY post_id;

-- ── 8. STORAGE BUCKET ────────────────────────────────────────
-- Run this manually if bucket doesn't exist:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('shai-uploads', 'shai-uploads', true)
-- ON CONFLICT DO NOTHING;

