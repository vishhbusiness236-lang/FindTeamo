# 🚀 FINDTEAMO - STEP 2 IMPLEMENTATION GUIDE

This guide covers the STEP 2 enhancements: matching engine, connection system, and notifications.

## 📋 Overview

STEP 2 adds:
- Extended profile schema with new fields
- Matching engine (SQL function for scoring)
- Connection request system
- Notifications system
- Real-time messaging capability
- Discovery feed with filtering

## 🚀 Implementation Steps

### 1. Run Database Migrations

1. Open Supabase SQL Editor
2. Copy entire content from `STEP2_MIGRATIONS.sql`
3. Run the SQL script (this creates all new tables, functions, and triggers)

```bash
# File location: STEP2_MIGRATIONS.sql
```

### 2. Database Schema Changes

#### Extended `profiles` Table

New columns added:

```sql
role VARCHAR(50)                              -- 'Developer', 'Designer', 'Founder', 'Marketer', 'Other'
skills TEXT[] DEFAULT ARRAY[]                 -- Array of skill strings
location VARCHAR(255)                         -- Location/timezone
github_url VARCHAR(255)                       -- GitHub profile
linkedin_url VARCHAR(255)                     -- LinkedIn profile
x_url VARCHAR(255)                            -- Twitter/X profile
looking_for TEXT[] DEFAULT ARRAY[]            -- Roles they want in a teammate
profile_completeness INTEGER DEFAULT 0        -- 0-100 score
blocked_users UUID[] DEFAULT ARRAY[]          -- Users they've blocked
```

#### New Tables

**connection_requests**
- Tracks all connection requests between users
- Status: 'pending' | 'accepted' | 'rejected'
- Unique constraint prevents duplicate requests
- Automatic cleanup for rejected requests after 24h (soft delete)

**notifications**
- Stores all notifications for users
- Types: 'connection_request', 'connection_accepted', 'message'
- Real-time capable via Supabase Realtime

**messages**
- Direct messages between connected users
- Indexed for fast retrieval
- Read status tracking

### 3. SQL Functions Created

#### `get_matches(user_id, limit_count = 10)`

Returns top matches for a user based on scoring algorithm.

**Scoring weights:**
- 30% - Skill complementarity
- 25% - Shared goals
- 20% - Shared interests
- 15% - Availability overlap
- 10% - Experience compatibility

**Returns:**
```json
[
  {
    "user_id": "uuid",
    "full_name": "string",
    "avatar_url": "string",
    "role": "string",
    "bio": "string",
    "match_score": 87,
    "match_reasons": ["Complementary role: Developer + Designer", "Shared goal: Startup"]
  }
]
```

#### `get_discovery_feed(user_id, limit, cursor, role_filter, experience_filter)`

Cursor-based pagination for discovery feed with filtering.

**Returns:**
```json
[
  {
    "profile_id": "uuid",
    "full_name": "string",
    "avatar_url": "string",
    "role": "string",
    "bio": "string (truncated to 120 chars)",
    "skills": ["string"],
    "goals": ["string"],
    "interests": ["string"],
    "experience_level": "string",
    "availability_hours_per_week": 10,
    "cursor_value": "timestamp"
  }
]
```

#### `get_connections(user_id)`

Gets all accepted connections for a user.

#### Triggers

- `update_profile_completeness` - Auto-calculates profile completeness score
- `notify_connection_request` - Creates notifications on new requests

### 4. API Functions (lib/db-step2.ts)

#### Connection Requests

```typescript
// Send a connection request
sendConnectionRequest(fromUserId, toUserId): Promise<ConnectionRequest>

// Accept a connection request
acceptConnectionRequest(connectionId): Promise<ConnectionRequest>

// Reject a connection request
rejectConnectionRequest(connectionId): Promise<ConnectionRequest>

// Get pending connection requests for a user
getConnectionRequests(userId): Promise<ConnectionRequest[]>

// Get all connections (pending + accepted)
getConnections(userId): Promise<Connection[]>
```

#### Matching & Discovery

```typescript
// Get top matches for a user
getMatches(userId, limit = 10): Promise<Match[]>

// Get discovery feed with cursor-based pagination
getDiscoveryFeed(userId, limit = 10, cursor = null, filters = {}): Promise<{
  profiles: Profile[],
  nextCursor: string | null
}>
```

#### Notifications

```typescript
// Get all notifications for a user
getNotifications(userId): Promise<Notification[]>

// Mark a notification as read
markNotificationAsRead(notificationId): Promise<boolean>

// Get count of unread notifications
getUnreadNotificationCount(userId): Promise<number>
```

#### Messaging

```typescript
// Send a message
sendMessage(fromUserId, toUserId, conversationId, content): Promise<Message>

// Get messages in a conversation
getMessages(conversationId): Promise<Message[]>

// Mark messages as read
markMessagesAsRead(conversationId, userId): Promise<boolean>
```

#### User Management

