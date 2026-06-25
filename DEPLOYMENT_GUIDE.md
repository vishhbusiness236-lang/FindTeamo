# 🚀 FINDTEAMO - STEP 1 + STEP 2 DEPLOYMENT GUIDE

## 📋 Complete Setup Checklist

### ✅ Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Git installed
- [ ] Supabase account created
- [ ] Google Cloud project created

---

## 🔧 LOCAL DEVELOPMENT SETUP

### Step 1: Prepare Environment

```bash
# Navigate to project
cd FindTeamo

# Copy environment template
cp .env.local.example .env.local

# Install dependencies
npm install
```

### Step 2: Setup Supabase Project

1. Go to https://supabase.com
2. Create new project (choose region close to you)
3. Wait for project to initialize (~2 minutes)
4. Go to **Settings > API**
5. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Paste into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run Initial Database Setup (STEP 1)

1. In Supabase, go to **SQL Editor**
2. Create new query
3. Copy entire content from `SETUP.md` (Initial Database Schema section)
4. Click **Run**
5. Wait for completion (should show no errors)

Verify tables created:
- Go to **Database > Tables**
- Should see: `profiles`, `skills`, `goals`, `interests`

### Step 4: Run STEP 2 Migrations

1. In Supabase **SQL Editor**, create new query
2. Copy entire content from `STEP2_MIGRATIONS.sql`
3. Click **Run**
4. Wait for completion

Verify new tables:
- Should see: `connection_requests`, `notifications`, `messages`
- Should see functions: `get_matches()`, `get_discovery_feed()`, etc.

### Step 5: Setup Google OAuth

#### In Google Cloud Console:

1. Go to https://console.cloud.google.com/
2. Create new project (name it "FindTeamo")
3. Search for **"Google+ API"** and enable it
4. Go to **Credentials** (left sidebar)
5. Click **Create Credentials** > **OAuth 2.0 Client ID**
6. Select **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost` (optional)
8. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost/auth/callback` (optional)
9. Click **Create**
10. Copy **Client ID** and **Client Secret**

#### In Supabase:

1. Go to **Authentication > Providers > Google**
2. Enable Google
3. Paste **Client ID** from Google Cloud
4. Paste **Client Secret** from Google Cloud
5. Click **Save**

### Step 6: Test Everything

```bash
# Start dev server
npm run dev
```

Open http://localhost:3000:

1. **Landing Page** - Should see hero with "Get Started" button
2. **Login** - Click "Get Started" → Should see "Continue with Google"
3. **OAuth Flow** - Click Google button → Sign in with your Google account
4. **Auto Redirect** - Should go to `/onboarding`
5. **Onboarding** - Complete all 4 steps
6. **Dashboard** - Should see main hub
7. **Discovery** - Click "Discover Teammates"
8. **Empty State** - Should show empty state (no other profiles yet)

### Step 7: Create Test Accounts

To test matching:

