import type { GeneratedAsset } from "../pipeline/types.js";

/**
 * Strips Gemini artifacts and MDX-incompatible elements from generated markdown.
 */
export function sanitizeForMdx(content: string): string {
  let cleaned = content;

  // Strip wrapping code fences (```markdown ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```\w*\n/m, "").replace(/\n```\s*$/m, "");

  // Remove horizontal rules (--- / *** / ___) — they break MDX inside JSX components
  cleaned = cleaned.replace(/^\s*[-*_]{3,}\s*$/gm, "");

  // Remove meta description / keywords lines (belong in frontmatter, not body)
  cleaned = cleaned.replace(/^\*{0,2}Meta[- ]?Beschreibung\*{0,2}:.*$/gim, "");
  cleaned = cleaned.replace(/^\*{0,2}Keywords?\*{0,2}:.*$/gim, "");

  // Remove stray code fences that aren't part of actual code blocks
  cleaned = cleaned.replace(/^```\s*$/gm, "");

  // Collapse triple+ blank lines to double
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function escapeFrontmatter(str: string): string {
  return str.replace(/"/g, '\\"');
}

function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitByH2(content: string): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  const parts = content.split(/^## /m);

  // First part (before any H2) — if it has content, wrap it
  if (parts[0].trim()) {
    sections.push({ heading: "", body: parts[0].trim() });
  }

  for (let i = 1; i < parts.length; i++) {
    const lines = parts[i].split("\n");
    const heading = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();
    sections.push({ heading, body });
  }

  // Filter out empty heading sections that have no body
  return sections.filter((s) => s.heading || s.body);
}

/**
 * Converts markdown content into MDX body wrapped in astro-ui components.
 * Splits by H2 sections and wraps each in a Container/Section.
 */
function markdownToMdxBody(markdown: string, isLandingPage: boolean): string {
  // Extract title (H1) and subtitle
  const lines = markdown.split("\n");
  let title = "";
  let subtitle = "";
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!title && line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "");
      contentStart = i + 1;
      // Check for italic subtitle on next non-empty line
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === "") continue;
        if (lines[j].trim().startsWith("*") && lines[j].trim().endsWith("*")) {
          subtitle = lines[j].trim().replace(/^\*+|\*+$/g, "");
          contentStart = j + 1;
        }
        break;
      }
      break;
    }
  }

  const remainingContent = lines.slice(contentStart).join("\n").trim();

  // Split into H2 sections
  const sections = splitByH2(remainingContent);

  const parts: string[] = [];

  // Separate intro content (before first H2) from H2 sections
  const introSection = sections.length > 0 && !sections[0].heading ? sections.shift() : null;

  // Hero / PageHeader — include intro text if present
  parts.push(
    `<Container verticalPadding="${isLandingPage ? "xl" : "md"}">`,
    `  <PageHeader heading={{ text: "${escapeFrontmatter(title)}", level: 1 }}>`,
    ...(subtitle ? [`    ${subtitle}`] : []),
    ...(introSection ? ["", introSection.body] : []),
    "  </PageHeader>",
    "</Container>"
  );

  // Each H2 section gets a Container or alternating Section
  const bgColors = ["white", "gray"];
  sections.forEach((section, idx) => {
    const bg = isLandingPage ? bgColors[idx % bgColors.length] : "white";
    const sectionId = slugifyHeading(section.heading);

    if (isLandingPage && bg !== "white") {
      parts.push(
        "",
        `<Section backgroundColor="${bg}" verticalPadding="lg" id="${sectionId}">`,
        `  <TextBlock heading={{ text: "${escapeFrontmatter(section.heading)}", level: 2 }}>`,
        "",
        section.body,
        "",
        "  </TextBlock>",
        "</Section>"
      );
    } else {
      parts.push(
        "",
        `<Container verticalPadding="md" id="${sectionId}">`,
        `  <TextBlock heading={{ text: "${escapeFrontmatter(section.heading)}", level: 2 }}>`,
        "",
        section.body,
        "",
        "  </TextBlock>",
        "</Container>"
      );
    }
  });

  return parts.filter((p) => p !== undefined).join("\n");
}

/**
 * Converts a GeneratedAsset's markdown content into an Astro MDX page
 * following the go.seibert.group conventions.
 */
export function convertToMdx(asset: GeneratedAsset): string {
  const slug = slugify(asset.title);
  const isLandingPage = asset.type === "landing-page";
  const sanitized = sanitizeForMdx(asset.content);

  // Extract first real paragraph as description (max 160 chars)
  const descriptionMatch = sanitized
    .replace(/^#.*$/m, "")       // skip H1
    .replace(/^\*[^*].*\*$/m, "") // skip italic subtitle
    .trim()
    .split("\n")
    .find((line) => line.trim().length > 20 && !line.startsWith("#") && !line.startsWith("*   ") && !line.startsWith(">"));
  const rawDesc = descriptionMatch ?? asset.title;
  const description = rawDesc.length > 157 ? rawDesc.slice(0, 157) + "..." : rawDesc;

  const frontmatter = [
    "---",
    `title: "${escapeFrontmatter(asset.title)}"`,
    `description: "${escapeFrontmatter(description)}"`,
    `uid: ${slug}`,
    ...(isLandingPage ? ["landingPage: true"] : []),
    "---",
  ].join("\n");

  const imports = [
    'import Container from "@seibert/astro-ui/components/Container.astro";',
    'import PageHeader from "@seibert/astro-ui/components/PageHeader.astro";',
    'import Section from "@seibert/astro-ui/components/Section.astro";',
    'import TextBlock from "@seibert/astro-ui/components/TextBlock.astro";',
  ];

  if (isLandingPage) {
    imports.push('import Grid from "@seibert/astro-ui/components/Grid.astro";');
    imports.push('import FormContact from "@seibert/astro-ui/components/FormContact.astro";');
  }

  const body = markdownToMdxBody(sanitized, isLandingPage);

  return `${frontmatter}\n\n${imports.join("\n")}\n\n${body}\n`;
}
