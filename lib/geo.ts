export interface FAQ {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  position: number;
}

/**
 * Extract FAQ-like Q&A pairs from MDX content.
 * Converts H2 headings to questions, first paragraph after each H2 to answer.
 * Filters to only include headings that are question-like or informative.
 */
export function extractFAQs(content: string): FAQ[] {
  const faqs: FAQ[] = [];

  // Split content by H2 headings
  const sections = content.split(/^## /m);

  for (const section of sections.slice(1)) { // Skip content before first H2
    const lines = section.split('\n');
    const heading = lines[0].trim();

    if (!heading) continue;

    // Skip headings that are clearly not FAQ-like (e.g., "참고 자료", "TL;DR", "함께 읽으면 좋은 글")
    const skipPatterns = /^(참고 자료|TL;DR|함께 읽으면|References|Sources|Related)/i;
    if (skipPatterns.test(heading)) continue;

    // Find the first meaningful paragraph after the heading
    let answer = '';
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip empty lines, images, code blocks, lists starting markers
      if (!line || line.startsWith('!') || line.startsWith('```') || line.startsWith('|') || line.startsWith('_Photo')) continue;
      // Skip H3 headings
      if (line.startsWith('### ')) continue;
      // Found a paragraph
      // Clean markdown formatting
      answer = line
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
        .replace(/`(.*?)`/g, '$1'); // inline code
      break;
    }

    if (answer && answer.length > 20) {
      // Convert heading to question format if it isn't already
      let question = heading;
      // Remove trailing markdown artifacts
      question = question.replace(/[#*`]/g, '').trim();

      faqs.push({ question, answer });
    }
  }

  // Limit to 5-7 FAQs for optimal schema
  return faqs.slice(0, 7);
}

/**
 * Extract HowTo steps from tutorial MDX content.
 * Uses H2 or H3 headings as step names, first paragraph as instruction.
 * Only for ai-tutorial category posts.
 */
export function extractHowToSteps(content: string): HowToStep[] {
  const steps: HowToStep[] = [];

  // Split by H2 or H3
  const sections = content.split(/^###? /m);
  let position = 1;

  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const heading = lines[0].trim();

    if (!heading) continue;

    // Skip non-step headings
    const skipPatterns = /^(참고 자료|TL;DR|함께 읽으면|References|Sources|Related|냉정한 평가|시작하려면|경쟁 구도)/i;
    if (skipPatterns.test(heading)) continue;

    // Find first paragraph
    let text = '';
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('!') || line.startsWith('```') || line.startsWith('|') || line.startsWith('_Photo')) continue;
      if (line.startsWith('### ') || line.startsWith('## ')) break;
      text = line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/`(.*?)`/g, '$1');
      break;
    }

    if (text && text.length > 10) {
      steps.push({
        name: heading.replace(/[#*`]/g, '').trim(),
        text,
        position: position++,
      });
    }
  }

  return steps;
}
