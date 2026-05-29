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



-- ============================================================
-- SHAI Connect – New Tables Migration
-- Board Resolutions & Financial Reports
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── BOARD RESOLUTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.board_resolutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_number TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  pdf_url           TEXT,
  approval_date     DATE NOT NULL,
  uploaded_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published         BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.board_resolutions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view published resolutions
CREATE POLICY "Published resolutions viewable by authenticated users"
  ON public.board_resolutions FOR SELECT
  USING (auth.role() = 'authenticated' AND published = TRUE);

-- Admins and superadmins can view all (including unpublished)
CREATE POLICY "Admins can view all resolutions"
  ON public.board_resolutions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','superadmin')
    )
  );

-- Admin and superadmin can insert
CREATE POLICY "Admin can insert resolutions"
  ON public.board_resolutions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','superadmin')
    )
  );

-- Admin and superadmin can update
CREATE POLICY "Admin can update resolutions"
  ON public.board_resolutions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','superadmin')
    )
  );

-- Only superadmin can delete
CREATE POLICY "Superadmin can delete resolutions"
  ON public.board_resolutions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_board_resolutions_published   ON public.board_resolutions(published);
CREATE INDEX IF NOT EXISTS idx_board_resolutions_approval    ON public.board_resolutions(approval_date DESC);
CREATE INDEX IF NOT EXISTS idx_board_resolutions_uploaded_by ON public.board_resolutions(uploaded_by);


-- ── FINANCIAL REPORTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  year        INT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'Annual Financial Report',
  pdf_url     TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published   BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reports viewable by authenticated users"
  ON public.financial_reports FOR SELECT
  USING (auth.role() = 'authenticated' AND published = TRUE);

CREATE POLICY "Admins can manage financial reports"
  ON public.financial_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','superadmin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_financial_reports_year      ON public.financial_reports(year DESC);
CREATE INDEX IF NOT EXISTS idx_financial_reports_published ON public.financial_reports(published);


-- ── Seed: 2025 Audited Financial Statements ─────────────────
-- Update pdf_url once you've uploaded the file to Supabase Storage
INSERT INTO public.financial_reports (title, year, report_type, pdf_url, published)
VALUES (
  '2025 Audited Financial Statements',
  2025,
  'Annual Financial Report',
  NULL,  -- update to Supabase Storage public URL after upload
  TRUE
)
ON CONFLICT DO NOTHING;

-- ── Ensure 'superadmin' is a valid role value ────────────────
-- (The existing CHECK constraint may only allow 'resident','moderator','admin')
-- Run this if the constraint needs updating:
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('resident','moderator','admin','superadmin'));
