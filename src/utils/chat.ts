export interface QuickAnswersExtraction {
  cleanContent: string;
  quickAnswers: string[];
}

// Function to extract brief_text from JSON content
export function extractBriefTextFromContent(content: string): string | null {
  try {
    const contentStr = String(content).trim();
    
    // First, try to extract JSON from markdown code block (handles ```json ... ```)
    // Find the start and end of the code block more reliably
    const jsonCodeBlockStart = contentStr.indexOf('```json');
    if (jsonCodeBlockStart !== -1) {
      const afterStart = contentStr.substring(jsonCodeBlockStart + 7); // Skip ```json
      // Find the last ``` to handle cases with newlines before closing
      const jsonCodeBlockEnd = afterStart.lastIndexOf('```');
      if (jsonCodeBlockEnd !== -1) {
        const jsonString = afterStart.substring(0, jsonCodeBlockEnd).trim();
        try {
          const parsed = JSON.parse(jsonString);
          if (parsed.brief_text && typeof parsed.brief_text === 'string') {
            return parsed.brief_text.trim();
          }
        } catch {
          // If parsing fails, try to find JSON object manually
        }
      }
    }
    
    // More robust approach: find the JSON object boundaries by counting braces
    // Look for opening brace followed by brief_text property
    const briefTextIndex = contentStr.indexOf('"brief_text"');
    if (briefTextIndex !== -1) {
      // Find the opening brace before brief_text
      let startIndex = briefTextIndex;
      while (startIndex > 0 && contentStr[startIndex] !== '{') {
        startIndex--;
      }
      
      if (contentStr[startIndex] === '{') {
        // Find the matching closing brace by counting braces
        let braceCount = 0;
        let endIndex = startIndex;
        for (let i = startIndex; i < contentStr.length; i++) {
          if (contentStr[i] === '{') braceCount++;
          if (contentStr[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }
        }
        
        if (endIndex > startIndex) {
          try {
            const jsonString = contentStr.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonString);
            if (parsed.brief_text && typeof parsed.brief_text === 'string') {
              return parsed.brief_text.trim();
            }
          } catch {
            // Parsing failed, continue to next method
          }
        }
      }
    }
    
    // Fallback: try to find JSON object with brief_text using regex (less reliable)
    const jsonObjectMatch = contentStr.match(/\{[\s\S]*?"brief_text"[\s\S]*?\}/);
    if (jsonObjectMatch) {
      try {
        const parsed = JSON.parse(jsonObjectMatch[0]);
        if (parsed.brief_text && typeof parsed.brief_text === 'string') {
          return parsed.brief_text.trim();
        }
      } catch {
        // Parsing failed
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function extractQuickAnswers(content: string): QuickAnswersExtraction {
  try {
    const markdownMatch = content.match(/```json\s*\{[\s\S]*"quick_answers"[\s\S]*?\}\s*```/);

    if (markdownMatch) {
      const jsonMatch = markdownMatch[0].match(/\{[\s\S]*"quick_answers"[\s\S]*?\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.quick_answers && Array.isArray(parsed.quick_answers)) {
          const processedAnswers = parsed.quick_answers.map((item: unknown) => {
            if (typeof item === "string") {
              return item;
            }
            if (typeof item === "object" && item !== null) {
              const typedItem = item as Record<string, unknown>;
              const indicator = typeof typedItem.indicator === "string" ? typedItem.indicator : undefined;
              const goal = typeof typedItem.goal === "string" ? typedItem.goal : undefined;

              if (indicator && goal) {
                return `${indicator}: ${goal}`;
              }
              if (indicator) {
                return indicator;
              }
              if (goal) {
                return goal;
              }

              return JSON.stringify(typedItem);
            }
            return String(item);
          });

          const cleanContent = content.replace(markdownMatch[0], "").trim();
          return { cleanContent, quickAnswers: processedAnswers };
        }
      }
    }

    const jsonMatch = content.match(/\{[\s\S]*"quick_answers"[\s\S]*?\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.quick_answers && Array.isArray(parsed.quick_answers)) {
        const processedAnswers = parsed.quick_answers.map((item: unknown) => {
          if (typeof item === "string") {
            return item;
          }
          if (typeof item === "object" && item !== null) {
            const typedItem = item as Record<string, unknown>;
            const indicator = typeof typedItem.indicator === "string" ? typedItem.indicator : undefined;
            const goal = typeof typedItem.goal === "string" ? typedItem.goal : undefined;

            if (indicator && goal) {
              return `${indicator}: ${goal}`;
            }
            if (indicator) {
              return indicator;
            }
            if (goal) {
              return goal;
            }

            return JSON.stringify(typedItem);
          }
          return String(item);
        });

        const cleanContent = content.replace(jsonMatch[0], "").trim();
        return { cleanContent, quickAnswers: processedAnswers };
      }
    }
  } catch {
    // ignore parsing errors and fall back to default response
  }

  return { cleanContent: content, quickAnswers: [] };
}

