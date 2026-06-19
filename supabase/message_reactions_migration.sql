-- ── Message Reactions Migration ──────────────────────────────────────────────
-- Run this in your Supabase SQL editor.
-- One reaction per user per message (like Facebook Messenger).

-- ── 1. Phase Chat message reactions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id  UUID        NOT NULL REFERENCES public.chat_messages(id)  ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  emoji       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)  -- one reaction per user per message
);

ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_reactions_select" ON public.chat_message_reactions
  FOR SELECT USING (true);

CREATE POLICY "chat_reactions_insert" ON public.chat_message_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_reactions_delete" ON public.chat_message_reactions
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message
  ON public.chat_message_reactions(message_id);

-- ── 2. Direct Message reactions ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dm_reactions (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id  UUID        NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id)         ON DELETE CASCADE,
  emoji       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)  -- one reaction per user per message
);

ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;

-- Only conversation participants can see/add/remove reactions
CREATE POLICY "dm_reactions_select" ON public.dm_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.direct_messages dm
      WHERE dm.id = message_id
        AND (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
    )
  );

CREATE POLICY "dm_reactions_insert" ON public.dm_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "dm_reactions_delete" ON public.dm_reactions
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message
  ON public.dm_reactions(message_id);
