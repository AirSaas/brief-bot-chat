import { useState, useEffect, useRef } from "react";
import HomePage from "./components/HomePage/HomePage";
import type { ChatMessage } from "./lib/api";
import { sendToChat } from "./lib/api";
import { useTranslation } from "react-i18next";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasSelectedInitialOption, setHasSelectedInitialOption] = useState(false);
  
  // Generate a new session ID on every page load/refresh
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  
  // Store sessionIds and preloaded responses for each template
  const templateSessionIdsRef = useRef<Map<string, string>>(new Map());
  const preloadedResponsesRef = useRef<Map<string, { output?: string; quick_answers?: string[]; [key: string]: unknown }>>(new Map());
  const preloadInProgressRef = useRef<Set<string>>(new Set());
  const preloadAbortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const { i18n } = useTranslation();

  // Clear sessionStorage on page load to ensure a fresh chat
  useEffect(() => {
    sessionStorage.removeItem('chatMessages');
  }, []);

  // Silently preload both templates when page loads
  useEffect(() => {
    // Get current language (default to 'en' if not available)
    const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
    const isFrench = currentLang === 'fr' || currentLang.startsWith('fr');
    
    // Hardcoded template messages based on language
    const basicMessage = isFrench 
      ? "Commençons un Récit de Base, pose-moi ta première question pour guider le brief ! =ma langue est le français, gardons cette conversation entièrement en français="
      : "Let's start a Basic Story Telling, start your first question to me for guiding the brief! =my language is English, let's keep this conversation completely in English=";
    
    const emotionalMessage = isFrench
      ? "Commençons un Récit Émotionnel, pose-moi ta première question pour guider le brief ! =ma langue est le français, gardons cette conversation entièrement en français="
      : "Let's start an Emotional Story Telling, start your first question to me for guiding the brief! =my language is English, let's keep this conversation completely in English=";

    const preloadTemplate = async (templateValue: string, templateMessage: string) => {
      // Skip if already preloading or already loaded
      if (preloadInProgressRef.current.has(templateValue) || preloadedResponsesRef.current.has(templateValue)) {
        return;
      }

      preloadInProgressRef.current.add(templateValue);
      
      // Generate unique sessionId for this template
      const templateSessionId = crypto.randomUUID();
      templateSessionIdsRef.current.set(templateValue, templateSessionId);

      // Create AbortController for this preload
      const abortController = new AbortController();
      preloadAbortControllersRef.current.set(templateValue, abortController);

      try {
        // Silently call the API with abort signal using hardcoded message
        const response = await sendToChat({
          message: templateMessage,
          sessionId: templateSessionId,
          language: isFrench ? 'fr' : 'en',
          selected_template: templateValue,
          signal: abortController.signal
        });

        // Store the response only if not aborted
        if (!abortController.signal.aborted) {
          preloadedResponsesRef.current.set(templateValue, response);
        }
      } catch (error: unknown) {
        // Ignore abort errors silently
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error(`Error preloading template ${templateValue}:`, error);
        }
      } finally {
        preloadInProgressRef.current.delete(templateValue);
        preloadAbortControllersRef.current.delete(templateValue);
      }
    };

    // Preload both templates with hardcoded messages
    preloadTemplate('basic', basicMessage);
    preloadTemplate('emotional', emotionalMessage);
  }, [i18n]);

  // Function to reset chat with a new session ID
  const resetChat = () => {
    setMessages([]);
    setInput("");
    setIsThinking(false);
    setHasSelectedInitialOption(false);
    setSessionId(crypto.randomUUID());
    sessionStorage.removeItem('chatMessages');
    
    // Abort any ongoing preloads
    preloadAbortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    
    // Reset template preloads
    templateSessionIdsRef.current.clear();
    preloadedResponsesRef.current.clear();
    preloadInProgressRef.current.clear();
    preloadAbortControllersRef.current.clear();
    
    // Re-preload templates with hardcoded messages
    const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
    const isFrench = currentLang === 'fr' || currentLang.startsWith('fr');
    
    // Hardcoded template messages based on language
    const basicMessage = isFrench 
      ? "Commençons un Récit de Base, pose-moi ta première question pour guider le brief ! =ma langue est le français, gardons cette conversation entièrement en français="
      : "Let's start a Basic Story Telling, start your first question to me for guiding the brief! =my language is English, let's keep this conversation completely in English=";
    
    const emotionalMessage = isFrench
      ? "Commençons un Récit Émotionnel, pose-moi ta première question pour guider le brief ! =ma langue est le français, gardons cette conversation entièrement en français="
      : "Let's start an Emotional Story Telling, start your first question to me for guiding the brief! =my language is English, let's keep this conversation completely in English=";
    
    const preloadTemplate = async (templateValue: string, templateMessage: string) => {
      if (preloadInProgressRef.current.has(templateValue) || preloadedResponsesRef.current.has(templateValue)) {
        return;
      }

      preloadInProgressRef.current.add(templateValue);
      const templateSessionId = crypto.randomUUID();
      templateSessionIdsRef.current.set(templateValue, templateSessionId);

      // Create AbortController for this preload
      const abortController = new AbortController();
      preloadAbortControllersRef.current.set(templateValue, abortController);

      try {
        const response = await sendToChat({
          message: templateMessage,
          sessionId: templateSessionId,
          language: isFrench ? 'fr' : 'en',
          selected_template: templateValue,
          signal: abortController.signal
        });
        if (!abortController.signal.aborted) {
          preloadedResponsesRef.current.set(templateValue, response);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error(`Error preloading template ${templateValue}:`, error);
        }
      } finally {
        preloadInProgressRef.current.delete(templateValue);
        preloadAbortControllersRef.current.delete(templateValue);
      }
    };
    
    preloadTemplate('basic', basicMessage);
    preloadTemplate('emotional', emotionalMessage);
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
        preloadInProgress={preloadInProgressRef.current}
        abortOtherTemplatePreload={(selectedTemplate: string) => {
          // Abort the other template's preload
          const otherTemplate = selectedTemplate === 'basic' ? 'emotional' : 'basic';
          const controller = preloadAbortControllersRef.current.get(otherTemplate);
          if (controller) {
            controller.abort();
            preloadAbortControllersRef.current.delete(otherTemplate);
            preloadInProgressRef.current.delete(otherTemplate);
          }
        }}
      />
    </div>
  );
}
