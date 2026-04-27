# 🏘️ SHAI Connect

**Community Digital Platform for Sabella Homeowners Association Inc.**

Built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. Deployable to Vercel for free.

---

## Features

- 🔐 **Auth** — Email/password login with role-based access (Resident / Moderator / Admin)
- 📢 **Announcements** — Admin-only bulletin board with pinning and categories
- 📰 **Community Feed** — Social-style posts with likes, phase tagging
- 💬 **Phase Chat Rooms** — Real-time group chats per residential phase
- ✉️ **Private Messages** — Secure one-on-one direct messaging
- 👥 **Residents Directory** — Search, filter, and follow neighbors
- 👤 **Profile** — Editable profile with notification preferences
- 🛡️ **Admin Panel** — User management, content moderation, analytics
- 🌙 **Dark / Light Mode** — Toggle stored in localStorage

---

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Frontend    | Next.js 14 (App Router) |
| Styling     | Tailwind CSS            |
| Backend     | Supabase (Auth, DB, Realtime, Storage) |
| Hosting     | Vercel                  |
| Version Control | GitHub              |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/shai-connect.git
cd shai-connect
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a **new project**
2. Open the **SQL Editor** and run the full contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Configure Supabase Auth

In your Supabase dashboard:
- Go to **Authentication → URL Configuration**
- Set **Site URL** to `http://localhost:3000` (update to your Vercel URL after deploy)
- Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### 6. Create your first admin account

1. Register via the app (creates a `resident` account)
2. Go to your Supabase dashboard → **Table Editor → profiles**
3. Find your record and change `role` from `resident` to `admin`

---

## Deploying to Vercel (Free)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial SHAI Connect"
git remote add origin https://github.com/YOUR_USERNAME/shai-connect.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your `shai-connect` GitHub repository
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

Vercel will give you a live URL like `shai-connect.vercel.app` in ~2 minutes.

### Step 3 — Update Supabase Auth URLs

After deployment, go back to Supabase → **Authentication → URL Configuration**:
- Update **Site URL** to your Vercel URL (e.g. `https://shai-connect.vercel.app`)
- Add to **Redirect URLs**: `https://shai-connect.vercel.app/auth/callback`

### Optional: Custom Domain

1. Buy a domain (e.g. `sabellahoa.com`) from Namecheap or GoDaddy (~₱570/yr)
2. In Vercel → your project → **Settings → Domains → Add**
3. Follow the DNS instructions — goes live within 1 hour

---

## Project Structure

```
shai-connect/
├── src/
│   ├── app/
│   │   ├── (app)/               # Protected pages (require login)
│   │   │   ├── layout.tsx       # App shell (sidebar + topbar)
│   │   │   ├── feed/            # Community feed
│   │   │   ├── announcements/   # HOA bulletin board
│   │   │   ├── chat/            # Phase chat rooms (realtime)
│   │   │   ├── messages/        # Private DMs (realtime)
│   │   │   ├── residents/       # Directory with follow system
│   │   │   ├── profile/         # User profile & settings
│   │   │   └── admin/           # Admin panel (admin/mod only)
│   │   ├── auth/                # Login & registration page
│   │   │   └── callback/        # Email verification handler
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   └── ui/
│   │       └── ThemeProvider.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        # Browser Supabase client
│   │       └── server.ts        # Server Supabase client
│   ├── middleware.ts             # Auth route protection
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── supabase/
│   └── schema.sql               # Full DB schema — run this first!
├── .env.example                 # Environment variable template
├── next.config.js
├── tailwind.config.ts
└── README.md
```

---

## Cost Estimate

| Service         | Cost at Launch |
|-----------------|----------------|
| Vercel (Hobby)  | FREE           |
| Supabase (Free) | FREE           |
| GitHub (Free)   | FREE           |
| **Total/month** | **₱0**         |

Scaling costs only kick in beyond 50,000 monthly active users.

---

## Development Phases

| Phase | Features | Status |
|-------|----------|--------|
| Phase 1 | Auth, Announcements, Feed, Responsive layout | ✅ Built |
| Phase 2 | Phase Chats, File uploads, Reactions, Profiles, Follow system | ✅ Built |
| Phase 3 | Private DMs, Notifications, Polls, Search | 🔄 Partial |
| Phase 4 | Admin dashboard, Analytics, Audit logs | ✅ Built |

---

## License

Internal use only — Sabella Homeowners Association Inc.
