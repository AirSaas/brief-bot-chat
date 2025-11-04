
interface QuickAnswersProps {
  onAnswerClick: (answer: string) => void;
  onDownloadPDF?: () => void;
  disabled?: boolean;
  isClosing?: boolean;
  answers?: string[];
  isFirstMessage?: boolean;
  selectedAnswers?: string[];
  onAnswerSelect?: (answer: string) => void;
}

const DEFAULT_QUICK_ANSWERS = [
  "Go",
  "Start a Basic Story Telling",
  "Start an Emotional Story Telling",
];

export default function QuickAnswers({ onAnswerClick, onDownloadPDF, disabled = false, isClosing = false, answers, isFirstMessage = false, selectedAnswers = [], onAnswerSelect }: QuickAnswersProps) {
  const handleAnswerClick = (answer: string) => {
    // Check if button is a PDF download button (English and French variations)
    const isPDFButton = answer === "Download as PDF" || 
                       answer === "Télécharger en PDF" || 
                       answer === "Télécharger en tant que PDF" ||
                       answer === "Télécharger au format PDF" ||
                       answer === "Télécharger comme PDF";
    
    // Check if it's a default button (give_examples or skip_question in both languages)
    const lowerAnswer = answer.toLowerCase();
    const isDefaultButton = 
      answer === "Generate other examples" ||
      answer === "Skip this question" ||
      answer === "Générer d'autres exemples" ||
      answer === "Sauter cette question" ||
      lowerAnswer === "everything is correct" ||
      lowerAnswer === "tout est correct";
    
    if (isPDFButton && onDownloadPDF) {
      onDownloadPDF();
    } else {
      // If it's not a default button and not a PDF button, mark it as selected
      if (!isDefaultButton && !isPDFButton && onAnswerSelect) {
        onAnswerSelect(answer);
      }
      onAnswerClick(answer);
    }
  };

  // If there are no bot responses and it is not the first message, don't show anything
  if (!answers || answers.length === 0) {
    if (!isFirstMessage) {
      return null;
    }
    // Show DEFAULT_QUICK_ANSWERS if it is the first message
    return (
      <div className={`px-4 sm:px-6 py-3 sm:py-4 bg-white border-t border-brand-200 quick-answers-container ${isClosing ? 'quick-answers-closing' : ''}`}>
        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">Quick Answers 💡 </div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {DEFAULT_QUICK_ANSWERS.map((answer, index) => {
            // Check if button is a PDF download button (English and French variations)
            const isPDFButton = answer === "Download as PDF" || 
                               answer === "Télécharger en PDF" || 
                               answer === "Télécharger en tant que PDF" ||
                               answer === "Télécharger au format PDF" ||
                               answer === "Télécharger comme PDF";
            
            // Check if it's a "everything is correct" button
            const lowerAnswer = answer.toLowerCase();
            const isCorrectButton = lowerAnswer === "everything is correct" || lowerAnswer === "tout est correct";
            
            // Check if it's a default button
            const isDefaultButton = 
              answer === "Generate other examples" ||
              answer === "Skip this question" ||
              answer === "Générer d'autres exemples" ||
              answer === "Sauter cette question";
            
            // Check if this answer is selected
            const isSelected = selectedAnswers.includes(answer);
            
            // Check if this is a small button that needs specific styling
            const isSmallButton = isDefaultButton || isCorrectButton;
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(answer)}
                disabled={disabled}
                className={isSmallButton ? '' : `px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  disabled && !isSelected
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : isPDFButton || isCorrectButton
                    ? 'bg-[#3C51E2] hover:bg-[#3041B5] text-white'
                    : isSelected
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-500'
                    : isDefaultButton
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-100 hover:bg-blue-50 hover:border-2 hover:border-blue-500 hover:text-blue-700 text-gray-700'
                }`}
                style={isSmallButton ? {
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
                  color: disabled && !isSelected
                    ? '#9CA3AF'
                    : isCorrectButton
                    ? '#FFFFFF'
                    : '#3C51E2',
                  background: disabled && !isSelected
                    ? '#F3F4F6'
                    : isCorrectButton
                    ? '#3C51E2'
                    : 'transparent',
                  border: isDefaultButton ? 'none' : '1px solid #3C51E2',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  opacity: disabled && !isSelected ? 0.5 : 1
                } : {}}
              >
                {answer}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Show the bot responses
  return (
    <div className={`px-4 sm:px-6 py-3 sm:py-4 bg-white border-t border-brand-200 quick-answers-container ${isClosing ? 'quick-answers-closing' : ''}`}>
      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">Quick Answers 💡 </div>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {answers.map((answer, index) => {
          // Check if button is a PDF download button (English and French variations)
          const isPDFButton = answer === "Download as PDF" || 
                             answer === "Télécharger en PDF" || 
                             answer === "Télécharger en tant que PDF" ||
                             answer === "Télécharger au format PDF" ||
                             answer === "Télécharger comme PDF";
          
          // Check if it's a "everything is correct" button
          const lowerAnswer = answer.toLowerCase();
          const isCorrectButton = lowerAnswer === "everything is correct" || lowerAnswer === "tout est correct";
          
          // Check if it's a default button
          const isDefaultButton = 
            answer === "Generate other examples" ||
            answer === "Skip this question" ||
            answer === "Générer d'autres exemples" ||
            answer === "Sauter cette question";
          
          // Check if this answer is selected
          const isSelected = selectedAnswers.includes(answer);
          
          // Check if this is a small button that needs specific styling
          const isSmallButton = isDefaultButton || isCorrectButton;
          
          return (
            <button
              key={index}
              onClick={() => handleAnswerClick(answer)}
              disabled={disabled}
              className={isSmallButton ? '' : `px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                disabled && !isSelected
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : isPDFButton || isCorrectButton
                  ? 'bg-[#3C51E2] hover:bg-[#3041B5] text-white'
                  : isSelected
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-500'
                  : isDefaultButton
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-100 hover:bg-blue-50 hover:border-2 hover:border-blue-500 hover:text-blue-700 text-gray-700'
              }`}
              style={isSmallButton ? {
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
                color: disabled && !isSelected
                  ? '#9CA3AF'
                  : isCorrectButton
                  ? '#FFFFFF'
                  : '#3C51E2',
                background: disabled && !isSelected
                  ? '#F3F4F6'
                  : isCorrectButton
                  ? '#3C51E2'
                  : 'transparent',
                border: isDefaultButton ? 'none' : '1px solid #3C51E2',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                opacity: disabled && !isSelected ? 0.5 : 1
              } : {}}
            >
              {answer}
            </button>
          );
        })}
      </div>
    </div>
  );
}
