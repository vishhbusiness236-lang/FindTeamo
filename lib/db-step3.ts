/**
 * FINDTEAMO - STEP 3 DATABASE API
 * Project Rooms, Hackathon Mode, Reputation System, Safety Controls
 */

import { supabase } from "./supabase";
import { Database } from "./database.types";

// ============================================================================
// TYPES
// ============================================================================

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  required_skills: string[];
  looking_for_roles: string[];
  max_members: number;
  current_members: number;
  status: "open" | "closed";
  project_type: "Startup" | "Hackathon" | "Open Source" | "Side Project";
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string | null;
  status: "pending" | "accepted" | "rejected";
  joined_at: string;
}

export interface ReputationEvent {
  id: string;
  user_id: string;
  event_type:
    | "accepted_connection"
    | "successful_collaboration"
    | "completed_project"
    | "received_report"
    | "rejection_spam";
  points: number;
  related_id?: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details?: string;
  created_at: string;
  status: "open" | "reviewed";
}

export interface UserBadge {
  badge_name: string;
  badge_tier: number;
}

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

/**
 * Create a new project
 */
export async function createProject(
  title: string,
  description: string,
  projectType: "Startup" | "Hackathon" | "Open Source" | "Side Project",
  requiredSkills: string[],
  lookingForRoles: string[],
  maxMembers: number
): Promise<Project | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title,
      description,
      project_type: projectType,
      required_skills: requiredSkills,
      looking_for_roles: lookingForRoles,
      max_members: maxMembers,
      current_members: 1, // Owner counts as 1
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    return null;
  }

  return data as Project;
}

/**
 * Get project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }

  return data as Project;
}

/**
 * Get all open projects (paginated)
 */
export async function getOpenProjects(
  limit: number = 10,
  offset: number = 0
): Promise<Project[] | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching projects:", error);
    return null;
  }

  return data as Project[];
}

/**
 * Get projects by owner
 */
export async function getUserProjects(): Promise<Project[] | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user projects:", error);
    return null;
  }

  return data as Project[];
}

/**
 * Get projects by type (Startup, Hackathon, etc.)
 */
export async function getProjectsByType(
  projectType: "Startup" | "Hackathon" | "Open Source" | "Side Project",
  limit: number = 10
): Promise<Project[] | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "open")
    .eq("project_type", projectType)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching projects by type:", error);
    return null;
  }

  return data as Project[];
}

/**
 * Update project (owner only)
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify ownership
  const project = await getProject(projectId);
  if (!project || project.owner_id !== user.id) {
    console.error("Not authorized to update this project");
    return null;
  }

  // Prevent reducing max_members below current_members
  if (
    updates.max_members &&
    updates.max_members < project.current_members
  ) {
    console.error("Cannot reduce max_members below current_members");
    return null;
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    console.error("Error updating project:", error);
    return null;
  }

  return data as Project;
}

/**
 * Delete project (owner only)
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Verify ownership
  const project = await getProject(projectId);
  if (!project || project.owner_id !== user.id) {
    console.error("Not authorized to delete this project");
    return false;
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    console.error("Error deleting project:", error);
    return false;
  }

  return true;
}

// ============================================================================
// PROJECT MEMBERS
// ============================================================================

/**
 * Request to join a project
 */
export async function requestToJoinProject(
  projectId: string,
  role?: string
): Promise<ProjectMember | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("project_members")
    .insert({
      project_id: projectId,
      user_id: user.id,
      role: role || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error requesting to join project:", error);
    return null;
  }

  return data as ProjectMember;
}

/**
 * Get members of a project
 */
export async function getProjectMembers(
  projectId: string
): Promise<ProjectMember[] | null> {
  const { data, error } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching project members:", error);
    return null;
  }

  return data as ProjectMember[];
}

/**
 * Accept member request (owner only)
 */
export async function acceptProjectMember(
  projectId: string,
  memberId: string
): Promise<ProjectMember | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify ownership
  const project = await getProject(projectId);
  if (!project || project.owner_id !== user.id) {
    console.error("Not authorized to approve members");
    return null;
  }

  // Check if project is full
  if (project.current_members >= project.max_members) {
    console.error("Project is already full");
    return null;
  }

  const { data, error } = await supabase
    .from("project_members")
    .update({ status: "accepted" })
    .eq("project_id", projectId)
    .eq("user_id", memberId)
    .select()
    .single();

  if (error) {
    console.error("Error accepting project member:", error);
    return null;
  }

  return data as ProjectMember;
}

/**
 * Reject member request (owner only)
 */
export async function rejectProjectMember(
  projectId: string,
  memberId: string
): Promise<ProjectMember | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify ownership
  const project = await getProject(projectId);
  if (!project || project.owner_id !== user.id) {
    console.error("Not authorized to reject members");
    return null;
  }

  const { data, error } = await supabase
    .from("project_members")
    .update({ status: "rejected" })
    .eq("project_id", projectId)
    .eq("user_id", memberId)
    .select()
    .single();

  if (error) {
    console.error("Error rejecting project member:", error);
    return null;
  }

  return data as ProjectMember;
}

/**
 * Leave a project
 */
export async function leaveProject(projectId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error leaving project:", error);
    return false;
  }

  return true;
}

// ============================================================================
// HACKATHON MODE
// ============================================================================

