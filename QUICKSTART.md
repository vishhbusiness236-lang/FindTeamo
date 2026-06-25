# 🚀 FINDTEAMO - QUICK START CHECKLIST

## Pre-Launch Checklist

### ✅ Step 1: Create Supabase Project
- [ ] Go to https://supabase.com and create account
- [ ] Create new project
- [ ] Wait for project to be ready (2-3 minutes)
- [ ] Copy Project URL
- [ ] Copy Anon Public Key

### ✅ Step 2: Setup Local Environment
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Paste `NEXT_PUBLIC_SUPABASE_URL` from Supabase
- [ ] Paste `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase
- [ ] Save `.env.local`

### ✅ Step 3: Create Database Schema
- [ ] In Supabase, go to **SQL Editor**
- [ ] Create new query
- [ ] Copy all SQL from `SETUP.md` - Database Schema section
- [ ] Run the SQL (should complete without errors)
- [ ] Verify tables appear in **Table Editor**

### ✅ Step 4: Setup Google OAuth
- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project (or select existing)
- [ ] Search for "Google+ API" and enable it
- [ ] Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
- [ ] Select "Web application"
- [ ] Add authorized redirect URIs:
  - `http://localhost:3000`
  - `http://localhost:3000/auth/callback`
- [ ] Copy **Client ID** and **Client Secret**
- [ ] In Supabase → **Authentication** → **Providers** → **Google**
- [ ] Enable Google
- [ ] Paste Client ID and Client Secret
- [ ] Add redirect URIs to Supabase

### ✅ Step 5: Install & Run
```bash
npm install
npm run dev
```

- [ ] Open http://localhost:3000
- [ ] Click "Get Started"
- [ ] Test Google OAuth login
- [ ] Should redirect to dashboard

### ✅ Step 6: Test the Flow
- [ ] Complete profile with name, bio, experience level
- [ ] Add 2-3 skills
- [ ] Add 1-2 goals
- [ ] Add 1-2 interests
- [ ] Save profile
- [ ] Go to "Discover Teammates"
- [ ] Should see profiles to like/pass

### ✅ Create Test Accounts
- [ ] Logout (click profile → Sign Out)
- [ ] Create 2-3 more Google accounts
- [ ] Login with each account and create profiles
- [ ] Test liking profiles and finding matches

## 📋 Troubleshooting

### Issue: "NEXT_PUBLIC_SUPABASE_URL not found"
**Solution:**
- Check `.env.local` exists and is not in `.gitignore` weirdly
- Verify URL format: `https://xxxx.supabase.co`
- Restart dev server after adding env vars

### Issue: Google OAuth redirect error
**Solution:**
- Verify redirect URIs in both Google Cloud Console AND Supabase
- Include both `http://localhost:3000` and `/auth/callback`
- Clear browser cookies
- Restart dev server

### Issue: Profile doesn't show after login
**Solution:**
- Check SQL ran successfully in Supabase
- Go to **Database** → **Tables** → Verify `profiles` table exists
- Check browser console for errors (F12)
- Try signing in again

### Issue: No profiles appearing in Discovery
**Solution:**
- Need at least 2 profiles in database
- Create test accounts (Step 6 above)
- First account won't show anything to like until another profile exists

## 🎯 Key Features to Demo

1. **Google OAuth Flow**
   - Click Get Started
   - Sign in with Google account
   - Auto-creates profile

2. **Profile Completion**
   - Fill in bio and experience level
   - Add multiple skills with proficiency
   - Add goals and interests

3. **Discovery Experience**
   - Browse profiles with Like/Pass/Skip
   - View skills, goals, interests at a glance
   - See progress bar of profiles viewed

4. **Matching System**
   - Like profiles of others
   - Go to Matches tab
   - See profiles that also liked you (mutual matches)

## 📱 Test on Mobile
```bash
# Get local IP (Windows)
ipconfig

# Visit from phone on same network
http://YOUR_LOCAL_IP:3000
```

## 🚀 Production Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

1. Connect GitHub repo
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### Update Google OAuth
1. Add your Vercel domain to Google Cloud Console:
   - `https://yourapp.vercel.app`
   - `https://yourapp.vercel.app/auth/callback`

2. Update redirect URIs in Supabase with production domain

## 📚 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Google Cloud Console](https://console.cloud.google.com)

## ✨ You're All Set!

FindTeamo is ready to connect teammates! 🎉

For issues or questions:
1. Check SETUP.md for detailed SQL schema
2. Check README.md for API reference
3. Check browser console (F12) for errors
4. Verify all environment variables are set correctly

Happy matching! 🚀
