"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { getConversations, getMessages, sendMessage, uploadChatMedia } from "@/lib/db";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      const data = await getConversations(user.id);
      setConversations(data);

      const fromUrl = searchParams.get("c");
      if (fromUrl) {
        setSelectedConv(fromUrl);
      } else if (data.length > 0) {
        setSelectedConv(data[0].conversation_id);
      }
      setLoading(false);
    };
    loadConversations();
  }, [user]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConv || !user) return;
      const msgs = await getMessages(user.id, selectedConv);
      setMessages(msgs);
    };
    loadMessages();
  }, [selectedConv, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find(c => c.conversation_id === selectedConv);

  const handleSend = async () => {
    if (!user || !selectedConv || !newMessage.trim()) return;
    const otherUserId = conversations.find(c => c.conversation_id === selectedConv)?.other_user_id;
    if (!otherUserId) return;
    await sendMessage(user.id, selectedConv, otherUserId, newMessage);
    setMessages([...messages, { content: newMessage, media_type: "text", from_user_id: user.id, created_at: new Date().toISOString() }]);
    setNewMessage("");
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedConv) return;
    const otherUserId = conversations.find(c => c.conversation_id === selectedConv)?.other_user_id;
    if (!otherUserId) return;

    const url = await uploadChatMedia(selectedConv, file, file.name);
    if (!url) return;

    await sendMessage(user.id, selectedConv, otherUserId, null, url, "image");
    setMessages([...messages, { content: null, media_url: url, media_type: "image", from_user_id: user.id, created_at: new Date().toISOString() }]);
    e.target.value = "";
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach(t => t.stop());

      if (!user || !selectedConv) return;
      const otherUserId = conversations.find(c => c.conversation_id === selectedConv)?.other_user_id;
      if (!otherUserId) return;

      const url = await uploadChatMedia(selectedConv, blob, "voice.webm");
      if (!url) return;

      await sendMessage(user.id, selectedConv, otherUserId, null, url, "voice");
      setMessages(prev => [...prev, { content: null, media_url: url, media_type: "voice", from_user_id: user.id, created_at: new Date().toISOString() }]);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-slate-600">Loading messages...</div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">FindTeamo</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          <div className="md:col-span-1 border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-950">Messages</h2>
            </div>
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-slate-600">No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setSelectedConv(conv.conversation_id)}
                    className={`w-full p-4 text-left border-b border-slate-100 last:border-0 hover:bg-slate-50 ${selectedConv === conv.conversation_id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 relative">
                        {conv.other_user_avatar ? (
                          <Image src={conv.other_user_avatar} alt={conv.other_user_name} fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold">
                            {conv.other_user_name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-950 truncate">{conv.other_user_name || 'Unknown'}</p>
                        <p className="text-sm text-slate-600 truncate">{conv.last_message || 'Sent a photo/voice note'}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-3 border border-slate-200 rounded-lg flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 relative">
                    {selectedConversation.other_user_avatar ? (
                      <Image src={selectedConversation.other_user_avatar} alt={selectedConversation.other_user_name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-500 font-bold">
                        {selectedConversation.other_user_name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-slate-950">{selectedConversation.other_user_name || 'Unknown'}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`max-w-[70%] ${msg.from_user_id === user.id ? 'ml-auto' : ''}`}>
                      <div className={`rounded-lg px-4 py-2 ${msg.from_user_id === user.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                        {msg.media_type === "image" && msg.media_url && (
                          <img src={msg.media_url} alt="" className="rounded-md max-w-[200px]" />
                        )}
                        {msg.media_type === "voice" && msg.media_url && (
                          <audio controls src={msg.media_url} className="w-48" />
                        )}
                        {(!msg.media_type || msg.media_type === "text") && msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-slate-200 flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-2xl text-slate-500 px-2"
                    type="button"
                  >
                    +
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    type="button"
                    className={`text-xl px-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}
                  >
                    🎤
                  </button>
                  <button onClick={handleSend} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">Send</button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-600">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}