export const EMAIL_SYSTEM = `You are an email marketing expert writing engaging newsletter content.

Guidelines:
- Write a compelling subject line (max 60 chars)
- Preview text (max 90 chars)
- Personal, conversational tone
- Clear structure: Hook → Value → CTA
- One primary CTA, max one secondary
- 300-600 words optimal length
- Use short paragraphs (2-3 sentences max)
- Write in Markdown format`;

export function emailPrompt(options: {
  title: string;
  angle: string;
  keyPoints: string[];
  cta: string;
  brandVoice: string;
  language: string;
}): string {
  return `Write a newsletter email with these specifications:

Title/Topic: ${options.title}
Angle: ${options.angle}
Key Points:
${options.keyPoints.map((p) => `- ${p}`).join("\n")}
CTA: ${options.cta}
Brand Voice: ${options.brandVoice}
Language: ${options.language}

Include Subject Line and Preview Text at the top, then the email body in Markdown.`;
}
