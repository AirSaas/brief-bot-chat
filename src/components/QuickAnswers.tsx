interface QuickAnswersProps {
  onAnswerClick: (answer: string) => void;
  onDownloadPDF?: () => void;
  disabled?: boolean;
  isClosing?: boolean;
  answers?: string[];
  isFirstMessage?: boolean;
}

const DEFAULT_QUICK_ANSWERS = [
  "Go",
  "Start a Basic Story Telling",
  "Start an Emotional Story Telling",
];

export default function QuickAnswers({ onAnswerClick, onDownloadPDF, disabled = false, isClosing = false, answers, isFirstMessage = false }: QuickAnswersProps) {
  const handleAnswerClick = (answer: string) => {
    // Check if button is a PDF download button (English and French variations)
    const isPDFButton = answer === "Download as PDF" || 
                       answer === "Télécharger en PDF" || 
                       answer === "Télécharger en tant que PDF" ||
                       answer === "Télécharger au format PDF" ||
                       answer === "Télécharger comme PDF";
    if (isPDFButton && onDownloadPDF) {
      onDownloadPDF();
    } else {
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
            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(answer)}
                disabled={disabled}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  disabled
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : isPDFButton
                    ? 'bg-[#3C51E2] hover:bg-[#3041B5] text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
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
          return (
            <button
              key={index}
              onClick={() => handleAnswerClick(answer)}
              disabled={disabled}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                disabled
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : isPDFButton
                  ? 'bg-[#3C51E2] hover:bg-[#3041B5] text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {answer}
            </button>
          );
        })}
      </div>
    </div>
  );
}
