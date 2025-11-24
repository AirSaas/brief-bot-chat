import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import Markdown from "react-markdown";
import { extractBriefTextFromContent as extractBriefTextFromContentUtil } from "../utils/chat";

// Function to hide language instruction text between equals signs for display
const hideLanguageInstruction = (text: string): string => {
  return text.replace(/\s*=my language is English, let's keep this conversation completely in English=\s*/g, '')
             .replace(/\s*=ma langue est le français, gardons cette conversation entièrement en français=\s*/g, '');
};

const isEverythingCorrectAnswer = (answer: string) => {
  const lowerAnswer = answer.toLowerCase();
  return lowerAnswer === "everything is correct" || lowerAnswer === "tout est correct";
};

const isChangesAnswer = (answer: string) => {
  const lowerAnswer = answer.toLowerCase();
  return (
    lowerAnswer.includes("i need to make") ||
    lowerAnswer.includes("i would like to make") ||
    lowerAnswer.includes("i want to make") ||
    lowerAnswer.includes("je souhaite apporter") ||
    lowerAnswer.includes("j'aimerais faire") ||
    lowerAnswer.includes("des modifications")
  );
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const DEFAULT_QUICK_ANSWERS = new Set([
  "Generate other examples",
  "Skip this question",
  "Générer d'autres exemples",
  "Sauter cette question",
]);

const PDF_QUICK_ANSWERS = new Set([
  "Download as PDF",
  "Télécharger en PDF",
  "Télécharger en tant que PDF",
  "Télécharger au format PDF",
  "Télécharger comme PDF",
]);

const NEW_BRIEF_QUICK_ANSWERS = new Set([
  "Start a new brief",
  "Commencer un nouveau brief",
  "Create a new brief",
  "Créer un nouveau brief",
]);

// Use the shared utility function
const extractBriefTextFromContent = extractBriefTextFromContentUtil;

// Function to detect if content contains a JSON with brief_text or starts with brief patterns
const hasBriefTextPattern = (content: string): boolean => {
  try {
    const contentStr = String(content).trim();
    
    // First, check if content directly starts with brief patterns
    if (contentStr.startsWith('## Project Context') ||
        contentStr.startsWith('## Project Brief') ||
        contentStr.startsWith('## Project Brief:') ||
        contentStr.startsWith('### Project Brief:') || 
        contentStr.startsWith('### Project Context') ||
        contentStr.startsWith('### Fiche Projet:') ||
        contentStr.startsWith('### Brief Projet:') ||
        contentStr.startsWith('### Contexte du Projet') ||
        contentStr.startsWith('### Résumé du projet') ||
        contentStr.startsWith('### Résumé du Projet') ||
        contentStr.startsWith('## Fiche Projet') ||
        contentStr.startsWith('## Brief Projet')) {
      return true;
    }
    
    // Check for JSON block with brief_text
    const briefText = extractBriefTextFromContent(contentStr);
    if (briefText) {
      // Check if brief_text contains brief patterns (English or French)
      // Check for patterns with ## (two #) for English briefs
      const hasEnglishPatternTwoHash = 
        briefText.startsWith('## Project Context') ||
        briefText.startsWith('## Project Brief') ||
        briefText.startsWith('## Project Brief:') ||
        briefText.includes('## Project Context') ||
        briefText.includes('## Project Brief') ||
        briefText.includes('## Project Brief:') ||
        briefText.includes('## Protagonist') ||
        briefText.includes('## Challenge') ||
        briefText.includes('## Resolution') ||
        briefText.includes('## Importance') ||
        briefText.includes('## Target Users') ||
        briefText.includes('## Project Objectives') ||
        briefText.includes('## Risks') ||
        briefText.includes('## Budget') ||
        briefText.includes('## Conclusion');
      
      // Check for patterns with ### (three #) for English briefs
      const hasEnglishPatternThreeHash = 
        briefText.startsWith('### Project Brief:') ||
        briefText.startsWith('### Project Context') ||
        briefText.includes('### Project Brief:') ||
        briefText.includes('### Project Context') ||
        briefText.includes('#### Context') ||
        briefText.includes('#### Protagonists') ||
        briefText.includes('#### Main Challenge') ||
        briefText.includes('### Desired Transformation') ||
        briefText.includes('### Obstacles') ||
        briefText.includes('### Consequences') ||
        briefText.includes('### Available Resources') ||
        briefText.includes('### Timeline') ||
        briefText.includes('### Success Metrics') ||
        briefText.includes('### Deliverables');
      
      const hasFrenchPattern = 
        briefText.startsWith('### Fiche Projet:') ||
        briefText.startsWith('### Brief Projet:') ||
        briefText.startsWith('### Contexte du Projet') ||
        briefText.startsWith('### Résumé du projet') ||
        briefText.startsWith('### Résumé du Projet') ||
        briefText.includes('### Contexte du Projet') ||
        briefText.includes('### Fiche Projet:') ||
        briefText.includes('### Résumé du projet') ||
        briefText.includes('### Résumé du Projet') ||
        briefText.includes('#### Contexte') ||
        briefText.includes('#### Contexte et Objectif') ||
        briefText.includes('#### Protagonistes') ||
        briefText.includes('#### Défi') ||
        briefText.includes('#### Défi Principal') ||
        briefText.includes('#### Risques') ||
        briefText.includes('#### Risques en Cas d\'Inaction') ||
        briefText.includes('#### Importance') ||
        briefText.includes('#### Importance du Projet') ||
        briefText.includes('#### Budget') ||
        briefText.includes('#### Budget Prévisionnel');
      
      if (hasEnglishPatternTwoHash || hasEnglishPatternThreeHash || hasFrenchPattern) {
        return true;
      }
      
      // Also check for common brief structure indicators (including ## patterns)
      const hasBriefStructure = 
        briefText.includes('## Project Context') ||
        briefText.includes('## Project Brief') ||
        briefText.includes('## Project Brief:') ||
        briefText.includes('## Protagonist') ||
        briefText.includes('## Challenge') ||
        briefText.includes('## Resolution') ||
        briefText.includes('## Importance') ||
        briefText.includes('## Target Users') ||
        briefText.includes('## Project Objectives') ||
        briefText.includes('## Risks') ||
        briefText.includes('## Budget') ||
        briefText.includes('## Conclusion') ||
        briefText.includes('#### Context') ||
        briefText.includes('#### Contexte') ||
        briefText.includes('#### Contexte et Objectif') ||
        briefText.includes('#### Protagonists') ||
        briefText.includes('#### Protagonistes') ||
        briefText.includes('#### Main Challenge') ||
        briefText.includes('#### Défi') ||
        briefText.includes('#### Défi Principal') ||
        briefText.includes('#### Défi Central') ||
        briefText.includes('#### Risques') ||
        briefText.includes('#### Risques en Cas d\'Inaction') ||
        briefText.includes('#### Budget') ||
        briefText.includes('#### Budget Prévisionnel') ||
        briefText.includes('#### Importance') ||
        briefText.includes('#### Importance du Projet') ||
        briefText.includes('#### Messages Clés') ||
        briefText.includes('#### Conclusion') ||
        briefText.includes('### Project Context') ||
        briefText.includes('### Target Users') ||
        briefText.includes('### Project Objectives') ||
        briefText.includes('### Risks') ||
        briefText.includes('### Budget') ||
        briefText.includes('### Conclusion') ||
        briefText.includes('### Desired Transformation') ||
        briefText.includes('### Obstacles') ||
        briefText.includes('### Consequences') ||
        briefText.includes('### Available Resources') ||
        briefText.includes('### Timeline') ||
        briefText.includes('### Success Metrics') ||
        briefText.includes('### Deliverables');
      
      if (hasBriefStructure) {
        return true;
      }
    }
    
    // Check if content directly contains the pattern (for resilience)
    if (contentStr.includes('"brief_text"')) {
      const hasBriefPattern = 
        contentStr.includes('## Project Context') ||
        contentStr.includes('## Project Brief') ||
        contentStr.includes('## Project Brief:') ||
        contentStr.includes('## Protagonist') ||
        contentStr.includes('## Challenge') ||
        contentStr.includes('## Resolution') ||
        contentStr.includes('## Importance') ||
        contentStr.includes('## Target Users') ||
        contentStr.includes('## Project Objectives') ||
        contentStr.includes('## Risks') ||
        contentStr.includes('## Budget') ||
        contentStr.includes('## Conclusion') ||
        contentStr.includes('### Project Brief:') || 
        contentStr.includes('### Project Context') ||
        contentStr.includes('### Target Users') ||
        contentStr.includes('### Project Objectives') ||
        contentStr.includes('### Risks') ||
        contentStr.includes('### Budget') ||
        contentStr.includes('### Conclusion') ||
        contentStr.includes('### Fiche Projet:') ||
        contentStr.includes('### Brief Projet:') ||
        contentStr.includes('### Contexte du Projet') ||
        contentStr.includes('### Résumé du projet') ||
        contentStr.includes('### Résumé du Projet') ||
        contentStr.includes('#### Context') ||
        contentStr.includes('#### Contexte') ||
        contentStr.includes('#### Contexte et Objectif') ||
        contentStr.includes('#### Protagonists') ||
        contentStr.includes('#### Protagonistes') ||
        contentStr.includes('#### Défi Principal') ||
        contentStr.includes('#### Risques en Cas d\'Inaction') ||
        contentStr.includes('#### Importance du Projet') ||
        contentStr.includes('#### Budget Prévisionnel') ||
        contentStr.includes('### Desired Transformation') ||
        contentStr.includes('### Obstacles') ||
        contentStr.includes('### Consequences') ||
        contentStr.includes('### Available Resources') ||
        contentStr.includes('### Timeline') ||
        contentStr.includes('### Success Metrics') ||
        contentStr.includes('### Deliverables');
      
      if (hasBriefPattern) {
        return true;
      }
    }
    
    // Also check if content contains brief patterns anywhere (including direct content without JSON)
    if (contentStr.includes('## Project Context') ||
        contentStr.includes('## Project Brief') ||
        contentStr.includes('## Project Brief:') ||
        contentStr.includes('### Project Brief:') || 
        contentStr.includes('### Project Context') ||
        contentStr.includes('### Fiche Projet:') ||
        contentStr.includes('### Brief Projet:') ||
        contentStr.includes('### Contexte du Projet') ||
        contentStr.includes('### Résumé du projet') ||
        contentStr.includes('### Résumé du Projet') ||
        contentStr.includes('## Fiche Projet') ||
        contentStr.includes('## Brief Projet')) {
      // Additional check: make sure it looks like a brief
      const hasBriefStructure = 
        contentStr.includes('## Project Context') ||
        contentStr.includes('## Project Brief') ||
        contentStr.includes('## Project Brief:') ||
        contentStr.includes('## Protagonist') ||
        contentStr.includes('## Challenge') ||
        contentStr.includes('## Resolution') ||
        contentStr.includes('## Importance') ||
        contentStr.includes('## Target Users') ||
        contentStr.includes('## Project Objectives') ||
        contentStr.includes('## Risks') ||
        contentStr.includes('## Budget') ||
        contentStr.includes('## Conclusion') ||
        contentStr.includes('#### Context') ||
        contentStr.includes('#### Contexte') ||
        contentStr.includes('#### Contexte et Objectif') ||
        contentStr.includes('#### Protagonists') ||
        contentStr.includes('#### Protagonistes') ||
        contentStr.includes('#### Main Challenge') ||
        contentStr.includes('#### Défi') ||
        contentStr.includes('#### Défi Principal') ||
        contentStr.includes('#### Risques') ||
        contentStr.includes('#### Risques en Cas d\'Inaction') ||
        contentStr.includes('#### Budget') ||
        contentStr.includes('#### Budget Prévisionnel') ||
        contentStr.includes('#### Importance') ||
        contentStr.includes('#### Importance du Projet') ||
        contentStr.includes('#### Messages Clés') ||
        contentStr.includes('#### Conclusion') ||
        contentStr.includes('### Project Context') ||
        contentStr.includes('### Target Users') ||
        contentStr.includes('### Project Objectives') ||
        contentStr.includes('### Risks') ||
        contentStr.includes('### Budget') ||
        contentStr.includes('### Conclusion') ||
        contentStr.includes('### Résumé du projet') ||
        contentStr.includes('### Résumé du Projet') ||
        contentStr.includes('### Desired Transformation') ||
        contentStr.includes('### Obstacles') ||
        contentStr.includes('### Consequences') ||
        contentStr.includes('### Available Resources') ||
        contentStr.includes('### Timeline') ||
        contentStr.includes('### Success Metrics') ||
        contentStr.includes('### Deliverables');
      
      if (hasBriefStructure) {
        return true;
      }
    }
    
    return false;
  } catch {
    // If parsing fails, check for direct pattern match as fallback
    const contentStr = String(content).trim();
    
    // Check if it starts with the pattern
    if (contentStr.startsWith('## Project Context') ||
        contentStr.startsWith('## Project Brief') ||
        contentStr.startsWith('## Project Brief:') ||
        contentStr.startsWith('### Project Brief:') || 
        contentStr.startsWith('### Project Context') ||
        contentStr.startsWith('### Fiche Projet:') ||
        contentStr.startsWith('### Brief Projet:') ||
        contentStr.startsWith('### Contexte du Projet') ||
        contentStr.startsWith('### Résumé du projet') ||
        contentStr.startsWith('### Résumé du Projet') ||
        contentStr.startsWith('## Fiche Projet') ||
        contentStr.startsWith('## Brief Projet')) {
      return true;
    }
    
    // Check if it contains the pattern and has brief structure
    if (contentStr.includes('## Project Context') ||
        contentStr.includes('## Project Brief') ||
        contentStr.includes('## Project Brief:') ||
        contentStr.includes('### Project Brief:') || 
        contentStr.includes('### Project Context') ||
        contentStr.includes('### Fiche Projet:') ||
        contentStr.includes('### Brief Projet:') ||
        contentStr.includes('### Contexte du Projet') ||
        contentStr.includes('### Résumé du projet') ||
        contentStr.includes('### Résumé du Projet') ||
        contentStr.includes('## Fiche Projet') ||
        contentStr.includes('## Brief Projet')) {
      const hasBriefStructure = 
        contentStr.includes('## Project Context') ||
        contentStr.includes('## Project Brief') ||
        contentStr.includes('## Project Brief:') ||
        contentStr.includes('## Protagonist') ||
        contentStr.includes('## Challenge') ||
        contentStr.includes('## Resolution') ||
        contentStr.includes('## Importance') ||
        contentStr.includes('## Target Users') ||
        contentStr.includes('## Project Objectives') ||
        contentStr.includes('## Risks') ||
        contentStr.includes('## Budget') ||
        contentStr.includes('## Conclusion') ||
        contentStr.includes('#### Context') ||
        contentStr.includes('#### Contexte') ||
        contentStr.includes('#### Contexte et Objectif') ||
        contentStr.includes('#### Protagonists') ||
        contentStr.includes('#### Protagonistes') ||
        contentStr.includes('#### Défi') ||
        contentStr.includes('#### Défi Principal') ||
        contentStr.includes('#### Risques') ||
        contentStr.includes('#### Risques en Cas d\'Inaction') ||
        contentStr.includes('#### Importance') ||
        contentStr.includes('#### Importance du Projet') ||
        contentStr.includes('#### Budget') ||
        contentStr.includes('#### Budget Prévisionnel') ||
        contentStr.includes('### Project Context') ||
        contentStr.includes('### Target Users') ||
        contentStr.includes('### Project Objectives') ||
        contentStr.includes('### Risks') ||
        contentStr.includes('### Budget') ||
        contentStr.includes('### Conclusion') ||
        contentStr.includes('### Résumé du projet') ||
        contentStr.includes('### Résumé du Projet') ||
        contentStr.includes('### Desired Transformation') ||
        contentStr.includes('### Obstacles') ||
        contentStr.includes('### Consequences') ||
        contentStr.includes('### Available Resources') ||
        contentStr.includes('### Timeline') ||
        contentStr.includes('### Success Metrics') ||
        contentStr.includes('### Deliverables');
      
      return hasBriefStructure;
    }
    
    return false;
  }
};

export function MessageBubble({
  role,
  children,
  isAudio = false,
  audioFile,
  showCopyButton = false,
  quickAnswers = [],
  onQuickAnswerClick,
  onDownloadPDF,
  selectedAnswers = [],
  onAnswerSelect,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  isAudio?: boolean;
  audioFile?: File;
  showCopyButton?: boolean;
  quickAnswers?: string[];
  onQuickAnswerClick?: (answer: string) => void;
  onDownloadPDF?: () => void;
  selectedAnswers?: string[];
  onAnswerSelect?: (answer: string) => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [clickedAnswers, setClickedAnswers] = useState<Set<string>>(new Set());
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState("");
  
  const base =
    "mb-3 box-border px-3 py-3 sm:px-5 sm:py-4 max-w-full sm:max-w-[80%] transition-all duration-200";
  const userClasses =
    "ml-[70px] sm:ml-auto bg-[#F8F9FF] text-black rounded-[10px] w-full sm:w-auto";
  const botClasses = "mr-auto text-gray-800 w-full";

  // Rotate thinking messages with rate limiting
  const trimmedChildren = useMemo(() => String(children).trim(), [children]);
  const isThinking = trimmedChildren === "";

  useEffect(() => {
    if (!isThinking) {
      setCurrentThinkingMessage("");
      return;
    }

    // Get thinking messages from translations
    const thinkingMessages = t('chat.thinking_messages', { returnObjects: true });
    
    // Default messages as fallback
    const defaultMessages = [
      "Analyzing your input...",
      "Understanding your needs...",
      "Thinking about your project...",
      "Organizing ideas...",
      "Structuring your brief...",
      "Connecting the dots...",
      "Polishing the details...",
      "Assembling the brief..."
    ];
    
    // Check if we got an array of messages and validate they're all strings
    let messages: string[] = defaultMessages;
    if (Array.isArray(thinkingMessages)) {
      const validMessages = thinkingMessages.filter((msg): msg is string => typeof msg === 'string');
      if (validMessages.length > 0) {
        messages = validMessages;
      }
    }

    // Set initial message
    const initialIndex = Math.floor(Math.random() * messages.length);
    setCurrentThinkingMessage(messages[initialIndex]);

    // Random interval between 1500ms and 4000ms for more varied timing
    const getRandomInterval = () => Math.floor(Math.random() * (2500 - 800 + 1)) + 800;

    let timeoutId: NodeJS.Timeout;
    let currentIndex = initialIndex;

    const rotateMessage = () => {
      // Get next random index different from current
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * messages.length);
      } while (nextIndex === currentIndex && messages.length > 1);
      
      currentIndex = nextIndex;
      setCurrentThinkingMessage(messages[nextIndex]);

      // Schedule next rotation with new random interval
      timeoutId = setTimeout(rotateMessage, getRandomInterval());
    };

    // Start first rotation after initial delay
    timeoutId = setTimeout(rotateMessage, getRandomInterval());

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isThinking, t]);

  const getAudioUrl = () => {
    if (audioFile) {
      return URL.createObjectURL(audioFile);
    }
    return null;
  };

  const copyToClipboard = async () => {
    try {
      const text = hideLanguageInstruction(displayContent);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Hide after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const selectedAnswerSet = useMemo(() => new Set(selectedAnswers), [selectedAnswers]);

  // Check if content has brief_text pattern
  const hasBriefText = useMemo(() => {
    return hasBriefTextPattern(String(children));
  }, [children]);

  // Extract brief_text from JSON if pattern is detected, otherwise use original content
  const displayContent = useMemo(() => {
    const contentStr = String(children).trim();
    
    if (hasBriefText && role === "assistant") {
      const extractedBriefText = extractBriefTextFromContent(contentStr);
      if (extractedBriefText) {
        // Convert \n escape sequences to actual newlines for proper markdown rendering
        return extractedBriefText.replace(/\\n/g, '\n');
      }
    }
    
    return contentStr;
  }, [children, hasBriefText, role]);

  const quickAnswerGroups = useMemo(() => {
    const regular: Array<{ answer: string; index: number }> = [];
    const special: Array<{
      answer: string;
      index: number;
      isCorrect: boolean;
    }> = [];
    const action: Array<{
      answer: string;
      index: number;
      type: "pdf" | "newBrief";
    }> = [];

    quickAnswers.forEach((answer, index) => {
      if (PDF_QUICK_ANSWERS.has(answer)) {
        action.push({ answer, index, type: "pdf" });
        return;
      }

      if (NEW_BRIEF_QUICK_ANSWERS.has(answer)) {
        action.push({ answer, index, type: "newBrief" });
        return;
      }

      const correct = isEverythingCorrectAnswer(answer);
      const changes = isChangesAnswer(answer);

      if (correct || changes) {
        special.push({ answer, index, isCorrect: correct });
        return;
      }

      regular.push({ answer, index });
    });

    // If brief_text pattern is detected, add PDF and New Brief buttons if not already present
    if (hasBriefText && role === "assistant") {
      const hasPdfButton = action.some(item => item.type === "pdf");
      const hasNewBriefButton = action.some(item => item.type === "newBrief");
      
      // Use a large offset to ensure unique indices for auto-added buttons
      const autoButtonIndexOffset = 10000;
      let autoButtonIndex = autoButtonIndexOffset;
      
      if (!hasPdfButton) {
        const pdfText = t('chat.quick_answers.download_pdf');
        action.push({ answer: pdfText, index: autoButtonIndex++, type: "pdf" });
      }
      
      if (!hasNewBriefButton) {
        const newBriefText = t('chat.quick_answers.create_new_brief');
        action.push({ answer: newBriefText, index: autoButtonIndex++, type: "newBrief" });
      }
    }

    return { regular, special, action };
  }, [quickAnswers, hasBriefText, role, t]);

  const shouldShowFixedButtons = useMemo(() => {
    // If brief_text pattern is detected, don't show fixed buttons (action buttons will be shown instead)
    if (hasBriefText && role === "assistant") {
      return false;
    }

    if (!quickAnswers || quickAnswers.length === 0) {
      return true;
    }

    return !quickAnswers.some((answer) =>
      PDF_QUICK_ANSWERS.has(answer) ||
      NEW_BRIEF_QUICK_ANSWERS.has(answer) ||
      isEverythingCorrectAnswer(answer)
    );
  }, [quickAnswers, hasBriefText, role]);

  const handleAnswerSelection = (answer: string, shouldSelect: boolean) => {
    setClickedAnswers((previous) => new Set(previous).add(answer));

    if (shouldSelect && onAnswerSelect) {
      onAnswerSelect(answer);
    }

    if (onQuickAnswerClick) {
      onQuickAnswerClick(answer);
    }
  };

  return (
    <>
      {role === "user" ? (
        // User message - simple structure, full width
        <div className="flex w-full items-start justify-end gap-[10px]">
          <div
            className={`${base} ${userClasses} ${
              isAudio ? "flex flex-col gap-2" : ""
            } w-full max-w-[250px] sm:w-auto md:w-auto md:max-w-[400px] p-5`}
          >
            {isAudio && audioFile ? (
              <div className="-mx-4 -my-4 flex min-h-[2rem] flex-col justify-center gap-2">
                <div className="rounded-lg bg-transparent p-2">
                  <audio
                    controls
                    className="h-10 w-full sm:w-80 md:w-96"
                    src={getAudioUrl() || undefined}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            ) : (
              <div
                className={`markdown-content ${
                  isThinking ? "thinking-message" : ""
                } text-[14px] leading-[1.4285714286em] font-normal md:font-light text-[#040D22]`}
              >
                {isThinking ? (
                  <div className="thinking-status-message">
                    {currentThinkingMessage || "Processing..."}
                  </div>
                ) : (
                  <Markdown
                    components={{
                      // Customize markdown components to match our design
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="mb-2 text-xl font-bold">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-2 text-lg font-bold">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 text-base font-bold">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-2 list-inside list-disc space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-2 list-inside list-decimal space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="ml-2">{children}</li>,
                      code: ({ children }) => (
                        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-800">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="mb-2 overflow-x-auto rounded-lg bg-gray-100 p-3 font-mono text-sm text-gray-800">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="mb-2 border-l-4 border-gray-300 pl-4 italic text-gray-600">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => <em className="italic">{children}</em>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {hideLanguageInstruction(displayContent)}
                  </Markdown>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Bot message - vertical structure with quick answers
        <div className="space-y-3">
          {/* Message container */}
          <div className="flex w-full items-start gap-[10px]">
            {/* logo */}
            <div className="flex h-[21.63px] w-6 flex-shrink-0 items-center justify-center">
              <svg
                width="24"
                height="21.63"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="block"
              >
                <path
                  opacity="0.4"
                  d="M35.1855 9.45942L41.4551 7.03957L43.765 0.879946C43.875 0.32998 44.425 0 44.9749 0C45.4149 0 45.9649 0.32998 46.0749 0.879946L48.4947 7.03957L54.6544 9.45942C55.2044 9.56941 55.5343 10.1194 55.5343 10.5593C55.5343 11.1093 55.2044 11.6593 54.6544 11.7693L48.4947 14.0791L46.0749 20.3487C45.9649 20.7887 45.4149 21.1187 44.9749 21.1187C44.425 21.1187 43.875 20.7887 43.765 20.3487L41.4551 14.0791L35.1855 11.7693C34.7455 11.6593 34.4155 11.1093 34.4155 10.5593C34.4155 10.1194 34.7455 9.56941 35.1855 9.45942Z"
                  fill="#3C51E2"
                />
                <path
                  opacity="0.4"
                  d="M5.21452 22.8817L6.92554 18.319C7.00701 17.9116 7.4144 17.6672 7.82178 17.6672C8.14769 17.6672 8.55508 17.9116 8.63655 18.319L10.429 22.8817L14.9918 24.6742C15.3991 24.7556 15.6436 25.163 15.6436 25.4889C15.6436 25.8963 15.3991 26.3037 14.9918 26.3852L10.429 28.0962L8.63655 32.7403C8.55508 33.0662 8.14769 33.3107 7.82178 33.3107C7.4144 33.3107 7.00701 33.0662 6.92554 32.7403L5.21452 28.0962L0.570338 26.3852C0.244431 26.3037 0 25.8963 0 25.4889C0 25.163 0.244431 24.7556 0.570338 24.6742L5.21452 22.8817Z"
                  fill="#3C51E2"
                />
                <path
                  d="M27.0839 17.6672L43.804 53.1412L26.561 47.8021L31.6504 44.7152L35.385 45.8817L27.0823 28.2685L19.7552 43.8142L29.0691 38.243L30.9827 42.2978L9.38818 55.2115L27.0839 17.6672Z"
                  fill="#3C51E2"
                />
              </svg>
            </div>

            {/* text */}
            <div className="flex flex-1 flex-col gap-[10px]">
            {/* Message content */}
            <div
              className={`${base} ${botClasses} ${
                isAudio ? "flex flex-col gap-2" : ""
                } group relative max-w-[400px] rounded-none pt-[5px] md:max-w-[600px] md:pt-[0px]`}
            >
              {isAudio && audioFile ? (
                <div className="flex flex-col gap-2">
                    <div className="rounded-lg bg-transparent p-2">
                    <audio
                      controls
                        className="h-10 w-full sm:w-80 md:w-96"
                      src={getAudioUrl() || undefined}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              ) : (
                <div
                    className={`markdown-content ${isThinking ? "thinking-message" : ""} text-[14px] leading-[1.4285714286em] font-normal md:font-light text-[#000000]`}
                >
                    {isThinking ? (
                    <div className="thinking-status-message">
                      {currentThinkingMessage || "Processing..."}
                    </div>
                  ) : (
                    <Markdown
                      components={{
                        // Customize markdown components to match our design
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        h1: ({ children }) => (
                            <h1 className="mb-2 text-xl font-bold">{children}</h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className="mb-2 text-lg font-bold">{children}</h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className="mb-2 text-base font-bold">{children}</h3>
                        ),
                        ul: ({ children }) => (
                            <ul className="mb-2 list-inside list-disc space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                            <ol className="mb-2 list-inside list-decimal space-y-1">
                            {children}
                          </ol>
                        ),
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                        pre: ({ children }) => {
                          // Check if children is empty or only whitespace
                            let content = "";
                          
                            if (typeof children === "string") {
                            content = children.trim();
                          } else if (React.isValidElement(children)) {
                            const codeChildren = (children.props as { children?: React.ReactNode })?.children;
                            if (codeChildren === null || codeChildren === undefined) {
                                content = "";
                            } else if (Array.isArray(codeChildren)) {
                              if (codeChildren.length === 0) {
                                  content = "";
                              } else {
                                const joined = codeChildren
                                    .map((child) => {
                                      if (child === null || child === undefined) return "";
                                      if (typeof child === "string") return child.trim();
                                    return String(child).trim();
                                  })
                                    .join("")
                                  .trim();
                                content = joined;
                              }
                              } else if (typeof codeChildren === "string") {
                              content = codeChildren.trim();
                            } else {
                              const str = String(codeChildren).trim();
                              content = str;
                            }
                          } else if (Array.isArray(children)) {
                            if (children.length === 0) {
                                content = "";
                            } else {
                              const joined = children
                                  .map((child) => {
                                    if (child === null || child === undefined) return "";
                                    if (typeof child === "string") return child.trim();
                                  if (React.isValidElement(child)) {
                                    const elemChildren = (child.props as { children?: React.ReactNode })?.children;
                                      if (elemChildren === null || elemChildren === undefined) return "";
                                    if (Array.isArray(elemChildren)) {
                                        if (elemChildren.length === 0) return "";
                                      return elemChildren
                                          .map((c) => {
                                            if (c === null || c === undefined) return "";
                                            if (typeof c === "string") return c.trim();
                                          return String(c).trim();
                                        })
                                          .join("")
                                        .trim();
                                    }
                                      if (typeof elemChildren === "string") return elemChildren.trim();
                                    return String(elemChildren).trim();
                                  }
                                  return String(child).trim();
                                })
                                  .join("")
                                .trim();
                              content = joined;
                            }
                          } else {
                            content = String(children).trim();
                          }
                          
                          if (!content || content.length === 0) {
                            return null;
                          }
                          
                          return (
                              <pre className="mb-2 overflow-x-auto rounded-lg bg-gray-100 p-3 font-mono text-sm text-gray-800">
                              {children}
                            </pre>
                          );
                        },
                        code: ({ children }) => {
                            let content = "";
                          
                          if (children === null || children === undefined) {
                              content = "";
                            } else if (typeof children === "string") {
                            content = children.trim();
                          } else if (Array.isArray(children)) {
                            if (children.length === 0) {
                                content = "";
                            } else {
                              const joined = children
                                  .map((child) => {
                                    if (child === null || child === undefined) return "";
                                    if (typeof child === "string") return child.trim();
                                  return String(child).trim();
                                })
                                  .join("")
                                .trim();
                              content = joined;
                            }
                          } else {
                            content = String(children).trim();
                          }
                          
                          if (!content || content.length === 0) {
                            return null;
                          }
                          
                          return (
                              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-800">
                              {children}
                            </code>
                          );
                        },
                        blockquote: ({ children }) => (
                            <blockquote className="mb-2 border-l-4 border-gray-300 pl-4 italic text-gray-600">
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold">{children}</strong>
                        ),
                          em: ({ children }) => <em className="italic">{children}</em>,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                        {hideLanguageInstruction(displayContent)}
                    </Markdown>
                  )}
                </div>
              )}

              {showCopyButton && !isAudio && (
                <button
                  onClick={copyToClipboard}
                    className="absolute bottom-0.5 right-0.5 cursor-pointer p-1 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  title="Copy message"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3C51E2"
                    strokeWidth="2"
                    className="h-[14px] w-[14px]"
                  >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              )}

              {copied && (
                  <div className="absolute bottom-0.5 right-2 animate-fade-in-out rounded-md bg-green-500 px-2 py-1 text-xs text-white shadow-lg">
                  Copied to Clipboard
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Quick Answers for bot messages */}
          {((quickAnswers && quickAnswers.length > 0 && onQuickAnswerClick) || (hasBriefText && role === "assistant" && onQuickAnswerClick)) && (
            <div className="ml-[30px] flex w-[calc(100%-30px)] max-w-[calc(100%-30px)] flex-col gap-[10px]">
              {quickAnswerGroups.regular.map(({ answer, index }) => {
                const isDefaultButton = DEFAULT_QUICK_ANSWERS.has(answer);
                      const isClicked = clickedAnswers.has(answer);
                const isSelected = selectedAnswerSet.has(answer);
                      
                      return (
                  <div key={`${answer}-${index}`} className="group flex w-full items-end gap-[10px]">
                    <div
                      className={cx(
                        "flex w-full items-center gap-[5px] rounded-[10px] border px-5 py-3 transition-all",
                        isSelected
                          ? "border-[#3C51E2] bg-[#E8EBFE]"
                          : "border-transparent bg-[#F8F9FF] group-hover:border-[#3C51E2] group-hover:bg-[#F3F3FC]",
                        isClicked && !isSelected && "opacity-50"
                      )}
                                  >
                                    <button
                        type="button"
                          onClick={() => {
                            if (isClicked) {
                              return;
                            }
                          handleAnswerSelection(answer, !isDefaultButton);
                          }}
                          disabled={isClicked}
                        className={cx(
                          "w-full bg-transparent text-left font-bold text-[#040D22]",
                          "md:text-[14px]",
                          "leading-[1.2130000250680106em]",
                          isClicked && !isSelected ? "cursor-not-allowed" : "cursor-pointer"
                        )}
                        >
                          {answer}
                        </button>
                      <div
                        className={cx(
                          "hidden justify-end transition-opacity sm:flex sm:w-[60px] sm:min-w-[60px]",
                          isClicked
                            ? "pointer-events-none opacity-0"
                            : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
                        )}
                      >
                                <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (isClicked) {
                              return;
                            }
                            handleAnswerSelection(answer, !isDefaultButton);
                          }}
                          disabled={isClicked}
                          className="flex h-[29px] w-[60px] items-center justify-center rounded-full border border-[#3C51E2] bg-[#3C51E2] text-xs font-light text-white transition-colors hover:bg-[#061333]"
                        >
                          <span className="flex h-[15px] w-[32px] items-center justify-center rounded-full">
                                      Select
                                    </span>
                                </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
              {quickAnswerGroups.action.length > 0 && (
                <div className="-mt-[30px] flex flex-col gap-[5px] md:mt-[10px] md:flex-row md:items-center">
                  {quickAnswerGroups.action.map(({ answer, index, type }) => (
                            <button
                      key={`${answer}-${index}`}
                      type="button"
                              onClick={() => {
                        if (type === "pdf") {
                          if (onDownloadPDF) {
                                  onDownloadPDF();
                          }
                          return;
                        }
                        if (onQuickAnswerClick) {
                                  onQuickAnswerClick(answer);
                                }
                              }}
                      className={cx(
                        "flex min-h-[29px] items-center justify-center gap-[5px] rounded-full px-[14px] py-[7px] text-xs font-light transition-all",
                        type === "pdf"
                          ? "bg-[#3C51E2] text-white hover:bg-[#061333]"
                          : "border border-[#3C51E2] text-[#3C51E2] hover:bg-[#061333] hover:text-white",
                        "whitespace-nowrap"
                      )}
                    >
                      {type === "pdf" ? (
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 14 15" 
                          fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                          className="h-[14px] w-[14px]"
                                >
                          <path d="M12.25 12.25C12.25 13.2344 11.457 14 10.5 14H3.5C2.51562 14 1.75 13.2344 1.75 12.25H2.625C2.625 12.7422 3.00781 13.125 3.5 13.125H10.5C10.9648 13.125 11.375 12.7422 11.375 12.25H12.25ZM8.3125 5.25C7.57422 5.25 7 4.67578 7 3.9375V0.875H3.5C3.00781 0.875 2.625 1.28516 2.625 1.75V6.125H1.75V1.75C1.75 0.792969 2.51562 0 3.5 0H7.76562C8.09375 0 8.44922 0.164062 8.69531 0.410156L11.8398 3.55469C12.0859 3.80078 12.25 4.15625 12.25 4.48438V6.125H11.375V5.25H8.3125ZM11.2383 4.18359L8.06641 1.01172C8.01172 0.957031 7.92969 0.929688 7.875 0.902344V3.9375C7.875 4.18359 8.06641 4.375 8.3125 4.375H11.3477C11.3203 4.32031 11.293 4.23828 11.2383 4.18359ZM4.15625 7C4.97656 7 5.6875 7.71094 5.6875 8.53125C5.6875 9.37891 4.97656 10.0625 4.15625 10.0625H3.9375V10.9375C3.9375 11.1836 3.71875 11.375 3.5 11.375C3.25391 11.375 3.0625 11.1836 3.0625 10.9375V7.4375C3.0625 7.21875 3.25391 7 3.5 7H4.15625ZM4.8125 8.53125C4.8125 8.17578 4.51172 7.875 4.15625 7.875H3.9375V9.1875H4.15625C4.51172 9.1875 4.8125 8.91406 4.8125 8.53125ZM6.125 7.4375C6.125 7.21875 6.31641 7 6.5625 7H7.21875C7.92969 7 8.53125 7.60156 8.53125 8.3125V10.0625C8.53125 10.8008 7.92969 11.375 7.21875 11.375H6.5625C6.31641 11.375 6.125 11.1836 6.125 10.9375V7.4375ZM7 10.5H7.21875C7.4375 10.5 7.65625 10.3086 7.65625 10.0625V8.3125C7.65625 8.09375 7.4375 7.875 7.21875 7.875H7V10.5ZM10.9375 7C11.1562 7 11.375 7.21875 11.375 7.4375C11.375 7.68359 11.1562 7.875 10.9375 7.875H10.0625V8.75H10.9375C11.1562 8.75 11.375 8.96875 11.375 9.1875C11.375 9.43359 11.1562 9.625 10.9375 9.625H10.0625V10.9375C10.0625 11.1836 9.84375 11.375 9.625 11.375C9.37891 11.375 9.1875 11.1836 9.1875 10.9375V7.4375C9.1875 7.21875 9.37891 7 9.625 7H10.9375Z" />
                                </svg>
                      ) : (
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  xmlns="http://www.w3.org/2000/svg"
                          className="h-[14px] w-[14px]"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              )}
                              <span>{answer}</span>
                            </button>
                  ))}
                      </div>
                    )}
                    
              {quickAnswerGroups.special.length > 0 && (
                <div
                  className={cx(
                    "flex flex-col gap-[5px] md:flex-row md:items-center",
                    quickAnswerGroups.regular.length > 0 && "mt-[10px]"
                  )}
                >
                  {quickAnswerGroups.special.map(({ answer, index, isCorrect }) => {
                          const isClicked = clickedAnswers.has(answer);
                          return (
                            <button
                        key={`${answer}-${index}`}
                        type="button"
                              onClick={() => {
                                if (isClicked) {
                                  return;
                                }
                          handleAnswerSelection(answer, true);
                        }}
                              disabled={isClicked}
                        className={cx(
                          "flex h-[29px] items-center justify-center gap-2 rounded-full px-[14px] py-[7px] text-xs font-light transition-all whitespace-nowrap",
                          isCorrect
                            ? "bg-[#3C51E2] text-white hover:bg-[#061333]"
                            : "border border-[#3C51E2] text-[#3C51E2] hover:bg-[#061333] hover:text-white",
                          isClicked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                        )}
                      >
                        {isCorrect ? (
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[14px] w-[14px]"
                            stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                            <polyline points="20 6 9 17 4 12" />
                                </svg>
                        ) : (
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[14px] w-[14px]"
                            stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              )}
                              <span>{answer}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

              {shouldShowFixedButtons && (
                <div className="mt-[10px] flex w-full flex-col gap-[5px] md:flex-row md:w-auto md:items-center">
                  <button
                    type="button"
                    onClick={() => onQuickAnswerClick(t('chat.quick_answers.give_examples'))}
                    className="flex h-[29px] items-center justify-center gap-2 rounded-full bg-[#3C51E2] px-[14px] py-[7px] text-xs font-light text-white transition-all hover:bg-[#061333] whitespace-nowrap"
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 19 19" 
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-[14px] w-[14px]"
                    >
                      <path d="M12.875 9.875C13.4688 9.9375 13.6875 10.6562 13.2812 11.0938L10.9062 13.4062L11.4688 16.6875C11.5 16.875 11.4375 17.0938 11.2812 17.25C11.1562 17.4062 10.9688 17.5 10.75 17.5C10.625 17.5 10.5 17.4688 10.4062 17.4375L7.5 15.875L4.5625 17.4375C4.4375 17.5 4.34375 17.5 4.21875 17.5C4 17.5 3.8125 17.4062 3.6875 17.25C3.5625 17.0938 3.5 16.875 3.53125 16.6875L4.0625 13.4062L1.71875 11.0938C1.28125 10.6875 1.5 9.9375 2.09375 9.875L5.375 9.375L6.84375 6.40625C6.96875 6.15625 7.21875 6 7.46875 6C7.75 6 8 6.15625 8.125 6.40625L9.59375 9.375L12.875 9.875ZM9.8125 13.0625L12.1562 10.7812L8.9375 10.3125L7.5 7.375L6.03125 10.3125L2.8125 10.7812L5.125 13.0625L4.59375 16.2812L7.46875 14.75L10.375 16.2812L9.8125 13.0625ZM9.5 5C9.21875 5 9 4.78125 9 4.5C9 4.25 9.21875 4 9.5 4.03125L11.5 4V2C11.5 1.75 11.7188 1.5 12 1.5C12.25 1.5 12.5 1.75 12.5 2V4L14.5 4.03125C14.75 4.03125 15 4.25 15 4.5C15 4.78125 14.75 5 14.5 5H12.5V7C12.5 7.28125 12.25 7.5 12 7.5C11.7188 7.5 11.5 7.28125 11.5 7V5H9.5ZM17 8C17.25 8 17.5 8.25 17.5 8.53125C17.5 8.78125 17.25 9 17 9H16V10C16 10.2812 15.75 10.5312 15.5 10.5312C15.2188 10.5312 15 10.2812 15 10V9H14C13.7188 9 13.5 8.78125 13.5 8.53125C13.5 8.25 13.7188 8 14 8H15V7C15 6.75 15.25 6.53125 15.5 6.53125C15.75 6.53125 16 6.75 16 7V8H17Z" />
                    </svg>
                    <span>{t('chat.quick_answers.give_examples')}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => onQuickAnswerClick(t('chat.quick_answers.skip_question'))}
                    className="flex h-[29px] items-center justify-center gap-2 rounded-full border border-[#3C51E2] px-[14px] py-[7px] text-xs font-light text-[#3C51E2] transition-all hover:bg-[#061333] hover:text-white whitespace-nowrap"
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 19 19" 
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-[14px] w-[14px]"
                    >
                      <path d="M7.15625 8.40625L2.5 4.5V14.5312L7.15625 10.625C7.375 10.4375 7.6875 10.4688 7.875 10.6875C8.03125 10.9062 8 11.2188 7.8125 11.375L3.03125 15.3125C2.875 15.4375 2.65625 15.5 2.4375 15.5C1.9375 15.5 1.5 15.0938 1.5 14.5V4.53125C1.5 3.9375 1.9375 3.5 2.4375 3.5C2.65625 3.5 2.875 3.59375 3.03125 3.71875L7.8125 7.65625C8 7.8125 8.03125 8.125 7.875 8.34375C7.6875 8.5625 7.375 8.59375 7.15625 8.40625ZM17.125 8.71875C17.3438 8.90625 17.5 9.21875 17.5 9.5C17.5 9.8125 17.3438 10.125 17.125 10.3438L11.0312 15.3125C10.875 15.4375 10.6562 15.5 10.4375 15.5C10.125 15.5 9.5 15.25 9.5 14.5V4.53125C9.5 3.78125 10.125 3.5 10.4375 3.5C10.6562 3.5 10.875 3.59375 11.0312 3.75L17.125 8.71875ZM10.5 14.5312L16.4688 9.5L10.5 4.5V14.5312Z" />
                    </svg>
                    <span>{t('chat.quick_answers.skip_question')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
