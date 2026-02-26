import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { GeneratedAsset } from "../types.js";

const PUBLISHABLE_TYPES = ["blog-article", "landing-page"];
const DEFAULT_ORG = "seibert-external";
const DEFAULT_REPO = "go.seibert.group";

export interface PublishOptions {
  /** GitHub repo in "org/repo" or just "repo" format (defaults to seibert-external/go.seibert.group) */
  repo?: string;
  /** Branch name for the PR (auto-generated if not set) */
  branch?: string;
  /** Create PR instead of pushing to main */
  createPr?: boolean;
}

export interface PublishResult {
  published: PublishedAsset[];
  prUrl?: string;
  branch: string;
  repo: string;
}

export interface PublishedAsset {
  assetId: string;
  filePath: string;
  url: string;
}

/**
 * Publishes blog-article and landing-page assets as MDX files to a GitHub content repository.
 * Clones the repo, creates a branch, adds MDX files, pushes, and optionally opens a PR.
 */
export async function publishToRepo(
  assets: GeneratedAsset[],
  campaignName: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  const publishable = assets.filter((a) => PUBLISHABLE_TYPES.includes(a.type));
  if (publishable.length === 0) {
    return { published: [], branch: "", repo: "" };
  }

  const repoFull = resolveRepo(options.repo);
  const branchName = options.branch ?? `content/${slugify(campaignName)}-${Date.now()}`;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "content-publish-"));

  try {
    // Clone the repo (shallow)
    exec(`git clone --depth 1 https://github.com/${repoFull}.git "${tmpDir}/repo"`);
    const repoDir = path.join(tmpDir, "repo");

    // Create branch
    exec(`git checkout -b "${branchName}"`, repoDir);

    const published: PublishedAsset[] = [];

    for (const asset of publishable) {
      const slug = slugify(asset.title);
      const mdxContent = convertToMdx(asset);
      const filePath = `src/data/pages/${slug}.mdx`;

      await fs.writeFile(path.join(repoDir, filePath), mdxContent, "utf-8");

      published.push({
        assetId: asset.id,
        filePath,
        url: `/${slug}/`,
      });
    }

    // Stage, commit, push
    exec("git add -A", repoDir);
    exec(
      `git commit -m "Add ${published.length} content asset(s) from campaign: ${campaignName}"`,
      repoDir
    );
    exec(`git push -u origin "${branchName}"`, repoDir);

    // Create PR if requested (default: yes)
    let prUrl: string | undefined;
    if (options.createPr !== false) {
      const prBody = buildPrBody(published, campaignName);
      const result = exec(
        `gh pr create --repo "${repoFull}" --title "Content: ${campaignName}" --body "${escapeShell(prBody)}"`,
        repoDir
      );
      prUrl = result.trim();
    }

    return { published, prUrl, branch: branchName, repo: repoFull };
  } finally {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

function resolveRepo(repo?: string): string {
  if (!repo) return `${DEFAULT_ORG}/${DEFAULT_REPO}`;
  if (repo.includes("/")) return repo;
  return `${DEFAULT_ORG}/${repo}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function exec(cmd: string, cwd?: string): string {
  return execSync(cmd, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

function escapeShell(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}

/**
 * Converts a GeneratedAsset's markdown content into an Astro MDX page
 * following the go.seibert.group conventions.
 */
function convertToMdx(asset: GeneratedAsset): string {
  const slug = slugify(asset.title);
  const isLandingPage = asset.type === "landing-page";

  // Extract first paragraph as description (max 160 chars)
  const descriptionMatch = asset.content
    .replace(/^#.*\n+/m, "")
    .replace(/^\*.*\*\n*/m, "")
    .trim()
    .split("\n")[0];
  const description = (descriptionMatch ?? asset.title).slice(0, 157) + (descriptionMatch && descriptionMatch.length > 157 ? "..." : "");

  const frontmatter = [
    "---",
    `title: "${escapeFrontmatter(asset.title)}"`,
    `description: "${escapeFrontmatter(description)}"`,
    `uid: ${slug}`,
    ...(isLandingPage ? ["landingPage: true"] : []),
    "draft: true",
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

  const body = markdownToMdxBody(asset.content, isLandingPage);

  return `${frontmatter}\n\n${imports.join("\n")}\n\n${body}\n`;
}

function escapeFrontmatter(str: string): string {
  return str.replace(/"/g, '\\"');
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

  // Hero / PageHeader
  const headerProps = [`heading={{ text: "${escapeFrontmatter(title)}", level: 1 }}`];
  parts.push(
    `<Container verticalPadding="${isLandingPage ? "xl" : "md"}">`,
    `  <PageHeader ${headerProps.join(" ")}>`,
    subtitle ? `    ${subtitle}` : "",
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

function buildPrBody(published: PublishedAsset[], campaignName: string): string {
  const fileList = published.map((p) => `- \`${p.filePath}\` → [${p.url}](${p.url})`).join("\n");
  return `## Content Campaign: ${campaignName}

Auto-generated content assets:

${fileList}

All pages are created as \`draft: true\` and need review before publishing.

---
Generated with content-creator pipeline`;
}
