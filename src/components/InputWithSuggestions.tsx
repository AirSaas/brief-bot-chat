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

  // Function to handle input debounce
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    // Clear previous timeout
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
    
    // If there's text, show suggestions after 1 second of pause
    if (inputValue.trim().length > 0) {
      const timeout = setTimeout(() => {
        setShowSuggestions(true);
      }, 1000);
      setInputTimeout(timeout);
    } else {
      // If no text, hide suggestions immediately
      setShowSuggestions(false);
    }
  };

  // Function to show suggestions after 4 seconds of inactivity
  const startInactivityTimer = () => {
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
      <input
        className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl2 border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 bg-white shadow-sm font-bold text-gray-700 placeholder-gray-400 transition-all duration-300 text-sm sm:text-base ${
          isThinking ? 'opacity-50 cursor-not-allowed' : ''
        }`}
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
          if (value.trim().length > 0) {
            setShowSuggestions(true);
          } else {
            // Start inactivity timer when user focuses
            startInactivityTimer();
          }
        }}
        onBlur={() => {
          // Small delay to allow clicking on suggestions
          setTimeout(() => {
            setShowSuggestions(false);
          }, 200);
        }}
        disabled={disabled}
      />
      
      {/* Help suggestions */}
      {showSuggestions && !isThinking && suggestions.length > 0 && (
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
