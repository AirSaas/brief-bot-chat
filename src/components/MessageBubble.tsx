import React, { useState } from "react";
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
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  isAudio?: boolean;
  audioFile?: File;
  showCopyButton?: boolean;
  quickAnswers?: string[];
  onQuickAnswerClick?: (answer: string) => void;
  onDownloadPDF?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const base =
    "px-3 sm:px-5 py-3 sm:py-4 max-w-[90%] sm:max-w-[80%] transition-all duration-200";
  const userClasses =
    "ml-auto bg-[#F8F9FF] text-black rounded-[10px] p-5 max-w-[400px]";
  const botClasses = "mr-auto text-gray-800";

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
                  <span></span>
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
                    <span></span>
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
            <div className="ml-11 flex flex-wrap gap-2">
              {/* Default options */}
              <button
                onClick={() => onQuickAnswerClick("Give me examples")}
                className="px-3 py-1.5 text-xs font-medium transition-colors duration-200 bg-gray-200 border border-gray-300 text-gray-800 hover:bg-gray-300"
                style={{ borderRadius: "3px" }}
              >
                Give me examples
              </button>
              <button
                onClick={() => onQuickAnswerClick("Skip this question")}
                className="px-3 py-1.5 text-xs font-normal transition-colors duration-200 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                style={{ borderRadius: "3px" }}
              >
                Skip this question
              </button>


              {/* Dynamic quick answers from bot */}
              {quickAnswers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (answer === "Download as PDF" && onDownloadPDF) {
                      onDownloadPDF();
                    } else {
                      onQuickAnswerClick(answer);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    answer === "Download as PDF"
                      ? 'bg-[#3C51E2] text-white hover:bg-[#3041B5]'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={{ borderRadius: "3px" }}
                >
                  {answer}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