1. Create 2-3 Google accounts (or use friends' accounts)
2. Login with each account
3. Complete onboarding for each
4. Each account should now see others in discovery
5. Send connection requests
6. Login as other account and accept
7. Should appear in matches

---

## 📱 PRODUCTION DEPLOYMENT (Vercel)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add FindTeamo STEP 1 + STEP 2"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click **Add New** > **Project**
3. Select your GitHub repo
4. Click **Import**
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your anon key
6. Click **Deploy**
7. Wait for deployment to complete (~2-3 minutes)

### Step 3: Get Your Production URL

After deployment, Vercel will show your domain:
```
https://your-app-name.vercel.app
```

Copy this URL.

### Step 4: Update Google OAuth for Production

#### In Google Cloud Console:

1. Go to **Credentials**
2. Click your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://your-app-name.vercel.app`
   - `https://your-app-name.vercel.app/auth/callback`
4. Save

#### In Supabase:

No changes needed - Supabase automatically redirects based on the domain.

### Step 5: Test Production

1. Visit your Vercel URL
2. Test Google OAuth login
3. Complete onboarding
4. Verify data saves correctly

---

## 🔌 ENABLE REAL-TIME NOTIFICATIONS (Optional but Recommended)

For real-time updates, enable Supabase Realtime:

1. In Supabase, go to **Settings > Realtime**
2. Enable Realtime for tables:
   - `notifications`
   - `connection_requests`
   - `messages` (for chat)
3. Save

This enables instant updates for:
- New connection requests
- Notifications
- Messages
- Connection status changes

---

## 🧪 COMPREHENSIVE TEST CHECKLIST

### Authentication
- [ ] Landing page loads
- [ ] "Get Started" button works
- [ ] Google OAuth login works
- [ ] Auto-redirects to onboarding
- [ ] Session persists on refresh
- [ ] Logout clears session

### Onboarding
- [ ] Step 1: Name, photo, bio save
- [ ] Step 2: Role required
- [ ] Step 2: At least 1 skill required
- [ ] Step 3: At least 1 goal required
- [ ] Step 3: At least 1 interest required
- [ ] Step 4: Experience level required
- [ ] Progress bar animates
- [ ] Can't skip required fields
- [ ] Can go back and edit previous steps
- [ ] Profile saves on completion

### Profile Completeness
- [ ] Completeness score updates as you add info
- [ ] At 30%+ can be matched
- [ ] Shows in dashboard

### Discovery Feed
- [ ] Shows other profiles
- [ ] Cards display: avatar, name, role, skills, bio
- [ ] Can see multiple profiles (pagination works)
- [ ] Can filter by role
- [ ] Can filter by experience
- [ ] Cursor-based pagination loads next page

### Connection System
- [ ] Can send connection requests
- [ ] Pending requests show status
- [ ] Can accept requests
- [ ] Can reject requests
- [ ] Connected users appear in "Matches"
- [ ] Blocked users don't appear in feed

### Notifications
- [ ] New request → notification
- [ ] Accepted request → notification
- [ ] Can mark as read
- [ ] Unread count updates

### Responsiveness
- [ ] Mobile view (< 640px) - works
- [ ] Tablet view (640px - 1024px) - works
- [ ] Desktop view (> 1024px) - works
- [ ] Touch interactions work
- [ ] Buttons are easy to tap

### Performance
- [ ] Page loads < 3 seconds
- [ ] Onboarding smooth (no lag)
- [ ] Animations smooth
- [ ] No console errors
- [ ] Images load correctly

---

## 🐛 TROUBLESHOOTING

### "NEXT_PUBLIC_SUPABASE_URL not found"
```bash
# Check .env.local exists
cat .env.local

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# If missing, copy from .env.local.example
cp .env.local.example .env.local

# Then restart:
npm run dev
```

### Google OAuth not working
1. Check redirect URIs in **both** Google Cloud AND Supabase
2. Use exact URLs: `http://localhost:3000/auth/callback` for dev
3. For Vercel: `https://your-domain.vercel.app/auth/callback`
4. Clear browser cookies: Press F12 → Application → Clear Storage
5. Try incognito window
6. Restart dev server

### No profiles in Discovery
- Need at least 2 profiles in database
- Both must have profile_completeness >= 30%
- Create multiple test accounts
- Login as each and complete profile

### Onboarding not saving
1. Open browser console: F12
2. Check for errors in Console tab
3. Try clearing browser cache
4. Verify Supabase connection in Network tab
5. Check Supabase RLS policies are correct

### Real-time notifications not working
1. Enable Realtime in Supabase Settings
2. Check RLS policies on notification table
3. Verify subscription channels are correct
4. Check browser console for Realtime errors

### Matching returns no results
1. Check profile_completeness >= 30 for both users
2. Verify roles have complementarity scores
3. Ensure no existing connection_requests
4. Check that profiles aren't blocked

---

## 📊 FILE STRUCTURE REMINDER

```
FindTeamo/
├── .env.local              # Your credentials (DO NOT COMMIT)
├── .env.local.example      # Template (COMMIT THIS)
├── SETUP.md                # Initial SQL schema
├── STEP2_MIGRATIONS.sql    # STEP 2 SQL
├── STEP2_GUIDE.md          # STEP 2 documentation
├── STEP1_STEP2_COMPLETE.md # This build summary
├── npm install             # Dependencies
└── npm run dev             # Start dev server
```

---

## 🎯 KEY ENDPOINTS

**Local Dev:**
- http://localhost:3000 (landing)
- http://localhost:3000/login (login)
- http://localhost:3000/onboarding (signup flow)
- http://localhost:3000/dashboard (main app)
- http://localhost:3000/discover (find teammates)
- http://localhost:3000/matches (connections)

**Production:**
- Replace `localhost:3000` with your Vercel domain

---

## ✅ AFTER DEPLOYMENT

### Update DNS (Optional)
Instead of `your-app.vercel.app`, use your own domain:
1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Vercel, add domain to project
3. Point DNS records to Vercel
4. Wait 24h for DNS propagation

### Setup Custom Email (Optional)
For production, consider:
- SendGrid for transactional emails
- Resend for marketing emails
- Supabase Auth emails

### Enable HTTPS Redirect (Auto)
Vercel automatically enables HTTPS with certificate.

### Setup Monitoring (Optional)
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage
- Supabase Dashboard for database monitoring

---

## 📞 SUPPORT LINKS

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Discussions**: (if you create a public repo)

---

## 🎉 YOU'RE LIVE!

Once deployed and tested:

1. **Share with friends** - Send them the link
2. **Test with multiple accounts** - Create profiles and test matching
3. **Gather feedback** - What works? What needs improvement?
4. **Plan STEP 3** - Projects, teams, portfolios
5. **Monitor performance** - Track usage and errors

---

## 📝 NEXT IMMEDIATE TASKS

After launch:

- [ ] Monitor for errors (Sentry)
- [ ] Collect user feedback
- [ ] Test on real mobile devices
- [ ] Load test (1000+ concurrent users)
- [ ] Plan STEP 3 features
- [ ] Document API for potential mobile app
- [ ] Setup analytics
- [ ] Create marketing landing page
- [ ] Setup email notifications

---

## 🚀 CONGRATULATIONS!

Your FindTeamo platform is now live with:

✅ Modern authentication
✅ Beautiful onboarding
✅ Smart matching algorithm
✅ Real-time connections
✅ Professional UI
✅ Production deployment

**Now go connect builders worldwide! 🌍**

---

*Last updated: 2026-06-22*
*Version: STEP 1 + STEP 2 - Production Ready*
