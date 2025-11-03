import { useEffect, useState, useRef, useCallback, useMemo } from "react";

interface InputWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendDirectly: (message: string) => void;
  placeholder: string;
  disabled: boolean;
  isThinking: boolean;
  suggestions?: string[];
  onHeightChange?: () => void;
  onRef?: (ref: { setCursorToEnd: () => void }) => void;
  onRecorded?: (file: File) => Promise<void>;
  isRecording?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  hasSelectedInitialOption?: boolean;
}

export default function InputWithSuggestions({
  value,
  onChange,
  onSend,
  onSendDirectly,
  placeholder,
  disabled,
  isThinking,
  suggestions = ["Donnez-moi des exemples", "Sauter cette question"],
  onHeightChange,
  onRef,
  onRecorded,
  isRecording: externalIsRecording,
  onRecordingStateChange,
  hasSelectedInitialOption = false
}: InputWithSuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverRecord, setHoverRecord] = useState(false);
  const [hoverSend, setHoverSend] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localIsRecording, setLocalIsRecording] = useState(false);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  
  const isRecording = externalIsRecording ?? localIsRecording;

  // Audio recording functionality
  useEffect(() => {
    return () => { 
      if (rec?.state === 'recording') {
        rec.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [rec, stream]);

  // Always notify parent when recording state changes
  // The parent (ChatWindow) manages the state
  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

  async function startRecording() {
    try {
      // Always notify parent first to update external state immediately
      if (onRecordingStateChange) {
        onRecordingStateChange(true);
      }
      // Also update local state in case external state is not provided
      setLocalIsRecording(true);
      
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      const mr = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      chunks.current = []; // Clear previous chunks
      
      mr.ondataavailable = (e) => { 
        if (e.data.size > 0) {
          chunks.current.push(e.data); 
        }
      };
      
      mr.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        chunks.current = [];
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all tracks
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        
        // Update recording state - always notify parent
        if (onRecordingStateChange) {
          onRecordingStateChange(false);
        }
        setLocalIsRecording(false);
        setRec(null);
        
        if (onRecorded && blob.size > 0) {
          await onRecorded(file);
        }
      };
      
      mr.start();
      setRec(mr);
    } catch (error) {
      console.error('Error starting recording:', error);
      if (onRecordingStateChange) {
        onRecordingStateChange(false);
      }
      setLocalIsRecording(false);
      setStream(null);
    }
  }

  function stopRecording() {
    if (rec && rec.state === 'recording') {
      rec.stop();
      // The onstop handler will clean up everything
    }
  }

  // Disable suggestions for now
  const suggestionsEnabled = false;

  // Function to set cursor to end of textarea
  const setCursorToEnd = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
      textarea.focus();
    }
  }, []);

  // Expose the setCursorToEnd function to parent component
  useEffect(() => {
    if (onRef) {
      onRef({ setCursorToEnd });
    }
  }, [onRef, setCursorToEnd]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const previousHeight = textarea.style.height;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (content height)
      const maxHeight = 120; // Max height 120px (~4 lines)
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Enable scroll when content exceeds max height
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
      
      // Notify parent if height changed
      if (previousHeight !== `${newHeight}px` && onHeightChange) {
        onHeightChange();
      }
    }
  }, [onHeightChange]);

  // Adjust height when value changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  // Function to handle input debounce
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    // Clear previous timeout
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
    
    // If suggestions are enabled and there's text, show suggestions after 1 second of pause
    if (suggestionsEnabled && inputValue.trim().length > 0) {
      const timeout = setTimeout(() => {
        setShowSuggestions(true);
      }, 1000);
      setInputTimeout(timeout);
    } else {
      // If no text or suggestions disabled, hide suggestions immediately
      setShowSuggestions(false);
    }
  };

  // Function to show suggestions after 4 seconds of inactivity
  const startInactivityTimer = () => {
    if (!suggestionsEnabled) return;
    
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowSuggestions(true);
    }, 4000);
    setInputTimeout(timeout);
  };

  // Function to handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
    
    // Send message directly
    onSendDirectly(suggestion);
  };

  // Function to hide suggestions
  const hideSuggestions = () => {
    setShowSuggestions(false);
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
    };
  }, [inputTimeout]);

  // Determine input state
  const isInputDisabled = disabled || isThinking || isRecording;
  const isRecordDisabled = (disabled || isThinking || !hasSelectedInitialOption || value.trim().length > 0) && !isRecording;
  const isSendDisabled = isThinking || !value.trim() || isRecording;

  // Get input container styles based on state
  const getInputContainerStyle = () => {
    if (isInputDisabled || isRecording) {
      return {
        background: '#F3F3FC', // Primary 5
        border: 'none'
      };
    }
    if (isFocused) {
      return {
        background: '#FFFFFF', // White
        border: '1px solid #3C51E2' // Primary
      };
    }
    if (isHovered) {
      return {
        background: '#F3F3FC', // Primary 5
        border: '1px solid #3C51E2' // Primary
      };
    }
    return {
      background: '#F3F3FC', // Primary 5
      border: 'none'
    };
  };

  // Get record button styles - use useMemo to recalculate when dependencies change
  const recordButtonStyle = useMemo(() => {
    const recording = isRecording || localIsRecording;
    if (recording) {
      // When recording, button is Stop button with Warning color
      // According to Figma, it should have hover state when recording
      if (hoverRecord) {
        return {
          background: '#FF0A55', // Warning (same, but could be darker on hover if needed)
          color: '#FFFFFF',
          iconColor: '#FAFAFB' // Secondary 2
        };
      }
      return {
        background: '#FF0A55', // Warning
        color: '#FFFFFF',
        iconColor: '#FAFAFB' // Secondary 2
      };
    }
    if (hoverRecord) {
      return {
        background: '#061333', // Secondary
        color: '#FFFFFF',
        iconColor: '#FFFFFF'
      };
    }
    return {
      background: '#E8EBFE', // Primary 10
      color: '#3C51E2', // Primary
      iconColor: '#3C51E2' // Primary
    };
  }, [isRecording, localIsRecording, hoverRecord]);

  // Get send button styles - use useMemo to recalculate when dependencies change
  const sendButtonStyle = useMemo(() => {
    if (isSendDisabled) {
      return {
        background: '#F3F3FC', // Primary 5
        color: '#8D94A3', // Secondary 50
        iconColor: '#8D94A3' // Secondary 50
      };
    }
    if (hoverSend) {
      return {
        background: '#061333', // Secondary
        color: '#FFFFFF',
        iconColor: '#FFFFFF'
      };
    }
    return {
      background: '#3C51E2', // Primary
      color: '#FFFFFF',
      iconColor: '#FFFFFF'
    };
  }, [isSendDisabled, hoverSend]);

  return (
    <div className="flex flex-col gap-[5px] w-full max-w-full">
      {/* Text field container */}
      <div 
        className="flex flex-col w-full max-w-full"
        style={{
          gap: '10px',
          borderRadius: '10px',
          ...getInputContainerStyle()
        }}
        onMouseEnter={() => !isInputDisabled && !isRecording && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Input text area */}
        <div 
          className="flex flex-row"
          style={{
            padding: '8px 15px',
            gap: '5px',
            borderRadius: '4px 4px 0px 0px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <textarea
              ref={textareaRef}
              rows={1}
              tabIndex={1}
              className={`w-full resize-none outline-none ${isInputDisabled && !isRecording ? 'input-disabled' : ''}`}
              style={{ 
                fontFamily: 'Product Sans Light, system-ui, sans-serif', 
                fontWeight: 300,
                fontSize: '16px',
                lineHeight: '1.2130000591278076em',
                color: isInputDisabled && !isRecording ? '#A6AAB6' : '#061333', // Secondary 40 when disabled, Secondary when enabled
                background: 'transparent',
                border: 'none',
                padding: 0,
                minHeight: 'auto',
                transition: 'height 0.2s ease-in-out',
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E0 transparent'
              }}
              placeholder={placeholder}
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isThinking && !isRecording) {
                    onSend();
                  }
                }
                if (e.key === "Escape") {
                  hideSuggestions();
                }
              }}
              onFocus={() => {
                setIsFocused(true);
                if (suggestionsEnabled && value.trim().length > 0) {
                  setShowSuggestions(true);
                } else if (suggestionsEnabled) {
                  // Start inactivity timer when user focuses
                  startInactivityTimer();
                }
              }}
              onBlur={() => {
                setIsFocused(false);
                // Small delay to allow clicking on suggestions
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 200);
              }}
              disabled={isInputDisabled}
            />
          </div>
        </div>

        {/* Actions bottom */}
        <div
          className="flex flex-row justify-end md:justify-between items-center"
          style={{
            padding: '0px 10px 6px 15px',
            borderRadius: '0px 0px 10px 10px'
          }}
        >
          {/* Empty space on left - only on desktop */}
          <div className="hidden md:block" style={{ flex: 1 }} />
          
          {/* Buttons container */}
          <div
            className="flex flex-row justify-end items-center gap-2 md:gap-[5px]"
          >
            {/* Record button - button-small */}
            {(!isRecording && !localIsRecording) ? (
              <button
                onClick={startRecording}
                disabled={isRecordDisabled}
                onMouseEnter={() => setHoverRecord(true)}
                onMouseLeave={() => setHoverRecord(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  padding: '7px 14px',
                  gap: '8px',
                  width: '88px',
                  height: '30px',
                  background: recordButtonStyle.background,
                  borderRadius: '100px',
                  flex: 'none',
                  cursor: isRecordDisabled ? 'not-allowed' : 'pointer',
                  border: 'none',
                  opacity: isRecordDisabled ? 0.5 : 1,
                  transition: 'background-color 0.2s ease'
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
                    width: '60px',
                    height: '16px',
                    borderRadius: '100px',
                    flex: 'none'
                }}
              >
                  {/* icons/small-icon */}
                <svg 
                    width="14" 
                    height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={recordButtonStyle.iconColor} 
                  strokeWidth="2"
                    style={{
                      width: '14px',
                      height: '14px',
                      flex: 'none'
                    }}
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                  {/* label-text */}
                  <span
                    style={{
                      width: '41px',
                      height: '16px',
                      fontFamily: 'Product Sans Light, system-ui, sans-serif',
                      fontStyle: 'normal',
                      fontWeight: 300,
                      fontSize: '13.2571px',
                      lineHeight: '16px',
                      color: recordButtonStyle.color,
                      flex: 'none'
                    }}
                  >
                    Record
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                onMouseEnter={() => setHoverRecord(true)}
                onMouseLeave={() => setHoverRecord(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  padding: '7px 14px',
                  gap: '8px',
                  width: '88px',
                  height: '30px',
                  background: recordButtonStyle.background,
                  borderRadius: '100px',
                  flex: 'none',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background-color 0.2s ease'
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
                    width: '60px',
                    height: '16px',
                    borderRadius: '100px',
                    flex: 'none'
                }}
              >
                  {/* icons/small-icon */}
                <svg 
                    width="14" 
                    height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={recordButtonStyle.iconColor} 
                  strokeWidth="2"
                    style={{
                      width: '14px',
                      height: '14px',
                      flex: 'none'
                    }}
                >
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                  {/* label-text */}
                  <span
                    style={{
                      width: '41px',
                      height: '16px',
                      fontFamily: 'Product Sans Light, system-ui, sans-serif',
                      fontStyle: 'normal',
                      fontWeight: 300,
                      fontSize: '13.2571px',
                      lineHeight: '16px',
                      color: recordButtonStyle.color,
                      flex: 'none'
                    }}
                  >
                    Stop
                  </span>
                </div>
              </button>
            )}

            {/* Send button - icon-button-small */}
            <button
              onClick={onSend}
              disabled={isSendDisabled}
              onMouseEnter={() => !isSendDisabled && setHoverSend(true)}
              onMouseLeave={() => setHoverSend(false)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '7px',
                isolation: 'isolate',
                width: '29px',
                height: '29px',
                background: sendButtonStyle.background,
                borderRadius: '100px',
                flex: 'none',
                cursor: isSendDisabled ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'background-color 0.2s ease'
              }}
            >
              {/* container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px',
                  width: '15px',
                  height: '15px',
                  flex: 'none',
                  zIndex: 0
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
                    width: '15px',
                    height: '15px',
                    flex: 'none',
                    zIndex: 0
              }}
            >
                  {/* icons/small-icon */}
              <svg 
                    width="14" 
                    height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={sendButtonStyle.iconColor} 
                    strokeWidth="2" 
                    style={{
                      width: '14px',
                      height: '14px',
                      flex: 'none',
                      transform: 'rotate(45deg)'
                    }}
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Help suggestions */}
      {suggestionsEnabled && showSuggestions && !isThinking && suggestions.length > 0 && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 z-20 suggestions-container">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700 whitespace-nowrap hover:scale-105 suggestions-button"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
