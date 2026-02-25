export const BLOG_SYSTEM = `You are a content marketing expert writing SEO-optimized blog articles.

Guidelines:
- Write a compelling headline (H1) and meta description
- Use clear H2/H3 structure
- Include an engaging introduction with a hook
- 800-1500 words optimal length
- Use bullet points, numbered lists where appropriate
- End with a conclusion and CTA
- Write in Markdown format
- Include suggested meta description and keywords in metadata`;

export function blogPrompt(options: {
  title: string;
  angle: string;
  keyPoints: string[];
  cta: string;
  brandVoice: string;
  language: string;
}): string {
  return `Write a blog article with these specifications:

Title/Topic: ${options.title}
Angle: ${options.angle}
Key Points to Cover:
${options.keyPoints.map((p) => `- ${p}`).join("\n")}
CTA: ${options.cta}
Brand Voice: ${options.brandVoice}
Language: ${options.language}

Write the complete article in Markdown format. Start with the H1 headline.`;
}
