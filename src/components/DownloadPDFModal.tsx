/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';

interface DownloadPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadPDFModal({ isOpen, onClose }: DownloadPDFModalProps) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
        // Get messages from sessionStorage
        const messages = JSON.parse(sessionStorage.getItem('chatMessages') || '[]');
        
        // Get only the last assistant message
        const assistantMessages = messages.filter((message: any) => message.role === 'assistant');
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
        
        if (!lastAssistantMessage || !lastAssistantMessage.content) {
        alert(t('pdf_modal.no_content'));
        setIsDownloading(false);
        return;
      }

          let content = lastAssistantMessage.content;
          
          // Extract content between markdown separators (---\n\n)
          const separatorPattern = /---\s*\n\s*\n([\s\S]*?)\n\s*\n---/;
          const match = content.match(separatorPattern);
          
          if (match && match[1]) {
            content = match[1].trim();
          }
          
      // jsPDF is already imported at the top
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;
      const lineHeight = 6;
      
      // Function to add text with word wrapping
      const addText = (text: string, fontSize: number, isBold = false, addSpace = true) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) { // 30mm for footer
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        
        if (addSpace) {
          yPosition += lineHeight * 0.5;
        }
      };
      
      // Add title
      addText(t('pdf_modal.pdf_title'), 18, true);
      
      // Add date
      addText(t('pdf_modal.generated_on', { date: new Date().toLocaleDateString('en-US') }), 10, false);
      yPosition += lineHeight;
      
      // Convert markdown to plain text and process
      const lines = content.split('\n');
      
      lines.forEach((line: string) => {
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          yPosition += lineHeight * 0.5;
          return;
        }
        
        // Handle headers (check from most specific to least specific)
        if (trimmedLine.startsWith('######')) {
          const text = trimmedLine.replace(/^######\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 10, true);
        } else if (trimmedLine.startsWith('#####')) {
          const text = trimmedLine.replace(/^#####\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 11, true);
        } else if (trimmedLine.startsWith('####')) {
          const text = trimmedLine.replace(/^####\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 12, true);
        } else if (trimmedLine.startsWith('###')) {
          const text = trimmedLine.replace(/^###\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 14, true);
        } else if (trimmedLine.startsWith('##')) {
          const text = trimmedLine.replace(/^##\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 16, true);
        } else if (trimmedLine.startsWith('#')) {
          const text = trimmedLine.replace(/^#\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 18, true);
        }
        // Handle lines that are completely bold (e.g., **Title**)
        else if (/^\*\*[^*]+\*\*$/.test(trimmedLine)) {
          const text = trimmedLine.replace(/\*\*/g, '');
          addText(text, 14, true);
        }
        // Handle lists
        else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          const text = '• ' + trimmedLine.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 10, false);
        } else if (/^\d+\.\s/.test(trimmedLine)) {
          const text = trimmedLine.replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 10, false);
        }
        // Handle regular text
        else {
          const text = trimmedLine.replace(/\*\*/g, '').replace(/\*/g, '');
          addText(text, 10, false);
        }
      });
      
      // Add footer to all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`${t('pdf_modal.pdf_footer')}`, margin, pageHeight - 10);
        pdf.text(`${t('pdf_modal.page_footer', { current: i, total: pageCount })}`, pageWidth - margin - 30, pageHeight - 10);
      }
      
      // Save PDF
      pdf.save('project-plan.pdf');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(t('pdf_modal.error_message'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareLinkedIn = () => {
    const shareText = encodeURIComponent(t('pdf_modal.share_text'));
    const shareUrl = encodeURIComponent(window.location.origin);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&text=${shareText}`;
    
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="flex items-center justify-center z-50"
      style={{
        position: 'fixed',
        left: '0%',
        right: '0%',
        top: '0%',
        bottom: '0%',
        background: 'rgba(6, 19, 51, 0.74)'
      }}
    >
      <div 
        className="bg-white rounded-[10px] relative md:w-[602px] w-full md:max-w-[calc(100%-32px)] max-w-[calc(100%-32px)] md:p-[15px_10px_20px] p-[10px_16px_12px]"
        style={{
          boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute md:top-[10px] md:right-[10px] top-[8px] right-[12px] md:p-[8px] p-[6px]"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '100px'
          }}
        >
          <div style={{
            width: '19px',
            height: '19px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.3438 14.375C14.1562 14.5625 13.8125 14.5625 13.625 14.375L9.5 10.2188L5.34375 14.375C5.15625 14.5625 4.8125 14.5625 4.625 14.375C4.4375 14.1875 4.4375 13.8438 4.625 13.6562L8.78125 9.5L4.625 5.375C4.4375 5.1875 4.4375 4.84375 4.625 4.65625C4.8125 4.46875 5.15625 4.46875 5.34375 4.65625L9.5 8.8125L13.625 4.65625C13.8125 4.46875 14.1562 4.46875 14.3438 4.65625C14.5312 4.84375 14.5312 5.1875 14.3438 5.375L10.1875 9.5L14.3438 13.6562C14.5312 13.8438 14.5312 14.1875 14.3438 14.375Z" fill="#061333"/>
            </svg>
          </div>
        </button>

        {/* Title with icon */}
        <div 
          className="md:gap-[10px] gap-[8px] md:pl-[10px] pl-0 md:mb-[10px] mb-[8px]"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'stretch'
          }}
        >
          <div className="md:gap-[5px] gap-[4px]" style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            {/* Icon - file duotone */}
            <div className="md:w-[20px] md:h-[20px] w-[18px] h-[18px] flex items-center justify-center relative">
              <svg className="md:w-[20px] md:h-[20px] w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.1875 0.875L17.125 6.8125H11.1875V0.875Z" fill="#6B7BE9"/>
                <path opacity="0.4" d="M11.1875 0.875V6.8125H17.125V17.5C17.125 18.8359 16.0488 19.875 14.75 19.875H5.25C3.91406 19.875 2.875 18.8359 2.875 17.5V3.25C2.875 1.95117 3.91406 0.875 5.25 0.875H11.1875Z" fill="#6B7BE9"/>
              </svg>
            </div>
            {/* Title text */}
            <h2 
              className="md:text-[18px] text-[14px]"
              style={{
                fontFamily: 'Product Sans, system-ui, sans-serif',
                fontWeight: 700,
                lineHeight: '1.2130000856187608em',
                color: '#061333',
                margin: 0,
                textAlign: 'left'
              }}
            >
              {t('pdf_modal.title')}
            </h2>
          </div>
        </div>

        {/* Content container */}
        <div className="md:gap-[10px] gap-[8px] md:px-[10px] px-0" style={{
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'stretch'
        }}>
          {/* Description section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'stretch'
          }}>
            <p 
              className="md:text-[14px] text-[11px] md:leading-[1.4285714285714286em] leading-[1.4em]"
              style={{
                fontFamily: 'Product Sans Light, system-ui, sans-serif',
                fontWeight: 300,
                color: '#061333',
                margin: 0,
                textAlign: 'left'
              }}
            >
              {t('pdf_modal.description')}
            </p>
          </div>

          {/* Buttons section */}
          <div className="md:gap-[10px] gap-[8px]" style={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'stretch'
          }}>
            {/* Share on LinkedIn button */}
            <button
              onClick={handleShareLinkedIn}
              className="md:h-[80px] h-[50px] md:py-[10px] py-[6px] md:px-[24px] px-[14px] md:gap-[8px] gap-[6px]"
              style={{
                width: '100%',
                background: '#3C51E2',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3041B5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3C51E2';
              }}
            >
              {/* LinkedIn icon */}
              <div className="md:w-[23px] md:h-[23px] w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                <svg className="md:w-[23px] md:h-[23px] w-[18px] h-[18px]" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.25 3.375C18.8477 3.375 19.375 3.90234 19.375 4.53516V18C19.375 18.6328 18.8477 19.125 18.25 19.125H4.71484C4.11719 19.125 3.625 18.6328 3.625 18V4.53516C3.625 3.90234 4.11719 3.375 4.71484 3.375H18.25ZM8.37109 16.875V9.38672H6.05078V16.875H8.37109ZM7.21094 8.33203C7.94922 8.33203 8.54688 7.73438 8.54688 6.99609C8.54688 6.25781 7.94922 5.625 7.21094 5.625C6.4375 5.625 5.83984 6.25781 5.83984 6.99609C5.83984 7.73438 6.4375 8.33203 7.21094 8.33203ZM17.125 16.875V12.7617C17.125 10.7578 16.668 9.17578 14.3125 9.17578C13.1875 9.17578 12.4141 9.80859 12.0977 10.4062H12.0625V9.38672H9.84766V16.875H12.168V13.1836C12.168 12.1992 12.3438 11.25 13.5742 11.25C14.7695 11.25 14.7695 12.375 14.7695 13.2188V16.875H17.125Z" fill="white"/>
                </svg>
              </div>
              {/* Button text */}
              <span className="md:text-[18px] text-[13px]"
                style={{
                  fontFamily: 'Product Sans Light, system-ui, sans-serif',
                  fontWeight: 300,
                  lineHeight: '1.2130000856187608em',
                  color: '#FFFFFF',
                  textAlign: 'left'
                }}>
                {t('pdf_modal.share_linkedin')}
              </span>
            </button>

            {/* Download as PDF button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="md:h-[80px] h-[50px] md:py-[10px] py-[6px] md:px-[24px] px-[14px] md:gap-[8px] gap-[6px]"
              style={{
                width: '100%',
                background: '#3C51E2',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                border: 'none',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                boxSizing: 'border-box',
                opacity: isDownloading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isDownloading) {
                  e.currentTarget.style.background = '#3041B5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDownloading) {
                  e.currentTarget.style.background = '#3C51E2';
                }
              }}
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full md:h-5 md:w-5 h-4 w-4 border-b-2 border-current flex-shrink-0"></div>
                  <span className="md:text-[18px] text-[13px]"
                    style={{
                      fontFamily: 'Product Sans Light, system-ui, sans-serif',
                      fontWeight: 300,
                      lineHeight: '1.2130000856187608em',
                      color: '#FFFFFF',
                      textAlign: 'left'
                    }}>
                    {t('pdf_modal.downloading')}
                  </span>
                </>
              ) : (
                <>
                  {/* Download icon */}
                  <div className="md:w-[23px] md:h-[23px] w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                    <svg className="md:w-[23px] md:h-[23px] w-[18px] h-[18px]" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.0781 16.1719L6.01562 11.1094C5.80469 10.8984 5.80469 10.5117 6.01562 10.3008C6.22656 10.0898 6.61328 10.0898 6.82422 10.3008L10.9375 14.4141V3.9375C10.9375 3.65625 11.1836 3.375 11.5 3.375C11.7812 3.375 12.0625 3.65625 12.0625 3.9375V14.4141L16.1406 10.3008C16.3516 10.0898 16.7383 10.0898 16.9492 10.3008C17.1602 10.5117 17.1602 10.8984 16.9492 11.1094L11.8867 16.1719C11.7812 16.2773 11.6406 16.3125 11.5 16.3125C11.3242 16.3125 11.1836 16.2773 11.0781 16.1719ZM17.6875 18C17.9688 18 18.25 18.2812 18.25 18.5625C18.25 18.8789 17.9688 19.125 17.6875 19.125H5.3125C4.99609 19.125 4.75 18.8789 4.75 18.5625C4.75 18.2812 4.99609 18 5.3125 18H17.6875Z" fill="white"/>
                    </svg>
                  </div>
                  {/* Button text */}
                  <span className="md:text-[18px] text-[13px]"
                    style={{
                      fontFamily: 'Product Sans Light, system-ui, sans-serif',
                      fontWeight: 300,
                      lineHeight: '1.2130000856187608em',
                      color: '#FFFFFF',
                      textAlign: 'left'
                    }}>
                    {t('pdf_modal.download_pdf')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
