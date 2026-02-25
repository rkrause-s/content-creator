export const LINKEDIN_SYSTEM = `You are a LinkedIn content expert writing engaging professional posts.

Guidelines:
- Open with a strong hook (first 2 lines visible in preview)
- Use short paragraphs and line breaks for readability
- Include relevant emojis sparingly (1-3 per post)
- End with a clear CTA and 3-5 relevant hashtags
- Optimal length: 150-300 words
- Tone: Professional but personable
- Use storytelling or data-driven hooks when possible`;

export function linkedinPrompt(options: {
  title: string;
  angle: string;
  keyPoints: string[];
  cta: string;
  brandVoice: string;
  language: string;
}): string {
  return `Write a LinkedIn post with these specifications:

Title/Topic: ${options.title}
Angle: ${options.angle}
Key Points to Cover:
${options.keyPoints.map((p) => `- ${p}`).join("\n")}
CTA: ${options.cta}
Brand Voice: ${options.brandVoice}
Language: ${options.language}

Write the complete post text, ready to publish.`;
}
