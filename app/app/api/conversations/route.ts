import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { otherUserId } = await request.json();
  if (!otherUserId) {
    return NextResponse.json({ error: "otherUserId is required" }, { status: 400 });
  }
  if (otherUserId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Check if a conversation already exists (either direction)
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
    )
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  // Create new conversation
  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({ user1_id: user.id, user2_id: otherUserId })
    .select("id")
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ conversationId: created.id });
}