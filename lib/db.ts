import { supabase } from "./supabase";
import type { Profile, Skill, Interest, Goal, Connection, ProfileWithDetails } from "./types";

const EXPERIENCE_LEVELS: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

async function enrichProfilesWithDetails(
  profiles: Profile[]
): Promise<ProfileWithDetails[]> {
  if (!profiles.length) return [];

  const profileIds = profiles.map(p => p.id);

  const [{ data: skills }, { data: interests }, { data: goals }] = await Promise.all([
    supabase.from("skills").select("*").in("profile_id", profileIds),
    supabase.from("interests").select("*").in("profile_id", profileIds),
    supabase.from("goals").select("*").in("profile_id", profileIds),
  ]);

  const skillsByProfile = (skills || []).reduce<Record<string, Skill[]>>((acc, s) => {
    acc[s.profile_id] = acc[s.profile_id] || [];
    acc[s.profile_id].push(s);
    return acc;
  }, {});

  const interestsByProfile = (interests || []).reduce<Record<string, Interest[]>>((acc, i) => {
    acc[i.profile_id] = acc[i.profile_id] || [];
    acc[i.profile_id].push(i);
    return acc;
  }, {});

  const goalsByProfile = (goals || []).reduce<Record<string, Goal[]>>((acc, g) => {
    acc[g.profile_id] = acc[g.profile_id] || [];
    acc[g.profile_id].push(g);
    return acc;
  }, {});

  return profiles.map(profile => ({
    ...profile,
    skills: skillsByProfile[profile.id] || [],
    interests: interestsByProfile[profile.id] || [],
    goals: goalsByProfile[profile.id] || [],
  }));
}

// Match score calculation function
export function calculateMatchScore(currentUser: ProfileWithDetails, otherUser: ProfileWithDetails): number {
  let score = 0;

  const currentUserSkills = (currentUser.skills || []).map(s => s.skill_name.toLowerCase());
  const otherUserSkills = (otherUser.skills || []).map(s => s.skill_name.toLowerCase());
  const sharedSkills = currentUserSkills.filter(s => otherUserSkills.includes(s));
  const skillsScore = currentUserSkills.length > 0 && otherUserSkills.length > 0
    ? (sharedSkills.length / Math.max(currentUserSkills.length, otherUserSkills.length)) * 30
    : 0;
  score += skillsScore;

  const currentUserGoals = (currentUser.goals || []).map(g => g.goal_name.toLowerCase());
  const otherUserGoals = (otherUser.goals || []).map(g => g.goal_name.toLowerCase());
  const sharedGoals = currentUserGoals.filter(g => otherUserGoals.includes(g));
  const goalsScore = currentUserGoals.length > 0 && otherUserGoals.length > 0
    ? (sharedGoals.length / Math.max(currentUserGoals.length, otherUserGoals.length)) * 25
    : 0;
  score += goalsScore;

  const currentUserInterests = (currentUser.interests || []).map(i => i.interest_name.toLowerCase());
  const otherUserInterests = (otherUser.interests || []).map(i => i.interest_name.toLowerCase());
  const sharedInterests = currentUserInterests.filter(i => otherUserInterests.includes(i));
  const interestsScore = currentUserInterests.length > 0 && otherUserInterests.length > 0
    ? (sharedInterests.length / Math.max(currentUserInterests.length, otherUserInterests.length)) * 20
    : 0;
  score += interestsScore;

  const currentExp = currentUser.experience_level ? currentUser.experience_level.toLowerCase() : null;
  const otherExp = otherUser.experience_level ? otherUser.experience_level.toLowerCase() : null;
  let expScore = 0;
  if (currentExp && otherExp) {
    if (currentExp === otherExp) {
      expScore = 10;
    } else if (Math.abs((EXPERIENCE_LEVELS[currentExp] || 0) - (EXPERIENCE_LEVELS[otherExp] || 0)) === 1) {
      expScore = 7;
    } else {
      expScore = 3;
    }
  }
  score += expScore;

  const currentHours = currentUser.hours_per_week;
  const otherHours = otherUser.hours_per_week;
  let hoursScore = 0;
  if (currentHours && otherHours) {
    hoursScore = (Math.min(currentHours, otherHours) / Math.max(currentHours, otherHours)) * 15;
  }
  score += hoursScore;

  return Math.round(Math.min(100, score));
}

// Profile operations
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error.message, error.details, error.code);
    return null;
  }
  return data;
}

