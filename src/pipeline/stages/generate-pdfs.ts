import path from "node:path";
import type { GeneratedAsset } from "../types.js";
import { generatePdf } from "../../export/pdf.js";

export async function generatePdfs(
  assets: GeneratedAsset[],
  outputDir: string,
  language: string
): Promise<GeneratedAsset[]> {
  const pdfAssets = assets.filter((a) => a.type === "whitepaper");
  if (pdfAssets.length === 0) return assets;

  const result = [...assets];

  for (const asset of pdfAssets) {
    const idx = result.findIndex((a) => a.id === asset.id);
    const pdfOutputPath = path.join(outputDir, "assets", "whitepaper", `${asset.id}.pdf`);

    try {
      const pdfPath = await generatePdf({
        asset,
        outputPath: pdfOutputPath,
        coverImagePath: asset.imagePath,
        language,
      });
      result[idx] = { ...asset, pdfPath };
    } catch (err) {
      console.error(`  Warning: PDF generation failed for ${asset.id}: ${(err as Error).message}`);
    }
  }

  return result;
}
