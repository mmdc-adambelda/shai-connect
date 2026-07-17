-- ── Content reporting/flagging ──────────────────────────────────
-- Backs the Admin Panel's "Flagged" tab, which previously showed
-- hardcoded placeholder data with no real table behind it.
--
-- Safe to run more than once: every policy is dropped first, then
-- recreated, since Postgres has no CREATE POLICY IF NOT EXISTS.

create table if not exists public.reports (
  id           uuid default gen_random_uuid() primary key,
  content_type text not null check (content_type in ('post', 'comment', 'chat_message')),
  content_id   uuid not null,
  reporter_id  uuid references public.profiles(id) on delete cascade not null,
  reason       text not null check (reason in ('Spam', 'Conduct', 'Misinformation', 'Other')),
  details      text,
  status       text not null default 'pending' check (status in ('pending', 'removed', 'dismissed')),
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz default now() not null
);

alter table public.reports enable row level security;

drop policy if exists "Authenticated users can create reports" on public.reports;
create policy "Authenticated users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Admins and moderators can view reports" on public.reports;
create policy "Admins and moderators can view reports"
  on public.reports for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator', 'superadmin'))
  );

drop policy if exists "Admins and moderators can update reports" on public.reports;
create policy "Admins and moderators can update reports"
  on public.reports for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator', 'superadmin'))
  );

-- ── Let admins/moderators actually remove flagged content ───────
-- (comments and chat_messages had no admin-delete policy at all;
-- posts had one but it was missing 'superadmin')

drop policy if exists "Admins and moderators can delete any comment" on public.comments;
create policy "Admins and moderators can delete any comment"
  on public.comments for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator', 'superadmin'))
  );

drop policy if exists "Admins and moderators can delete chat messages" on public.chat_messages;
create policy "Admins and moderators can delete chat messages"
  on public.chat_messages for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator', 'superadmin'))
  );

drop policy if exists "Superadmins can delete posts" on public.posts;
create policy "Superadmins can delete posts"
  on public.posts for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
  );
