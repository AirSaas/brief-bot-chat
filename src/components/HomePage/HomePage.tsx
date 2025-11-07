import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "../../lib/api";
import HomePageDesktopView from "./HomePageDesktopView";
import HomePageMobileView from "./HomePageMobileView";

interface HomePageProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  sessionId: string;
  isThinking: boolean;
  setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
  hasSelectedInitialOption: boolean;
  setHasSelectedInitialOption: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HomePage({
  messages,
  setMessages,
  input,
  setInput,
  sessionId,
  isThinking,
  setIsThinking,
  hasSelectedInitialOption,
  setHasSelectedInitialOption,
}: HomePageProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("app.airsaas.io/link");
  const [showChat, setShowChat] = useState(false);

  const parseBoldText = (translatedText: string): ReactNode => {
    const parts = translatedText.split(/(<strong>.*?<\/strong>)/g);
    return parts.map((part, index) => {
      if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
        const text = part.replace(/<\/?strong>/g, "");
        return (
          <strong
            key={index}
            style={{
              fontWeight: 700,
              fontFamily: "Product Sans, system-ui, sans-serif",
            }}
          >
            {text}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleGoBack = () => {
    setShowChat(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <HomePageMobileView
        showChat={showChat}
        onStartChat={handleStartChat}
        onGoBack={handleGoBack}
        onCopyLink={handleCopyLink}
        parseBoldText={parseBoldText}
        currentUrl={currentUrl}
        copied={copied}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        sessionId={sessionId}
        isThinking={isThinking}
        setIsThinking={setIsThinking}
        hasSelectedInitialOption={hasSelectedInitialOption}
        setHasSelectedInitialOption={setHasSelectedInitialOption}
        t={t}
      />
      <HomePageDesktopView
        onCopyLink={handleCopyLink}
        onGoBack={handleGoBack}
        parseBoldText={parseBoldText}
        currentUrl={currentUrl}
        copied={copied}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        sessionId={sessionId}
        isThinking={isThinking}
        setIsThinking={setIsThinking}
        hasSelectedInitialOption={hasSelectedInitialOption}
        setHasSelectedInitialOption={setHasSelectedInitialOption}
        t={t}
      />
    </div>
  );
}
