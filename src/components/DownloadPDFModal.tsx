/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { extractBriefTextFromContent } from '../utils/chat';

interface DownloadPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadPDFModal({ isOpen, onClose }: DownloadPDFModalProps) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const rawFeatures = t('pdf_modal.features', { returnObjects: true }) as string[] | string;
  const features = Array.isArray(rawFeatures) ? rawFeatures : [];
  const demoUrl = 'https://www.airsaas.io/fr/demo';

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
          
          // First, try to extract brief_text from JSON if present
          const extractedBriefText = extractBriefTextFromContent(content);
          if (extractedBriefText) {
            // Convert \n escape sequences to actual newlines for proper processing
            content = extractedBriefText.replace(/\\n/g, '\n');
          } else {
            // Extract content between markdown separators (---\n\n) if no JSON brief_text found
            const separatorPattern = /---\s*\n\s*\n([\s\S]*?)\n\s*\n---/;
            const match = content.match(separatorPattern);
            
            if (match && match[1]) {
              content = match[1].trim();
            }
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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking on the overlay (not on the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#061333]/75 px-5 py-0 sm:px-5 sm:py-5"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full h-full sm:h-auto sm:max-w-[580px] flex items-stretch sm:items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-none overflow-hidden rounded-[12px] sm:rounded-[16px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close modal"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div 
            className="flex-1 overflow-y-auto sm:overflow-visible [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-indigo-600 [&::-webkit-scrollbar-thumb]:rounded-full"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4F46E5 #f1f5f9'
            }}
          >
            <div className="px-6 pt-5 pb-5 text-center sm:px-10 sm:pt-10 sm:pb-6">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-[0_8px_24px_rgba(79,70,229,0.35)] sm:h-16 sm:w-16 sm:mb-6">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 stroke-white stroke-[2.5]">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[22px] font-bold leading-[1.3] text-slate-900 sm:text-[26px]">
              {t('pdf_modal.title')}
              <span className="block text-indigo-600">{t('pdf_modal.subtitle')}</span>
            </h2>
            <p className="mt-3 text-base leading-[1.5] text-slate-500 sm:mt-4">
              {t('pdf_modal.description')}
            </p>
          </div>

          <div className="px-6 pb-6 sm:px-10 sm:pb-8">
            <div className="mb-7 rounded-xl bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 p-5 sm:py-6 sm:px-7">
              <div>
                {features.map((feature, index) => (
                  <div key={feature} className={`flex items-start text-sm font-medium leading-[1.6] sm:text-[15px] ${index !== features.length - 1 ? 'mb-4' : ''}`} style={{ color: '#334155' }}>
                    <span className="mr-3 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_8px_16px_rgba(79,70,229,0.25)]">
                      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 stroke-white stroke-[3]">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="leading-[1.6]" style={{ color: '#334155' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="stroke-white stroke-[2.5]">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t('pdf_modal.demo_cta')}</span>
              </a>

              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-slate-200 bg-white px-6 py-3.5 text-[15px] font-semibold text-indigo-600 shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-indigo-700 hover:shadow-[0_8px_20px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloading ? (
                  <>
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-b-transparent" />
                    <span>{t('pdf_modal.downloading')}</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="stroke-current stroke-[2]">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                    </svg>
                    <span>{t('pdf_modal.download_pdf')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </div>

          <div className="flex-shrink-0 border-t border-slate-100 px-6 pb-6 pt-4 text-center sm:px-10 sm:pb-8 sm:pt-5 bg-white">
            <button
              onClick={handleShareLinkedIn}
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#0A66C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              {t('pdf_modal.share_linkedin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