/**
 * Toggle hackathon mode
 */
export async function setHackathonMode(
  enabled: boolean,
  tags?: string[]
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("profiles")
    .update({
      hackathon_ready: enabled,
      hackathon_tags: tags || [],
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating hackathon mode:", error);
    return false;
  }

  return true;
}

/**
 * Get all hackathon-ready builders
 */
export async function getHackathonReadyBuilders(
  limit: number = 20
): Promise<any[] | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, skills, reputation_score")
    .eq("hackathon_ready", true)
    .eq("is_hidden", false)
    .order("reputation_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching hackathon builders:", error);
    return null;
  }

  return data;
}

// ============================================================================
// REPUTATION SYSTEM
// ============================================================================

/**
 * Get reputation score
 */
export async function getReputationScore(): Promise<number | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("reputation_score")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching reputation:", error);
    return null;
  }

  return (data as any).reputation_score;
}

/**
 * Get user badges (computed from reputation events)
 */
export async function getUserBadges(userId: string): Promise<UserBadge[] | null> {
  const { data, error } = await supabase.rpc("get_user_badges", {
    user_id: userId,
  });

  if (error) {
    console.error("Error fetching badges:", error);
    return null;
  }

  return data as UserBadge[];
}

/**
 * Get reputation events
 */
export async function getReputationEvents(): Promise<ReputationEvent[] | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("reputation_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reputation events:", error);
    return null;
  }

  return data as ReputationEvent[];
}

/**
 * Log reputation event (internal - usually triggered by triggers)
 */
export async function logReputationEvent(
  eventType:
    | "accepted_connection"
    | "successful_collaboration"
    | "completed_project"
    | "received_report"
    | "rejection_spam",
  points: number,
  relatedId?: string
): Promise<ReputationEvent | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("reputation_events")
    .insert({
      user_id: user.id,
      event_type: eventType,
      points,
      related_id: relatedId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error logging reputation event:", error);
    return null;
  }

  return data as ReputationEvent;
}

// ============================================================================
// SAFETY & BLOCKING
// ============================================================================

/**
 * Block a user
 */
export async function blockUser(blockedUserId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("blocked_users").insert({
    blocker_id: user.id,
    blocked_id: blockedUserId,
  });

  if (error) {
    console.error("Error blocking user:", error);
    return false;
  }

  return true;
}

/**
 * Unblock a user
 */
export async function unblockUser(blockedUserId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedUserId);

  if (error) {
    console.error("Error unblocking user:", error);
    return false;
  }

  return true;
}

/**
 * Get blocked users
 */
export async function getBlockedUsers(): Promise<any[] | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id, created_at")
    .eq("blocker_id", user.id);

  if (error) {
    console.error("Error fetching blocked users:", error);
    return null;
  }

  return data;
}

/**
 * Check if user is blocked (bidirectional)
 */
export async function isUserBlocked(otherUserId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("is_blocked", {
    p_user_id: user.id,
    p_other_id: otherUserId,
  });

  if (error) {
    console.error("Error checking block status:", error);
    return false;
  }

  return data as boolean;
}

/**
 * Toggle profile visibility (hide profile)
 */
export async function toggleProfileHidden(hidden: boolean): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ is_hidden: hidden })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile visibility:", error);
    return false;
  }

  return true;
}

// ============================================================================
// REPORTING & MODERATION
// ============================================================================

/**
 * Report a user
 */
export async function reportUser(
  reportedUserId: string,
  reason: string,
  details?: string
): Promise<Report | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      reported_id: reportedUserId,
      reason,
      details: details || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error reporting user:", error);
    return null;
  }

  return data as Report;
}

/**
 * Check rejection spam (3+ rejections in 24h)
 */
export async function checkRejectionSpam(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("check_rejection_spam", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Error checking spam:", error);
    return false;
  }

  return data as boolean;
}

// ============================================================================
// DISCOVERY FEED V2 (with projects)
// ============================================================================

export async function getDiscoveryFeedV2(
  limit: number = 10,
  cursor: string | null = null,
  roleFilter: string | null = null,
  experienceFilter: string | null = null
): Promise<any[] | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_discovery_feed_v2", {
    p_user_id: user.id,
    p_limit: limit,
    p_cursor: cursor,
    p_role_filter: roleFilter,
    p_experience_filter: experienceFilter,
  });

  if (error) {
    console.error("Error fetching discovery feed:", error);
    return null;
  }

  return data;
}

// ============================================================================
// MATCHES V2 (with hackathon boost & blocking)
// ============================================================================

export async function getMatchesV2(limit: number = 10): Promise<any[] | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_matches_v2", {
    p_user_id: user.id,
    p_limit: limit,
  });

  if (error) {
    console.error("Error fetching matches:", error);
    return null;
  }

  return data;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to project updates
 */
export function subscribeToProjectUpdates(
  projectId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`project-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "projects",
        filter: `id=eq.${projectId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
}

/**
 * Subscribe to project member updates
 */
export function subscribeToProjectMembers(
  projectId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`project_members_${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "project_members",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
}

/**
 * Subscribe to reputation updates
 */
export async function subscribeToReputationUpdates(
  callback: (payload: any) => void
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return supabase
    .channel(`reputation_events_${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reputation_events",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
}