import { z } from "zod";

// --- Stage 1: Campaign Brief ---

export const AssetTypeEnum = z.enum([
  "linkedin-post",
  "twitter-post",
  "blog-article",
  "email-newsletter",
  "instagram-caption",
]);

export type AssetType = z.infer<typeof AssetTypeEnum>;

export const AssetRequestSchema = z.object({
  type: AssetTypeEnum,
  count: z.number().min(1).max(10),
  notes: z.string().optional(),
});

export const CampaignBriefSchema = z.object({
  topic: z.string().describe("Core topic of the campaign"),
  targetAudience: z.string().describe("Who the content is for"),
  goals: z.array(z.string()).describe("Campaign goals"),
  tone: z.string().describe("Desired tone/voice, e.g. professional, casual"),
  keyMessages: z.array(z.string()).describe("Key messages to convey"),
  language: z.string().describe("Content language: de or en"),
  requestedAssets: z.array(AssetRequestSchema).describe("Assets to generate"),
  constraints: z.array(z.string()).optional().describe("Any constraints or requirements"),
});

export type CampaignBrief = z.infer<typeof CampaignBriefSchema>;

// --- Stage 2: Content Plan ---

export const ContentPillarSchema = z.object({
  name: z.string(),
  description: z.string(),
  keyMessages: z.array(z.string()),
});

export const PlannedAssetSchema = z.object({
  id: z.string(),
  type: AssetTypeEnum,
  title: z.string(),
  angle: z.string().describe("Specific angle or hook for this asset"),
  pillar: z.string().describe("Which content pillar this belongs to"),
  keyPoints: z.array(z.string()),
  cta: z.string().describe("Call to action"),
});

export const ContentPlanSchema = z.object({
  campaignName: z.string(),
  summary: z.string(),
  pillars: z.array(ContentPillarSchema),
  assets: z.array(PlannedAssetSchema),
  brandVoiceGuidelines: z.string(),
});

export type ContentPlan = z.infer<typeof ContentPlanSchema>;
export type PlannedAsset = z.infer<typeof PlannedAssetSchema>;

// --- Stage 3: Generated Assets ---

export interface GeneratedAsset {
  id: string;
  type: AssetType;
  title: string;
  content: string;
  metadata: Record<string, string>;
}

// --- Stage 4: Review ---

export const AssetReviewSchema = z.object({
  assetId: z.string(),
  score: z.number().min(1).max(10),
  strengths: z.array(z.string()),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
  revised: z.boolean().describe("Whether the asset needs revision"),
});

export const ReviewResultSchema = z.object({
  overallScore: z.number().min(1).max(10),
  consistencyNotes: z.string(),
  assetReviews: z.array(AssetReviewSchema),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

// --- Pipeline State ---

export interface PipelineState {
  userPrompt: string;
  language: string;
  brief?: CampaignBrief;
  plan?: ContentPlan;
  assets?: GeneratedAsset[];
  review?: ReviewResult;
  outputDir?: string;
}
