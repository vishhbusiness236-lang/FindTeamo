# 🏗️ FINDTEAMO - ARCHITECTURE & ROADMAP

## System Architecture

### Frontend Layer (Next.js)
```
Pages (app/)
    ├── Public Routes
    │   ├── /           (Landing page)
    │   └── /login      (Auth entry)
    └── Protected Routes (require auth)
        ├── /dashboard  (Hub/navigation)
        ├── /profile    (Edit own profile)
        ├── /profile/[id] (View other profiles)
        ├── /discover   (Browse & like)
        └── /matches    (Mutual connections)

Components (components/)
    ├── ProfileEdit     (Reusable form)
    └── HomeHero        (Landing hero)

Utilities (lib/)
    ├── supabase.ts     (Client initialization)
    ├── db.ts           (All DB queries)
    ├── types.ts        (TypeScript definitions)
    ├── site.ts         (Site configuration)
    └── database.types.ts (Supabase schema types)
```

### Backend Layer (Supabase/PostgreSQL)
```
Database Schema
    ├── profiles          (User profile data)
    ├── skills            (Skills with proficiency)
    ├── goals             (User goals/intentions)
    ├── interests         (User interests/topics)
    └── connections       (Likes & matches)

Authentication
    └── Supabase Auth
        └── Google OAuth provider

Row Level Security (RLS)
    └── Policies on all tables for data privacy
```

### Data Flow

```
User → Login (Google OAuth) 
    → Supabase Auth 
    → Auto-create profile 
    → Edit profile (add skills/goals/interests)
    → Browse profiles (get discovery list)
    → Like/Reject profiles (create connection)
    → View matches (query mutual likes)
```

## Database Schema Details

### profiles Table
```sql
id              UUID (user ID from auth)
username        VARCHAR(50) - unique handle
full_name       VARCHAR(255) - display name
avatar_url      VARCHAR(500) - profile picture
bio             TEXT - user bio
experience_level VARCHAR(20) - beginner/intermediate/advanced
hours_per_week   INTEGER - availability
looking_for     TEXT - what they want
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### skills Table
```sql
id               BIGSERIAL (primary key)
profile_id       UUID (foreign key to profiles)
skill_name       VARCHAR(100) - "React", "Product", etc
proficiency      VARCHAR(20) - learning/intermediate/expert
created_at       TIMESTAMP
```

### goals Table
```sql
id               BIGSERIAL
profile_id       UUID
goal_name        VARCHAR(100) - "Startup", "Hackathon", etc
created_at       TIMESTAMP
```

### interests Table
```sql
id               BIGSERIAL
profile_id       UUID
interest_name    VARCHAR(100) - "AI", "Web3", etc
created_at       TIMESTAMP
```

### connections Table
```sql
id               BIGSERIAL
from_user_id     UUID - who liked/rejected
to_user_id       UUID - who was liked/rejected
status           VARCHAR(20) - liked/matched/rejected
created_at       TIMESTAMP
UNIQUE(from_user_id, to_user_id)
```

## Key Algorithms

### Discovery Algorithm
```typescript
getDiscoveryProfiles(userId, limit=10):
1. Get all connections for user (liked/rejected)
2. Exclude: current user + all previously connected users
3. Get remaining profiles from DB
4. Fetch full details (skills, goals, interests)
5. Return to frontend for display
```

### Matching Algorithm
```typescript
getMatches(userId):
1. Get all profiles user liked
2. Get all profiles that liked user
3. Find intersection (mutual likes)
4. Fetch full details for each match
5. Return matches to frontend
```

## Client Data Functions (lib/db.ts)

### Profile Operations
```typescript
getProfile(userId)              // Get basic profile
getProfileWithDetails(userId)   // Get profile + relations
createProfile(userId, data)     // Auto-called on signup
updateProfile(userId, updates)  // Update profile info
```

### Skill Operations
```typescript
addSkill(profileId, name, proficiency)
deleteSkill(skillId)
```

### Goal Operations
```typescript
addGoal(profileId, name)
deleteGoal(goalId)
```

### Interest Operations
```typescript
addInterest(profileId, name)
deleteInterest(interestId)
```

### Connection Operations
```typescript
likeProfile(fromUserId, toUserId)
rejectProfile(fromUserId, toUserId)
getDiscoveryProfiles(userId, limit)
getMatches(userId)
```

## UI/UX Components

### Pages
- **Landing**: Hero + CTA for login
- **Login**: Google OAuth button with form
- **Dashboard**: Grid of quick-access cards
- **Profile Edit**: Form for updating profile + manage skills/goals/interests
- **Profile View**: Detailed profile display with Like/Skip buttons
- **Discovery**: Tinder-style card with navigation
- **Matches**: Grid of mutual match cards

### Responsive Design
- Mobile-first Tailwind CSS
- Breakpoints: sm, md, lg, xl
- Touch-friendly buttons and spacing

## Route Protection

### Middleware (middleware.ts)
```typescript
Protected routes (require auth):
- /dashboard
- /profile
- /discover
- /matches
- /profile/[id]

