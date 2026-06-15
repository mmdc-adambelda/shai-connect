-- ============================================================
-- SHAI Connect — Service Desk Migration
-- Run this entire script in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── 0. Drop old tables cleanly (safe: cascades to comments/activity) ──
DROP TABLE IF EXISTS public.ticket_activity  CASCADE;
DROP TABLE IF EXISTS public.ticket_comments  CASCADE;
DROP TABLE IF EXISTS public.support_tickets  CASCADE;
DROP TABLE IF EXISTS public.ticket_counters  CASCADE;

-- ── 1. Ticket counter (per-year auto-increment) ─────────────
CREATE TABLE IF NOT EXISTS public.ticket_counters (
  year    INTEGER PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0
);

-- ── 2. Function: generate unique ticket number ───────────────
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year    INTEGER;
  v_counter INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  INSERT INTO public.ticket_counters (year, counter)
    VALUES (v_year, 1)
    ON CONFLICT (year)
    DO UPDATE SET counter = ticket_counters.counter + 1
    RETURNING counter INTO v_counter;
  RETURN 'SHAI-' || v_year::TEXT || '-' || LPAD(v_counter::TEXT, 6, '0');
END;
$$;

-- ── 3. Main support_tickets table ───────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT        NOT NULL UNIQUE DEFAULT public.generate_ticket_number(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category      TEXT        NOT NULL DEFAULT 'general_inquiry',
  subject       TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  priority      TEXT        NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','urgent')),
  status        TEXT        NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','assigned','in_progress','waiting_for_resident','resolved','closed')),
  assigned_to   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  closed_at     TIMESTAMPTZ,
  contact_info  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Ticket comments (conversation thread + internal notes) ─
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  is_internal BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Ticket activity log ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_activity (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id     ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status      ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority    ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at  ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id   ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_activity_ticket_id   ON public.ticket_activity(ticket_id);

-- ── 7. Row Level Security ────────────────────────────────────
ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activity  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_counters  ENABLE ROW LEVEL SECURITY;

-- Helper: check if caller is a support agent
CREATE OR REPLACE FUNCTION public.is_support_agent(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('moderator','admin','superadmin')
  );
$$;

-- support_tickets policies
DROP POLICY IF EXISTS "tickets_select"  ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert"  ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_update"  ON public.support_tickets;

CREATE POLICY "tickets_select" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR public.is_support_agent());

CREATE POLICY "tickets_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tickets_update" ON public.support_tickets
  FOR UPDATE USING (public.is_support_agent());

-- ticket_comments policies
DROP POLICY IF EXISTS "comments_select" ON public.ticket_comments;
DROP POLICY IF EXISTS "comments_insert" ON public.ticket_comments;

CREATE POLICY "comments_select" ON public.ticket_comments
  FOR SELECT USING (
    public.is_support_agent()
    OR (
      NOT is_internal
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = ticket_id AND t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "comments_insert" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_support_agent()
      OR (
        NOT is_internal
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = ticket_id AND t.user_id = auth.uid()
        )
      )
    )
  );

-- ticket_activity policies
DROP POLICY IF EXISTS "activity_select" ON public.ticket_activity;
DROP POLICY IF EXISTS "activity_insert" ON public.ticket_activity;

CREATE POLICY "activity_select" ON public.ticket_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (t.user_id = auth.uid() OR public.is_support_agent())
    )
  );

CREATE POLICY "activity_insert" ON public.ticket_activity
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (t.user_id = auth.uid() OR public.is_support_agent())
    )
  );

-- No direct access to counters (only via SECURITY DEFINER function)
DROP POLICY IF EXISTS "counters_deny" ON public.ticket_counters;
CREATE POLICY "counters_deny" ON public.ticket_counters FOR ALL USING (FALSE);

-- ── 8. updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ticket_comments_updated_at ON public.ticket_comments;
CREATE TRIGGER trg_ticket_comments_updated_at
  BEFORE UPDATE ON public.ticket_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 9. Auto-log ticket creation in activity ──────────────────
CREATE OR REPLACE FUNCTION public.fn_log_ticket_created()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.ticket_activity (ticket_id, user_id, action, new_value)
  VALUES (NEW.id, NEW.user_id, 'created', 'Ticket submitted');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_ticket_created ON public.support_tickets;
CREATE TRIGGER trg_on_ticket_created
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_ticket_created();
