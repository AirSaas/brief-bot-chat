import { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import HomePage from "./components/HomePage";

export default function App() {
  const [showChat, setShowChat] = useState(false);

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleBackToHomepage = () => {
    setShowChat(false);
  };

  return (
    <div className="h-screen">
      {showChat ? (
        <ChatWindow onBackToHomepage={handleBackToHomepage} />
      ) : (
        <HomePage onStartChat={handleStartChat} />
      )}
    </div>
  );
}
