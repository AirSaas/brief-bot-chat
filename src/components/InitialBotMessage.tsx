import { useTranslation } from 'react-i18next';

interface InitialBotMessageProps {
  onTemplateSelect: (template: string) => void;
}

// Function to hide language instruction text between equals signs for display
const hideLanguageInstruction = (text: string): string => {
  return text.replace(/\s*=my language is English, let's keep this conversation completely in English=\s*/g, '')
             .replace(/\s*=ma langue est le français, gardons cette conversation entièrement en français=\s*/g, '');
};

export default function InitialBotMessage({ onTemplateSelect }: InitialBotMessageProps) {
  const { t } = useTranslation();

  const TEMPLATES = [
    {
      id: "basic-storytelling",
      title: t('initial_message.templates.basic_storytelling.title'),
      description: t('initial_message.templates.basic_storytelling.description')
    },
    {
      id: "emotional-storytelling", 
      title: t('initial_message.templates.emotional_storytelling.title'),
      description: t('initial_message.templates.emotional_storytelling.description')
    }
  ];
  return (
    <div className="space-y-6">
      {/* Bot Message */}
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0">
          <img 
            src="/mini.png" 
            alt="AirSaas Bot" 
            className="w-7 h-7 sm:w-9 sm:h-9"
          />
        </div>
        <div className="max-w-2xl">
          <p className="text-gray-800 leading-relaxed">
            {hideLanguageInstruction(t('initial_message.greeting'))}
            <br /><br />
            {hideLanguageInstruction(t('initial_message.template_question'))}
          </p>
        </div>
      </div>

      {/* Template Selection Buttons */}
      <div className="space-y-3 ml-11 sm:ml-12">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(t('initial_message.lets_start_template', { template: template.title }))}
            style={{ borderRadius: 3}}
            className="w-full text-left p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-700">
                {template.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {template.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
