interface QuickAnswersProps {
  onAnswerClick: (answer: string) => void;
  disabled?: boolean;
  isClosing?: boolean;
}

const QUICK_ANSWERS = [
  "Let's start!",
  "Start a Basic Story Telling",
  "Start an Emotional Story Telling",
];

export default function QuickAnswers({ onAnswerClick, disabled = false, isClosing = false }: QuickAnswersProps) {
  return (
    <div className={`px-4 sm:px-6 py-3 sm:py-4 bg-white border-t border-brand-200 quick-answers-container ${isClosing ? 'quick-answers-closing' : ''}`}>
      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">Quick Answers 💡 </div>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {QUICK_ANSWERS.map((answer, index) => (
          <button
            key={index}
            onClick={() => onAnswerClick(answer)}
            disabled={disabled}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
              disabled
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
}
