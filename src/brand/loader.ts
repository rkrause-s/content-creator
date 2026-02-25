import fs from "node:fs/promises";
import path from "node:path";

export interface BrandConfig {
  /** Raw content of each brand file, keyed by filename (without .md) */
  files: Record<string, string>;
  /** Concatenated brand context for text generation prompts */
  textContext: string;
  /** Concatenated visual/image context for image generation prompts */
  imageContext: string;
  /** Whether any brand files were found */
  loaded: boolean;
}

const TEXT_RELEVANT = ["identity", "tone-of-voice", "guidelines"];
const IMAGE_RELEVANT = ["visual-identity", "image-guidelines", "identity"];

export async function loadBrandConfig(brandDir?: string): Promise<BrandConfig> {
  const dir = brandDir ?? path.resolve("brand");

  const config: BrandConfig = {
    files: {},
    textContext: "",
    imageContext: "",
    loaded: false,
  };

  try {
    await fs.access(dir);
  } catch {
    return config;
  }

  const entries = await fs.readdir(dir);
  const mdFiles = entries.filter((f) => f.endsWith(".md")).sort();

  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(dir, file), "utf-8");
    const trimmed = content.trim();
    // Skip empty templates (only headings and HTML comments, no real content)
    if (isEmptyTemplate(trimmed)) continue;
    const key = file.replace(/\.md$/, "");
    config.files[key] = trimmed;
  }

  config.loaded = Object.keys(config.files).length > 0;

  if (config.loaded) {
    config.textContext = buildContext(config.files, TEXT_RELEVANT);
    config.imageContext = buildContext(config.files, IMAGE_RELEVANT);
  }

  return config;
}

function buildContext(files: Record<string, string>, relevantKeys: string[]): string {
  const sections: string[] = [];
  // First add the specifically relevant files in order
  for (const key of relevantKeys) {
    if (files[key]) {
      sections.push(files[key]);
    }
  }
  // Then add any extra files not in the relevant list
  for (const [key, content] of Object.entries(files)) {
    if (!relevantKeys.includes(key)) {
      sections.push(content);
    }
  }
  return sections.join("\n\n---\n\n");
}

function isEmptyTemplate(content: string): boolean {
  // Remove structural elements and placeholder text, then check if real content remains
  const stripped = content
    .replace(/<!--[\s\S]*?-->/g, "")           // HTML comments
    .replace(/^#+\s.*$/gm, "")                 // Headings
    .replace(/^\|[-| :]+\|$/gm, "")            // Table separators
    .replace(/^\|.*\|.*\|$/gm, "")             // Table rows
    .replace(/^-\s*\*\*[^*]+\*\*:\s*.*$/gm, "") // - **Label**: value
    .replace(/^-\s*[A-Za-zÄÖÜäöüß]+:\s*#?\w*\s*$/gm, "") // - Key: #value or - Key:
    .replace(/^-\s*(#\w*)?\s*$/gm, "")         // - # or bare -
    .replace(/\(z\.?B\.?\s*[^)]*\)/g, "")      // (z.B. ...)
    .replace(/ja\/nein/g, "")                   // ja/nein
    .replace(/\s/g, "");
  return stripped.length === 0;
}
