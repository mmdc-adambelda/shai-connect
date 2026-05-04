# SHAI Connect – Upgrade Integration Guide

## What's New in This Upgrade

### Features Added
1. **Post Engagement System** — Reactions (6 types), Comments, Threaded Replies
2. **Follow System** — Follow/Unfollow users, Followers/Following lists
3. **iOS-Inspired UI Redesign** — DM Sans font, CSS variable design tokens, refined components

---

## Step 1: Run the Database Migration

Open your **Supabase Dashboard → SQL Editor** and run the contents of:
```
supabase/migrations.sql
```

This adds:
- `reactions` table with UNIQUE(post_id, user_id) constraint
- `comments` table with `parent_id` for threading (max 1 level)
- `follows` table with self-follow guard
- RLS policies on all new tables
- Helper views: `post_reaction_counts`, `post_comment_counts`
- Indexes for all foreign keys

---

## Step 2: Replace/Merge Files

### New files to add (didn't exist before):
```
src/types/index.ts                               ← unified types
src/hooks/useEngagement.ts                       ← useReactions, useFollow hooks
src/lib/supabase/client.ts                       ← Supabase browser client
src/lib/supabase/server.ts                       ← Supabase server client
src/app/api/posts/[postId]/reactions/route.ts    ← Reactions API
src/app/api/posts/[postId]/comments/route.ts     ← Comments API
src/app/api/users/[userId]/follow/route.ts       ← Follow/Unfollow API
src/app/api/users/[userId]/followers/route.ts    ← Followers list API
src/app/api/users/[userId]/following/route.ts    ← Following list API
tailwind.config.js                               ← Design tokens
supabase/migrations.sql                          ← DB schema
```

### Files to replace (modified):
```
src/app/globals.css                              ← Full redesign
src/components/layout/Sidebar.tsx               ← Redesigned sidebar
src/components/layout/Topbar.tsx                ← Redesigned topbar + search
src/app/(app)/layout.tsx                        ← Updated layout wrapper
src/app/(app)/feed/FeedClient.tsx               ← Full reactions + comments UI
src/app/(app)/feed/page.tsx                     ← Batched server queries
src/app/(app)/profile/ProfileClient.tsx         ← Follow system + redesigned UI
src/app/(app)/profile/page.tsx                  ← Updated queries + follow state
src/app/layout.tsx                              ← Google Fonts preconnect
```

---

## Step 3: Install Dependencies

No new npm packages required. All features use your existing:
- `@supabase/supabase-js` + `@supabase/ssr`
- `lucide-react`
- `date-fns`
- `clsx`
- `tailwindcss`

---

## API Reference

### Reactions
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET`  | `/api/posts/:postId/reactions` | — | Get counts + user's reaction |
| `POST` | `/api/posts/:postId/reactions` | `{ type: "like"\|"love"\|"haha"\|"wow"\|"sad"\|"angry" }` | Add/toggle/switch reaction |
| `DELETE` | `/api/posts/:postId/reactions` | — | Remove reaction |

**Toggle behavior:** POST with same type as current → removes it. POST with different type → switches.

### Comments
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET`  | `/api/posts/:postId/comments?limit=20&offset=0` | — | Paginated comments + replies |
| `POST` | `/api/posts/:postId/comments` | `{ content, parent_id? }` | Add comment or reply |

**Threading:** Max 1 level of nesting enforced on the server side.

### Follow System
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET`    | `/api/users/:userId/follow` | — | Check if current user follows |
| `POST`   | `/api/users/:userId/follow` | — | Follow a user |
| `DELETE` | `/api/users/:userId/follow` | — | Unfollow a user |
| `GET`    | `/api/users/:userId/followers?limit=20` | — | Paginated followers list |
| `GET`    | `/api/users/:userId/following?limit=20` | — | Paginated following list |

---

## Performance: N+1 Elimination

### Feed page (page.tsx)
The feed uses **4 parallel queries** total for any number of posts, never N+1:
```
1. posts + profiles (JOIN, single query)
2. reactions for all postIds (batch IN)
3. user's own reactions for all postIds (batch IN)  
4. comment counts for all postIds (batch IN)
```
Results are merged in-memory using Maps.

### Comments API
Two queries total regardless of thread depth:
```
1. Top-level comments + author profiles (paginated)
2. All replies for those comment IDs (single IN query)
```
Replies are grouped by `parent_id` in-memory.

### Profile page (page.tsx)
Four queries run in **parallel** via `Promise.all`:
```
1. Post count
2. Following count
3. Follower count
4. Is current user following? (conditional)
```

---

## Caching Strategy (Bonus)

### Recommended approach for large communities:

**Option A: Supabase Edge Functions + Redis (Production)**
- Cache reaction counts in Redis with a TTL of 30s
- Invalidate on POST/DELETE to reactions
- Use `INCR`/`DECR` for atomic counter updates

**Option B: Next.js ISR (Simple)**
```ts
// In page.tsx — revalidate feed every 60 seconds
export const revalidate = 60
```

**Option C: SWR/React Query (Client-side)**
```ts
// Install: npm install swr
import useSWR from 'swr'
const { data } = useSWR(`/api/posts/${postId}/reactions`, fetcher, {
  refreshInterval: 30000, // 30s polling
  revalidateOnFocus: true,
})
```

---

## Profile Page Navigation

To view another user's profile, link to:
```
/profile?userId=<their-uuid>
```

The page detects `isOwnProfile` automatically and shows/hides the edit form, password section, and notification settings accordingly.

---

## Design Tokens

All colors and spacing use CSS variables defined in `globals.css`:

```css
--brand          /* #1b6b45 — primary green */
--surface        /* #ffffff — card background */
--surface-2      /* #f7f8f6 — page background */
--text-primary   /* #0f1711 — headings */
--text-muted     /* #8a9899 — timestamps, labels */
--border-soft    /* #f0f1ef — subtle borders */
```

Dark mode variables are automatically set via `.dark` class on `<html>`.

---

## Troubleshooting

**"RLS policy violation" on reactions/comments:**
→ Make sure you ran the full `migrations.sql` file. Check that `auth.uid()` matches the `user_id` being inserted.

**Reactions not persisting:**
→ The `UNIQUE(post_id, user_id)` constraint on reactions is intentional. The toggle logic handles it.

**Comments not loading:**
→ Verify `parent_id` column is nullable in the `comments` table. Run the migration again if needed.

**Tailwind classes not applying:**
→ Make sure `tailwind.config.js` is in the project root and `content` paths include `./src/**/*.{js,ts,jsx,tsx}`.

**DM Sans font not loading:**
→ Check that `globals.css` `@import` is at the very top of the file (before all `@tailwind` directives). The `preconnect` tags in `layout.tsx` also help with load time.