export async function getProfileWithDetails(userId: string): Promise<ProfileWithDetails | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError.message, profileError.details, profileError.code);
    return null;
  }

  if (!profile) {
    return null;
  }

  const [{ data: skills }, { data: interests }, { data: goals }] = await Promise.all([
    supabase.from("skills").select("*").eq("profile_id", userId),
    supabase.from("interests").select("*").eq("profile_id", userId),
    supabase.from("goals").select("*").eq("profile_id", userId),
  ]);

  return {
    ...profile,
    skills: skills || [],
    interests: interests || [],
    goals: goals || [],
  };
}

export async function createProfile(userId: string, profile: Omit<Profile, 'id' | 'created_at'>) {
  // age ko alag nikal do taaki database me na jaye aur error na aaye
  const { age, ...profileWithoutAge } = profile as any;

  const { data, error } = await supabase
    .from("profiles")
    .upsert([{ id: userId, ...profileWithoutAge }], { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error.message, error.details, error.code);
    return null;
  }
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  // age ko updates se bhi alag kar diya
  const { age, ...updatesWithoutAge } = updates;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updatesWithoutAge,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error.message, error.details, error.code);
    return null;
  }
  return data;
}



// Skills operations
export async function addSkill(profileId: string, skillName: string, proficiency: 'learning' | 'intermediate' | 'expert'): Promise<Skill | null> {
  const { data, error } = await supabase
    .from("skills")
    .insert([{ profile_id: profileId, skill_name: skillName, proficiency }])
    .select()
    .single();

  if (error) {
    console.error("Error adding skill:", error.message, error.details, error.code);
    return null;
  }
  return data;
}

export async function deleteSkill(skillId: number): Promise<boolean> {
  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("id", skillId);

  if (error) {
    console.error("Error deleting skill:", error.message, error.details, error.code);
    return false;
  }
  return true;
}

// Interests operations
export async function addInterest(profileId: string, interestName: string): Promise<Interest | null> {
  const { data, error } = await supabase
    .from("interests")
    .insert([{ profile_id: profileId, interest_name: interestName }])
    .select()
    .single();

  if (error) {
    console.error("Error adding interest:", error.message, error.details, error.code);
    return null;
  }
  return data;
}

export async function deleteInterest(interestId: number): Promise<boolean> {
  const { error } = await supabase
    .from("interests")
    .delete()
    .eq("id", interestId);

  if (error) {
    console.error("Error deleting interest:", error.message, error.details, error.code);
    return false;
  }
  return true;
}

// Goals operations
export async function addGoal(profileId: string, goalName: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from("goals")
    .insert([{ profile_id: profileId, goal_name: goalName }])
    .select()
    .single();

  if (error) {
    console.error("Error adding goal:", error.message, error.details, error.code);
    return null;
  }
  return data;
}

export async function deleteGoal(goalId: number): Promise<boolean> {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId);

  if (error) {
    console.error("Error deleting goal:", error.message, error.details, error.code);
    return false;
  }
  return true;
}

// ==========================================
// Connections/Matching operations (FIXED)
// ==========================================

