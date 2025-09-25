import { useEffect, useState } from "react";

interface InputWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendDirectly: (message: string) => void;
  placeholder: string;
  disabled: boolean;
  isThinking: boolean;
  suggestions?: string[];
}

export default function InputWithSuggestions({
  value,
  onChange,
  onSend,
  onSendDirectly,
  placeholder,
  disabled,
  isThinking,
  suggestions = ["Donnez-moi des exemples", "Sauter cette question"]
}: InputWithSuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Disable suggestions for now
  const suggestionsEnabled = false;

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

  return (
    <div className="flex-1 relative">
      <div className="relative">
        <input
          className={`w-full h-[42px] px-[15px] py-2 rounded-[10px] border-0 focus:outline-none bg-[#F8F9FF] focus:bg-white focus:border focus:border-[#3C51E2] text-gray-700 placeholder-[#8D94A3] transition-all duration-300 text-base ${
            isThinking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ fontFamily: 'Product Sans Light, system-ui, sans-serif', fontWeight: 300, lineHeight: '1.213em' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!isThinking) {
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
          disabled={disabled}
        />
        
        {/* Send button icon */}
        <button
          onClick={onSend}
          disabled={isThinking || !value.trim()}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-[7px] rounded-full transition-all duration-200 disabled:cursor-not-allowed ${
            isFocused && value.trim() 
              ? 'bg-[#3C51E2] text-white' 
              : 'bg-[#F3F3FC] text-[#8D94A3] hover:text-gray-700'
          } disabled:opacity-30`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rotate-45">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22,2 15,22 11,13 2,9"></polygon>
          </svg>
        </button>
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
