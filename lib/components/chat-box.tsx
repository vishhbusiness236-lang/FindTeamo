"use client";

import { useState } from "react";

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
};

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", senderId: "other", text: "Hey! Your profile looks great.", timestamp: "12:30 PM" },
    { id: "2", senderId: "me", text: "Yo! Thanks bro.", timestamp: "12:31 PM" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setInputText("");
  };

  return (
    <div className="w-full max-w-md h-[500px] bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
          HB
        </div>
        <div>
          <h4 className="font-bold text-sm">Hacker Bhai</h4>
          <span className="text-xs text-green-400">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[75%] ${
              msg.senderId === "me" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`p-3 rounded-2xl text-sm ${
                msg.senderId === "me"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-800 text-slate-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-800 border-t border-slate-700 flex space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95"
        >
          Send
        </button>
      </div>
    </div>
  );
}