export async function likeProfile(fromUserId: string, toUserId: string): Promise<Connection | null> {
  const { data: fromProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", fromUserId)
    .maybeSingle();

  if (checkError || !fromProfile) {
    console.error("Error liking profile: from_user_id profile not found");
    return null;
  }

  const { data, error } = await supabase
    .from("connections")
    .upsert(
      [
        { 
          from_user_id: fromUserId, 
          to_user_id: toUserId, 
          status: 'liked' 
        }
      ],
      { onConflict: 'from_user_id,to_user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error("Error liking profile:", error.message, error.details, error.code);
    return null;
  }
  return data;
}

export async function rejectProfile(fromUserId: string, toUserId: string): Promise<Connection | null> {
  const { data: fromProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", fromUserId)
    .maybeSingle();

  if (checkError || !fromProfile) {
    console.error("Error rejecting profile: from_user_id profile not found");
    return null;
  }

  const { data, error } = await supabase
    .from("connections") 
    .upsert(
      [
        { 
          from_user_id: fromUserId, 
          to_user_id: toUserId, 
          status: "rejected" 
        }
      ], 
      { onConflict: 'from_user_id,to_user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error("Error rejecting profile:", error.message, error.details, error.code);
    return null;
  }
  return data;
}

// Get profiles for discovery (excluding current user only)
export async function getDiscoveryProfiles(userId: string, limit: number = 10): Promise<ProfileWithDetails[]> {
  let query = supabase.from("profiles").select("*").neq("id", userId).limit(limit);
  const { data: profiles, error } = await query;
  if (error) { console.error("Error fetching discovery profiles:", error.message, error.details, error.code); return []; }
  return enrichProfilesWithDetails(profiles || []);
}

export async function getMatches(userId: string): Promise<ProfileWithDetails[]> {
  const { data: userLikes } = await supabase.from("connections").select("to_user_id").eq("from_user_id", userId).eq("status", "liked");
  const { data: userLikedBy } = await supabase.from("connections").select("from_user_id").eq("to_user_id", userId).eq("status", "liked");
  const userLikeIds = userLikes?.map((c) => c.to_user_id) || [];
  const userLikedByIds = userLikedBy?.map((c) => c.from_user_id) || [];
  const matchIds = userLikeIds.filter((id) => userLikedByIds.includes(id));
  if (matchIds.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", matchIds);
  return enrichProfilesWithDetails(profiles || []);
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const fileExtension = file.name.split(".").pop() || "png";
  const filePath = `${userId}/avatar.${fileExtension}`;

  const { error: uploadError } = await supabase
    .storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError.message);
    return null;
  }

  const { data: urlData } = supabase
    .storage
    .from("avatars")
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  const updatedProfile = await updateProfile(userId, { avatar_url: publicUrl });
  if (!updatedProfile) {
    console.error("Error updating profile with avatar URL");
    return publicUrl;
  }

  return publicUrl;
}

// Favorites functions
export async function addFavorite(userId: string, favoriteProfileId: string): Promise<boolean> {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, favorite_profile_id: favoriteProfileId });
  if (error) {
    console.error("Error adding favorite:", error.message);
    return false;
  }
  return true;
}

export async function removeFavorite(userId: string, favoriteProfileId: string): Promise<boolean> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("favorite_profile_id", favoriteProfileId);
  if (error) {
    console.error("Error removing favorite:", error.message);
    return false;
  }
  return true;
}

export async function getFavorites(userId: string): Promise<ProfileWithDetails[]> {
  const { data: favoriteIds, error: idsError } = await supabase
    .from("favorites")
    .select("favorite_profile_id")
    .eq("user_id", userId);

  if (idsError || !favoriteIds || favoriteIds.length === 0) return [];

  const profileIds = favoriteIds.map(f => f.favorite_profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIds);

  return enrichProfilesWithDetails(profiles || []);
}

// Messaging functions
export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("messages")
    .select("conversation_id")
    .or(`and(from_user_id.eq.${userId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${userId})`)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0].conversation_id;
  }

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (error || !conv) return null;

  await Promise.all([
    supabase.from("messages").insert({
      conversation_id: conv.id,
      from_user_id: userId,
      to_user_id: otherUserId,
      content: "Conversation started!",
      read: true,
    }),
    supabase.from("messages").insert({
      conversation_id: conv.id,
      from_user_id: otherUserId,
      to_user_id: userId,
      content: "Say hello!",
      read: false,
    }),
  ]);

  return conv.id;
}

export async function getMessages(userId: string, conversationId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`*, from_profile:profiles!messages_from_user_id_fkey(full_name, avatar_url), to_profile:profiles!messages_to_user_id_fkey(full_name, avatar_url)`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error.message);
    return [];
  }
  return data || [];
}

export async function sendMessage(userId: string, conversationId: string, toUserId: string, content: string): Promise<boolean> {
  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      from_user_id: userId,
      to_user_id: toUserId,
      content,
    });

  if (error) {
    console.error("Error sending message:", error.message);
    return false;
  }
  return true;
}

export async function getConversations(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`conversation_id, created_at, read, content, from_user_id, to_user_id,
      from_profile:profiles!messages_from_user_id_fkey(id, full_name, avatar_url),
      to_profile:profiles!messages_to_user_id_fkey(id, full_name, avatar_url)`)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error.message);
    return [];
  }

  const grouped = (data || []).reduce((acc: any[], msg: any) => {
    const isSender = msg.from_user_id === userId;
    const other = isSender ? msg.to_profile : msg.from_profile;
    const existing = acc.find((c: any) => c.conversation_id === msg.conversation_id);
    if (!existing) {
      acc.push({
        conversation_id: msg.conversation_id,
        other_user_id: other?.id,
        other_user_name: other?.full_name,
        other_user_avatar: other?.avatar_url,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: !isSender && msg.read === false ? 1 : 0,
      });
    } else if (!isSender && msg.read === false) {
      existing.unread_count += 1;
    }
    return acc;
  }, [] as any[]);

  return grouped;
}