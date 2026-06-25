import { supabase } from "./supabase";
import type { Profile } from "./types";

// ============================================
// CONNECTION REQUEST FUNCTIONS
// ============================================

export async function sendConnectionRequest(fromUserId: string, toUserId: string) {
  const { data, error } = await supabase
    .from("connection_requests")
    .insert([{ from_user_id: fromUserId, to_user_id: toUserId, status: "pending" }])
    .select()
    .single();

  if (error) {
    console.error("Error sending connection request:", error);
    return null;
  }
  return data;
}

export async function acceptConnectionRequest(connectionId: string) {
  const { data, error } = await supabase
    .from("connection_requests")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .select()
    .single();

  if (error) {
    console.error("Error accepting connection request:", error);
    return null;
  }
  return data;
}

export async function rejectConnectionRequest(connectionId: string) {
  const { data, error } = await supabase
    .from("connection_requests")
    .update({ status: "rejected" })
    .eq("id", connectionId)
    .select()
    .single();

  if (error) {
    console.error("Error rejecting connection request:", error);
    return null;
  }
  return data;
}

export async function getConnectionRequests(userId: string) {
  const { data, error } = await supabase
    .from("connection_requests")
    .select(
      `
      id,
      from_user_id,
      to_user_id,
      status,
      created_at,
      profiles:from_user_id(id, full_name, avatar_url, role, bio)
    `
    )
    .eq("to_user_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching connection requests:", error);
    return [];
  }
  return data || [];
}

export async function getConnections(userId: string) {
  const { data, error } = await supabase
    .rpc("get_connections", { user_id: userId });

  if (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
  return data || [];
}

// ============================================
// MATCHING ENGINE FUNCTIONS
// ============================================

export async function getMatches(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .rpc("get_matches", { user_id: userId, limit_count: limit });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
  return data || [];
}

// ============================================
// DISCOVERY FEED FUNCTIONS
// ============================================

interface DiscoveryFilters {
  roleFilter?: string | null;
  experienceFilter?: string | null;
}

export async function getDiscoveryFeed(
  userId: string,
  limit: number = 10,
  cursor: string | null = null,
  filters: DiscoveryFilters = {}
) {
  const { data, error } = await supabase
    .rpc("get_discovery_feed", {
      user_id: userId,
      p_limit: limit,
      p_cursor: cursor,
      p_role_filter: filters.roleFilter || null,
      p_experience_filter: filters.experienceFilter || null,
    });

  if (error) {
    console.error("Error fetching discovery feed:", error);
    return { profiles: [], nextCursor: null };
  }

  const profiles = data || [];
  const nextCursor = profiles.length > 0 ? profiles[profiles.length - 1]?.cursor_value : null;

  return { profiles, nextCursor };
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data || [];
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
  return true;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
  return count || 0;
}

// ============================================
// MESSAGE FUNCTIONS
// ============================================

export async function sendMessage(
  fromUserId: string,
  toUserId: string,
  conversationId: string,
  content: string
) {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        content,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return null;
  }
  return data;
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data || [];
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .eq("to_user_id", userId);

  if (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
  return true;
}

// ============================================
// BLOCK/UNBLOCK FUNCTIONS
// ============================================

export async function blockUser(userId: string, blockedUserId: string) {
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("blocked_users")
    .eq("id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching profile:", fetchError);
    return false;
  }

  const blockedUsers = profile?.blocked_users || [];
  const updatedBlockedUsers = Array.from(new Set([...blockedUsers, blockedUserId]));

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ blocked_users: updatedBlockedUsers })
    .eq("id", userId);

  if (updateError) {
    console.error("Error blocking user:", updateError);
    return false;
  }
  return true;
}

export async function unblockUser(userId: string, unblockedUserId: string) {
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("blocked_users")
    .eq("id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching profile:", fetchError);
    return false;
  }

  const blockedUsers = profile?.blocked_users || [];
  const updatedBlockedUsers = blockedUsers.filter((id: string) => id !== unblockedUserId);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ blocked_users: updatedBlockedUsers })
    .eq("id", userId);

  if (updateError) {
    console.error("Error unblocking user:", updateError);
    return false;
  }
  return true;
}
