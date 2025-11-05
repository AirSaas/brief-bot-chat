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
  onGoBack?: () => void;
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
  setHasSelectedInitialOption: externalSetHasSelectedInitialOption,
  onGoBack
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

  const handleGoBack = () => {
    // If onGoBack callback is provided, use it to hide chat and show homepage
    if (onGoBack) {
      onGoBack();
    } else {
      // Fallback to browser history
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    }
  };

  const handleCopyChat = () => {
    // Copy all chat messages to clipboard
    const chatText = messages.map(m => {
      if (m.role === 'user') {
        return `User: ${m.content}`;
      } else {
        return `Assistant: ${m.content}`;
      }
    }).join('\n\n');
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(chatText);
    }
  };

  return (
    <div className={`h-full flex flex-col bg-white mobile-chat-container chat-window-mobile mobile-safe-area ${isKeyboardOpen ? 'mobile-keyboard-adjust' : ''}`}>
      {/* Mobile Top Header - Back and Copy buttons */}
      <div className="md:hidden flex flex-col bg-white" style={{ padding: '10px 20px', borderBottom: '1px solid #D2D6DC' }}>
        <div className="flex flex-row justify-between items-center w-full" style={{ gap: '5px' }}>
          {/* Back button */}
          <button
            onClick={handleGoBack}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px',
              width: '35px',
              height: '35px',
              background: 'transparent',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E8EBFE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '19px',
                height: '19px'
              }}
            >
              <svg 
                width="19" 
                height="19" 
                viewBox="0 0 19 19" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: '19px',
                  height: '19px',
                  flex: 'none'
                }}
              >
                <path d="M16.5 9.5C16.5 9.78125 16.25 10 15.9688 10H4.1875L8.5625 14.6875C8.75 14.875 8.75 15.1875 8.53125 15.375C8.4375 15.4688 8.3125 15.5 8.1875 15.5C8.03125 15.5 7.90625 15.4688 7.8125 15.3438L2.625 9.84375C2.4375 9.65625 2.4375 9.375 2.625 9.1875L7.8125 3.6875C8 3.46875 8.3125 3.46875 8.53125 3.65625C8.75 3.84375 8.75 4.15625 8.5625 4.34375L4.1875 9H15.9688C16.25 9 16.5 9.25 16.5 9.5Z" fill="#3C51E2"/>
              </svg>
            </div>
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopyChat}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px',
              width: '35px',
              height: '35px',
              background: 'transparent',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E8EBFE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '19px',
                height: '19px'
              }}
            >
              <svg 
                width="19" 
                height="19" 
                viewBox="0 0 19 19" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: '19px',
                  height: '19px',
                  flex: 'none'
                }}
              >
                <path d="M10 14.5C10.25 14.5 10.5 14.75 10.5 15V15.5C10.5 16.625 9.59375 17.5 8.5 17.5H3.5C2.375 17.5 1.5 16.625 1.5 15.5L1.46875 7.5C1.46875 6.40625 2.375 5.5 3.46875 5.5H7C7.25 5.5 7.5 5.75 7.5 6C7.5 6.28125 7.25 6.5 7 6.5H3.5C2.9375 6.5 2.5 6.96875 2.5 7.5V15.5C2.5 16.0625 2.9375 16.5 3.5 16.5H8.5C9.03125 16.5 9.5 16.0625 9.5 15.5V15C9.5 14.75 9.71875 14.5 10 14.5ZM17.1875 4.21875C17.375 4.40625 17.5 4.65625 17.5 4.9375V11.5C17.5 12.625 16.5938 13.5 15.5 13.5H10.5C9.375 13.5 8.5 12.625 8.5 11.5V3.5C8.5 2.40625 9.375 1.5 10.5 1.5H14.0625C14.3438 1.5 14.5938 1.625 14.7812 1.8125L17.1875 4.21875ZM14.5 2.9375V4.5H16.0625L14.5 2.9375ZM16.5 11.5V5.5H14.5C13.9375 5.5 13.5 5.0625 13.5 4.5V2.5H10.5C9.9375 2.5 9.5 2.96875 9.5 3.5V11.5C9.5 12.0625 9.9375 12.5 10.5 12.5H15.5C16.0312 12.5 16.5 12.0625 16.5 11.5Z" fill="#3C51E2"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <header className="bg-white flex flex-col" style={{ padding: '10px 20px 10px 21px' }}>
        {/* Cont */}
        <div 
          style={{ 
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'stretch'
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
                gap: '10px'
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
                  flexShrink: 0,
                  padding: '1.74px 0px'
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
          overflowX: 'hidden',
          padding: '10px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: hasSelectedInitialOption ? 'flex-start' : 'flex-end',
          gap: '20px',
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#FFFFFF',
          borderRadius: '25px',
          transition: 'justify-content 0.3s ease-in-out',
          boxSizing: 'border-box',
          width: '100%'
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

      <footer className="bg-transparent chat-footer-mobile" style={{ padding: '0px 20px 20px' }}>
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
