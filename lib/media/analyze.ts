import fs from "node:fs/promises";
import path from "node:path";
import {Asset} from "../schema";

export async function getImageBase64(assetUrl: string): Promise<string | null> {
  try {
    if (assetUrl.startsWith("http")) return null; // We can't safely read remote urls here, or we'd need to fetch them
    
    // Normalize path to get the actual file in public directory
    const normalizedUrl = assetUrl.replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), "public", normalizedUrl);
    
    const buffer = await fs.readFile(filePath);
    const mimeType = filePath.endsWith(".png") ? "image/png" : filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg" : "image/webp";
    
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch (e) {
    console.error(`Failed to read image ${assetUrl}:`, e);
    return null;
  }
}

export async function prepareVisionMessages(assets: Asset[]): Promise<any[]> {
  const messages: any[] = [];
  
  for (const asset of assets) {
    if (asset.type === "image" || asset.type === "logo") {
      const base64 = await getImageBase64(asset.url);
      if (base64) {
        messages.push({
          type: "text",
          text: `The following image represents assetId: ${asset.id} (${asset.name})`
        });
        messages.push({
          type: "image_url",
          image_url: {
            url: base64
          }
        });
      }
    }
    // Note: Video frame extraction using ffmpeg would go here in a production setup
  }
  
  return messages;
}
