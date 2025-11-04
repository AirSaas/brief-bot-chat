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
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-white via-brand-50 to-brand-100 flex-col overflow-y-auto">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-start" style={{ margin: '0px 40px 0px 40px', width: 'calc(100% - 80px)', boxSizing: 'border-box' }}>
          <div className="w-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '56px' }}>
            {/* Hero Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', alignSelf: 'stretch', marginTop: 'calc(-12.5%)'}}>
                  {/* Logo with halo */}
                  <div 
                    className="flex justify-center items-center" 
                    style={{ 
                      width: '91px', 
                      height: '91px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Halo - outline of 8px on each side */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '91px',
                        height: '91px',
                        borderRadius: '50%',
                        border: '8px solid transparent',
                        boxSizing: 'border-box',
                        pointerEvents: 'none'
                      }}
                    />
                    {/* Logo - 75px diameter */}
                    <img
                      src="/airsaas-ai-logo.svg"
                      alt="AirSaas AI"
                      style={{
                        width: '91px',
                        height: '91px',
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                  </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <h1
                style={{ 
                  fontFamily: "Product Sans, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '36px',
                    lineHeight: '1.2130000856187608em',
                  color: '#3C51E2',
                    textAlign: 'center',
                    margin: 0,
                    width: '100%',
                    whiteSpace: 'pre-line'
                }}
              >
                {t('homepage.title')}
              </h1>
              <h2
                style={{ 
                  fontFamily: "Product Sans, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '20px',
                  lineHeight: '1.5em',
                  color: '#475467',
                    textAlign: 'center',
                    margin: 0,
                    width: '100%'
                }}
              >
                {t('homepage.subtitle')}
              </h2>
              </div>
            </div>

            {/* Text Section - Check items and Share link */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', width: '100%' }}>
            {/* Features Section - Check items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
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
                    fontSize: '18px',
                      lineHeight: '1.2130000856187608em',
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
                      fontSize: '18px',
                      lineHeight: '1.2130000856187608em',
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
                      fontSize: '18px',
                      lineHeight: '1.2130000856187608em',
                    color: '#475467',
                    paddingTop: '3.4px'
                  }}
                >
                  {parseBoldText(t('homepage.features.quality_description'))}
                </p>
              </div>
            </div>

            {/* Share link section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0px', width: '100%', height: '57px', marginTop: '-1px' }}>
              {/* label-text */}
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '0px 0px 5px', width: '100%', height: '17px' }}>
                {/* label */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px', gap: '10px', width: '100%', height: '9px' }}>
                <p
                  style={{
                    fontFamily: "Product Sans Light, system-ui, sans-serif",
                    fontWeight: 300,
                      fontSize: '12px',
                      lineHeight: '15px',
                      color: '#50596F',
                      margin: 0,
                      width: '100%',
                      height: '9px',
                      display: 'flex',
                      alignItems: 'center'
                  }}
                >
                  {t('homepage.share_link.label', { defaultValue: 'Share the link to your teammates' })}
                </p>
                  {/* Trailing - hidden */}
                  <div style={{ display: 'none', width: '12px', height: '12px' }} />
                </div>
              </div>
              {/* wrapper */}
              <div 
                className="bg-white border border-[#E5E7EA] rounded-[10px] transition-all duration-200" 
                style={{ 
                  width: '100%',
                  height: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignSelf: 'stretch',
                  padding: '0px',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F3F3FC';
                  e.currentTarget.style.border = '1px solid #3C51E2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.border = '1px solid #E5E7EA';
                }}
              >
                {/* Cont */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px 15px', width: '100%', height: '35px' }}>
                  {/* left */}
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px', gap: '5px', height: '16px', flex: 1 }}>
                    {/* Icon container */}
                    <div style={{ width: '21px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.46875 4.125C7 2.5625 9.53125 2.5625 11.0938 4.125C12.5938 5.59375 12.6562 7.96875 11.3125 9.5625L11.125 9.75C10.9375 9.96875 10.625 10 10.4375 9.8125C10.2188 9.625 10.1875 9.3125 10.375 9.09375L10.5312 8.90625C11.5625 7.71875 11.5 5.9375 10.4062 4.84375C9.21875 3.65625 7.34375 3.65625 6.15625 4.84375L2.28125 8.71875C1.09375 9.90625 1.09375 11.7812 2.28125 12.9688C3.4375 14.125 5.34375 14.125 6.5 12.9688L7.21875 12.25C7.40625 12.0625 7.71875 12.0625 7.9375 12.25C8.125 12.4375 8.125 12.7812 7.9375 12.9688L7.21875 13.6562C5.65625 15.2188 3.125 15.2188 1.5625 13.6562C0 12.0938 0 9.5625 1.5625 8L5.46875 4.125ZM14.625 11.9062C13.0938 13.4688 10.5625 13.4688 9 11.9062C7.5 10.4375 7.4375 8.0625 8.78125 6.46875L8.96875 6.28125C9.15625 6.0625 9.46875 6.03125 9.65625 6.21875C9.875 6.40625 9.90625 6.71875 9.71875 6.9375L9.5625 7.125C8.53125 8.3125 8.59375 10.0938 9.6875 11.1875C10.875 12.375 12.75 12.375 13.9375 11.1875L17.8125 7.3125C19 6.125 19 4.25 17.8125 3.0625C16.6562 1.90625 14.75 1.90625 13.5938 3.0625L12.875 3.78125C12.6875 3.96875 12.375 3.96875 12.1562 3.78125C11.9688 3.5625 11.9688 3.25 12.1562 3.0625L12.875 2.34375C14.4375 0.78125 16.9688 0.78125 18.5312 2.34375C20.0938 3.90625 20.0938 6.4375 18.5312 8L14.625 11.9062Z" fill="#061333"/>
                  </svg>
                </div>
                    {/* text */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0px', height: '16px', flex: 1 }}>
                      {/* title */}
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px', gap: '5px', height: '16px', width: '100%' }}>
                        {/* text-field */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0px', gap: '5px', height: '16px', width: '100%', borderRadius: '4px 4px 0px 0px' }}>
                          {/* text field */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0px', gap: '10px', height: '16px', width: '100%', borderRadius: '100px' }}>
                            {/* state-layer */}
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px', gap: '4px', height: '16px', width: '100%', borderRadius: '4px 4px 0px 0px' }}>
                              {/* content */}
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0px', height: '16px', width: '100%' }}>
                                {/* input-text */}
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px', height: '16px', width: '100%' }}>
                  <input
                    type="text"
                    value={currentUrl}
                    readOnly
                                    className="bg-transparent border-none outline-none"
                    style={{
                      fontFamily: "Product Sans Light, system-ui, sans-serif",
                      fontWeight: 300,
                                      fontSize: '14px',
                                      lineHeight: '115%',
                                      color: '#061333',
                                      height: '16px',
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center'
                    }}
                  />
                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right */}
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: '0px', gap: '5px', width: '75px', height: '35px', flex: 'none' }}>
                    {/* button-small */}
                <button
                  onClick={handleCopyLink}
                      className="rounded-full text-[#3C51E2] transition-all duration-200"
                  style={{
                    fontFamily: "Product Sans Light, system-ui, sans-serif",
                    fontWeight: 300,
                        fontSize: '12px',
                        lineHeight: '15px',
                        padding: '7px 14px',
                        gap: '8px',
                        width: '75px',
                        height: '29px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '100px',
                        background: 'transparent',
                        border: 'none',
                        isolation: 'isolate'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E8EBFE';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '0px', gap: '5px', width: '47px', height: '15px', borderRadius: '100px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3C51E2" strokeWidth="2" style={{ width: '14px', height: '14px', flex: 'none' }}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                        <span style={{ width: '28px', height: '15px', display: 'flex', alignItems: 'center', fontFamily: "Product Sans Light, system-ui, sans-serif", fontWeight: 300, fontSize: '12px', lineHeight: '15px', color: '#3C51E2' }}>{copied ? 'Copied!' : 'Copy'}</span>
                      </div>
                </button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Right side - Chat Panel */}
      <div className="w-full md:w-1/2 md:border-l border-[#E5E7EA] flex flex-col bg-white relative">
        {/* Language Selector */}
        <div className="absolute top-[10px] right-[10px] md:left-[-140px] z-50">
          <LanguageSelector />
        </div>
        {/* Container with max-width for proportional scaling */}
        <div className="w-full max-w-[640px] xl:max-w-none xl:mx-0 mx-auto h-full flex flex-col overflow-hidden flex-1">
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
