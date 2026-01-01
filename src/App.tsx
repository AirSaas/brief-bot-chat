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
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  
  // Store sessionIds and preloaded responses for each template
  const templateSessionIdsRef = useRef<Map<string, string>>(new Map());
  const preloadedResponsesRef = useRef<Map<string, any>>(new Map());
  const preloadInProgressRef = useRef<Set<string>>(new Set());
  const preloadAbortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const { i18n } = useTranslation();

  // Clear sessionStorage on page load to ensure a fresh chat
  useEffect(() => {
    sessionStorage.removeItem('chatMessages');
  }, []);

  // Silently preload both templates when page loads
  useEffect(() => {
    const preloadTemplate = async (templateValue: string, templateTitle: string) => {
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
        // Get the template message text (same as what user would send)
        const templateMessage = i18n.t('initial_message.lets_start_template', { template: templateTitle });

        // Silently call the API with abort signal
        const response = await sendToChat({
          message: templateMessage,
          sessionId: templateSessionId,
          language: i18n.language,
          selected_template: templateValue,
          signal: abortController.signal
        });

        // Store the response only if not aborted
        if (!abortController.signal.aborted) {
          preloadedResponsesRef.current.set(templateValue, response);
        }
      } catch (error: any) {
        // Ignore abort errors silently
        if (error.name !== 'AbortError') {
          console.error(`Error preloading template ${templateValue}:`, error);
        }
      } finally {
        preloadInProgressRef.current.delete(templateValue);
        preloadAbortControllersRef.current.delete(templateValue);
      }
    };

    // Preload both templates
    const basicTitle = i18n.t('initial_message.templates.basic_storytelling.title');
    const emotionalTitle = i18n.t('initial_message.templates.emotional_storytelling.title');
    
    preloadTemplate('basic', basicTitle);
    preloadTemplate('emotional', emotionalTitle);
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
    
    // Re-preload templates
    const basicTitle = i18n.t('initial_message.templates.basic_storytelling.title');
    const emotionalTitle = i18n.t('initial_message.templates.emotional_storytelling.title');
    
    const preloadTemplate = async (templateValue: string, templateTitle: string) => {
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
        const templateMessage = i18n.t('initial_message.lets_start_template', { template: templateTitle });
        const response = await sendToChat({
          message: templateMessage,
          sessionId: templateSessionId,
          language: i18n.language,
          selected_template: templateValue,
          signal: abortController.signal
        });
        if (!abortController.signal.aborted) {
          preloadedResponsesRef.current.set(templateValue, response);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error(`Error preloading template ${templateValue}:`, error);
        }
      } finally {
        preloadInProgressRef.current.delete(templateValue);
        preloadAbortControllersRef.current.delete(templateValue);
      }
    };
    
    preloadTemplate('basic', basicTitle);
    preloadTemplate('emotional', emotionalTitle);
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
