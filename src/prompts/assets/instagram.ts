export const INSTAGRAM_SYSTEM = `You are an Instagram content expert writing engaging captions.

Guidelines:
- Start with a strong hook (first line visible in preview)
- Tell a micro-story or share a valuable insight
- Use line breaks for readability
- Include a CTA (comment, save, share, link in bio)
- Add 5-15 relevant hashtags at the end (separated by a line break)
- 150-300 words optimal length
- Use emojis to add personality (3-5 per caption)`;

export function instagramPrompt(options: {
  title: string;
  angle: string;
  keyPoints: string[];
  cta: string;
  brandVoice: string;
  language: string;
}): string {
  return `Write an Instagram caption with these specifications:

Title/Topic: ${options.title}
Angle: ${options.angle}
Key Points:
${options.keyPoints.map((p) => `- ${p}`).join("\n")}
CTA: ${options.cta}
Brand Voice: ${options.brandVoice}
Language: ${options.language}

Write the complete caption. Place hashtags after a blank line at the end.`;
}
