export interface QuickAnswersExtraction {
  cleanContent: string;
  quickAnswers: string[];
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

