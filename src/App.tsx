import { useState, useEffect, useRef } from "react";
import HomePage from "./components/HomePage/HomePage";
import type { ChatMessage } from "./lib/api";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasSelectedInitialOption, setHasSelectedInitialOption] = useState(false);
  
  // Generate a new session ID on every page load/refresh
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  
  // Store sessionIds and preloaded responses for each template
  const templateSessionIdsRef = useRef<Map<string, string>>(new Map());
  const preloadedResponsesRef = useRef<Map<string, { preloaded?: boolean; output?: string; quick_answers?: string[]; [key: string]: unknown }>>(new Map());

  // Clear sessionStorage on page load to ensure a fresh chat
  useEffect(() => {
    sessionStorage.removeItem('chatMessages');
  }, []);

  // No longer preloading on page load - will be done when user selects a template

  // Function to reset chat with a new session ID
  const resetChat = () => {
    setMessages([]);
    setInput("");
    setIsThinking(false);
    setHasSelectedInitialOption(false);
    setSessionId(crypto.randomUUID());
    sessionStorage.removeItem('chatMessages');
    
    // Reset template preloads
    templateSessionIdsRef.current.clear();
    preloadedResponsesRef.current.clear();
  };

  return (
    <div className="h-screen">
      <HomePage
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        sessionId={sessionId}
        setSessionId={setSessionId}
        isThinking={isThinking}
        setIsThinking={setIsThinking}
        hasSelectedInitialOption={hasSelectedInitialOption}
        setHasSelectedInitialOption={setHasSelectedInitialOption}
        onResetChat={resetChat}
        templateSessionIds={templateSessionIdsRef.current}
        preloadedResponses={preloadedResponsesRef.current}
        abortOtherTemplatePreload={(selectedTemplate: string) => {
          // Mark the other template's preload as cancelled (no longer needed)
          const otherTemplate = selectedTemplate === 'basic' ? 'emotional' : 'basic';
          preloadedResponsesRef.current.delete(otherTemplate);
          templateSessionIdsRef.current.delete(otherTemplate);
        }}
      />
    </div>
  );
}
