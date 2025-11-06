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
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-[5px] px-[19px] py-2 rounded-full transition-colors ${
          isOpen
            ? 'bg-[#061333] text-white'
            : 'bg-[#E8EBFE] text-[#3C51E2]'
        }`}
        style={{
          fontFamily: 'Product Sans Light, system-ui, sans-serif',
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: '1.2130000591278076em',
          border: isHovered && !isOpen ? '1px solid #3C51E2' : '1px solid transparent',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        <img
          src={currentLanguage.flag}
          alt={currentLanguage.name}
          style={{ width: '20px', height: '19px', borderRadius: '9.5px', objectFit: 'cover' }}
        />
        <span>{currentLanguage.name}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
            className="absolute top-full right-0 mt-[5px] bg-white rounded-[10px] z-50 overflow-hidden"
          style={{
            width: '213px',
            padding: '10px 0px',
            boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Cont */}
          <div 
            className="flex flex-col"
            style={{
              width: '100%',
              padding: '0px',
              gap: '5px'
            }}
          >
            {languages.map((lang) => {
              const isSelected = lang.code === i18n.language;
              return (
                <div
                  key={lang.code}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    padding: '0px',
                    width: '100%'
                  }}
                >
                  {/* item */}
                  <button
                    onClick={() => handleLanguageChange(lang.code)}
                    onMouseEnter={() => setHoveredItem(lang.code)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      height: '35px',
                      background: hoveredItem === lang.code ? '#E8EBFE' : (isSelected ? '#F3F3FC' : '#FFFFFF'),
                      borderRadius: hoveredItem === lang.code ? '0px' : '10px',
                      padding: '4px 10px',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'background-color 0.2s ease, border-radius 0.2s ease'
                    }}
                  >
                    {/* state-layer */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '0px',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {/* name */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                    <img
                      src={lang.flag}
                      alt={lang.name}
                          style={{ width: '20px', height: '19px', borderRadius: '9.5px', objectFit: 'cover' }}
                    />
                        <span
                          style={{
                            fontFamily: 'Product Sans Light, system-ui, sans-serif',
                            fontWeight: 300,
                            fontSize: '16px',
                            lineHeight: '1.2130000591278076em',
                            color: isSelected ? '#061333' : '#3C51E2'
                          }}
                        >
                          {lang.name}
                        </span>
                      </div>
                      {/* icons-right - empty but maintains structure */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: '5px',
                          width: 'auto'
                        }}
                      />
                  </div>
                </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