Redirect logic:
- No auth + protected route → /login
- Auth + /login or / → /dashboard
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxx (optional, for server operations)
```

## Performance Considerations

### Database
- Indexes on foreign keys (profile_id)
- Unique constraint on connections table
- RLS policies on all tables

### Frontend
- Client-side queries minimize server load
- Profile details lazy-loaded in discovery
- Pagination not yet implemented (consider for >100 profiles)

### Caching
- None implemented yet (consider React Query)

## Security

### Authentication
- Google OAuth handled by Supabase
- User session managed by Supabase Auth

### Authorization
- RLS policies enforce row-level access
- Users can only see other users' profiles
- Users can only edit their own profile

### Data Privacy
- All personal data behind RLS
- Connections are user-specific

## Future Features (Roadmap)

### Phase 2 - Messaging
- [ ] Direct messages between matches
- [ ] Chat interface with real-time updates
- [ ] Notification system
- [ ] Message history

### Phase 3 - Advanced Search
- [ ] Filter by skills, goals, experience
- [ ] Search by username
- [ ] Sort by match percentage
- [ ] Save favorites

### Phase 4 - Recommendations
- [ ] AI-powered match scoring
- [ ] Suggested matches based on profile
- [ ] "You might like" suggestions
- [ ] Trending skills/goals

### Phase 5 - Community
- [ ] User ratings and reviews
- [ ] Portfolio/GitHub links
- [ ] Skill verification badges
- [ ] User activity feed
- [ ] Group/team profiles

### Phase 6 - Analytics
- [ ] User statistics
- [ ] Matching trends
- [ ] Success stories
- [ ] Admin dashboard

## Testing Strategy

### Manual Testing
1. Auth flow with multiple accounts
2. Profile CRUD operations
3. Discovery browsing and interaction
4. Matching accuracy
5. Mobile responsiveness

### Unit Testing (TODO)
- Database query functions
- Matching algorithm
- Data validation

### E2E Testing (TODO)
- Complete user flows
- Auth → Profile → Discovery → Match

## Deployment Checklist

### Before Production
- [ ] Test all routes with multiple accounts
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test on mobile devices
- [ ] Performance test with 100+ profiles
- [ ] Setup error monitoring (Sentry)
- [ ] Configure email notifications

### Launch
- [ ] Deploy to Vercel
- [ ] Setup custom domain
- [ ] Configure production Google OAuth
- [ ] Monitor performance metrics
- [ ] Setup database backups
- [ ] Create admin dashboard

## Code Quality

### TypeScript
- All components and functions typed
- Database schema types auto-generated

### Styling
- Tailwind CSS with consistency
- Custom color scheme
- Responsive mobile-first

### Structure
- Clean separation of concerns
- Reusable components
- Utility functions in lib/
- Types centralized

## Developer Notes

### Adding a New Feature
1. Define database schema change (if needed)
2. Add types in `lib/types.ts`
3. Add database functions in `lib/db.ts`
4. Create component/page
5. Update routes in `app/`
6. Test auth flow

### Common Patterns
- Client components use `"use client"` directive
- Protect routes with auth check in useEffect
- Use Supabase client from `lib/supabase.ts`
- Query database using functions from `lib/db.ts`

### Debugging
- Check browser console (F12) for errors
- Check Supabase logs for query errors
- Verify environment variables set correctly
- Test auth session with `supabase.auth.getUser()`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
