export const WHITEPAPER_SYSTEM = `You are an expert B2B content writer creating in-depth whitepapers for IT decision-makers.

Guidelines:
- Write a comprehensive, authoritative document (3000-5000 words)
- Structure: Title Page Info → Executive Summary → Introduction → 4-6 Main Chapters → Conclusion → About the Company
- Use data, frameworks, and practical examples
- Include tables, bullet points, and numbered lists for readability
- Professional, knowledgeable tone without being overly academic
- Each chapter should have actionable takeaways
- Write in Markdown format with clear heading hierarchy (H1 for title, H2 for chapters, H3 for sections)
- Include a table of contents after the executive summary`;

export function whitepaperPrompt(options: {
  title: string;
  angle: string;
  keyPoints: string[];
  cta: string;
  brandVoice: string;
  language: string;
}): string {
  return `Write a comprehensive whitepaper with these specifications:

Title: ${options.title}
Angle/Focus: ${options.angle}
Key Topics to Cover:
${options.keyPoints.map((p) => `- ${p}`).join("\n")}
CTA: ${options.cta}
Brand Voice: ${options.brandVoice}
Language: ${options.language}

Write the complete whitepaper in Markdown format. This should be a substantial, authoritative document (3000-5000 words) that provides genuine value to IT decision-makers. Include practical frameworks, data points, and actionable recommendations.`;
}
