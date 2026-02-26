import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { GeneratedAsset } from "../types.js";
import { convertToMdx, slugify } from "../../shared/mdx.js";

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
    // Clone the repo
    exec(`gh repo clone "${repoFull}" "${tmpDir}/repo" -- --depth 1`);
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

    // Install dependencies and verify build (also updates pages.json)
    exec("pnpm install --frozen-lockfile", repoDir);
    exec("pnpm build", repoDir);

    // Stage all changes including updated pages.json from build
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
        `gh pr create --repo "${repoFull}" --head "${branchName}" --title "Content: ${campaignName}" --body "${escapeShell(prBody)}"`,
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

function exec(cmd: string, cwd?: string): string {
  return execSync(cmd, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 300_000 });
}

function escapeShell(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}

function buildPrBody(published: PublishedAsset[], campaignName: string): string {
  const fileList = published.map((p) => `- \`${p.filePath}\` → [${p.url}](${p.url})`).join("\n");
  return `## Content Campaign: ${campaignName}

Auto-generated content assets:

${fileList}

Pages are live on the Vercel preview once this PR is created — review before merging.

---
Generated with content-creator pipeline`;
}
