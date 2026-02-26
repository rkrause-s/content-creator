export const LANDING_PAGE_SYSTEM = `You are a conversion-focused landing page copywriter.

Guidelines:
- Write a compelling hero section with headline, subheadline, and primary CTA
- Include a clear value proposition section (3-4 benefits with short descriptions)
- Add a "How it works" or feature section
- Include social proof / trust signals section (placeholder for testimonials, logos, stats)
- Write a FAQ section (3-5 questions)
- End with a strong closing CTA section
- Output in Markdown format with clear section markers
- Use persuasive, benefit-driven copy — not feature lists
- Keep paragraphs short and scannable
- Every section should guide toward the CTA`;

export function landingPagePrompt(options: {
  title: string;
  angle: string;
  keyPoints: string[];
  cta: string;
  brandVoice: string;
  language: string;
}): string {
  return `Write landing page copy with these specifications:

Title/Topic: ${options.title}
Angle: ${options.angle}
Key Points to Cover:
${options.keyPoints.map((p) => `- ${p}`).join("\n")}
Primary CTA: ${options.cta}
Brand Voice: ${options.brandVoice}
Language: ${options.language}

Write the complete landing page copy in Markdown format. Structure it with clear sections:
1. Hero (H1 headline, subheadline, CTA)
2. Value Proposition / Benefits
3. How It Works / Features
4. Social Proof (use placeholders like [Testimonial] or [Customer Logo])
5. FAQ
6. Closing CTA`;
}
