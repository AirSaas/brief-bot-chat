import { useState, useMemo, useEffect } from "react";
import HomePage from "./components/HomePage/HomePage";
import type { ChatMessage } from "./lib/api";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasSelectedInitialOption, setHasSelectedInitialOption] = useState(false);
  
  // Generate a new session ID on every page load/refresh
  const sessionId = useMemo(() => {
    return crypto.randomUUID();
  }, []);

  // Clear sessionStorage on page load to ensure a fresh chat
  useEffect(() => {
    sessionStorage.removeItem('chatMessages');
  }, []);

  return (
    <div className="h-screen">
      <HomePage
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        sessionId={sessionId}
        isThinking={isThinking}
        setIsThinking={setIsThinking}
        hasSelectedInitialOption={hasSelectedInitialOption}
        setHasSelectedInitialOption={setHasSelectedInitialOption}
      />
    </div>
  );
}
