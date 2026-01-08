/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { extractQuickAnswers } from "../utils/chat";
import {
  handleGoBack as goBack,
  handleCopyLink as copyLink,
} from "../utils/navigation";
import { sendToChat, uploadAudio, getFirstAIMessage, insertInitialChatHistory, getInitialMessages, type ChatMessage } from "../lib/api";
import { MessageBubble } from "./MessageBubble";
import InputWithSuggestions from "./InputWithSuggestions";
import InitialBotMessage from "./InitialBotMessage";
import DownloadPDFModal from "./DownloadPDFModal";

interface ChatWindowProps {
  isPanel?: boolean;
  messages?: ChatMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input?: string;
  setInput?: React.Dispatch<React.SetStateAction<string>>;
  sessionId?: string;
  setSessionId?: React.Dispatch<React.SetStateAction<string>>;
  isThinking?: boolean;
  setIsThinking?: React.Dispatch<React.SetStateAction<boolean>>;
  hasSelectedInitialOption?: boolean;
  setHasSelectedInitialOption?: React.Dispatch<React.SetStateAction<boolean>>;
  onGoBack?: () => void;
  onResetChat?: () => void;
  templateSessionIds?: Map<string, string>;
  preloadedResponses?: Map<string, any>;
  abortOtherTemplatePreload?: (selectedTemplate: string) => void;
}

