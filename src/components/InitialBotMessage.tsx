interface InitialBotMessageProps {
  onTemplateSelect: (template: string) => void;
}

const TEMPLATES = [
  {
    id: "basic-storytelling",
    title: "Basic Story Telling",
    description: "This template focuses on presenting your project in a straightforward narrative format. It emphasizes the project's context, objectives, and expected outcomes, making it easy to understand the overall purpose and direction."
  },
  {
    id: "emotional-storytelling", 
    title: "Emotional Story Telling",
    description: "This template takes a more engaging approach by incorporating emotional elements into the narrative. It aims to connect with the audience on a deeper level, highlighting the human impact of the project and inspiring action through storytelling."
  }
];

export default function InitialBotMessage({ onTemplateSelect }: InitialBotMessageProps) {
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
            Hello, I'm here to assist you to create a well-structured project. Let's take it step by step.
            <br /><br />
            Which template of project brief do you want to use?
          </p>
        </div>
      </div>

      {/* Template Selection Buttons */}
      <div className="space-y-3 ml-11 sm:ml-12">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.title)}
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
