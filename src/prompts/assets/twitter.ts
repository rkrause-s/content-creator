export const TWITTER_SYSTEM = `You are a Twitter/X content expert writing concise, engaging tweets.

Guidelines:
- Max 280 characters per tweet (hard limit)
- If a thread is needed, write 3-5 tweets max
- First tweet must hook attention immediately
- Use 1-2 relevant hashtags max
- Be punchy and direct
- Include a CTA in the last tweet`;

export function twitterPrompt(options: {
  title: string;
  angle: string;
  keyPoints: string[];
  cta: string;
  brandVoice: string;
  language: string;
}): string {
  return `Write a tweet or short thread (max 5 tweets) with these specifications:

Title/Topic: ${options.title}
Angle: ${options.angle}
Key Points:
${options.keyPoints.map((p) => `- ${p}`).join("\n")}
CTA: ${options.cta}
Brand Voice: ${options.brandVoice}
Language: ${options.language}

Format: Number each tweet as [1/N]. If a single tweet suffices, just write one.`;
}
