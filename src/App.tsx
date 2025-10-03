import { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import HomePage from "./components/HomePage";

type ChatMode = "hidden" | "panel" | "fullscreen";

export default function App() {
  const [chatMode, setChatMode] = useState<ChatMode>("hidden");

  const handleStartChat = () => {
    setChatMode("fullscreen");
  };

  const handleToggleChat = () => {
    // Check if mobile (screen width < 768px)
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, toggle always goes back to home
      setChatMode("hidden");
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
  };

  const handleBackToHomepage = () => {
    setChatMode("hidden");
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
            />
          </div>
        </div>
      )}

      {chatMode === "fullscreen" && (
        <div className="fixed inset-0 z-50 bg-white">
          <ChatWindow
            onBackToHomepage={handleBackToHomepage}
            onToggleChat={handleToggleChat}
            onCloseChat={handleCloseChat}
            isPanel={false}
          />
        </div>
      )}
    </div>
  );
}
