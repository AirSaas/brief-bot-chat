import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Markdown from "react-markdown";

// Function to hide language instruction text between equals signs for display
const hideLanguageInstruction = (text: string): string => {
  return text.replace(/\s*=my language is English, let's keep this conversation completely in English=\s*/g, '')
             .replace(/\s*=ma langue est le français, gardons cette conversation entièrement en français=\s*/g, '');
};

export function MessageBubble({
  role,
  children,
  isAudio = false,
  audioFile,
  showCopyButton = false,
  quickAnswers = [],
  onQuickAnswerClick,
  onDownloadPDF,
  selectedAnswers = [],
  onAnswerSelect,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  isAudio?: boolean;
  audioFile?: File;
  showCopyButton?: boolean;
  quickAnswers?: string[];
  onQuickAnswerClick?: (answer: string) => void;
  onDownloadPDF?: () => void;
  selectedAnswers?: string[];
  onAnswerSelect?: (answer: string) => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [clickedAnswers, setClickedAnswers] = useState<Set<string>>(new Set());
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState("");
  const [hoveredAnswer, setHoveredAnswer] = useState<string | null>(null);
  const [hoveredSelectButton, setHoveredSelectButton] = useState<string | null>(null);
  
  const base =
    "px-3 sm:px-5 py-3 sm:py-4 max-w-[90%] sm:max-w-[80%] transition-all duration-200 message-bubble-mobile";
  const userClasses =
    "ml-auto bg-[#F8F9FF] text-black rounded-[10px] max-w-[400px] user-message-mobile";
  const botClasses = "mr-auto text-gray-800 bot-message-mobile";

  // Rotate thinking messages with rate limiting
  useEffect(() => {
    const isThinking = String(children).trim() === "";
    if (!isThinking) {
      setCurrentThinkingMessage("");
      return;
    }

    // Get thinking messages from translations
    const thinkingMessages = t('chat.thinking_messages', { returnObjects: true });
    
    // Default messages as fallback
    const defaultMessages = [
      "Analyzing your input...",
      "Understanding your needs...",
      "Thinking about your project...",
      "Organizing ideas...",
      "Structuring your brief...",
      "Connecting the dots...",
      "Polishing the details...",
      "Assembling the brief..."
    ];
    
    // Check if we got an array of messages and validate they're all strings
    let messages: string[] = defaultMessages;
    if (Array.isArray(thinkingMessages)) {
      const validMessages = thinkingMessages.filter((msg): msg is string => typeof msg === 'string');
      if (validMessages.length > 0) {
        messages = validMessages;
      }
    }

    // Set initial message
    const initialIndex = Math.floor(Math.random() * messages.length);
    setCurrentThinkingMessage(messages[initialIndex]);

    // Random interval between 1500ms and 4000ms for more varied timing
    const getRandomInterval = () => Math.floor(Math.random() * (2500 - 800 + 1)) + 800;

    let timeoutId: NodeJS.Timeout;
    let currentIndex = initialIndex;

    const rotateMessage = () => {
      // Get next random index different from current
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * messages.length);
      } while (nextIndex === currentIndex && messages.length > 1);
      
      currentIndex = nextIndex;
      setCurrentThinkingMessage(messages[nextIndex]);

      // Schedule next rotation with new random interval
      timeoutId = setTimeout(rotateMessage, getRandomInterval());
    };

    // Start first rotation after initial delay
    timeoutId = setTimeout(rotateMessage, getRandomInterval());

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [children, t]);

  const getAudioUrl = () => {
    if (audioFile) {
      return URL.createObjectURL(audioFile);
    }
    return null;
  };

  const copyToClipboard = async () => {
    try {
      const text = hideLanguageInstruction(String(children).trim());
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Hide after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <>
      {role === "user" ? (
        // User message - simple structure, full width
        <div 
          style={{ 
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            gap: '10px',
            alignSelf: 'stretch',
            width: '100%'
          }}
        >
          <div
            className={`${base} ${userClasses} ${
              isAudio ? "flex flex-col gap-2" : ""
            }`}
            style={{ padding: '20px', width: '400px' }}
          >
            {isAudio && audioFile ? (
              <div className="flex flex-col gap-2 min-h-[2rem] justify-center -my-4 -mx-4">
                {/* Audio Player Container */}
                <div className="relative p-2 rounded-lg bg-transparent">
                  {/* Audio Player */}
                  <audio
                    controls
                    className="w-77 sm:w-80 md:w-96 h-10"
                    src={getAudioUrl() || undefined}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            ) : (
              <div
                className={`markdown-content ${
                  String(children).trim() === "" ? "thinking-message" : ""
                }`}
                style={{
                  fontFamily: "Product Sans Light, system-ui, sans-serif",
                  fontWeight: 300,
                  fontSize: "14px",
                  lineHeight: "1.4285714285714286em",
                }}
              >
                {String(children).trim() === "" ? (
                  <div className="thinking-status-message">
                    {currentThinkingMessage || "Processing..."}
                  </div>
                ) : (
                  <Markdown
                    components={{
                      // Customize markdown components to match our design
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold mb-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-bold mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-base font-bold mb-2">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="ml-2">{children}</li>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-2">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {hideLanguageInstruction(String(children))}
                  </Markdown>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Bot message - vertical structure with quick answers
        <div className="space-y-3">
          {/* Message container */}
          <div 
            style={{ 
              display: 'flex',
              flexDirection: 'row',
              alignSelf: 'stretch',
              alignItems: 'flex-start',
              gap: '10px',
              width: '100%'
            }}
          >
            {/* logo */}
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '30px',
                height: '30px',
                gap: '10px',
                flexShrink: 0
              }}
            >
              <svg width="30" height="30" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <path opacity="0.4" d="M35.1855 9.45942L41.4551 7.03957L43.765 0.879946C43.875 0.32998 44.425 0 44.9749 0C45.4149 0 45.9649 0.32998 46.0749 0.879946L48.4947 7.03957L54.6544 9.45942C55.2044 9.56941 55.5343 10.1194 55.5343 10.5593C55.5343 11.1093 55.2044 11.6593 54.6544 11.7693L48.4947 14.0791L46.0749 20.3487C45.9649 20.7887 45.4149 21.1187 44.9749 21.1187C44.425 21.1187 43.875 20.7887 43.765 20.3487L41.4551 14.0791L35.1855 11.7693C34.7455 11.6593 34.4155 11.1093 34.4155 10.5593C34.4155 10.1194 34.7455 9.56941 35.1855 9.45942Z" fill="#3C51E2"/>
                <path opacity="0.4" d="M5.21452 22.8817L6.92554 18.319C7.00701 17.9116 7.4144 17.6672 7.82178 17.6672C8.14769 17.6672 8.55508 17.9116 8.63655 18.319L10.429 22.8817L14.9918 24.6742C15.3991 24.7556 15.6436 25.163 15.6436 25.4889C15.6436 25.8963 15.3991 26.3037 14.9918 26.3852L10.429 28.0962L8.63655 32.7403C8.55508 33.0662 8.14769 33.3107 7.82178 33.3107C7.4144 33.3107 7.00701 33.0662 6.92554 32.7403L5.21452 28.0962L0.570338 26.3852C0.244431 26.3037 0 25.8963 0 25.4889C0 25.163 0.244431 24.7556 0.570338 24.6742L5.21452 22.8817Z" fill="#3C51E2"/>
                <path d="M27.0839 17.6672L43.804 53.1412L26.561 47.8021L31.6504 44.7152L35.385 45.8817L27.0823 28.2685L19.7552 43.8142L29.0691 38.243L30.9827 42.2978L9.38818 55.2115L27.0839 17.6672Z" fill="#3C51E2"/>
              </svg>
            </div>

            {/* text */}
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: 1
              }}
            >
            {/* Message content */}
            <div
              className={`${base} ${botClasses} ${
                isAudio ? "flex flex-col gap-2" : ""
              } group relative bot-message-no-radius`}
                style={{ borderRadius: "0", width: '400px', paddingTop: '5px' }}
            >
              {isAudio && audioFile ? (
                <div className="flex flex-col gap-2">
                  {/* Audio Player Container */}
                  <div className="relative p-2 rounded-lg bg-transparent">
                    {/* Audio Player */}
                    <audio
                      controls
                      className="w-77 sm:w-80 md:w-96 h-10"
                      src={getAudioUrl() || undefined}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              ) : (
                <div
                  className={`markdown-content ${
                    String(children).trim() === "" ? "thinking-message" : ""
                  }`}
                  style={{
                    fontFamily: "Product Sans Light, system-ui, sans-serif",
                    fontWeight: 300,
                    fontSize: "14px",
                    lineHeight: "1.4285714285714286em",
                    color: "#000000"
                  }}
                >
                  {String(children).trim() === "" ? (
                    <div className="thinking-status-message">
                      {currentThinkingMessage || "Processing..."}
                    </div>
                  ) : (
                    <Markdown
                      components={{
                        // Customize markdown components to match our design
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mb-2">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold mb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-bold mb-2">
                            {children}
                          </h3>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-2 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-2 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="ml-2">{children}</li>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-2">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic">{children}</em>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {hideLanguageInstruction(String(children))}
                    </Markdown>
                  )}
                </div>
              )}

              {/* Copy button for assistant messages */}
              {showCopyButton && !isAudio && (
                <button
                  onClick={copyToClipboard}
                  className="absolute bottom-0.5 right-0.5 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Copy message"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              )}

              {/* Copy feedback */}
              {copied && (
                <div className="absolute bottom-0.5 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-md shadow-lg animate-fade-in-out">
                  Copied to Clipboard
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Quick Answers for bot messages */}
          {quickAnswers && quickAnswers.length > 0 && onQuickAnswerClick && (
            <div 
              style={{
                marginLeft: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                alignItems: 'flex-start',
                width: 'calc(100% - 30px)',
                maxWidth: 'calc(100% - 30px)'
              }}
            >
              {/* Separate regular and special buttons */}
              {(() => {
                // Separate buttons into regular and special
                const regularButtons: Array<{ answer: string; index: number }> = [];
                const specialButtons: Array<{ answer: string; index: number }> = [];
                const actionButtons: Array<{ answer: string; index: number }> = [];
                
                quickAnswers.forEach((answer, index) => {
                  const lowerAnswer = answer.toLowerCase();
                  const isCorrectButton = lowerAnswer === "everything is correct" || lowerAnswer === "tout est correct";
                  const isChangesButton = lowerAnswer.includes("i need to make") || 
                                         lowerAnswer.includes("i would like to make") ||
                                         lowerAnswer.includes("i need to make some changes") ||
                                         lowerAnswer.includes("je souhaite apporter") ||
                                         lowerAnswer.includes("j'aimerais faire") ||
                                         lowerAnswer.includes("des modifications");
                  
                  // Check for PDF or new brief action buttons
                  const isPDFButton = answer === "Download as PDF" || 
                                     answer === "Télécharger en PDF" || 
                                     answer === "Télécharger en tant que PDF" ||
                                     answer === "Télécharger au format PDF" ||
                                     answer === "Télécharger comme PDF";
                  const isNewBriefButton = answer === "Start a new brief" ||
                                          answer === "Commencer un nouveau brief" ||
                                          answer === "Create a new brief" ||
                                          answer === "Créer un nouveau brief";
                  
                  if (isCorrectButton || isChangesButton) {
                    specialButtons.push({ answer, index });
                  } else if (isPDFButton || isNewBriefButton) {
                    actionButtons.push({ answer, index });
                  } else {
                    regularButtons.push({ answer, index });
                  }
                });
                
                return (
                  <>
                    {/* Regular buttons - in column */}
                    {regularButtons.map(({ answer, index }) => {
                      // Check if it's a default button
                      const isDefaultButton = 
                        answer === "Generate other examples" ||
                        answer === "Skip this question" ||
                        answer === "Générer d'autres exemples" ||
                        answer === "Sauter cette question";
                      
                      const isClicked = clickedAnswers.has(answer);
                      const isSelected = selectedAnswers.includes(answer);
                      const isHovered = hoveredAnswer === answer;
                      
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            gap: '10px',
                            width: '100%',
                            alignSelf: 'stretch'
                          }}
                          onMouseEnter={() => !isClicked && setHoveredAnswer(answer)}
                          onMouseLeave={() => setHoveredAnswer(null)}
                        >
                          {/* wrapper */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignSelf: 'stretch',
                              gap: '5px',
                              background: isSelected ? '#E8EBFE' : (isHovered ? '#F3F3FC' : '#F8F9FF'),
                              border: '1px solid',
                              borderColor: isSelected || isHovered ? '#3C51E2' : 'transparent',
                              borderRadius: '10px',
                              flex: 1,
                              transition: 'all 0.2s ease',
                              boxSizing: 'border-box'
                            }}
                          >
                            {/* Cont */}
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: '10px 10px 10px 20px',
                                gap: '5px',
                                flex: 1
                              }}
                            >
                              {/* left */}
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: '5px',
                                  flex: 1
                                }}
                              >
                                {/* text */}
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    flex: 1
                                  }}
                                >
                                  {/* title */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: '5px',
                                      width: '100%'
                                    }}
                                  >
                                    <button
                          onClick={() => {
                            if (isClicked) {
                              return;
                            }
                            
                            setClickedAnswers(prev => new Set(prev).add(answer));
                            if (!isDefaultButton && onAnswerSelect) {
                              onAnswerSelect(answer);
                            }
                            onQuickAnswerClick(answer);
                          }}
                          disabled={isClicked}
                          style={{
                            fontFamily: 'Product Sans, system-ui, sans-serif',
                            fontWeight: 700,
                            fontSize: '14px',
                                        lineHeight: '1.2130000250680106em',
                            textAlign: 'left',
                            cursor: isClicked ? 'not-allowed' : 'pointer',
                                        background: 'transparent',
                                        border: 'none',
                            color: '#040D22',
                            opacity: isClicked && !isSelected ? 0.5 : 1,
                                        padding: 0,
                                        width: '100%'
                          }}
                        >
                          {answer}
                        </button>
                                  </div>
                                </div>
                              </div>
                              {/* Right - Always present to reserve space */}
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  justifyContent: 'flex-end',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '0px',
                                  flex: 'none',
                                  width: '60px',
                                  minWidth: '60px',
                                  opacity: isHovered && !isClicked ? 1 : 0,
                                  pointerEvents: isHovered && !isClicked ? 'auto' : 'none',
                                  transition: 'opacity 0.2s ease'
                                }}
                              >
                                {/* button-small */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDefaultButton && onAnswerSelect) {
                                      onAnswerSelect(answer);
                                    }
                                    onQuickAnswerClick(answer);
                                  }}
                                  onMouseEnter={() => setHoveredSelectButton(answer)}
                                  onMouseLeave={() => setHoveredSelectButton(null)}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '7px 14px',
                                    gap: '3px',
                                    isolation: 'isolate',
                                    width: '60px',
                                    height: '29px',
                                    background: hoveredSelectButton === answer ? '#061333' : '#3C51E2',
                                    border: '1px solid #3C51E2',
                                    borderRadius: '100px',
                                    flex: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  {/* state-layer */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'row',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      padding: '0px',
                                      gap: '5px',
                                      width: '32px',
                                      height: '15px',
                                      borderRadius: '100px',
                                      flex: 'none',
                                      zIndex: 0
                                    }}
                                  >
                                    {/* label-text */}
                                    <span
                                      style={{
                                        width: '32px',
                                        height: '15px',
                                        fontFamily: 'Product Sans Light, system-ui, sans-serif',
                                        fontStyle: 'normal',
                                        fontWeight: 300,
                                        fontSize: '12px',
                                        lineHeight: '1.2130000591278076em',
                                        color: '#FFFFFF',
                                        flex: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      Select
                                    </span>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Action buttons - in row */}
                    {actionButtons.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '5px',
                          alignItems: 'center',
                          marginTop: actionButtons.length > 0 && regularButtons.length > 0 ? '10px' : '0'
                        }}
                      >
                        {actionButtons.map(({ answer, index }) => {
                          const isPDFButton = answer === "Download as PDF" || 
                                             answer === "Télécharger en PDF" || 
                                             answer === "Télécharger en tant que PDF" ||
                                             answer === "Télécharger au format PDF" ||
                                             answer === "Télécharger comme PDF";
                          const isNewBriefButton = answer === "Start a new brief" ||
                                                  answer === "Commencer un nouveau brief" ||
                                                  answer === "Create a new brief" ||
                                                  answer === "Créer un nouveau brief";
                          
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (isPDFButton && onDownloadPDF) {
                                  onDownloadPDF();
                                } else if (isNewBriefButton && onQuickAnswerClick) {
                                  onQuickAnswerClick(answer);
                                }
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '8px 19px',
                                borderRadius: '100px',
                                fontFamily: 'Product Sans Light, system-ui, sans-serif',
                                fontWeight: 300,
                                fontSize: '16px',
                                lineHeight: '1.213em',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                background: isPDFButton ? '#3C51E2' : 'transparent',
                                border: isNewBriefButton ? '1px solid #3C51E2' : 'none',
                                color: isPDFButton ? '#FFFFFF' : '#3C51E2'
                              }}
                            >
                              {isPDFButton && (
                                <svg 
                                  width="19" 
                                  height="19" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="#FFFFFF" 
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ width: '19px', height: '19px' }}
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                  <path d="M16 13H8"/>
                                  <path d="M16 17H8"/>
                                  <path d="M10 9H8"/>
                                </svg>
                              )}
                              {isNewBriefButton && (
                                <svg 
                                  width="19" 
                                  height="19" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="#3C51E2" 
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ width: '19px', height: '19px' }}
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              )}
                              <span>{answer}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Special buttons - in row */}
                    {specialButtons.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '5px',
                          alignItems: 'center',
                          marginTop: specialButtons.length > 0 && regularButtons.length > 0 ? '10px' : '0'
                        }}
                      >
                        {specialButtons.map(({ answer, index }) => {
                          const lowerAnswer = answer.toLowerCase();
                          const isCorrectButton = lowerAnswer === "everything is correct" || lowerAnswer === "tout est correct";
                          const isChangesButton = lowerAnswer.includes("i need to make") || 
                                                 lowerAnswer.includes("i would like to make") ||
                                                 lowerAnswer.includes("i need to make some changes") ||
                                                 lowerAnswer.includes("je souhaite apporter") ||
                                                 lowerAnswer.includes("j'aimerais faire") ||
                                                 lowerAnswer.includes("des modifications");
                          
                          const isClicked = clickedAnswers.has(answer);
                          
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (isClicked) {
                                  return;
                                }
                                setClickedAnswers(prev => new Set(prev).add(answer));
                                if (onAnswerSelect) {
                                  onAnswerSelect(answer);
                                }
                                onQuickAnswerClick(answer);
                              }}
                              disabled={isClicked}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '7px 15px',
                                height: '29px',
                                borderRadius: '100px',
                                fontFamily: 'Product Sans Light, system-ui, sans-serif',
                                fontWeight: 300,
                                fontSize: '12px',
                                lineHeight: '12px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                cursor: isClicked ? 'not-allowed' : 'pointer',
                                background: isCorrectButton ? '#3C51E2' : 'transparent',
                                border: isChangesButton ? '1px solid #3C51E2' : 'none',
                                color: isCorrectButton ? '#FFFFFF' : '#3C51E2',
                                opacity: isClicked ? 0.5 : 1,
                                boxSizing: 'border-box'
                              }}
                            >
                              {isCorrectButton && (
                                <svg 
                                  width="19" 
                                  height="19" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="#FFFFFF" 
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ width: '19px', height: '19px' }}
                                >
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                              {isChangesButton && (
                                <svg 
                                  width="19" 
                                  height="19" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="#3C51E2" 
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ width: '19px', height: '19px' }}
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              )}
                              <span>{answer}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Fixed action buttons - only show if no PDF button exists and no completion buttons */}
              {!quickAnswers.some(answer => {
                const lowerAnswer = answer.toLowerCase();
                return answer === "Download as PDF" || 
                       answer === "Télécharger en PDF" || 
                       answer === "Télécharger en tant que PDF" ||
                       answer === "Télécharger au format PDF" ||
                       answer === "Télécharger comme PDF" ||
                       answer === "Start a new brief" ||
                       answer === "Commencer un nouveau brief" ||
                       answer === "Create a new brief" ||
                       answer === "Créer un nouveau brief" ||
                       lowerAnswer === "everything is correct" ||
                       lowerAnswer === "tout est correct";
              }) && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '5px',
                    alignItems: 'center',
                    marginTop: '10px'
                  }}
                >
                  {/* Generate other examples button - filled */}
                  <button
                    onClick={() => onQuickAnswerClick(t('chat.quick_answers.give_examples'))}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 15px',
                      height: '29px',
                      borderRadius: '100px',
                      background: '#3C51E2',
                      border: 'none',
                      fontFamily: 'Product Sans Light, system-ui, sans-serif',
                      fontWeight: 300,
                      fontSize: '12px',
                      lineHeight: '12px',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    <svg 
                      width="19" 
                      height="19" 
                      viewBox="0 0 19 19" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: '19px', height: '19px' }}
                    >
                      <path d="M12.875 9.875C13.4688 9.9375 13.6875 10.6562 13.2812 11.0938L10.9062 13.4062L11.4688 16.6875C11.5 16.875 11.4375 17.0938 11.2812 17.25C11.1562 17.4062 10.9688 17.5 10.75 17.5C10.625 17.5 10.5 17.4688 10.4062 17.4375L7.5 15.875L4.5625 17.4375C4.4375 17.5 4.34375 17.5 4.21875 17.5C4 17.5 3.8125 17.4062 3.6875 17.25C3.5625 17.0938 3.5 16.875 3.53125 16.6875L4.0625 13.4062L1.71875 11.0938C1.28125 10.6875 1.5 9.9375 2.09375 9.875L5.375 9.375L6.84375 6.40625C6.96875 6.15625 7.21875 6 7.46875 6C7.75 6 8 6.15625 8.125 6.40625L9.59375 9.375L12.875 9.875ZM9.8125 13.0625L12.1562 10.7812L8.9375 10.3125L7.5 7.375L6.03125 10.3125L2.8125 10.7812L5.125 13.0625L4.59375 16.2812L7.46875 14.75L10.375 16.2812L9.8125 13.0625ZM9.5 5C9.21875 5 9 4.78125 9 4.5C9 4.25 9.21875 4 9.5 4.03125L11.5 4V2C11.5 1.75 11.7188 1.5 12 1.5C12.25 1.5 12.5 1.75 12.5 2V4L14.5 4.03125C14.75 4.03125 15 4.25 15 4.5C15 4.78125 14.75 5 14.5 5H12.5V7C12.5 7.28125 12.25 7.5 12 7.5C11.7188 7.5 11.5 7.28125 11.5 7V5H9.5ZM17 8C17.25 8 17.5 8.25 17.5 8.53125C17.5 8.78125 17.25 9 17 9H16V10C16 10.2812 15.75 10.5312 15.5 10.5312C15.2188 10.5312 15 10.2812 15 10V9H14C13.7188 9 13.5 8.78125 13.5 8.53125C13.5 8.25 13.7188 8 14 8H15V7C15 6.75 15.25 6.53125 15.5 6.53125C15.75 6.53125 16 6.75 16 7V8H17Z" fill="white"/>
                    </svg>
                    <span>{t('chat.quick_answers.give_examples')}</span>
                  </button>
                  
                  {/* Skip this question button - outlined */}
                  <button
                    onClick={() => onQuickAnswerClick(t('chat.quick_answers.skip_question'))}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 15px',
                      height: '29px',
                      borderRadius: '100px',
                      background: 'transparent',
                      border: '1px solid #3C51E2',
                      fontFamily: 'Product Sans Light, system-ui, sans-serif',
                      fontWeight: 300,
                      fontSize: '12px',
                      lineHeight: '12px',
                      color: '#3C51E2',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    <svg 
                      width="19" 
                      height="19" 
                      viewBox="0 0 19 19" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: '19px', height: '19px' }}
                    >
                      <path d="M7.15625 8.40625L2.5 4.5V14.5312L7.15625 10.625C7.375 10.4375 7.6875 10.4688 7.875 10.6875C8.03125 10.9062 8 11.2188 7.8125 11.375L3.03125 15.3125C2.875 15.4375 2.65625 15.5 2.4375 15.5C1.9375 15.5 1.5 15.0938 1.5 14.5V4.53125C1.5 3.9375 1.9375 3.5 2.4375 3.5C2.65625 3.5 2.875 3.59375 3.03125 3.71875L7.8125 7.65625C8 7.8125 8.03125 8.125 7.875 8.34375C7.6875 8.5625 7.375 8.59375 7.15625 8.40625ZM17.125 8.71875C17.3438 8.90625 17.5 9.21875 17.5 9.5C17.5 9.8125 17.3438 10.125 17.125 10.3438L11.0312 15.3125C10.875 15.4375 10.6562 15.5 10.4375 15.5C10.125 15.5 9.5 15.25 9.5 14.5V4.53125C9.5 3.78125 10.125 3.5 10.4375 3.5C10.6562 3.5 10.875 3.59375 11.0312 3.75L17.125 8.71875ZM10.5 14.5312L16.4688 9.5L10.5 4.5V14.5312Z" fill="#3C51E2"/>
                    </svg>
                    <span>{t('chat.quick_answers.skip_question')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
