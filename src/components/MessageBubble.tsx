import React, { useState } from "react";
import Markdown from "react-markdown";

export function MessageBubble({
  role,
  children,
  isAudio = false,
  audioFile,
  audioStatus,
  showCopyButton = false,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  isAudio?: boolean;
  audioFile?: File;
  audioStatus?: 'uploading' | 'uploaded' | 'error';
  showCopyButton?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const base = "rounded-xl2 px-5 py-4 shadow-lg max-w-[80%] font-bold transition-all duration-200";
  const userClasses = "ml-auto text-white shadow-brand-200/50";
  const botClasses = "mr-auto bg-white text-gray-800 border border-brand-200 shadow-brand-100/30 hover:shadow-brand-200/40";
  
  const userStyle = {
    background: 'linear-gradient(135deg, #3C51E2 0%, #3041B5 100%)'
  };

  const getStatusColor = () => {
    switch (audioStatus) {
      case 'uploading': return 'text-yellow-600';
      case 'uploaded': return 'text-green-600';
      case 'error': return 'text-red-500';
      default: return role === "user" ? 'text-white/80' : 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (audioStatus) {
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Uploaded';
      case 'error': return 'Upload failed';
      default: return 'Audio • 0:00';
    }
  };

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
      console.error('Failed to copy text: ', err);
    }
  };
  
  return (
    <div className={`flex items-start gap-3 ${role === "user" ? "flex-row-reverse" : ""}`}>
      {/* Bot profile picture */}
      {role === "assistant" && (
        <div className="flex-shrink-0">
          <img 
            src="/mini.png" 
            alt="AirSaas Bot" 
            className="w-9 h-9 rounded-full border-brand-200 shadow-sm"
          />
        </div>
      )}
      
      {/* Message bubble */}
      <div 
        className={`${base} ${role === "user" ? userClasses : botClasses} ${isAudio ? 'flex flex-col gap-2' : ''} ${role === "assistant" ? 'group relative' : ''}`}
        style={role === "user" ? userStyle : undefined}
      >
        {isAudio && audioFile ? (
          <div className="flex flex-col gap-2">
            {/* Audio Player Container */}
            <div className={`relative p-2 rounded-lg ${
              role === "user" 
                ? "bg-transparent" 
                : "bg-transparent"
            }`}>
              {/* Audio Player */}
              <audio 
                controls 
                className="w-77 sm:w-80 md:w-96 h-10"
                src={getAudioUrl() || undefined}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
            
            {/* Status - Right aligned */}
            <div className="flex justify-end">
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        ) : (
          <div className={`markdown-content ${String(children).trim() === "" ? "thinking-message" : ""}`}>
            {String(children).trim() === "" ? (
              <span></span>
            ) : (
              <Markdown 
                components={{
              // Customize markdown components to match our design
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
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
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
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
        {role === "assistant" && showCopyButton && !isAudio && (
          <button
            onClick={copyToClipboard}
            className="absolute bottom-0.5 right-0.5 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Copy message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
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
  );
}
