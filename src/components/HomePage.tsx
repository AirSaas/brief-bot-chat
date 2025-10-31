import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import ChatWindow from './ChatWindow';
import type { ChatMessage } from '../lib/api';

interface HomePageProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  sessionId: string;
  isThinking: boolean;
  setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
  hasSelectedInitialOption: boolean;
  setHasSelectedInitialOption: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HomePage({
  messages,
  setMessages,
  input,
  setInput,
  sessionId,
  isThinking,
  setIsThinking,
  hasSelectedInitialOption,
  setHasSelectedInitialOption
}: HomePageProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('app.airsaas.io/link');

  // Parse translated text with bold tags
  const parseBoldText = (translatedText: string) => {
    const parts = translatedText.split(/(<strong>.*?<\/strong>)/g);
    return parts.map((part, index) => {
      if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
        const text = part.replace(/<\/?strong>/g, '');
        return <strong key={index} style={{ fontWeight: 700, fontFamily: 'Product Sans, system-ui, sans-serif' }}>{text}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Left side - Homepage content */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-white via-brand-50 to-brand-100 flex-col overflow-y-auto">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-start">
          <div className="w-full max-w-[640px] mx-auto px-8">
            {/* Hero Section */}
            <div className="mb-[30px] text-center">
                  {/* Logo */}
                  <div className="flex justify-center mb-[16px]">
                    <div
                      style={{
                        position: 'relative',
                        width: '120px',
                        height: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      {/* Halo azul de fondo */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '120px',
                          height: '120px',
                          background: '#FFFFFF',
                          border: '8.36px solid #8A97EE',
                          borderRadius: '250px',
                          pointerEvents: 'none',
                          zIndex: 1
                        }}
                      />
                      {/* Imagen por encima del halo */}
                      <div
                        style={{
                          width: '87px',
                          height: '87px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        <img
                          src="/mini.png"
                          alt="AirSaas AI"
                          style={{
                            width: '87px',
                            height: '65px',
                            objectFit: 'contain',
                            borderRadius: '9.5px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
              
              <h1
                className="mb-0"
                style={{ 
                  fontFamily: "Product Sans, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '38px',
                  lineHeight: '1.213em',
                  color: '#3C51E2',
                  textAlign: 'center'
                }}
              >
                {t('homepage.title')}
              </h1>
              <h2
                className="mt-0 mb-[8px]"
                style={{ 
                  fontFamily: "Product Sans, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '20px',
                  lineHeight: '1.5em',
                  color: '#475467',
                  textAlign: 'center'
                }}
              >
                {t('homepage.subtitle')}
              </h2>
            </div>

            {/* Features Section - Check items */}
            <div className="flex flex-col mb-[20px] mt-[50px]" style={{ gap: '14px' }}>
              <div className="flex gap-[10px] items-start w-full">
                <div className="flex items-center justify-center" style={{ width: '12px', height: '28px' }}>
                  <div
                    style={{
                      width: '9px',
                      height: '9px',
                      backgroundColor: '#03E26B',
                      borderRadius: '50%',
                      position: 'relative',
                      top: '0.23px'
                    }}
                  />
                </div>
                <p
                  className="flex-1"
                  style={{ 
                    fontFamily: "Product Sans, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: '20px',
                    lineHeight: '1.213em',
                    color: '#475467',
                    paddingTop: '3.4px'
                  }}
                >
                  {parseBoldText(t('homepage.features.question_description'))}
                </p>
              </div>

              <div className="flex gap-[10px] items-start w-full">
                <div className="flex items-center justify-center" style={{ width: '12px', height: '28px' }}>
                  <div
                    style={{
                      width: '9px',
                      height: '9px',
                      backgroundColor: '#03E26B',
                      borderRadius: '50%',
                      position: 'relative',
                      top: '-0.17px'
                    }}
                  />
                </div>
                <p
                  className="flex-1"
                  style={{ 
                    fontFamily: "Product Sans, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: '20px',
                    lineHeight: '1.213em',
                    color: '#475467',
                    paddingTop: '3.4px'
                  }}
                >
                  {parseBoldText(t('homepage.features.time_description'))}
                </p>
              </div>

              <div className="flex gap-[10px] items-start w-full">
                <div className="flex items-center justify-center" style={{ width: '12px', height: '28px' }}>
                  <div
                    style={{
                      width: '9px',
                      height: '9px',
                      backgroundColor: '#03E26B',
                      borderRadius: '50%',
                      position: 'relative',
                      top: '0.43px'
                    }}
                  />
                </div>
                <p
                  className="flex-1"
                  style={{ 
                    fontFamily: "Product Sans, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: '20px',
                    lineHeight: '1.213em',
                    color: '#475467',
                    paddingTop: '3.4px'
                  }}
                >
                  {parseBoldText(t('homepage.features.quality_description'))}
                </p>
              </div>
            </div>

            {/* Share link section */}
            <div className="mb-0">
              <div className="mb-[5px]">
                <p
                  style={{
                    fontFamily: "Product Sans Light, system-ui, sans-serif",
                    fontWeight: 300,
                    fontSize: '16px',
                    lineHeight: '1.213em',
                    color: '#50596F'
                  }}
                >
                  {t('homepage.share_link.label', { defaultValue: 'Share the link to your teammates' })}
                </p>
              </div>
              <div className="bg-white border border-[#E5E7EA] rounded-[10px] p-[15px] flex items-center gap-[15px]">
                <div className="w-4 h-4 flex items-center justify-center bg-[#F8F9FF] rounded-full p-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#061333" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={currentUrl}
                    readOnly
                    className="w-full bg-transparent border-none outline-none"
                    style={{
                      fontFamily: "Product Sans Light, system-ui, sans-serif",
                      fontWeight: 300,
                      fontSize: '18px',
                      lineHeight: '1.15em',
                      color: '#061333'
                    }}
                  />
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-[5px] px-[14px] py-[7px] rounded-full text-[#3C51E2] hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: "Product Sans Light, system-ui, sans-serif",
                    fontWeight: 300,
                    fontSize: '16px',
                    lineHeight: '1.213em'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3C51E2" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Right side - Chat Panel */}
      <div className="w-full md:w-[639px] md:border-l border-[#E5E7EA] flex flex-col bg-white relative">
        {/* Language Selector */}
        <div className="absolute top-[10px] right-[10px] md:left-[-140px] z-50">
          <LanguageSelector />
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          {/* Chat Section */}
          <ChatWindow
            messages={messages}
            setMessages={setMessages}
            input={input}
            setInput={setInput}
            sessionId={sessionId}
            isThinking={isThinking}
            setIsThinking={setIsThinking}
            hasSelectedInitialOption={hasSelectedInitialOption}
            setHasSelectedInitialOption={setHasSelectedInitialOption}
            isPanel={true}
          />
        </div>
      </div>
    </div>
  );
}