export default function ChatWindow({
  messages: externalMessages,
  setMessages: externalSetMessages,
  input: externalInput,
  setInput: externalSetInput,
  sessionId: externalSessionId,
  setSessionId: externalSetSessionId,
  isThinking: externalIsThinking,
  setIsThinking: externalSetIsThinking,
  hasSelectedInitialOption: externalHasSelectedInitialOption,
  setHasSelectedInitialOption: externalSetHasSelectedInitialOption,
  onGoBack,
  onResetChat,
  templateSessionIds,
  preloadedResponses,
  abortOtherTemplatePreload,
}: ChatWindowProps) {
  const { t, i18n } = useTranslation();

  // Use external state if provided, otherwise use local state (for backward compatibility)
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [localInput, setLocalInput] = useState("");
  const [localSessionId, setLocalSessionId] = useState(() => crypto.randomUUID());
  const [localIsThinking, setLocalIsThinking] = useState(false);
  const [localHasSelectedInitialOption, setLocalHasSelectedInitialOption] =
    useState(false);

  const messages = externalMessages ?? localMessages;
  const setMessages = externalSetMessages ?? setLocalMessages;
  const input = externalInput ?? localInput;
  const setInput = externalSetInput ?? setLocalInput;
  const sessionId = externalSessionId ?? localSessionId;
  const setSessionId = externalSetSessionId 
    ? (id: string) => externalSetSessionId(id) 
    : setLocalSessionId;
  const isThinking = externalIsThinking ?? localIsThinking;
  const setIsThinking = externalSetIsThinking ?? setLocalIsThinking;
  const hasSelectedInitialOption =
    externalHasSelectedInitialOption ?? localHasSelectedInitialOption;
  const setHasSelectedInitialOption =
    externalSetHasSelectedInitialOption ?? setLocalHasSelectedInitialOption;

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedQuickAnswers, setSelectedQuickAnswers] = useState<string[]>(
    []
  );
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<{ setCursorToEnd: () => void } | null>(null);
  const preloadCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    // Track scroll position to determine if user manually scrolled up
    const handleScroll = () => {
      if (listRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        // Check if we're near the bottom (where newest messages are)
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShouldAutoScroll(isAtBottom);
      }
    };

    const scrollElement = listRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    // Scroll to bottom to show newest messages
    if (shouldAutoScroll && listRef.current) {
      // Use requestAnimationFrame for better scroll performance
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (listRef.current && shouldAutoScroll) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }
        }, 100);
      });
    }

    // Save messages to sessionStorage for PDF generation
    if (messages.length > 0) {
      sessionStorage.setItem("chatMessages", JSON.stringify(messages));
    } else {
      sessionStorage.removeItem("chatMessages");
    }
  }, [messages, shouldAutoScroll]);

  // Detect mobile keyboard open/close
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const initialViewportHeight =
          window.visualViewport?.height || window.innerHeight;
        const currentViewportHeight = window.innerHeight;
        const keyboardHeight = initialViewportHeight - currentViewportHeight;

        // If viewport height decreased significantly, keyboard is likely open
        setIsKeyboardOpen(keyboardHeight > 150);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (preloadCheckIntervalRef.current) {
        clearInterval(preloadCheckIntervalRef.current);
        preloadCheckIntervalRef.current = null;
      }
    };
  }, []);

  // Scroll to bottom on mount, especially for initial messages
  useEffect(() => {
    // Scroll to bottom when component mounts to show newest messages at bottom
    const scrollToBottom = () => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    };

    // Initial scroll after mount
    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 200);
    });
  }, []); // Only run on mount

  // Function to handle input height changes and scroll to bottom
  const handleInputHeightChange = () => {
    // Scroll to bottom when input grows
    setTimeout(() => {
      if (listRef.current && shouldAutoScroll) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 0);
  };

  // Function to send message directly with text
  const sendMessageDirectly = async (messageText: string) => {
    if (!messageText.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: messageText.trim() };
    setMessages((m) => [...m, userMsg]);
    setIsThinking(true);

    try {
      const json = await sendToChat({
        message: userMsg.content,
        sessionId,
        language: i18n.language,
      });
      const text = json?.output ?? json?.data ?? JSON.stringify(json);

      // Extract quick_answers from the message content
      const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: cleanContent,
          quickAnswers: quickAnswers,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("chat.error_message") },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  async function sendText() {
    if (!input.trim()) return;
    const messageToSend = input;
    setInput(""); // Clear input only when user actively clicks send button
    await sendMessageDirectly(messageToSend);
  }

  // Function to hide language instruction text between equals signs for display
  const hideLanguageInstruction = (text: string): string => {
    return text.replace(/\s*=my language is English, let's keep this conversation completely in English=\s*/g, '')
               .replace(/\s*=ma langue est le français, gardons cette conversation entièrement en français=\s*/g, '');
  };

  async function handleTemplateSelect(template: string, templateValue: string) {
    if (isThinking) return;

    // Abort the other template's preload
    if (abortOtherTemplatePreload) {
      abortOtherTemplatePreload(templateValue);
    }

    // Mark that user has selected an initial option
    setHasSelectedInitialOption(true);

    // Generate unique sessionId for this template selection
    const templateSessionId = crypto.randomUUID();
    
    // Store the sessionId for this template
    if (templateSessionIds) {
      templateSessionIds.set(templateValue, templateSessionId);
    }
    
    // Switch to the template's sessionId
    if (setSessionId) {
      (setSessionId as (id: string) => void)(templateSessionId);
    }

    // Clean the template message (remove language instructions) and add user's message first
    const cleanTemplateMessage = hideLanguageInstruction(template).trim();
    const userMsg: ChatMessage = { role: "user", content: cleanTemplateMessage };
    setMessages((m) => [...m, userMsg]);

    // Show thinking indicator while inserting messages into Supabase
    setIsThinking(true);

    try {
      // Get current language
      const currentLang = i18n.language || 'en';
      const isFrench = currentLang === 'fr' || currentLang.startsWith('fr');
      
      // Get initial messages for this template and language
      const initialMessages = getInitialMessages(templateValue, isFrench ? 'fr' : 'en');
      
      if (!initialMessages) {
        throw new Error(`No initial messages found for template ${templateValue} and language ${isFrench ? 'fr' : 'en'}`);
      }

      // Silently insert initial chat history into Supabase
      await insertInitialChatHistory(
        templateSessionId,
        initialMessages.human,
        initialMessages.ai
      );

      // Mark as preloaded (optional, for tracking purposes)
      if (preloadedResponses) {
        preloadedResponses.set(templateValue, { preloaded: true });
      }

      // Get the first AI message from Supabase and display it
      const aiContent = await getFirstAIMessage(templateSessionId);
      
      if (aiContent) {
        // Extract quick_answers from message content
        const { cleanContent, quickAnswers } = extractQuickAnswers(String(aiContent));

        // Add the assistant's first question
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: cleanContent,
            quickAnswers: quickAnswers,
          },
        ]);
      } else {
        throw new Error("No AI message found in Supabase");
      }
    } catch (error) {
      console.error("Error setting up template:", error);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("chat.error_message") },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleQuickAnswerClick(answer: string) {
    // Check if it's the "create_new_brief" button
    const isNewBriefButton =
      answer === t("chat.quick_answers.create_new_brief") ||
      answer === "Start a new brief" ||
      answer === "Commencer un nouveau brief";

    if (isNewBriefButton && onResetChat) {
      // Reset chat with a new session ID
      onResetChat();
      return;
    }

    // Check if it's a default button (give_examples or skip_question in both languages)
    const lowerAnswer = answer.toLowerCase();
    const isDefaultButton =
      answer === t("chat.quick_answers.give_examples") ||
      answer === t("chat.quick_answers.skip_question") ||
      answer === "Give me examples" ||
      answer === "Skip this question" ||
      answer === "Donnez-moi des exemples" ||
      answer === "Sauter cette question" ||
      lowerAnswer === "everything is correct" ||
      lowerAnswer === "tout est correct";

    if (isDefaultButton) {
      // Send message directly for default buttons
      sendMessageDirectly(answer);
    } else {
      // Append the quick answer text to the existing input for other buttons
      setInput((prevInput) => {
        // If there's already text, add a line break with space before appending
        return prevInput.trim() ? `${prevInput.trim()}\n\n${answer}` : answer;
      });

      // Position cursor at the end of the inserted text
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setCursorToEnd();
        }
      }, 0);
    }
  }

  function handleQuickAnswerSelect(answer: string) {
    setSelectedQuickAnswers((prev) => [...prev, answer]);
  }

  function handleDownloadPDF() {
    setShowDownloadModal(true);
  }

  async function sendAudioFile(file: File) {
    // Show initial message in "uploading" state
    const userMsg: ChatMessage = {
      role: "user",
      content: t("chat.voice_message"),
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
        content: t("chat.voice_message"),
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
        language: i18n.language,
      });

      const text = json?.output ?? json?.data ?? JSON.stringify(json);

      // Extract quick_answers from the message content
      const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: cleanContent,
          quickAnswers: quickAnswers,
        },
      ]);

      setIsThinking(false);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        role: "user",
        content: t("chat.voice_message"),
        audioFile: file,
        audioStatus: "error",
      };
      setMessages((m) => m.slice(0, -1).concat(errorMsg));
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("chat.audio_error") },
      ]);
      setIsThinking(false);
    }
  }

  const handleBackClick = () => goBack(onGoBack);

  const handleCopyLinkClick = () => {
    void copyLink();
  };

  return (
    <div
      className={`h-full flex flex-col bg-white mobile-chat-container chat-window-mobile mobile-safe-area font-[var(--font-mobile)] md:font-[var(--font-desktop)] ${
        isKeyboardOpen ? "mobile-keyboard-adjust" : ""
      }`}
    >
      {/* Mobile Top Header - Back and Copy buttons */}
      <div className="md:hidden flex flex-col border-b border-[#D2D6DC] bg-white px-[20px] py-[10px]">
        <div className="flex w-full flex-row items-center justify-between gap-[5px]">
          {/* Back button */}
          <button
            onClick={handleBackClick}
            type="button"
            className="flex h-[35px] w-[35px] items-center justify-center rounded-full p-2 transition-colors duration-200 hover:bg-[#E8EBFE]"
          >
            <span className="flex h-[19px] w-[19px] items-center justify-center">
              <svg
                width="19"
                height="19"
                viewBox="0 0 19 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[19px] w-[19px]"
              >
                <path
                  d="M16.5 9.5C16.5 9.78125 16.25 10 15.9688 10H4.1875L8.5625 14.6875C8.75 14.875 8.75 15.1875 8.53125 15.375C8.4375 15.4688 8.3125 15.5 8.1875 15.5C8.03125 15.5 7.90625 15.4688 7.8125 15.3438L2.625 9.84375C2.4375 9.65625 2.4375 9.375 2.625 9.1875L7.8125 3.6875C8 3.46875 8.3125 3.46875 8.53125 3.65625C8.75 3.84375 8.75 4.15625 8.5625 4.34375L4.1875 9H15.9688C16.25 9 16.5 9.25 16.5 9.5Z"
                  fill="#3C51E2"
                />
              </svg>
            </span>
          </button>

          {/* Copy link button */}
          <button
            onClick={handleCopyLinkClick}
            type="button"
            className="flex h-[35px] w-[35px] items-center justify-center rounded-full p-2 transition duration-200 hover:bg-[#E8EBFE] active:bg-[#DCE4FF] active:scale-95 transform"
          >
            <span className="flex h-[19px] w-[19px] items-center justify-center">
              <svg
                width="19"
                height="19"
                viewBox="0 0 19 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[19px] w-[19px]"
              >
                <path
                  d="M4.90625 5.625C6.4375 4.0625 8.96875 4.0625 10.5312 5.625C12.0312 7.09375 12.0938 9.46875 10.75 11.0625L10.5625 11.25C10.375 11.4688 10.0625 11.5 9.875 11.3125C9.65625 11.125 9.625 10.8125 9.8125 10.5938L9.96875 10.4062C11 9.21875 10.9375 7.4375 9.84375 6.34375C8.65625 5.15625 6.78125 5.15625 5.59375 6.34375L1.71875 10.2188C0.53125 11.4062 0.53125 13.2812 1.71875 14.4688C2.875 15.625 4.78125 15.625 5.9375 14.4688L6.65625 13.75C6.84375 13.5625 7.15625 13.5625 7.375 13.75C7.5625 13.9375 7.5625 14.2812 7.375 14.4688L6.65625 15.1562C5.09375 16.7188 2.5625 16.7188 1 15.1562C-0.5625 13.5938 -0.5625 11.0625 1 9.5L4.90625 5.625ZM14.0625 13.4062C12.5312 14.9688 10 14.9688 8.4375 13.4062C6.9375 11.9375 6.875 9.5625 8.21875 7.96875L8.40625 7.78125C8.59375 7.5625 8.90625 7.53125 9.09375 7.71875C9.3125 7.90625 9.34375 8.21875 9.15625 8.4375L9 8.625C7.96875 9.8125 8.03125 11.5938 9.125 12.6875C10.3125 13.875 12.1875 13.875 13.375 12.6875L17.25 8.8125C18.4375 7.625 18.4375 5.75 17.25 4.5625C16.0938 3.40625 14.1875 3.40625 13.0312 4.5625L12.3125 5.28125C12.125 5.46875 11.8125 5.46875 11.5938 5.28125C11.4062 5.0625 11.4062 4.75 11.5938 4.5625L12.3125 3.84375C13.875 2.28125 16.4062 2.28125 17.9688 3.84375C19.5312 5.40625 19.5312 7.9375 17.9688 9.5L14.0625 13.4062Z"
                  fill="#3C51E2"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <header className="flex flex-col bg-white pt-[10px] pr-[20px] pb-[10px] pl-[21px]">
        {/* Cont */}
        <div className="flex flex-row items-center justify-between self-stretch">
          {/* left */}
          <div className="flex flex-1 min-w-0 flex-row items-center gap-[10px]">
            {/* left subgroup */}
            <div className="flex flex-row items-center gap-[10px]">
              {/* icons/airsaas-ai */}
              <div className="flex h-[40px] w-[40px] flex-shrink-0 flex-col items-center justify-center py-[1.74px]">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.4"
                    d="M35.1855 9.45942L41.4551 7.03957L43.765 0.879946C43.875 0.32998 44.425 0 44.9749 0C45.4149 0 45.9649 0.32998 46.0749 0.879946L48.4947 7.03957L54.6544 9.45942C55.2044 9.56941 55.5343 10.1194 55.5343 10.5593C55.5343 11.1093 55.2044 11.6593 54.6544 11.7693L48.4947 14.0791L46.0749 20.3487C45.9649 20.7887 45.4149 21.1187 44.9749 21.1187C44.425 21.1187 43.875 20.7887 43.765 20.3487L41.4551 14.0791L35.1855 11.7693C34.7455 11.6593 34.4155 11.1093 34.4155 10.5593C34.4155 10.1194 34.7455 9.56941 35.1855 9.45942Z"
                    fill="#3C51E2"
                  />
                  <path
                    opacity="0.4"
                    d="M5.21452 22.8817L6.92554 18.319C7.00701 17.9116 7.4144 17.6672 7.82178 17.6672C8.14769 17.6672 8.55508 17.9116 8.63655 18.319L10.429 22.8817L14.9918 24.6742C15.3991 24.7556 15.6436 25.163 15.6436 25.4889C15.6436 25.8963 15.3991 26.3037 14.9918 26.3852L10.429 28.0962L8.63655 32.7403C8.55508 33.0662 8.14769 33.3107 7.82178 33.3107C7.4144 33.3107 7.00701 33.0662 6.92554 32.7403L5.21452 28.0962L0.570338 26.3852C0.244431 26.3037 0 25.8963 0 25.4889C0 25.163 0.244431 24.7556 0.570338 24.6742L5.21452 22.8817Z"
                    fill="#3C51E2"
                  />
                  <path
                    d="M27.0839 17.6672L43.804 53.1412L26.561 47.8021L31.6504 44.7152L35.385 45.8817L27.0823 28.2685L19.7552 43.8142L29.0691 38.243L30.9827 42.2978L9.38818 55.2115L27.0839 17.6672Z"
                    fill="#3C51E2"
                  />
                </svg>
              </div>

              {/* panel name */}
              <div className="text-left text-[18px] font-medium md:font-bold leading-[1.2130000856187608em] text-[#040D22]">
                {t("chat.title")}
              </div>
            </div>
          </div>

          {/* right */}
          <div className="flex flex-shrink-0 flex-row items-center justify-end gap-[5px]">
            {/* Empty - maintains layout spacing */}
          </div>
        </div>
      </header>

      <div
        ref={listRef}
        className={`chat-scrollbar chat-messages-mobile relative z-10 flex flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-[25px] bg-white md:gap-[10px] gap-[20px] md:p-[20px_40px_40px] p-[10px_20px_40px] ${
          hasSelectedInitialOption ? "justify-start" : "justify-end"
        }`}
        style={{ transition: "justify-content 0.3s ease-in-out" }}
      >
        {/* Initial bot message with template selection */}
        {messages.length === 0 && !hasSelectedInitialOption && (
          <InitialBotMessage onTemplateSelect={handleTemplateSelect} />
        )}

        {/* Render messages in chronological order: first messages at top, newest at bottom */}
        {messages.map((m, i) => {
          // Only show quick answers for the last assistant message, but never for the first assistant message
          const isLastAssistantMessage =
            m.role === "assistant" && i === messages.length - 1;

          // Check if this is the first assistant message
          const firstAssistantIndex = messages.findIndex(
            (msg) => msg.role === "assistant"
          );
          const isFirstAssistantMessage =
            m.role === "assistant" && i === firstAssistantIndex;

          // Show quick answers only if it's the last assistant message AND not the first assistant message
          const shouldShowQuickAnswers =
            isLastAssistantMessage && !isFirstAssistantMessage;

          // Filter out selected quick answers so they disappear once chosen
          const availableQuickAnswers =
            shouldShowQuickAnswers && m.quickAnswers
              ? m.quickAnswers.filter(
                  (answer) => !selectedQuickAnswers.includes(answer)
                )
              : [];

          return (
            <div key={i} className="message-bubble-enter">
              <MessageBubble
                role={m.role}
                isAudio={!!(m.audioFile || m.audioUrl)}
                audioFile={m.audioFile}
                showCopyButton={m.role === "assistant"}
                quickAnswers={availableQuickAnswers}
                onQuickAnswerClick={
                  shouldShowQuickAnswers ? handleQuickAnswerClick : undefined
                }
                onDownloadPDF={handleDownloadPDF}
                selectedAnswers={selectedQuickAnswers}
                onAnswerSelect={handleQuickAnswerSelect}
              >
                {m.content}
              </MessageBubble>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="message-bubble-enter">
            <MessageBubble
              role="assistant"
              quickAnswers={[]}
              onQuickAnswerClick={undefined}
              selectedAnswers={[]}
              onAnswerSelect={undefined}
            >
              {""}
            </MessageBubble>
          </div>
        )}
      </div>

      <footer className="chat-footer-mobile bg-transparent px-[20px] pb-[20px] pt-0">
        <div className="w-full max-w-full chat-input-mobile">
          <InputWithSuggestions
            value={input}
            onChange={setInput}
            onSend={sendText}
            onSendDirectly={sendMessageDirectly}
            placeholder={
              isThinking
                ? t("chat.placeholder_thinking")
                : t("chat.placeholder")
            }
            disabled={isThinking || !hasSelectedInitialOption || isRecording}
            isThinking={isThinking}
            suggestions={
              t("chat.suggestions", { returnObjects: true }) as string[]
            }
            onHeightChange={handleInputHeightChange}
            onRef={(ref) => {
              inputRef.current = ref;
            }}
            onRecorded={sendAudioFile}
            isRecording={isRecording}
            onRecordingStateChange={setIsRecording}
            hasSelectedInitialOption={hasSelectedInitialOption}
          />
        </div>
      </footer>

      {/* Download PDF Modal */}
      <DownloadPDFModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
}
