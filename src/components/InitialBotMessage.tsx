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
    <div className="flex flex-col gap-[10px] my-4 md:my-5 px-3 md:px-0">
      {/* Bot Message */}
      <div className="flex items-start gap-[10px]">
        <div className="flex-shrink-0">
          <img 
            src="/mini.png" 
            alt="AirSaas Bot" 
            className="w-[30px] h-[30px] rounded-full"
          />
        </div>
        <div className="max-w-2xl flex-1">
          <p
            className="text-[#000000] text-left m-0 p-0"
            style={{
              fontFamily: 'Product Sans Light, system-ui, sans-serif',
              fontWeight: 300,
              fontSize: '14px',
              lineHeight: '1.4285714285714286em'
            }}
          >
            {hideLanguageInstruction(t('initial_message.greeting'))}
            <br /><br />
            {hideLanguageInstruction(t('initial_message.template_question'))}
          </p>
        </div>
      </div>

      {/* Template Selection Buttons */}
      <div className="flex flex-col gap-[10px] self-stretch ml-0 md:ml-[40px] mt-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(t('initial_message.lets_start_template', { template: template.title }))}
            className="flex flex-row items-end w-full gap-[10px] bg-transparent border-none cursor-pointer self-stretch transition-all duration-200 group hover:opacity-90"
            style={{
              padding: '0px',
              minHeight: '97px'
            }}
          >
            {/* wrapper */}
            <div
              className="flex flex-row items-start flex-1 bg-[#F8F9FF] rounded-[10px]"
              style={{
                padding: '0px',
                gap: '5px',
                minHeight: '97px',
                height: 'auto'
              }}
            >
              {/* Cont */}
              <div
                className="flex flex-row items-center w-full flex-1 px-3 md:px-5 py-2 md:py-[10px]"
                style={{
                  minHeight: '97px',
                  height: 'auto'
                }}
              >
                {/* left */}
                <div
                  className="flex flex-row items-center flex-1"
                  style={{
                    padding: '0px',
                    gap: '5px',
                    minHeight: '77px',
                    height: 'auto'
                  }}
                >
                  {/* text */}
                  <div
                    className="flex flex-col justify-center items-start flex-1"
                    style={{
                      padding: '0px',
                      gap: '10px',
                      minHeight: '77px',
                      height: 'auto'
                    }}
                  >
                    {/* title */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '0px',
                        gap: '5px',
                        width: '100%',
                        height: '17px',
                        marginBottom: '0px',
                        marginTop: '0px'
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'Product Sans, system-ui, sans-serif',
                          fontStyle: 'normal',
                          fontWeight: 700,
                          fontSize: '14px',
                          lineHeight: '17px',
                          color: '#040D22',
                          margin: 0,
                          padding: 0,
                          flex: 1,
                          textAlign: 'left'
                        }}
                      >
                        {template.title}
                      </h3>
                    </div>
                    {/* Subtitle */}
                    <div
                      className="flex flex-row items-center w-full"
                      style={{
                        padding: '0px',
                        gap: '5px',
                        minHeight: '60px',
                        height: 'auto',
                        marginTop: '0px'
                      }}
                    >
                      <p
                        className="text-[#061333] m-0 p-0 flex-1 text-left"
                        style={{
                          fontFamily: 'Product Sans Light, system-ui, sans-serif',
                          fontStyle: 'normal',
                          fontWeight: 300,
                          fontSize: '12px',
                          lineHeight: '15px'
                        }}
                      >
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Right */}
                <div
                  className="flex flex-row justify-end items-center flex-shrink-0"
                  style={{
                    padding: '0px',
                    gap: '5px',
                    width: 'auto',
                    height: 'auto',
                    marginLeft: '8px'
                  }}
                >
                  {/* button-small */}
                  <div
                    className="box-border flex flex-row justify-center items-center cursor-pointer px-3 md:px-[14px] py-[7px]"
                    style={{
                      gap: '3px',
                      minWidth: 'auto',
                      width: 'auto',
                      height: '29px',
                      background: '#3C51E2',
                      border: '1px solid #3C51E2',
                      borderRadius: '100px'
                    }}
                  >
                    {/* label-text */}
                    <span
                      style={{
                        fontFamily: 'Product Sans Light, system-ui, sans-serif',
                        fontStyle: 'normal',
                        fontWeight: 300,
                        fontSize: '12px',
                        lineHeight: '15px',
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t('initial_message.button_text', { defaultValue: 'Start!' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
