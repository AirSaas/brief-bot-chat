/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { sendToChat, uploadAudio, type ChatMessage } from "../lib/api";
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
  isThinking?: boolean;
  setIsThinking?: React.Dispatch<React.SetStateAction<boolean>>;
  hasSelectedInitialOption?: boolean;
  setHasSelectedInitialOption?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ChatWindow({ 
  isPanel: _isPanel = false,
  messages: externalMessages,
  setMessages: externalSetMessages,
  input: externalInput,
  setInput: externalSetInput,
  sessionId: externalSessionId,
  isThinking: externalIsThinking,
  setIsThinking: externalSetIsThinking,
  hasSelectedInitialOption: externalHasSelectedInitialOption,
  setHasSelectedInitialOption: externalSetHasSelectedInitialOption
}: ChatWindowProps) {
  const { t } = useTranslation();
  
  // Use external state if provided, otherwise use local state (for backward compatibility)
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [localInput, setLocalInput] = useState("");
  const [localSessionId] = useState(() => crypto.randomUUID());
  const [localIsThinking, setLocalIsThinking] = useState(false);
  const [localHasSelectedInitialOption, setLocalHasSelectedInitialOption] = useState(false);
  
  const messages = externalMessages ?? localMessages;
  const setMessages = externalSetMessages ?? setLocalMessages;
  const input = externalInput ?? localInput;
  const setInput = externalSetInput ?? setLocalInput;
  const sessionId = externalSessionId ?? localSessionId;
  const isThinking = externalIsThinking ?? localIsThinking;
  const setIsThinking = externalSetIsThinking ?? setLocalIsThinking;
  const hasSelectedInitialOption = externalHasSelectedInitialOption ?? localHasSelectedInitialOption;
  const setHasSelectedInitialOption = externalSetHasSelectedInitialOption ?? setLocalHasSelectedInitialOption;
  
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedQuickAnswers, setSelectedQuickAnswers] = useState<string[]>([]);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<{ setCursorToEnd: () => void } | null>(null);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    // Track scroll position to determine if user manually scrolled up
    const handleScroll = () => {
      if (listRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShouldAutoScroll(isAtBottom);
      }
    };

    const scrollElement = listRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    // This allows users to scroll up to see previous messages
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
      sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    } else {
      sessionStorage.removeItem('chatMessages');
    }
  }, [messages, shouldAutoScroll]);

  // Detect mobile keyboard open/close
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const initialViewportHeight = window.visualViewport?.height || window.innerHeight;
        const currentViewportHeight = window.innerHeight;
        const keyboardHeight = initialViewportHeight - currentViewportHeight;
        
        // If viewport height decreased significantly, keyboard is likely open
        setIsKeyboardOpen(keyboardHeight > 150);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Scroll to bottom on mount, especially for initial messages
  useEffect(() => {
    // Scroll to bottom when component mounts to show initial messages at bottom
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
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 0);
  };

  // Function to extract quick_answers from the message content
  const extractQuickAnswers = (content: string): { cleanContent: string; quickAnswers: string[] } => {
    try {
      // Search for the complete markdown code block with JSON
      const markdownMatch = content.match(/```json\s*\{[\s\S]*"quick_answers"[\s\S]*?\}\s*```/);
      
      if (markdownMatch) {
        // Extract only the JSON from the markdown block
        const jsonMatch = markdownMatch[0].match(/\{[\s\S]*"quick_answers"[\s\S]*?\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.quick_answers && Array.isArray(parsed.quick_answers)) {
            // Remove the entire markdown block from the content
            const cleanContent = content.replace(markdownMatch[0], '').trim();
            return { cleanContent, quickAnswers: parsed.quick_answers };
          }
        }
      }
      
      // If the markdown block is not found, search for the JSON alone
      const jsonMatch = content.match(/\{[\s\S]*"quick_answers"[\s\S]*?\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.quick_answers && Array.isArray(parsed.quick_answers)) {
          // Remove the JSON from the content
          const cleanContent = content.replace(jsonMatch[0], '').trim();
          return { cleanContent, quickAnswers: parsed.quick_answers };
        }
      }
    } catch {
      // Silence parsing errors
    }
    
    return { cleanContent: content, quickAnswers: [] };
  };

  // Function to send message directly with text
  const sendMessageDirectly = async (messageText: string) => {
    if (!messageText.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: messageText.trim() };
    setMessages((m) => [...m, userMsg]);
    setIsThinking(true);
    
    try {
      const json = await sendToChat({ message: userMsg.content, sessionId });
      const text = json?.output ?? json?.data ?? JSON.stringify(json);
      
      // Extract quick_answers from the message content
      const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));
      
      setMessages((m) => [...m, { 
        role: "assistant", 
        content: cleanContent,
        quickAnswers: quickAnswers
      }]);
      
    } catch (error) {
      console.error(error);
      setMessages((m) => [...m, { role: "assistant", content: t('chat.error_message') }]);
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

  function handleTemplateSelect(template: string) {
    if (isThinking) return;
    
    // Mark that user has selected an initial option
    setHasSelectedInitialOption(true);
    
    // Create user message with selected template
    const userMsg: ChatMessage = { role: "user", content: template };
    setMessages((m) => [...m, userMsg]);
    setIsThinking(true);
    
    // Send template selection to chat
    sendToChat({ message: template, sessionId })
      .then((json) => {
        const text = json?.output ?? json?.data ?? JSON.stringify(json);
        
        // Extract quick_answers from message content
        const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));
        
        setMessages((m) => [...m, { 
          role: "assistant", 
          content: cleanContent,
          quickAnswers: quickAnswers
        }]);
      })
      .catch((error) => {
        console.error(error);
        setMessages((m) => [...m, { role: "assistant", content: t('chat.error_message') }]);
      })
      .finally(() => {
        setIsThinking(false);
      });
  }

  function handleQuickAnswerClick(answer: string) {
    // Check if it's a default button (give_examples or skip_question in both languages)
    const lowerAnswer = answer.toLowerCase();
    const isDefaultButton = 
      answer === t('chat.quick_answers.give_examples') || 
      answer === t('chat.quick_answers.skip_question') ||
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
      setInput(prevInput => {
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
    setSelectedQuickAnswers(prev => [...prev, answer]);
  }

  function handleDownloadPDF() {
    setShowDownloadModal(true);
  }

  async function sendAudioFile(file: File) {
    // Show initial message in "uploading" state
    const userMsg: ChatMessage = {
      role: "user",
      content: t('chat.voice_message'),
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
        content: t('chat.voice_message'),
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
       
       // Extract quick_answers from the message content
       const { cleanContent, quickAnswers } = extractQuickAnswers(String(text));
       
       setMessages((m) => [...m, { 
         role: "assistant", 
         content: cleanContent,
         quickAnswers: quickAnswers
       }]);
       
       setIsThinking(false);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        role: "user",
        content: t('chat.voice_message'),
        audioFile: file,
        audioStatus: "error",
      };
      setMessages((m) => m.slice(0, -1).concat(errorMsg));
      setMessages((m) => [...m, { role: "assistant", content: t('chat.audio_error') }]);
      setIsThinking(false);
    }
  }

  return (
    <div className={`h-full flex flex-col bg-white mobile-chat-container chat-window-mobile mobile-safe-area ${isKeyboardOpen ? 'mobile-keyboard-adjust' : ''}`}>
      <header className="bg-white flex flex-col px-4 py-2.5 md:px-5 md:py-2.5">
        {/* Main header row */}
        <div className="flex items-center justify-between w-full gap-0 md:gap-[307px]">
          {/* Left section */}
          <div className="flex items-center gap-2 md:gap-[10px] flex-1 min-w-0">
            {/* Logo */}
            <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
              <img 
                src="/mini.png" 
                alt="AirSaas AI" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            
            {/* Title */}
            <div 
              className="text-[#040D22] flex-1 min-w-0"
              style={{ 
                fontFamily: 'Product Sans, system-ui, sans-serif', 
                fontWeight: 700,
                fontSize: '20px',
                lineHeight: '1.213em'
              }}
            >
              {t('chat.title')}
            </div>
          </div>
          
          {/* Right section - Empty but maintains spacing */}
          <div className="flex items-center gap-[5px]" style={{ width: 'auto' }}>
            {/* Empty - maintains layout spacing */}
          </div>
        </div>
      </header>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#FFFFFF',
          borderRadius: '25px'
        }}
        className="chat-scrollbar chat-messages-mobile"
      >
        {/* Background logo - Fixed position */}
        {/*<div className="fixed right-6 sm:right-6 bottom-16 sm:bottom-50 opacity-5 pointer-events-none z-0">
          <img
            src="/logo-air.svg"
            alt="AirSaas Background Logo"
            className="w-20 h-20 sm:w-32 sm:h-32"
          />
        </div>*/}

         {/* Initial bot message with template selection */}
         {messages.length === 0 && (
           <InitialBotMessage onTemplateSelect={handleTemplateSelect} />
         )}
         
         {messages.map((m, i) => {
           // Only show quick answers for the last assistant message, but never for the first assistant message
           const isLastAssistantMessage = m.role === "assistant" && 
             i === messages.length - 1;
           
           // Check if this is the first assistant message
           const isFirstAssistantMessage = m.role === "assistant" && 
             messages.findIndex(msg => msg.role === "assistant") === i;
           
           // Show quick answers only if it's the last assistant message AND not the first assistant message
           const shouldShowQuickAnswers = isLastAssistantMessage && !isFirstAssistantMessage;
           
           return (
            <MessageBubble
              key={i}
              role={m.role}
              isAudio={!!(m.audioFile || m.audioUrl)}
              audioFile={m.audioFile}
              showCopyButton={m.role === "assistant"}
              quickAnswers={shouldShowQuickAnswers ? m.quickAnswers : []}
              onQuickAnswerClick={shouldShowQuickAnswers ? handleQuickAnswerClick : undefined}
              onDownloadPDF={handleDownloadPDF}
              selectedAnswers={selectedQuickAnswers}
              onAnswerSelect={handleQuickAnswerSelect}
            >
              {m.content}
            </MessageBubble>
          );
         })}
         
         {/* Thinking indicator */}
         {isThinking && (
           <MessageBubble role="assistant" quickAnswers={[]} onQuickAnswerClick={undefined} selectedAnswers={[]} onAnswerSelect={undefined}>
             {""}
           </MessageBubble>
         )}
         
      </div>

      <footer className="px-3 py-3 md:px-6 md:py-4 bg-transparent chat-footer-mobile">
        <div className="w-full max-w-full chat-input-mobile">
          <InputWithSuggestions
            value={input}
            onChange={setInput}
            onSend={sendText}
            onSendDirectly={sendMessageDirectly}
            placeholder={isThinking ? t('chat.placeholder_thinking') : t('chat.placeholder')}
            disabled={isThinking || !hasSelectedInitialOption || isRecording}
            isThinking={isThinking}
            suggestions={t('chat.suggestions', { returnObjects: true }) as string[]}
            onHeightChange={handleInputHeightChange}
            onRef={(ref) => { inputRef.current = ref; }}
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
