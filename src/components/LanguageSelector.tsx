import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  className?: string;
}

const languages = [
  { code: 'fr', name: 'Français', flag: '/flags/flag-fr.png' },
  { code: 'en', name: 'English', flag: '/flags/flag-en.png' }
];

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[1];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Button - shows current language */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-[5px] px-[19px] py-2 rounded-full transition-colors ${
          isOpen
            ? 'bg-[#061333] text-white'
            : 'bg-[#E8EBFE] text-[#3C51E2]'
        }`}
        style={{
          fontFamily: 'Product Sans Light, system-ui, sans-serif',
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: '1.213em'
        }}
      >
        <img
          src={currentLanguage.flag}
          alt={currentLanguage.name}
          className="w-5 h-[19px] rounded-[9.5px] object-cover"
        />
        <span>{currentLanguage.name}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-[10px] w-[213px] bg-white rounded-[10px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.2)] z-50 overflow-hidden">
          <div className="flex flex-col gap-[5px] pt-[10px] pb-[10px]">
            {languages.map((lang) => {
              const isSelected = lang.code === i18n.language;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center justify-between gap-[5px] px-[13px] py-[3px] mx-[10px] rounded transition-colors ${
                    isSelected
                      ? 'bg-[#F3F3FC]'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    fontFamily: 'Product Sans Light, system-ui, sans-serif',
                    fontWeight: 300,
                    fontSize: '16px',
                    lineHeight: '1.213em',
                    color: isSelected ? '#3C51E2' : '#061333'
                  }}
                >
                  <div className="flex items-center gap-[5px]">
                    <img
                      src={lang.flag}
                      alt={lang.name}
                      className="w-5 h-[19px] rounded-[9.5px] object-cover"
                    />
                    <span>{lang.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
