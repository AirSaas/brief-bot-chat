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
    <div className="fixed inset-0 bg-gray-50/75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-black mb-3 text-center">
          {t('pdf_modal.title')}
        </h2>

        {/* Description */}
        <p className="text-sm text-black mb-6 text-center">
          {t('pdf_modal.description')}
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Share on LinkedIn button */}
          <button
            onClick={handleShareLinkedIn}
            className="w-full bg-[#3C51E2] text-white py-3 px-4 font-medium flex items-center justify-center gap-2 hover:bg-[#3041B5] rounded-full transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"/>
            </svg>
            {t('pdf_modal.share_linkedin')}
          </button>

          {/* Download as PDF button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="w-full rounded-full bg-white border border-[#3C51E2] text-[#3C51E2] py-3 px-4 font-medium flex items-center justify-center gap-2 hover:bg-[#3C51E2] hover:text-white transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                {t('pdf_modal.downloading')}
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                {t('pdf_modal.download_pdf')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
