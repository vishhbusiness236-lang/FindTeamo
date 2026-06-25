# FindTeamo

A swipe based teammate matching platform built specifically for hackers, builders, and founders to find project partners based on overlapping skills, project goals, and availability.

## Why I Built This (The Story)
Having participated in over 16 hackathons, I've faced the teammate struggle firsthand. Almost every major hackathon enforces a strict minimum rule of 2-4 members per team. Watching solo developers with incredible ideas get disqualified or forced into random, mismatched teams because of rushed Discord or Slack pitches is incredibly frustarting.

FindTeamo solves this by bringing a Tinder like discovery interface to hackathons and startup building. Instead of scrolling through text heavy spam channels, users can quickly swipe through profiles, match based on mutual interest, and instantly know if their skills align.

## Core Features
* **Tinder Style Discovery Cards:** Fast swiping mechanism to pass or like potential teammates.
* **Smart Mutual Matching:** Connections are only established when both developers swipe 'liked' on each other.
* **AI Powered Reliability Meter:** Analyzes profile completeness and chat responsivness to dynamically calculate a teammate's commitment score, helping you filter out inactive builders.
* **Granular Profile Tags:** Profile setups that filter and display users based on technical skills, project goals (SaaS, Hackathon, Web3), and weekly availability hours.
* **Google OAuth Authentication:** Fast and secure onboarding using Supabase Auth.
* **In App Messaging:** Once matched, chat directly inside the app with text, image, and voice message support.

## Tech Stack
* **Frontend:** Next.js (App Router) + React
* **Styling:** Tailwind CSS
* **Backend/Database:** Supabase (PostgreSQL, Auth, Realtime, Storage)
* **Hosting:** Vercel

## Demo

Live: (add your vercel.app url here after deploy)

## Screenshots

<!-- add 1-2 real screenshots here, see instructions below -->
<!-- ![Discover page](./screenshots/discover.png) -->
<!-- ![Match screen](./screenshots/match.png) -->

---

## Local Setup Guide

### 1. Clone & Install
```bash
git clone https://github.com/vishhbusiness236-lang/FindTeamo.git
cd FindTeamo
npm install
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the root directory of your project and populate it with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema Setup
Navigate to your Supabase Dashboard -> SQL Editor.

Initialize your database tables by running the setup queries for the following relational tables:

* `profiles` (User core data)
* `skills` (M2M technical tags)
* `goals` (Project target indicators)
* `interests` (Domain focuses)
* `connections` (Swiping states tracking)
* `conversations` / `messages` (In app chat)

### 4. Run the Development Server
```bash
npm run dev
```

Open `http://localhost:3000` in your browser to view the local instance.

## Database & Architecture Notes
The core matching engine relies on a relational schema handling complex many to many relationships:

* Each profile row links dynamically to multiple relational tables (skills, goals, interests).
* The `connections` table tracks swipes with three definitive states: liked, rejected, or matched.

### Development Challenges Overcome
**Schema Cache Syncing (PGRST204):** Encountered PostgREST schema cache mismatch errors during database modifications. Resolved by syncronizing Next.js database payloads and ensuring precise table typing without forwarding unmapped UI fields (like standalone local age states) directly into Postgres rows.

**Unique Constraint Handling (PostgreSQL Error 23505):** Faced unexpected database crashes when users re-swiped or refreshed states on profiles they had already skipped. Swapped out standard `.insert()` operations in favor of strict atomic `.upsert()` chains using unique target combinations (`from_user_id`, `to_user_id`) to smoothly overwrite outdated relationship states instead of throwing duplication errors.

## Application Routes
* `/` - Landing Page
* `/login` - Google Auth gate
* `/dashboard` - Main control panel & profile completness tracker
* `/profile` - Technical tags management & availability setup
* `/discover` - Swiping engine for teammate matching
* `/matches` - View successful mutual connections
* `/messages` - Chat with matched teammates

## Future Roadmap
* **Advanced Skill Filtering:** Ability to filter the discovery stack strictly by high priority stacks (e.g., searching specifically for a Rust or Solidity backend dev).
* **Reputation System:** Rate teammates after a hackathon ends.

## Built for

This project is built and shipped for #horizons.

## License
MIT