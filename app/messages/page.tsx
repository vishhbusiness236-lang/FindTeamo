"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { getConversations, getMessages, sendMessage, uploadChatMedia, getOrCreateConversation } from "@/lib/db";
import { Avatar } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Paperclip, Send, Mic, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const fixDuration = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e101;
        const onTimeUpdate = () => {
          audio.currentTime = 0;
          audio.removeEventListener("timeupdate", onTimeUpdate);
        };
        audio.addEventListener("timeupdate", onTimeUpdate);
      }
    };

    audio.addEventListener("loadedmetadata", fixDuration);
    return () => audio.removeEventListener("loadedmetadata", fixDuration);
  }, [src]);

  return (
    <audio
      ref={audioRef}
      controls
      src={src}
      className="max-w-full"
      style={{ maxWidth: "100%" }}
    />
  );
}

function MessagesContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(28).fill(4));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discardRef = useRef(false);

  // refs so the realtime subscription always sees latest values without re-subscribing
  const selectedConvRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.conversation_id === selectedConv),
    [conversations, selectedConv]
  );

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      try {
        setError(null);
        const data = await getConversations(user.id);
        setConversations(data);

        const fromUrl = searchParams.get("c");
        if (fromUrl) {
          setSelectedConv(fromUrl);
        } else if (data.length > 0) {
          setSelectedConv(data[0].conversation_id);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError("Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user, searchParams]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConv || !user) return;
      try {
        const msgs = await getMessages(selectedConv);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to load messages:", err);
        setError("Failed to load messages.");
      }
    };

    loadMessages();
  }, [selectedConv, user]);

  // Single global realtime subscription: handles new messages for ANY conversation
  // the user is part of. Updates open chat + conversation list previews.
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`messages-global:${user.id}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const incoming = payload.new as any;
          const currentUserId = userIdRef.current;
          if (!currentUserId) return;

          const involvesMe =
            incoming.from_user_id === currentUserId || incoming.to_user_id === currentUserId;
          if (!involvesMe) return;

          if (incoming.conversation_id === selectedConvRef.current) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          }

          getConversations(currentUserId).then(setConversations).catch((err) => {
            console.error("Failed to refresh conversations:", err);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !selectedConv || !newMessage.trim() || sending) return;
    const otherUserId = conversations.find((c) => c.conversation_id === selectedConv)?.other_user_id;
    if (!otherUserId) return;

    const content = newMessage.trim();
    setSending(true);
    setError(null);
    setNewMessage("");

    const ok = await sendMessage(user.id, selectedConv, otherUserId, content);
    if (!ok) {
      setError("Unable to send message. Please try again.");
      setNewMessage(content);
    }

    setSending(false);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedConv) return;
    const otherUserId = conversations.find((c) => c.conversation_id === selectedConv)?.other_user_id;
    if (!otherUserId) return;

    setSending(true);
    setError(null);

    try {
      const url = await uploadChatMedia(selectedConv, file, file.name);
      if (!url) {
        setError("Unable to upload image.");
        setSending(false);
        return;
      }

      const ok = await sendMessage(user.id, selectedConv, otherUserId, null, url, "image");
      if (!ok) {
        setError("Unable to send image.");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      setError("Failed to upload image.");
    }

    e.target.value = "";
    setSending(false);
  };

  const cleanupRecordingVisuals = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    animationFrameRef.current = null;
    timerIntervalRef.current = null;
    audioContextRef.current = null;
    setWaveform(Array(28).fill(4));
    setRecordingSeconds(0);
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      discardRef.current = false;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = Math.max(4, Math.min(32, Math.round((avg / 255) * 32)));
        setWaveform((prev) => [...prev.slice(1), level]);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const durationMs = Date.now() - recordingStartTimeRef.current;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        if (discardRef.current || durationMs < 700) {
          return;
        }

        if (!user || !selectedConv) return;
        const otherUserId = conversations.find((c) => c.conversation_id === selectedConv)?.other_user_id;
        if (!otherUserId) return;

        setSending(true);
        try {
          const url = await uploadChatMedia(selectedConv, blob, "voice.webm");
          if (!url) {
            setError("Unable to upload voice message.");
            setSending(false);
            return;
          }

          const ok = await sendMessage(user.id, selectedConv, otherUserId, null, url, "voice");
          if (!ok) {
            setError("Unable to send voice message.");
          }
        } catch (err) {
          console.error("Voice upload error:", err);
          setError("Failed to upload voice message.");
        }
        setSending(false);
      };

      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      setError("Microphone access is required to record voice messages.");
    }
  };

  const stopRecording = (discard = false) => {
    discardRef.current = discard;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupRecordingVisuals();
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording(false);
    } else {
      startRecording();
    }
  };

  const handleCancelRecording = () => {
    stopRecording(true);
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConv(conversationId);
    router.replace(`/messages?c=${conversationId}`);
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-slate-600 font-medium">Loading messages...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-950">Authentication Required</h1>
          <p className="mt-2 text-slate-600">Please log in to access messages.</p>
          <Link href="/login" className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 border-b border-slate-200 bg-white/80 backdrop-blur-md z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
            <span className="text-xl sm:text-2xl font-bold text-slate-950">Messages</span>
          </Link>
          <div className="rounded-full bg-blue-50 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-blue-700">
            {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid h-[calc(100vh-140px)] grid-cols-1 gap-4 md:gap-6 md:grid-cols-4">
          {/* Conversations Sidebar */}
          <div className="hidden md:flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-950">Conversations</h2>
              {conversations.length > 0 && (
                <div className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {conversations.reduce((sum, item) => sum + (item.unread_count || 0), 0)} unread
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => handleConversationSelect(conv.conversation_id)}
                    className={`w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 last:border-0 ${
                      selectedConv === conv.conversation_id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={conv.other_user_avatar}
                        alt={conv.other_user_name}
                        name={conv.other_user_name}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium text-slate-950">{conv.other_user_name || "Unknown"}</p>
                          {conv.unread_count > 0 && (
                            <span className="flex-shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs sm:text-sm text-slate-500 mt-1">{conv.last_message}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-3">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-transparent p-4">
                  <Avatar
                    src={selectedConversation.other_user_avatar}
                    alt={selectedConversation.other_user_name}
                    name={selectedConversation.other_user_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-950">{selectedConversation.other_user_name || "Unknown"}</div>
                    <div className="text-xs text-slate-500">Active now</div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4 sm:p-6">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <div>
                        <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No messages yet</p>
                        <p className="text-sm text-slate-400 mt-1">Start a conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMine = msg.from_user_id === user.id;
                      return (
                        <div key={msg.id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs sm:max-w-sm lg:max-w-md rounded-2xl px-4 py-3 ${
                              isMine
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-slate-100 text-slate-950 rounded-bl-none"
                            }`}
                          >
                            {msg.media_type === "image" && msg.media_url ? (
                              <img
                                src={msg.media_url}
                                alt="Shared image"
                                className="max-h-64 max-w-full rounded-lg object-cover"
                              />
                            ) : null}
                            {msg.media_type === "voice" && msg.media_url ? (
                              <AudioPlayer src={msg.media_url} />
                            ) : null}
                            {(!msg.media_type || msg.media_type === "text") && msg.content ? (
                              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                            ) : null}
                            <div
                              className={`mt-2 text-[11px] ${
                                isMine ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                {isRecording ? (
                  <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 sm:p-4">
                    <button
                      onClick={handleCancelRecording}
                      type="button"
                      className="flex-shrink-0 rounded-full p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      aria-label="Cancel recording"
                      title="Cancel recording"
                    >
                      <span className="text-xl leading-none">×</span>
                    </button>

                    <div className="flex-1 flex items-center gap-1 h-9 px-3">
                      {waveform.map((level, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-red-400 rounded-full transition-all duration-75"
                          style={{ height: `${level}px`, minWidth: "2px" }}
                        />
                      ))}
                    </div>

                    <span className="flex-shrink-0 text-xs font-medium text-slate-500 tabular-nums">
                      {formatRecordingTime(recordingSeconds)}
                    </span>

                    <button
                      onClick={() => stopRecording(false)}
                      type="button"
                      className="flex-shrink-0 rounded-full bg-blue-600 p-2.5 text-white hover:bg-blue-700 transition"
                      aria-label="Send voice message"
                      title="Send voice message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 border-t border-slate-100 bg-white p-3 sm:p-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 rounded-full border border-slate-300 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:border-slate-400"
                      type="button"
                      aria-label="Attach image"
                      title="Attach image"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImagePick}
                    />
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      onClick={handleMicClick}
                      type="button"
                      className="flex-shrink-0 rounded-full p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                      aria-label="Start recording"
                      title="Click to start recording"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="flex-shrink-0 rounded-full bg-blue-600 p-2.5 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Send message"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
                <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
                <p className="font-medium">No conversation selected</p>
                <p className="text-sm text-slate-400 mt-1">Choose a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-slate-600 font-medium">Loading messages...</span>
            </div>
          </div>
        </main>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}