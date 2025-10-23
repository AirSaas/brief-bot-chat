import { useState, useMemo, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import HomePage from "./components/HomePage";
import type { ChatMessage } from "./lib/api";

type ChatMode = "hidden" | "panel" | "fullscreen";

export default function App() {
  const [chatMode, setChatMode] = useState<ChatMode>("hidden");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasSelectedInitialOption, setHasSelectedInitialOption] = useState(false);
  
  // Generate a new session ID on every page load/refresh
  const sessionId = useMemo(() => {
    return crypto.randomUUID();
  }, []);
console.log("sessionId", sessionId); 
  // Clear sessionStorage on page load to ensure a fresh chat
  useEffect(() => {
    sessionStorage.removeItem('chatMessages');
  }, []);

  // Handle window resize to adjust chat mode for mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      
      // If we're currently in panel mode but switched to mobile, go to fullscreen
      if (isMobile && chatMode === "panel") {
        setChatMode("fullscreen");
      }
      // If we're currently in fullscreen mode but switched to desktop, go to panel
      else if (!isMobile && chatMode === "fullscreen") {
        setChatMode("panel");
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chatMode]);

  const handleStartChat = () => {
    // Check if mobile (screen width < 768px)
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, open in fullscreen mode
      setChatMode("fullscreen");
    } else {
      // On desktop, open in panel mode
      setChatMode("panel");
    }
  };

  const handleToggleChat = () => {
    // Check if mobile (screen width < 768px)
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, toggle between fullscreen and hidden
      if (chatMode === "fullscreen") {
        setChatMode("hidden");
      } else if (chatMode === "panel") {
        setChatMode("fullscreen");
      }
    } else {
      // On desktop, toggle between panel and fullscreen
      if (chatMode === "fullscreen") {
        setChatMode("panel");
      } else if (chatMode === "panel") {
        setChatMode("fullscreen");
      }
    }
  };

  const handleCloseChat = () => {
    setChatMode("hidden");
    // Clear messages when closing chat
    setMessages([]);
    setInput("");
    setIsThinking(false);
    setHasSelectedInitialOption(false);
    // Clear sessionStorage to ensure clean state
    sessionStorage.removeItem('chatMessages');
  };

  const handleBackToHomepage = () => {
    setChatMode("hidden");
    // Clear messages when going back to homepage
    setMessages([]);
    setInput("");
    setIsThinking(false);
    setHasSelectedInitialOption(false);
    // Clear sessionStorage to ensure clean state
    sessionStorage.removeItem('chatMessages');
  };

  return (
    <div className="h-screen relative">
      <HomePage onStartChat={handleStartChat} />

      {chatMode === "panel" && (
        <div
          className="hidden md:flex fixed bottom-0 right-0 
               w-full max-w-[520px] 
               h-screen max-h-[90vh] 
               z-50 shadow-2xl rounded-t-lg overflow-hidden"
        >
          <div className="flex flex-col w-full h-full overflow-hidden">
            <ChatWindow
              onBackToHomepage={handleBackToHomepage}
              onToggleChat={handleToggleChat}
              onCloseChat={handleCloseChat}
              isPanel={true}
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
        </div>
      )}

      {chatMode === "fullscreen" && (
        <div className="fixed inset-0 z-50 bg-white mobile-chat-container">
          <ChatWindow
            onBackToHomepage={handleBackToHomepage}
            onToggleChat={handleToggleChat}
            onCloseChat={handleCloseChat}
            isPanel={false}
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
      )}
    </div>
  );
}
