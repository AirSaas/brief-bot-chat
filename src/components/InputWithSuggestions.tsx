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
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const mobileTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const desktopTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const setMobileTextareaRef = useCallback((element: HTMLTextAreaElement | null) => {
    mobileTextareaRef.current = element;
  }, []);
  const setDesktopTextareaRef = useCallback((element: HTMLTextAreaElement | null) => {
    desktopTextareaRef.current = element;
  }, []);
  const getActiveTextarea = useCallback(() => {
    return isMobileView ? mobileTextareaRef.current : desktopTextareaRef.current;
  }, [isMobileView]);
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
    const textarea = getActiveTextarea();
    if (textarea) {
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
      textarea.focus();
    }
  }, [getActiveTextarea]);

  // Expose the setCursorToEnd function to parent component
  useEffect(() => {
    if (onRef) {
      onRef({ setCursorToEnd });
    }
  }, [onRef, setCursorToEnd]);

  useEffect(() => {
    const updateView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    updateView();
    window.addEventListener('resize', updateView);
    return () => window.removeEventListener('resize', updateView);
  }, []);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = getActiveTextarea();
    if (textarea) {
      const currentHeightPx = `${textarea.offsetHeight}px`;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (content height)
      // Allow expansion up to 200px on mobile, 120px on desktop
      const isMobile = isMobileView;
      const maxHeight = isMobile ? 320 : 220; // Max height 320px on mobile (~10-11 lines), 220px on desktop (~7-8 lines)
      const baseMobileMinHeight = 35;
      const expandedMobileMinHeight = 72;
      
      // Get the actual scroll height
      const scrollHeight = textarea.scrollHeight;
      const shouldExpandMobile = isMobile && scrollHeight > baseMobileMinHeight + 2; // allow slight tolerance for rounding
      const minHeight = isMobile ? (shouldExpandMobile ? expandedMobileMinHeight : baseMobileMinHeight) : 28; // Ensure a taller base height on mobile/desktop
      const boundedHeight = Math.min(scrollHeight, maxHeight);
      const newHeight = Math.max(boundedHeight, minHeight);
      const newHeightPx = `${newHeight}px`;
      const hasHeightChanged = currentHeightPx !== newHeightPx;

      const applyFinalHeight = () => {
        textarea.style.height = newHeightPx;
        if (scrollHeight > maxHeight) {
          textarea.style.overflowY = 'auto';
          textarea.style.maxHeight = `${maxHeight}px`;
        } else {
          textarea.style.overflowY = 'hidden';
          textarea.style.maxHeight = 'none';
        }
        if (hasHeightChanged && onHeightChange) {
          onHeightChange();
        }
      };

      if (hasHeightChanged) {
        textarea.style.height = currentHeightPx;
        requestAnimationFrame(() => {
          applyFinalHeight();
        });
      } else {
        applyFinalHeight();
      }
      
      if (isMobile) {
        if (isMobileExpanded !== shouldExpandMobile) {
          setIsMobileExpanded(shouldExpandMobile);
        }
      } else if (isMobileExpanded) {
        setIsMobileExpanded(false);
      }
      
    }
  }, [getActiveTextarea, isMobileView, onHeightChange, isMobileExpanded]);

  // Re-adjust height on window resize (for mobile/desktop switch)
  useEffect(() => {
    const handleResize = () => {
      adjustTextareaHeight();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustTextareaHeight]);

  // Adjust height when value changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  useEffect(() => {
    if (!isMobileView) {
      return;
    }
    if (!isFocused && !isHovered && !value.trim()) {
      setIsMobileExpanded(false);
    }
  }, [isMobileView, isFocused, isHovered, value]);

  useEffect(() => {
    if (isMobileView) {
      adjustTextareaHeight();
    }
  }, [isMobileExpanded, isMobileView, adjustTextareaHeight]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [isMobileView, adjustTextareaHeight]);

  // Function to handle input debounce
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    requestAnimationFrame(() => {
      adjustTextareaHeight();
    });
    
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
        border: '1px solid #F3F3FC', // Same color as background to prevent jump
        outline: 'none'
      };
    }
    if (isFocused) {
      return {
        background: '#FFFFFF', // White
        border: '1px solid #3C51E2', // Primary
        outline: 'none'
      };
    }
    if (isHovered) {
      return {
        background: '#F3F3FC', // Primary 5
        border: '1px solid #3C51E2', // Primary
        outline: 'none'
      };
    }
    return {
      background: '#F3F3FC', // Primary 5
      border: '1px solid #F3F3FC', // Same color as background to prevent jump
      outline: 'none'
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
    <div className="flex flex-col md:flex-col gap-[5px] w-full max-w-full">
      {/* Mobile: Horizontal layout - Text field and buttons in same row */}
      <div className="flex md:hidden flex-row items-start gap-[5px] w-full">
        {/* Text field container */}
        <div 
          className="flex flex-col flex-1"
          style={{
            borderRadius: isMobileExpanded ? '10px' : '100px',
            minHeight: 'auto',
            maxHeight: 'none',
            ...getInputContainerStyle()
          }}
          onMouseEnter={() => {
            if (!isInputDisabled && !isRecording) {
              setIsHovered(true);
            }
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            if (!isFocused && !value.trim()) {
              setIsMobileExpanded(false);
            }
          }}
        >
          {/* Input text area */}
          <div 
            className="relative flex flex-row items-stretch"
            style={{
              padding: '8px 15px',
              gap: '4px',
              borderRadius: isMobileExpanded ? '10px' : '100px',
              justifyContent: 'stretch',
              alignSelf: 'stretch',
              minHeight: 'auto',
              maxHeight: 'none',
              height: isMobileExpanded ? 'auto' : '35px'
            }}
          >
            {isMobileView && !isMobileExpanded && !value && (
              <span
                className="absolute left-[15px] top-1/2 -translate-y-1/2 pointer-events-none w-[calc(100%-30px)] truncate text-[16px] leading-[19px] font-light text-[#A6AAB6]"
              >
                {placeholder}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', flex: 1, minHeight: 'auto' }}>
              <textarea
                ref={setMobileTextareaRef}
                rows={isMobileExpanded ? 3 : 1}
                tabIndex={1}
                className={`w-full resize-none outline-none will-change-[height] motion-reduce:transition-none !transition-[height] !duration-300 !ease-in-out ${isInputDisabled && !isRecording ? 'input-disabled' : ''} ${isMobileExpanded ? '!min-h-[72px]' : '!min-h-[35px]'} ${isMobileView && !isMobileExpanded && !value ? 'overflow-hidden text-ellipsis whitespace-nowrap' : 'whitespace-pre-wrap'}`}
                style={{ 
                  fontFamily: 'Product Sans Light, system-ui, sans-serif', 
                  fontWeight: 300,
                  fontSize: '16px',
                  lineHeight: '19px',
                  color: isInputDisabled && !isRecording ? '#A6AAB6' : '#061333',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  height: 'auto',
                  paddingTop: isMobileView && !isMobileExpanded ? '8px' : 0,
                  paddingBottom: isMobileView && !isMobileExpanded ? '8px' : 0,
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E0 transparent',
                  textAlign: 'left',
                  verticalAlign: 'middle'
                }}
                placeholder={isMobileView && !isMobileExpanded ? '' : placeholder}
                aria-label={placeholder}
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (isMobileView) {
                      return;
                    }
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
                    startInactivityTimer();
                  }
                }}
                onBlur={() => {
                  setIsFocused(false);
                  setTimeout(() => {
                    setShowSuggestions(false);
                    if (!value.trim()) {
                      setIsMobileExpanded(false);
                    }
                  }, 200);
                }}
                disabled={isInputDisabled}
              />
            </div>
          </div>
        </div>

        {/* Buttons container - Mobile */}
        <div className="flex flex-row items-end gap-[5px] flex-shrink-0 self-end">
            {/* Record button - icon-button-medium */}
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
                  alignItems: 'center',
                  padding: '8px',
                  width: '35px',
                  height: '35px',
                  background: isRecordDisabled ? '#E8EBFE' : recordButtonStyle.background,
                  borderRadius: '100px',
                  flex: 'none',
                  cursor: isRecordDisabled ? 'not-allowed' : 'pointer',
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
                    width: '19px',
                    height: '19px'
                  }}
                >
                  {/* icons/medium-icon */}
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 14 15" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      width: '16px',
                      height: '16px',
                      flex: 'none'
                    }}
                  >
                    <path d="M10.9375 5.25C11.1562 5.25 11.375 5.46875 11.375 5.6875V7C11.375 9.26953 9.625 11.1289 7.4375 11.3477V13.125H9.1875C9.40625 13.125 9.625 13.3438 9.625 13.5625C9.625 13.8086 9.40625 14 9.1875 14H4.8125C4.56641 14 4.375 13.8086 4.375 13.5625C4.375 13.3438 4.56641 13.125 4.8125 13.125H6.5625V11.3477C4.29297 11.1289 2.625 9.13281 2.625 6.86328V5.6875C2.625 5.46875 2.81641 5.25 3.0625 5.25C3.28125 5.25 3.5 5.46875 3.5 5.6875V6.89062C3.5 8.75 4.89453 10.3906 6.75391 10.5C8.77734 10.6367 10.5 9.02344 10.5 7V5.6875C10.5 5.46875 10.6914 5.25 10.9375 5.25ZM7 9.625C5.55078 9.625 4.375 8.44922 4.375 7V2.625C4.375 1.17578 5.55078 0 7 0C8.44922 0 9.625 1.20312 9.625 2.625V7C9.625 8.44922 8.44922 9.625 7 9.625ZM5.25 2.625V7C5.25 7.98438 6.01562 8.75 7 8.75C7.95703 8.75 8.75 7.98438 8.75 7V2.625C8.75 1.66797 7.95703 0.875 7 0.875C6.01562 0.875 5.25 1.66797 5.25 2.625Z" fill={isRecordDisabled ? '#3C51E2' : recordButtonStyle.iconColor}/>
                  </svg>
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
                  alignItems: 'center',
                  padding: '8px',
                  width: '35px',
                  height: '35px',
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
                    width: '19px',
                    height: '19px'
                  }}
                >
                  {/* icons/medium-icon */}
                  <svg 
                    width="19" 
                    height="19" 
                    viewBox="0 0 19 19" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      width: '16px',
                      height: '16px',
                      flex: 'none'
                    }}
                  >
                    <path d="M13.5 3.5C14.5938 3.5 15.5 4.40625 15.5 5.5V13.5C15.5 14.5938 14.5938 15.5 13.5 15.5H5.5C4.375 15.5 3.5 14.5938 3.5 13.5V5.5C3.5 4.40625 4.375 3.5 5.5 3.5H13.5ZM14.5 13.5V5.5C14.5 4.96875 14.0312 4.5 13.5 4.5H5.5C4.9375 4.5 4.5 4.96875 4.5 5.5V13.5C4.5 14.0625 4.9375 14.5 5.5 14.5H13.5C14.0312 14.5 14.5 14.0625 14.5 13.5Z" fill={recordButtonStyle.iconColor}/>
                  </svg>
                </div>
              </button>
            )}

            {/* Send button - icon-button-medium */}
            <button
              onClick={onSend}
              disabled={isSendDisabled}
              onMouseEnter={() => !isSendDisabled && setHoverSend(true)}
              onMouseLeave={() => setHoverSend(false)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px',
                width: '35px',
                height: '35px',
                background: isSendDisabled ? '#F3F3FC' : sendButtonStyle.background,
                borderRadius: '100px',
                flex: 'none',
                cursor: isSendDisabled ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'background-color 0.2s ease',
                boxSizing: 'border-box',
              }}
            >
              {/* icons/medium-icon */}
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
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={isSendDisabled ? '#8D94A3' : sendButtonStyle.iconColor} 
                  strokeWidth="2" 
                  style={{
                    width: '16px',
                    height: '16px',
                    flex: 'none',
                    transform: 'rotate(45deg)',
                    marginLeft: '-3px'
                  }}
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9"></polygon>
                </svg>
              </div>
            </button>
          </div>
        </div>

      {/* Desktop: Vertical layout - Text field with buttons below */}
      <div className="hidden md:flex flex-col w-full max-w-full">
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
              gap: '4px',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', minHeight: 'auto' }}>
              <textarea
                ref={setDesktopTextareaRef}
                rows={1}
                tabIndex={1}
                className={`w-full resize-none outline-none ${isInputDisabled && !isRecording ? 'input-disabled' : ''}`}
                style={{ 
                  fontFamily: 'Product Sans Light, system-ui, sans-serif', 
                  fontWeight: 300,
                  fontSize: '16px',
                  lineHeight: '1.2130000591278076em',
                  color: isInputDisabled && !isRecording ? '#A6AAB6' : '#061333',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  height: 'auto',
                  transition: 'height 0.2s ease-in-out',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E0 transparent',
                  textAlign: 'left',
                  verticalAlign: 'middle'
                }}
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (isMobileView) {
                      return;
                    }
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
                    startInactivityTimer();
                  }
                }}
                onBlur={() => {
                  setIsFocused(false);
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
              {/* Record button - Desktop */}
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
                      borderRadius: '100px'
                    }}
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 14 15" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        width: '14px',
                        height: '14px',
                        flex: 'none'
                      }}
                    >
                      <path d="M10.9375 5.25C11.1562 5.25 11.375 5.46875 11.375 5.6875V7C11.375 9.26953 9.625 11.1289 7.4375 11.3477V13.125H9.1875C9.40625 13.125 9.625 13.3438 9.625 13.5625C9.625 13.8086 9.40625 14 9.1875 14H4.8125C4.56641 14 4.375 13.8086 4.375 13.5625C4.375 13.3438 4.56641 13.125 4.8125 13.125H6.5625V11.3477C4.29297 11.1289 2.625 9.13281 2.625 6.86328V5.6875C2.625 5.46875 2.81641 5.25 3.0625 5.25C3.28125 5.25 3.5 5.46875 3.5 5.6875V6.89062C3.5 8.75 4.89453 10.3906 6.75391 10.5C8.77734 10.6367 10.5 9.02344 10.5 7V5.6875C10.5 5.46875 10.6914 5.25 10.9375 5.25ZM7 9.625C5.55078 9.625 4.375 8.44922 4.375 7V2.625C4.375 1.17578 5.55078 0 7 0C8.44922 0 9.625 1.20312 9.625 2.625V7C9.625 8.44922 8.44922 9.625 7 9.625ZM5.25 2.625V7C5.25 7.98438 6.01562 8.75 7 8.75C7.95703 8.75 8.75 7.98438 8.75 7V2.625C8.75 1.66797 7.95703 0.875 7 0.875C6.01562 0.875 5.25 1.66797 5.25 2.625Z" fill={recordButtonStyle.iconColor}/>
                    </svg>
                    <span
                      style={{
                        width: '41px',
                        height: '16px',
                        fontFamily: 'Product Sans Light, system-ui, sans-serif',
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
                      borderRadius: '100px'
                    }}
                  >
                    <svg 
                      width="19" 
                      height="19" 
                      viewBox="0 0 19 19" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        width: '14px',
                        height: '14px',
                        flex: 'none'
                      }}
                    >
                      <path d="M13.5 3.5C14.5938 3.5 15.5 4.40625 15.5 5.5V13.5C15.5 14.5938 14.5938 15.5 13.5 15.5H5.5C4.375 15.5 3.5 14.5938 3.5 13.5V5.5C3.5 4.40625 4.375 3.5 5.5 3.5H13.5ZM14.5 13.5V5.5C14.5 4.96875 14.0312 4.5 13.5 4.5H5.5C4.9375 4.5 4.5 4.96875 4.5 5.5V13.5C4.5 14.0625 4.9375 14.5 5.5 14.5H13.5C14.0312 14.5 14.5 14.0625 14.5 13.5Z" fill={recordButtonStyle.iconColor}/>
                    </svg>
                    <span
                      style={{
                        width: '41px',
                        height: '16px',
                        fontFamily: 'Product Sans Light, system-ui, sans-serif',
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

              {/* Send button - Desktop */}
              <button
                onClick={onSend}
                disabled={isSendDisabled}
                onMouseEnter={() => !isSendDisabled && setHoverSend(true)}
                onMouseLeave={() => setHoverSend(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
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
                  transition: 'background-color 0.2s ease',
                  boxSizing: 'border-box',
                }}
              >
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
                    transform: 'rotate(45deg)',
                    marginLeft: '-3px'
                  }}
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9"></polygon>
                </svg>
              </button>
            </div>
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
