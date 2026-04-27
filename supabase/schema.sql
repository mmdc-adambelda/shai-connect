-- =============================================
-- SHAI Connect — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- ── 1. PROFILES ──────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  unit        text not null default '',
  phase       text not null default 'Phase 1',
  role        text not null default 'resident' check (role in ('resident','moderator','admin')),
  avatar_url  text,
  created_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup (handled in app, but trigger as backup)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, unit, phase)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','New Resident'), '', 'Phase 1')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. ANNOUNCEMENTS ─────────────────────────
create table if not exists public.announcements (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  body        text not null,
  category    text not null default 'General',
  pinned      boolean default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now() not null
);

alter table public.announcements enable row level security;

create policy "Announcements are viewable by all authenticated users"
  on public.announcements for select
  using (auth.role() = 'authenticated');

create policy "Only admins and moderators can insert announcements"
  on public.announcements for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','moderator')
    )
  );

create policy "Only admins and moderators can update announcements"
  on public.announcements for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','moderator')
    )
  );

create policy "Only admins can delete announcements"
  on public.announcements for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ── 3. POSTS ──────────────────────────────────
create table if not exists public.posts (
  id          uuid default gen_random_uuid() primary key,
  author_id   uuid references public.profiles(id) on delete cascade not null,
  content     text not null,
  phase_tag   text not null default 'All Phases',
  image_url   text,
  created_at  timestamptz default now() not null
);

alter table public.posts enable row level security;

create policy "Posts viewable by authenticated users"
  on public.posts for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Authors can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Authors and admins can delete posts"
  on public.posts for delete
  using (
    auth.uid() = author_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  );


-- ── 4. REACTIONS ──────────────────────────────
create table if not exists public.reactions (
  id       uuid default gen_random_uuid() primary key,
  post_id  uuid references public.posts(id) on delete cascade not null,
  user_id  uuid references public.profiles(id) on delete cascade not null,
  type     text not null default 'like',
  unique(post_id, user_id, type)
);

alter table public.reactions enable row level security;

create policy "Reactions viewable by authenticated users"
  on public.reactions for select using (auth.role() = 'authenticated');

create policy "Authenticated users can react"
  on public.reactions for insert with check (auth.uid() = user_id);

create policy "Users can remove their own reactions"
  on public.reactions for delete using (auth.uid() = user_id);


-- ── 5. COMMENTS ───────────────────────────────
create table if not exists public.comments (
  id         uuid default gen_random_uuid() primary key,
  post_id    uuid references public.posts(id) on delete cascade not null,
  author_id  uuid references public.profiles(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comments viewable by authenticated users"
  on public.comments for select using (auth.role() = 'authenticated');

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = author_id);

create policy "Authors can delete their own comments"
  on public.comments for delete using (auth.uid() = author_id);


-- ── 6. CHAT MESSAGES ──────────────────────────
create table if not exists public.chat_messages (
  id         uuid default gen_random_uuid() primary key,
  room       text not null,
  sender_id  uuid references public.profiles(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz default now() not null
);

alter table public.chat_messages enable row level security;

create policy "Chat messages viewable by authenticated users"
  on public.chat_messages for select using (auth.role() = 'authenticated');

create policy "Authenticated users can send messages"
  on public.chat_messages for insert with check (auth.uid() = sender_id);


-- ── 7. DIRECT MESSAGES ────────────────────────
create table if not exists public.direct_messages (
  id           uuid default gen_random_uuid() primary key,
  sender_id    uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  content      text not null,
  read         boolean default false,
  created_at   timestamptz default now() not null
);

alter table public.direct_messages enable row level security;

create policy "Users can view their own DMs"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Authenticated users can send DMs"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can mark DMs as read"
  on public.direct_messages for update
  using (auth.uid() = recipient_id);


-- ── 8. FOLLOWS ────────────────────────────────
create table if not exists public.follows (
  follower_id  uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at   timestamptz default now() not null,
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows viewable by authenticated users"
  on public.follows for select using (auth.role() = 'authenticated');

create policy "Users can follow others"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);


-- ── 9. REALTIME ───────────────────────────────
-- Enable realtime for live chat and notifications
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.posts;


-- ── 10. SEED DATA (optional, delete in production) ──
-- Uncomment to seed a test admin account after first signup:
-- update public.profiles set role = 'admin' where full_name = 'Your Name Here';
