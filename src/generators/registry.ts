import type { AssetType } from "../pipeline/types.js";
import type { AssetGenerator } from "./base.js";
import { LinkedInPostGenerator } from "./linkedin-post.js";
import { TwitterPostGenerator } from "./twitter-post.js";
import { BlogArticleGenerator } from "./blog-article.js";
import { EmailNewsletterGenerator } from "./email-newsletter.js";
import { InstagramCaptionGenerator } from "./instagram-caption.js";
import { WhitepaperGenerator } from "./whitepaper.js";
import { LandingPageGenerator } from "./landing-page.js";

const generators: Map<AssetType, AssetGenerator> = new Map();

function register(generator: AssetGenerator): void {
  generators.set(generator.type, generator);
}

register(new LinkedInPostGenerator());
register(new TwitterPostGenerator());
register(new BlogArticleGenerator());
register(new EmailNewsletterGenerator());
register(new InstagramCaptionGenerator());
register(new WhitepaperGenerator());
register(new LandingPageGenerator());

export function getGenerator(type: AssetType): AssetGenerator {
  const gen = generators.get(type);
  if (!gen) {
    throw new Error(`No generator registered for asset type: ${type}`);
  }
  return gen;
}

export function listGenerators(): AssetGenerator[] {
  return Array.from(generators.values());
}
