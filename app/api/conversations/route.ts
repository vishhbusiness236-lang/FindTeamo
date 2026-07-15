import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { userId, otherUserId } = await request.json();
    if (!userId || !otherUserId) {
      return NextResponse.json({ error: "Missing user ids" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: existingMessages, error: lookupError } = await supabase
      .from("messages")
      .select("conversation_id")
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${userId})`
      )
      .limit(1);

    if (lookupError) {
      console.error("Error looking up conversation:", lookupError.message);
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if ((existingMessages || []).length > 0) {
      return NextResponse.json({ conversationId: existingMessages[0].conversation_id });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (conversationError || !conversation) {
      console.error("Error creating conversation:", conversationError?.message);
      return NextResponse.json({ error: conversationError?.message || "Failed to create conversation" }, { status: 500 });
    }

    const { error: messageError } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        from_user_id: userId,
        to_user_id: otherUserId,
        content: "Conversation started",
        read: true,
      },
    ]);

    if (messageError) {
      console.error("Error seeding conversation messages:", messageError.message);
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Conversation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}