```typescript
// Block a user from matches/discovery
blockUser(userId, blockedUserId): Promise<boolean>

// Unblock a user
unblockUser(userId, unblockedUserId): Promise<boolean>
```

## 🔌 Real-Time Subscriptions

Use Supabase Realtime for live updates:

```typescript
import { supabase } from "@/lib/supabase";

// Listen for connection requests
supabase
  .from(`connection_requests:to_user_id=eq.${userId}`)
  .on("INSERT", (payload) => {
    console.log("New connection request:", payload);
  })
  .subscribe();

// Listen for notifications
supabase
  .from(`notifications:user_id=eq.${userId}`)
  .on("INSERT", (payload) => {
    console.log("New notification:", payload);
  })
  .subscribe();

// Listen for new messages
supabase
  .from(`messages:conversation_id=eq.${conversationId}`)
  .on("INSERT", (payload) => {
    console.log("New message:", payload);
  })
  .subscribe();
```

## 🎯 Matching Algorithm Details

### Skill Complementarity (30%)

Predefined role compatibility matrix:

```
Developer    → Designer (1.0), Founder (0.7), Marketer (0.5), Developer (0.4)
Designer     → Developer (1.0), Founder (0.7), Marketer (0.6)
Founder      → All (0.8)
Marketer     → Founder (1.0), Developer (0.5), Designer (0.5)
```

### Goal Matching (25%)

- Exact match: 1.0
- Partial overlap: `(shared / total) * 1.0`
- No overlap: 0.0

### Interest Matching (20%)

- Same calculation as goals
- Requires at least 1 interest to be selected

### Availability Overlap (15%)

- `min(hours_a, hours_b) / max(hours_a, hours_b)`
- If either is 0, score = 0

### Experience Compatibility (10%)

- Same level: 1.0
- 1 level apart: 0.7
- 2+ levels apart: 0.3

### Hard Exclusions

Profiles are excluded from matching if:
- Same user ID (self-match)
- Profile completeness < 30%
- User has blocked them
- Existing connection request in any status (except rejected >24h)

## 📊 Match Score Interpretation

```
90-100: Excellent match
75-89:  Good match
60-74:  Fair match
50-59:  Possible match
<50:    Low compatibility
```

## 🧪 Testing Checklist

- [ ] Create 3+ test accounts with different roles
- [ ] Complete profiles for each account
- [ ] Send connection requests between accounts
- [ ] Accept/reject requests
- [ ] Verify notifications appear in real-time
- [ ] Check discovery feed returns correct profiles
- [ ] Test match scoring (should rank complementary roles higher)
- [ ] Send messages and verify real-time delivery
- [ ] Block users and verify they don't appear in feed
- [ ] Test cursor-based pagination

## 🔧 Configuration Tweaking

To adjust matching algorithm weights, edit `STEP2_MIGRATIONS.sql`:

```plpgsql
v_skill_weight NUMERIC := 0.30;        -- Change skill weight
v_goal_weight NUMERIC := 0.25;         -- Change goal weight
v_interest_weight NUMERIC := 0.20;     -- Change interest weight
v_availability_weight NUMERIC := 0.15; -- Change availability weight
v_experience_weight NUMERIC := 0.10;   -- Change experience weight
```

Update the `COMPLEMENT_MAP` for different role compatibility scores.

## 📱 Discovery Feed Filtering

Apply filters when calling `getDiscoveryFeed`:

```typescript
// Filter by role
getDiscoveryFeed(userId, 10, null, { roleFilter: "Designer" })

// Filter by experience
getDiscoveryFeed(userId, 10, null, { experienceFilter: "Advanced" })

// Combine filters
getDiscoveryFeed(userId, 10, null, { 
  roleFilter: "Designer",
  experienceFilter: "Intermediate"
})
```

## 🚨 Common Issues

### Matching returns no results
- Check that `profile_completeness >= 30` for both users
- Verify users don't have existing connection requests
- Check that roles have complementarity scores > 0

### Notifications not appearing
- Ensure RLS policies allow user to read their notifications
- Check database trigger is firing
- Verify notification type matches subscription

### Messages not showing up
- Ensure both users are connected (status = 'accepted')
- Check conversation_id is correct UUID format
- Verify RLS allows both users to read messages

## 📚 Next Steps

- Implement UI components for discovery feed
- Build matching page UI
- Create connection request dialog
- Build chat/messaging interface
- Add profile filtering UI
- Implement block user UI

## 🔐 Security Notes

All functions use RLS for row-level access control. Users cannot:
- See other users' profiles at higher completeness than their own
- Send messages outside of accepted connections
- View others' blocked lists
- Modify notifications they don't own

## 📖 Related Files

- Migration SQL: `STEP2_MIGRATIONS.sql`
- Database functions: `lib/db-step2.ts`
- Updated types: `lib/types.ts` (extend as needed)
- Onboarding components: `components/onboarding-*.tsx`
