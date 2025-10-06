/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
      // Crear el contenido del PDF
      const generatePDF = async () => {
        // Importar jsPDF dinámicamente
        const { jsPDF } = await import('jspdf');
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = margin;
        const lineHeight = 6;
        const maxWidth = pageWidth - (margin * 2);
        
        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(t('pdf_modal.pdf_title'), margin, yPosition);
        yPosition += lineHeight * 2;
        
        // Date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(t('pdf_modal.generated_on', { date: new Date().toLocaleDateString('en-US') }), margin, yPosition);
        yPosition += lineHeight * 2;
        
        // Get messages from localStorage
        const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        
        // Get only the last assistant message
        const assistantMessages = messages.filter((message: any) => message.role === 'assistant');
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
        
        if (!lastAssistantMessage || !lastAssistantMessage.content) {
          doc.setFontSize(12);
          doc.text(t('pdf_modal.no_content'), margin, yPosition);
        } else {
          let content = lastAssistantMessage.content;
          
          // Extract content between markdown separators (---\n\n)
          const separatorPattern = /---\s*\n\s*\n([\s\S]*?)\n\s*\n---/;
          const match = content.match(separatorPattern);
          
          if (match && match[1]) {
            content = match[1].trim();
          }
          
          // Format markdown content for PDF
          const formattedContent = formatMarkdownForPDF(content);
          
          // Add formatted content
          formattedContent.forEach((section: any) => {
            if (yPosition > doc.internal.pageSize.getHeight() - 30) {
              doc.addPage();
              yPosition = margin;
            }
            
            // Handle different section types
            if (section.type === 'spacing') {
              yPosition += lineHeight * 0.5;
              return;
            }
            
            // Set font based on section type
            switch (section.type) {
              case 'heading': {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                yPosition += lineHeight * 0.5;
                // Simple text for headings
                const headingLines = doc.splitTextToSize(section.text, maxWidth);
                headingLines.forEach((line: string) => {
                  if (yPosition > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPosition = margin;
                  }
                  doc.text(line, margin, yPosition);
                  yPosition += lineHeight;
                });
                break;
              }
                
              case 'subheading': {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                yPosition += lineHeight * 0.3;
                // Simple text for subheadings
                const subheadingLines = doc.splitTextToSize(section.text, maxWidth);
                subheadingLines.forEach((line: string) => {
                  if (yPosition > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPosition = margin;
                  }
                  doc.text(line, margin, yPosition);
                  yPosition += lineHeight;
                });
                break;
              }
                
              case 'list':
              case 'numbered-list':
                doc.setFontSize(9);
                // Process list content with mixed formatting
                yPosition = renderMixedContent(doc, section.content, margin + 10, yPosition, maxWidth - 10, lineHeight, margin);
                yPosition += lineHeight * 0.5;
                break;
                
              default:
                doc.setFontSize(9);
                // Process text content with mixed formatting
                yPosition = renderMixedContent(doc, section.content, margin, yPosition, maxWidth, lineHeight, margin);
                yPosition += lineHeight * 0.5;
            }
            
            yPosition += lineHeight * 0.5;
          });
        }
        
        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(t('pdf_modal.page_footer', { current: i, total: pageCount }), pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
          doc.text(t('pdf_modal.pdf_footer'), margin, doc.internal.pageSize.getHeight() - 10);
        }
        
        // Download the PDF
        doc.save('project-plan.pdf');
      };
      
      // Function to format markdown content for PDF
      const formatMarkdownForPDF = (content: string) => {
        const sections: any[] = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          
          if (!trimmedLine) {
            sections.push({ type: 'spacing', text: '' });
            return;
          }
          
          // Headers
          if (trimmedLine.startsWith('###')) {
            sections.push({ type: 'subheading', text: trimmedLine.replace(/^###\s*/, '') });
          } else if (trimmedLine.startsWith('##')) {
            sections.push({ type: 'heading', text: trimmedLine.replace(/^##\s*/, '') });
          } else if (trimmedLine.startsWith('#')) {
            sections.push({ type: 'heading', text: trimmedLine.replace(/^#\s*/, '') });
          }
          // Lists with markdown formatting
          else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            const listContent = trimmedLine.replace(/^[-*]\s*/, '');
            // Process markdown within list items
            const processedContent = processInlineMarkdown(listContent);
            sections.push({ type: 'list', content: processedContent });
          } else if (/^\d+\.\s/.test(trimmedLine)) {
            const listContent = trimmedLine.replace(/^\d+\.\s/, '');
            const processedContent = processInlineMarkdown(listContent);
            sections.push({ type: 'numbered-list', content: processedContent });
          }
          // Regular text
          else {
            const processedContent = processInlineMarkdown(trimmedLine);
            sections.push({ type: 'text', content: processedContent });
          }
        });
        
        return sections;
      };
      
      // Function to process inline markdown formatting
      const processInlineMarkdown = (text: string) => {
        const parts: any[] = [];
        let currentIndex = 0;
        
        // Find all markdown patterns
        const patterns = [
          { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
          { regex: /\*(.*?)\*/g, type: 'italic' },
          { regex: /`(.*?)`/g, type: 'code' },
          { regex: /\[([^\]]+)\]\([^)]+\)/g, type: 'link' }
        ];
        
        const allMatches: any[] = [];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.regex.exec(text)) !== null) {
            allMatches.push({
              type: pattern.type,
              text: match[1],
              start: match.index,
              end: match.index + match[0].length,
              original: match[0]
            });
          }
        });
        
        // Sort matches by start position
        allMatches.sort((a, b) => a.start - b.start);
        
        // Build parts array
        allMatches.forEach(match => {
          // Add text before match
          if (match.start > currentIndex) {
            const beforeText = text.slice(currentIndex, match.start);
            if (beforeText) {
              parts.push({ type: 'normal', text: beforeText });
            }
          }
          
          // Add formatted text
          parts.push({ type: match.type, text: match.text });
          currentIndex = match.end;
        });
        
        // Add remaining text
        if (currentIndex < text.length) {
          const remainingText = text.slice(currentIndex);
          if (remainingText) {
            parts.push({ type: 'normal', text: remainingText });
          }
        }
        
        // If no markdown found, return as normal text
        if (parts.length === 0) {
          parts.push({ type: 'normal', text: text });
        }
        
        return parts;
      };
      
      // Function to render mixed content with different formatting
      const renderMixedContent = (doc: any, content: any[], startX: number, startY: number, maxWidth: number, lineHeight: number, pageMargin: number) => {
        let currentX = startX;
        let currentY = startY;
        let remainingWidth = maxWidth;

        content.forEach((part: any) => {
          // Save current font state
          const originalFont = doc.getFont();
          const originalFontSize = doc.getFontSize();

          // Set font style based on part type
          switch (part.type) {
            case 'bold':
              doc.setFont('helvetica', 'bold');
              break;
            case 'italic':
              doc.setFont('helvetica', 'italic');
              break;
            case 'code':
              doc.setFont('courier', 'normal');
              break;
            case 'link':
              doc.setFont('helvetica', 'normal'); // Links are just text for now
              break;
            default:
              doc.setFont('helvetica', 'normal');
              break;
          }

          let textToProcess = part.text;

          while (textToProcess.length > 0) {
            // Check for page overflow before adding each line
            if (currentY > doc.internal.pageSize.getHeight() - 30) { // 30 for footer
              doc.addPage();
              currentY = pageMargin; // Reset Y position for new page
              currentX = startX; // Reset X position for new page
              remainingWidth = maxWidth; // Reset remaining width for new page
            }

            // Measure how much of the text fits on the current line
            const textFits = doc.splitTextToSize(textToProcess, remainingWidth);
            const lineSegment = textFits[0]; // The part that fits on the current line

            if (lineSegment.length === 0 && textToProcess.length > 0) {
                // If no text fits on the current line, move to the next line
                // This can happen if remainingWidth is too small for even one character
                // or if the first word is longer than remainingWidth.
                currentY += lineHeight;
                currentX = startX;
                remainingWidth = maxWidth;
                continue; // Try to fit the text on the new line
            }

            // Print the line segment
            doc.text(lineSegment, currentX, currentY);
            currentX += doc.getTextWidth(lineSegment);
            remainingWidth -= doc.getTextWidth(lineSegment);

            // Remove the printed segment from textToProcess
            textToProcess = textToProcess.substring(lineSegment.length);

            // If there's still textToProcess, or if the current line is full, move to a new line
            if (textToProcess.length > 0 || remainingWidth <= 0) {
              currentY += lineHeight;
              currentX = startX;
              remainingWidth = maxWidth;
            }
          }

          // Restore original font state for the next part
          doc.setFont(originalFont.fontName, originalFont.fontStyle);
          doc.setFontSize(originalFontSize);
        });

        return currentY; // Return the updated Y position
      };
      
      await generatePDF();
      // Don't close the modal after PDF generation
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
