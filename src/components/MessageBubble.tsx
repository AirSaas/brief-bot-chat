import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Markdown from "react-markdown";

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
  
  const base =
    "px-3 sm:px-5 py-3 sm:py-4 max-w-[90%] sm:max-w-[80%] transition-all duration-200";
  const userClasses =
    "ml-auto bg-[#F8F9FF] text-black rounded-[10px] p-5 max-w-[400px]";
  const botClasses = "mr-auto text-gray-800";

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
      const text = String(children).trim();
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
        <div className="flex flex-row-reverse items-start gap-2 sm:gap-3">
          <div
            className={`${base} ${userClasses} ${
              isAudio ? "flex flex-col gap-2" : ""
            }`}
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
                    {String(children)}
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
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Bot profile picture */}
            <div className="flex-shrink-0">
              <img
                src="/mini.png"
                alt="AirSaas Bot"
                className="w-7 h-7 sm:w-9 sm:h-9"
              />
            </div>

            {/* Message content */}
            <div
              className={`${base} ${botClasses} ${
                isAudio ? "flex flex-col gap-2" : ""
              } group relative bot-message-no-radius`}
              style={{ borderRadius: "0" }}
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
                      {String(children)}
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

          {/* Quick Answers for bot messages */}
          {quickAnswers && quickAnswers.length > 0 && onQuickAnswerClick && (
            <div className="ml-12 sm:ml-14 flex flex-wrap gap-2">
              {/* Default options - no feedback visual */}
              <button
                onClick={() => onQuickAnswerClick(t('chat.quick_answers.give_examples'))}
                className="px-3 py-1.5 text-xs font-medium transition-colors duration-200 bg-gray-200 border border-gray-300 text-gray-800 hover:bg-gray-300"
                style={{ borderRadius: "3px" }}
              >
                {t('chat.quick_answers.give_examples')}
              </button>
              <button
                onClick={() => onQuickAnswerClick(t('chat.quick_answers.skip_question'))}
                className="px-3 py-1.5 text-xs font-normal transition-colors duration-200 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                style={{ borderRadius: "3px" }}
              >
                {t('chat.quick_answers.skip_question')}
              </button>


              {/* Dynamic quick answers from bot */}
              {quickAnswers.map((answer, index) => {
                // Check if button is a PDF download button (English and French variations)
                const isPDFButton = answer === "Download as PDF" || 
                                   answer === "Télécharger en PDF" || 
                                   answer === "Télécharger en tant que PDF" ||
                                   answer === "Télécharger au format PDF" ||
                                   answer === "Télécharger comme PDF";
                
                // Check if it's a default button
                const isDefaultButton = 
                  answer === "Give me examples" ||
                  answer === "Skip this question" ||
                  answer === "Donnez-moi des exemples" ||
                  answer === "Sauter cette question";
                
                const isClicked = clickedAnswers.has(answer);
                const isSelected = selectedAnswers.includes(answer);
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      // Prevent click if already clicked (except for PDF buttons)
                      if (!isPDFButton && isClicked) {
                        return;
                      }
                      
                      if (isPDFButton && onDownloadPDF) {
                        onDownloadPDF();
                      } else {
                        setClickedAnswers(prev => new Set(prev).add(answer));
                        // If it's not a default button and not a PDF button, mark it as selected
                        if (!isDefaultButton && !isPDFButton && onAnswerSelect) {
                          onAnswerSelect(answer);
                        }
                        onQuickAnswerClick(answer);
                      }
                    }}
                    disabled={!isPDFButton && isClicked}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      isPDFButton
                        ? 'bg-[#3C51E2] text-white hover:bg-[#3041B5]'
                        : isSelected
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-500'
                        : isClicked && !isSelected
                        ? 'bg-gray-100 border border-gray-400 text-gray-500 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-2 hover:border-blue-500 hover:text-blue-700'
                    }`}
                    style={{ borderRadius: "3px" }}
                  >
                    {answer}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
