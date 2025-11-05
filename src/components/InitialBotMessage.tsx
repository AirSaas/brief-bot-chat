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
        <div className="flex-shrink-0" style={{ width: '24px', height: '21.63px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="21.63" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path opacity="0.4" d="M35.1855 9.45942L41.4551 7.03957L43.765 0.879946C43.875 0.32998 44.425 0 44.9749 0C45.4149 0 45.9649 0.32998 46.0749 0.879946L48.4947 7.03957L54.6544 9.45942C55.2044 9.56941 55.5343 10.1194 55.5343 10.5593C55.5343 11.1093 55.2044 11.6593 54.6544 11.7693L48.4947 14.0791L46.0749 20.3487C45.9649 20.7887 45.4149 21.1187 44.9749 21.1187C44.425 21.1187 43.875 20.7887 43.765 20.3487L41.4551 14.0791L35.1855 11.7693C34.7455 11.6593 34.4155 11.1093 34.4155 10.5593C34.4155 10.1194 34.7455 9.56941 35.1855 9.45942Z" fill="#3C51E2"/>
            <path opacity="0.4" d="M5.21452 22.8817L6.92554 18.319C7.00701 17.9116 7.4144 17.6672 7.82178 17.6672C8.14769 17.6672 8.55508 17.9116 8.63655 18.319L10.429 22.8817L14.9918 24.6742C15.3991 24.7556 15.6436 25.163 15.6436 25.4889C15.6436 25.8963 15.3991 26.3037 14.9918 26.3852L10.429 28.0962L8.63655 32.7403C8.55508 33.0662 8.14769 33.3107 7.82178 33.3107C7.4144 33.3107 7.00701 33.0662 6.92554 32.7403L5.21452 28.0962L0.570338 26.3852C0.244431 26.3037 0 25.8963 0 25.4889C0 25.163 0.244431 24.7556 0.570338 24.6742L5.21452 22.8817Z" fill="#3C51E2"/>
            <path d="M27.0839 17.6672L43.804 53.1412L26.561 47.8021L31.6504 44.7152L35.385 45.8817L27.0823 28.2685L19.7552 43.8142L29.0691 38.243L30.9827 42.2978L9.38818 55.2115L27.0839 17.6672Z" fill="#3C51E2"/>
          </svg>
        </div>
        <div className="flex-1">
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
      <div className="flex flex-col gap-[10px] self-stretch ml-[30px] mt-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(t('initial_message.lets_start_template', { template: template.title }))}
            className="flex flex-row items-end w-full bg-transparent border-none cursor-pointer self-stretch transition-all duration-200 group"
            style={{
              padding: '0px',
              gap: '10px',
              alignItems: 'flex-end'
            }}
          >
            {/* wrapper */}
            <div
              className="flex flex-row items-start flex-1 bg-[#F8F9FF] rounded-[10px] transition-all duration-200"
              style={{
                padding: '0px',
                gap: '5px',
                boxSizing: 'border-box',
                border: '1px solid transparent',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F3F3FC';
                e.currentTarget.style.border = '1px solid #3C51E2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F8F9FF';
                e.currentTarget.style.border = '1px solid transparent';
              }}
            >
              {/* Cont */}
              <div
                className="flex flex-row items-center w-full flex-1"
                style={{
                  padding: '10px 10px 10px 20px'
                }}
              >
                {/* left */}
                <div
                  className="flex flex-row items-center flex-1"
                  style={{
                    padding: '0px',
                    gap: '5px'
                  }}
                >
                  {/* text */}
                  <div
                    className="flex flex-col justify-center items-start flex-1"
                    style={{
                      padding: '0px'
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
                        width: '100%'
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'Product Sans, system-ui, sans-serif',
                          fontWeight: 700,
                          fontSize: '14px',
                          lineHeight: '1.2130000250680106em',
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
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'stretch',
                        alignItems: 'stretch',
                        padding: '0px',
                        gap: '5px',
                        width: '100%'
                      }}
                    >
                      <p
                        className="text-[#061333] m-0 p-0 flex-1 text-left"
                        style={{
                          fontFamily: 'Product Sans Light, system-ui, sans-serif',
                          fontWeight: 300,
                          fontSize: '12px',
                          lineHeight: '1.2130000591278076em'
                        }}
                      >
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Right - Hidden on mobile */}
                <div
                  className="hidden md:flex flex-row justify-end items-center flex-shrink-0"
                  style={{
                    padding: '0px 0px 0px 5px',
                    gap: '5px'
                  }}
                >
                  {/* button-small */}
                  <div
                    className="box-border flex flex-row justify-center items-center cursor-pointer transition-all duration-200"
                    style={{
                      padding: '7px 14px',
                      gap: '3px',
                      background: '#3C51E2',
                      border: '1px solid #3C51E2',
                      borderRadius: '100px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#061333';
                      e.currentTarget.style.border = '1px solid #061333';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3C51E2';
                      e.currentTarget.style.border = '1px solid #3C51E2';
                    }}
                  >
                    {/* label-text */}
                    <span
                      style={{
                        fontFamily: 'Product Sans Light, system-ui, sans-serif',
                        fontWeight: 300,
                        fontSize: '12px',
                        lineHeight: '1.2130000591278076em',
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
