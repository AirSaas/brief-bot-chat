/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { sendToChat, uploadAudio, type ChatMessage } from "../lib/api";
import AudioRecorder from "./AudioRecorder";
import { MessageBubble } from "./MessageBubble";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const sessionId = useMemo(() => {
    const existing = localStorage.getItem("sessionId");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
    return id;
  }, []);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages.length]);


  async function sendText() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsThinking(true);
    
    try {
      const json = await sendToChat({ message: userMsg.content, sessionId });
      const text = json?.output ?? json?.data ?? JSON.stringify(json);
      setMessages((m) => [...m, { role: "assistant", content: String(text) }]);
    } catch (error) {
      console.error(error);
      setMessages((m) => [...m, { role: "assistant", content: "❌ Error processing your message." }]);
    } finally {
      setIsThinking(false);
    }
  }

  async function sendAudioFile(file: File) {
    // Show initial message in "uploading" state
    const userMsg: ChatMessage = {
      role: "user",
      content: "🎙️ Voice message",
      audioFile: file,
      audioStatus: "uploading",
    };
    setMessages((m) => [...m, userMsg]);

    try {
      // Upload file to n8n webhook
      const { audio_url } = await uploadAudio(file);

      // Update state to "uploaded"
      const updatedMsg: ChatMessage = {
        role: "user",
        content: "🎙️ Voice message",
        audioFile: file,
        audioUrl: audio_url,
        audioStatus: "uploaded",
      };
      setMessages((m) => m.slice(0, -1).concat(updatedMsg));

       // Send audio_url to Chat Trigger for transcription + response
       setIsThinking(true);
       const json = await sendToChat({
         message: "",
         sessionId,
         audio_url,
       });

       const text = json?.output ?? json?.data ?? JSON.stringify(json);
       setMessages((m) => [...m, { role: "assistant", content: String(text) }]);
       setIsThinking(false);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        role: "user",
        content: "🎙️ Voice message",
        audioFile: file,
        audioStatus: "error",
      };
      setMessages((m) => m.slice(0, -1).concat(errorMsg));
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't process your audio, could you write it instead?" }]);
      setIsThinking(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-brand-50">
      <header className="px-6 py-4 border-b border-brand-200 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-8 rounded-lg shadow-md"
            style={{
              background: "linear-gradient(135deg, #3C51E2 0%, #3041B5 100%)",
            }}
          />
          <div className="font-display font-bold text-brand-800 text-lg">
            AirSaas Brief Project Assistant
          </div>
        </div>
        <img src="/mini.png" alt="AirSaas Logo" className="w-8 h-8" />
      </header>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 relative"
        style={{
          background: "linear-gradient(to bottom, #F0F2FF 0%, #FFFFFF 100%)",
        }}
      >
        {/* Background logo */}
        <div className="absolute left-6 top-6 opacity-5 pointer-events-none">
          <img
            src="/logo-air.svg"
            alt="AirSaas Background Logo"
            className="w-32 h-32"
          />
        </div>
         {messages.map((m, i) => (
           <MessageBubble
             key={i}
             role={m.role}
             isAudio={!!(m.audioFile || m.audioUrl)}
             audioFile={m.audioFile}
             audioStatus={m.audioStatus}
           >
             {m.content}
           </MessageBubble>
         ))}
         
         {/* Thinking indicator */}
         {isThinking && (
           <MessageBubble role="assistant">
             {""}
           </MessageBubble>
         )}
         
      </div>

      <footer className="p-6 bg-white border-t border-brand-200 shadow-lg">
        <div className="flex items-center gap-3">
          <input
            className={`flex-1 px-4 py-3 rounded-xl2 border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 bg-white shadow-sm font-bold text-gray-700 placeholder-gray-400 transition-all duration-300 ${
              isThinking ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder={isThinking ? "Bot is responding..." : "Type a message...   :-)"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isThinking) {
                  sendText();
                }
              }
            }}
            disabled={isThinking}
          />
          <button
            onClick={sendText}
            disabled={isThinking}
            className={`px-6 py-3 bg-brand-500 text-white font-bold shadow-lg hover:bg-brand-600 transition-all duration-300 ${
              isThinking ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ color: "white", backgroundColor: "#3C51E2" }}
          >
            {isThinking ? "Thinking..." : "Send"}
          </button>
          <AudioRecorder onRecorded={sendAudioFile} disabled={isThinking} />
        </div>
      </footer>
    </div>
  );
}
