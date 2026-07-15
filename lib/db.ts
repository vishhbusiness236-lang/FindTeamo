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
// Connections/Matching operations
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
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError.message);
      return null;
    }

    if (!session?.access_token) {
      console.error("No active session — user is not logged in. Please log in again.");
      return null;
    }

    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId, otherUserId }),
    });

    const rawText = await response.text();
    let data: any = {};

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        console.error(
          "Non-JSON response from /api/conversations. Status:",
          response.status,
          "Body:",
          rawText
        );
        return null;
      }
    }

    if (!response.ok) {
      console.error(
        "Error creating conversation. Status:",
        response.status,
        "Details:",
        data
      );
      return null;
    }

    return data.conversationId ?? null;
  } catch (error) {
    console.error("Unexpected error in getOrCreateConversation:", error);
    return null;
  }
}

export async function getMessages(conversationId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`*, from_profile:profiles!messages_from_user_id_fkey(id, full_name, avatar_url), to_profile:profiles!messages_to_user_id_fkey(id, full_name, avatar_url)`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error.message);
    return [];
  }

  return data || [];
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  toUserId: string,
  content: string | null,
  mediaUrl: string | null = null,
  mediaType: "text" | "image" | "voice" = "text"
): Promise<boolean> {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    from_user_id: userId,
    to_user_id: toUserId,
    content,
    media_url: mediaUrl,
    media_type: mediaType,
    read: false,
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
    .select(`conversation_id, created_at, read, content, media_type, media_url, from_user_id, to_user_id,
      from_profile:profiles!messages_from_user_id_fkey(id, full_name, avatar_url),
      to_profile:profiles!messages_to_user_id_fkey(id, full_name, avatar_url)`)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error.message);
    return [];
  }

  const grouped = new Map<string, any>();

  for (const msg of data || []) {
    const isSender = msg.from_user_id === userId;
    const otherProfile = (isSender ? msg.to_profile : msg.from_profile) as { id?: string; full_name?: string; username?: string; avatar_url?: string } | null;
    const existing = grouped.get(msg.conversation_id);

    if (!existing) {
      const preview = msg.media_type === "image"
        ? "📷 Photo"
        : msg.media_type === "voice"
          ? "🎤 Voice message"
          : msg.content || "New message";

      grouped.set(msg.conversation_id, {
        conversation_id: msg.conversation_id,
        other_user_id: otherProfile?.id,
        other_user_name: otherProfile?.full_name || otherProfile?.username || "Unknown",
        other_user_avatar: otherProfile?.avatar_url,
        last_message: preview,
        last_message_at: msg.created_at,
        unread_count: !isSender && msg.read === false ? 1 : 0,
      });
      continue;
    }

    if (!isSender && msg.read === false) {
      existing.unread_count += 1;
    }
  }

  return Array.from(grouped.values()).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
}

export async function uploadChatMedia(
  conversationId: string,
  file: File | Blob,
  fileName: string
): Promise<string | null> {
  const normalizedName = fileName.replace(/\s+/g, "_");
  const filePath = `${conversationId}/${Date.now()}_${normalizedName}`;
  const { error } = await supabase.storage.from("chat-media").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Error uploading chat media:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath);
  return data.publicUrl;
}