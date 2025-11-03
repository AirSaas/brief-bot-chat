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
        // Check if we're near the bottom (where newest messages are)
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
        behavior: 'smooth'
      });
      }
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
            // Process quick_answers: handle both string arrays and object arrays
            const processedAnswers = parsed.quick_answers.map((item: any) => {
              if (typeof item === 'string') {
                return item;
              } else if (typeof item === 'object' && item !== null) {
                // Handle object format with indicator and goal
                if (item.indicator && item.goal) {
                  return `${item.indicator}: ${item.goal}`;
                } else if (item.indicator) {
                  return item.indicator;
                } else if (item.goal) {
                  return item.goal;
                }
                // Fallback: try to stringify the object if it has other properties
                return JSON.stringify(item);
              }
              return String(item);
            });
            
            // Remove the entire markdown block from the content
            const cleanContent = content.replace(markdownMatch[0], '').trim();
            return { cleanContent, quickAnswers: processedAnswers };
          }
        }
      }
      
      // If the markdown block is not found, search for the JSON alone
      const jsonMatch = content.match(/\{[\s\S]*"quick_answers"[\s\S]*?\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.quick_answers && Array.isArray(parsed.quick_answers)) {
          // Process quick_answers: handle both string arrays and object arrays
          const processedAnswers = parsed.quick_answers.map((item: any) => {
            if (typeof item === 'string') {
              return item;
            } else if (typeof item === 'object' && item !== null) {
              // Handle object format with indicator and goal
              if (item.indicator && item.goal) {
                return `${item.indicator}: ${item.goal}`;
              } else if (item.indicator) {
                return item.indicator;
              } else if (item.goal) {
                return item.goal;
              }
              // Fallback: try to stringify the object if it has other properties
              return JSON.stringify(item);
            }
            return String(item);
          });
          
          // Remove the JSON from the content
          const cleanContent = content.replace(jsonMatch[0], '').trim();
          return { cleanContent, quickAnswers: processedAnswers };
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
      <header className="bg-white flex flex-col" style={{ padding: '10px 20px 10px 21px' }}>
        {/* Cont */}
        <div 
          style={{ 
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'stretch',
            gap: '307px'
          }}
        >
          {/* left */}
          <div 
            style={{ 
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '10px',
              flex: 1,
              minWidth: 0
            }}
          >
            {/* left subgroup */}
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                width: '100%'
              }}
            >
              {/* icons/airsaas-ai */}
              <div 
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '40px',
                  height: '40px',
                  flexShrink: 0
                }}
              >
                <svg width="40" height="40" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.4" d="M35.1855 9.45942L41.4551 7.03957L43.765 0.879946C43.875 0.32998 44.425 0 44.9749 0C45.4149 0 45.9649 0.32998 46.0749 0.879946L48.4947 7.03957L54.6544 9.45942C55.2044 9.56941 55.5343 10.1194 55.5343 10.5593C55.5343 11.1093 55.2044 11.6593 54.6544 11.7693L48.4947 14.0791L46.0749 20.3487C45.9649 20.7887 45.4149 21.1187 44.9749 21.1187C44.425 21.1187 43.875 20.7887 43.765 20.3487L41.4551 14.0791L35.1855 11.7693C34.7455 11.6593 34.4155 11.1093 34.4155 10.5593C34.4155 10.1194 34.7455 9.56941 35.1855 9.45942Z" fill="#3C51E2"/>
                  <path opacity="0.4" d="M5.21452 22.8817L6.92554 18.319C7.00701 17.9116 7.4144 17.6672 7.82178 17.6672C8.14769 17.6672 8.55508 17.9116 8.63655 18.319L10.429 22.8817L14.9918 24.6742C15.3991 24.7556 15.6436 25.163 15.6436 25.4889C15.6436 25.8963 15.3991 26.3037 14.9918 26.3852L10.429 28.0962L8.63655 32.7403C8.55508 33.0662 8.14769 33.3107 7.82178 33.3107C7.4144 33.3107 7.00701 33.0662 6.92554 32.7403L5.21452 28.0962L0.570338 26.3852C0.244431 26.3037 0 25.8963 0 25.4889C0 25.163 0.244431 24.7556 0.570338 24.6742L5.21452 22.8817Z" fill="#3C51E2"/>
                  <path d="M27.0839 17.6672L43.804 53.1412L26.561 47.8021L31.6504 44.7152L35.385 45.8817L27.0823 28.2685L19.7552 43.8142L29.0691 38.243L30.9827 42.2978L9.38818 55.2115L27.0839 17.6672Z" fill="#3C51E2"/>
                </svg>
              </div>
              
              {/* panel name */}
              <div 
                style={{ 
                  fontFamily: 'Product Sans, system-ui, sans-serif',
                fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: '1.2130000856187608em',
                  color: '#040D22',
                  textAlign: 'left'
              }}
            >
              {t('chat.title')}
              </div>
            </div>
          </div>
          
          {/* right */}
          <div 
            style={{ 
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0
            }}
          >
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
          justifyContent: hasSelectedInitialOption ? 'flex-start' : 'flex-end',
          gap: '20px',
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#FFFFFF',
          borderRadius: '25px',
          transition: 'justify-content 0.3s ease-in-out'
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
         
         {/* Render messages in chronological order: first messages at top, newest at bottom */}
         {messages.map((m, i) => {
           // Only show quick answers for the last assistant message, but never for the first assistant message
           const isLastAssistantMessage = m.role === "assistant" && 
             i === messages.length - 1;
           
           // Check if this is the first assistant message
           const firstAssistantIndex = messages.findIndex(msg => msg.role === "assistant");
           const isFirstAssistantMessage = m.role === "assistant" && 
             i === firstAssistantIndex;
           
           // Show quick answers only if it's the last assistant message AND not the first assistant message
           const shouldShowQuickAnswers = isLastAssistantMessage && !isFirstAssistantMessage;
           
           // Filter out selected quick answers so they disappear once chosen
           const availableQuickAnswers = shouldShowQuickAnswers && m.quickAnswers
             ? m.quickAnswers.filter(answer => !selectedQuickAnswers.includes(answer))
             : [];
           
           return (
            <div key={i} className="message-bubble-enter">
              <MessageBubble
                role={m.role}
                isAudio={!!(m.audioFile || m.audioUrl)}
                audioFile={m.audioFile}
                showCopyButton={m.role === "assistant"}
                quickAnswers={availableQuickAnswers}
                onQuickAnswerClick={shouldShowQuickAnswers ? handleQuickAnswerClick : undefined}
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
             <MessageBubble role="assistant" quickAnswers={[]} onQuickAnswerClick={undefined} selectedAnswers={[]} onAnswerSelect={undefined}>
               {""}
             </MessageBubble>
           </div>
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
