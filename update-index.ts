#!/usr/bin/env bun

/**
 * Update Index HTML Generator for IIIF Manifests
 *
 * This script dynamically generates an updated index.html file
 * by reading all manifest files in the manifests directory
 */

import { promises as fs } from "fs";
import path from "path";

interface ManifestInfo {
  filename: string;
  id: string;
  title: string;
  titleEn?: string;
  dynasty?: string;
  canvasCount: number;
  fileSize: string;
  volumeCount?: number;
  authors?: string[];
  summary?: string;
  metadata?: Array<{
    label: { [lang: string]: string[] };
    value: { [lang: string]: string[] };
  }>;
}

class IndexHTMLGenerator {
  private manifestsDir = "./docs";

  chineseToArabic(text: string): number {
    const chineseNums: { [key: string]: number } = {
      零: 0,
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      十: 10,
      百: 100,
      千: 1000,
      万: 10000,
    };

    if (/^\d+$/.test(text)) return parseInt(text);

    let result = 0;
    let temp = 0;

    for (const char of text) {
      if (chineseNums[char] !== undefined) {
        const num = chineseNums[char];
        if (num >= 10) {
          if (num === 10 && temp === 0) temp = 1;
          result += temp * num;
          temp = 0;
        } else {
          temp = temp * 10 + num;
        }
      }
    }
    result += temp;
    return result || parseInt(text) || 0;
  }

  /**
   * Read and parse a manifest file
   */
  async parseManifest(filename: string): Promise<ManifestInfo | null> {
    try {
      const filePath = path.join(this.manifestsDir, filename);
      const content = await fs.readFile(filePath, "utf-8");
      const manifest = JSON.parse(content);

      if (manifest.type !== "Manifest") {
        return null; // Skip collection files
      }

      const stats = await fs.stat(filePath);
      const fileSize = this.formatFileSize(stats.size);

      // Extract metadata
      const title =
        manifest.label?.zh?.[0] || manifest.label?.ja?.[0] || filename;
      const titleEn = manifest.label?.en?.[0];
      const canvasCount = manifest.items?.length || 0;

      // Extract dynasty and other metadata
      let dynasty = "";
      let authors: string[] = [];
      let volumeCount: number | undefined;

      if (manifest.metadata && Array.isArray(manifest.metadata)) {
        for (const meta of manifest.metadata) {
          const labelKey = meta.label?.en?.[0] || meta.label?.zh?.[0];
          if (labelKey === "Dynasty" || labelKey === "朝代") {
            dynasty = meta.value?.zh?.[0] || "";
          } else if (labelKey === "Author(s)" || labelKey === "作者") {
            authors = meta.value?.zh || [];
          } else if (labelKey === "Volumes" || labelKey === "卷數") {
            const volumeText = meta.value?.zh?.[0] || "";
            // Convert Chinese numerals to integers
            volumeCount = this.chineseToArabic(volumeText);
            volumeCount = volumeCount===0?1:volumeCount; // Ensure at least 1 volume
          }
        }
      }

      const summary =
        manifest.summary?.zh?.[0] || manifest.summary?.en?.[0] || "";

      return {
        filename,
        id: filename.replace(".json", ""),
        title,
        titleEn,
        dynasty,
        canvasCount,
        fileSize,
        volumeCount,
        authors,
        summary,
        metadata: manifest.metadata,
      };
    } catch (error) {
      console.error(`❌ Failed to parse ${filename}:`, error);
      return null;
    }
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Generate HTML content
   */
  generateHTML(manifests: ManifestInfo[]): string {
    const totalCanvases = manifests.reduce((sum, m) => sum + m.canvasCount, 0);
    const totalVolumes = manifests.reduce(
      (sum, m) => sum + (m.volumeCount || 0),
      0
    );
    const totalSize = manifests.length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>東方學デジタル圖書館 - IIIF Manifests</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .subtitle {
            color: #666;
            font-size: 1.1em;
            margin: 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 8px;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            display: block;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .collection-link {
            text-align: center;
            margin: 30px 0;
        }
        .collection-link a {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 500;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .collection-link a:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .manifest-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        .manifest-card {
            border: 1px solid #e1e8ed;
            border-radius: 12px;
            padding: 20px;
            background: white;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .manifest-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .manifest-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .manifest-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        .manifest-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            font-size: 0.9em;
            color: #666;
        }
        .meta-label {
            font-weight: 500;
        }
        .meta-value {
            color: #2c3e50;
        }
        .dynasty-tag {
            display: inline-block;
            padding: 4px 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            font-size: 0.8em;
            color: #495057;
        }
        .authors {
            font-style: italic;
            color: #666;
            margin: 10px 0;
            line-height: 1.4;
        }
        .manifest-actions {
            margin-top: 15px;
            display: flex;
            gap: 10px;
        }
        .manifest-link {
            flex: 1;
            display: inline-block;
            padding: 10px 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.9em;
            text-align: center;
            transition: all 0.2s;
        }
        .manifest-link:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }
        .info-note {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            color: #856404;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e1e8ed;
            color: #666;
            font-size: 0.9em;
        }
        .last-updated {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 10px;
            margin: 20px 0;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>東方學デジタル圖書館</h1>
            <p class="subtitle">Oriental Studies Digital Library - IIIF Presentation API 3.0 Manifests</p>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <span class="stat-value">${manifests.length}</span>
                <div class="stat-label">Manifests</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalCanvases.toLocaleString()}</span>
                <div class="stat-label">Total Pages</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalVolumes}</span>
                <div class="stat-label">Volumes</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${manifests.length + 1}</span>
                <div class="stat-label">JSON Files</div>
            </div>
        </div>

        <div class="collection-link">
            <a href="./collection.json" target="_blank">📚 View IIIF Collection</a>
        </div>

        <div class="last-updated">
            📅 Last updated: ${new Date().toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
        </div>

        <div class="manifest-grid">
${manifests
  .map(
    (manifest) => `            <div class="manifest-card">
                <div class="manifest-title">${manifest.title}</div>
                
                <div class="manifest-meta">
                    <span class="meta-label">📖 ID:</span>
                    <span class="meta-value">${manifest.id}</span>
                </div>
                
                ${
                  manifest.dynasty
                    ? `<div class="manifest-meta">
                    <span class="meta-label">🏛️ Dynasty:</span>
                    <span class="dynasty-tag">${manifest.dynasty}</span>
                </div>`
                    : ""
                }
                
                <div class="manifest-meta">
                    <span class="meta-label">📄 Pages:</span>
                    <span class="meta-value">${manifest.canvasCount.toLocaleString()}</span>
                </div>
                
                <div class="manifest-meta">
                    <span class="meta-label">💾 Size:</span>
                    <span class="meta-value">${manifest.fileSize}</span>
                </div>
                
                ${
                  manifest.volumeCount
                    ? `<div class="manifest-meta">
                    <span class="meta-label">📚 Volumes:</span>
                    <span class="meta-value">${manifest.volumeCount}</span>
                </div>`
                    : ""
                }
                
                ${
                  manifest.authors && manifest.authors.length > 0
                    ? `<div class="authors">
                    👤 ${manifest.authors.join(", ")}
                </div>`
                    : ""
                }
                
                ${
                  manifest.summary
                    ? `<div class="authors">
                    📝 ${manifest.summary}
                </div>`
                    : ""
                }
                
                <div class="manifest-actions">
                    <a href="./${
                      manifest.filename
                    }" class="manifest-link" target="_blank">
                        View Manifest
                    </a>
                </div>
            </div>`
  )
  .join("\n")}
        </div>

        <div class="info-note">
            <strong>📝 Note:</strong> These are IIIF Presentation API 3.0 compliant manifests. 
            To view the actual digital books, you'll need a IIIF viewer like 
            <a href="https://projectmirador.org/" target="_blank" style="color: #856404; text-decoration: underline;">Mirador</a> or 
            <a href="https://universalviewer.io/" target="_blank" style="color: #856404; text-decoration: underline;">Universal Viewer</a>, 
            and the actual image resources need to be available via a IIIF Image Server.
        </div>

        <div class="footer">
            <p>Generated with IIIF Manifest Generator | IIIF Presentation API 3.0</p>
            <p>東方學デジタル圖書館 © ${new Date().getFullYear()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Main execution function
   */
  async execute(): Promise<void> {
    try {
      console.log("🔄 Updating index.html for IIIF Manifests...");

      // Read all files in manifests directory
      const files = await fs.readdir(this.manifestsDir);
      const manifestFiles = files.filter(
        (f) => f.endsWith(".json") && f !== "collection.json"
      );

      console.log(`📄 Found ${manifestFiles.length} manifest files`);

      // Parse all manifests
      const manifests: ManifestInfo[] = [];
      for (const filename of manifestFiles) {
        const manifest = await this.parseManifest(filename);
        if (manifest) {
          manifests.push(manifest);
        }
      }

      // Sort by ID
      manifests.sort((a, b) => a.id.localeCompare(b.id));

      console.log(`✅ Successfully parsed ${manifests.length} manifests`);

      // Generate HTML
      const html = this.generateHTML(manifests);

      // Write to index.html
      const indexPath = path.join("./docs", "index.html");
      await fs.writeFile(indexPath, html, "utf-8");

      console.log(`📝 Updated ${indexPath}`);
      console.log("✨ Index HTML generation completed!");

      // Display summary
      console.log("\n📊 Summary:");
      console.log(`   Total manifests: ${manifests.length}`);
      console.log(
        `   Total pages: ${manifests
          .reduce((sum, m) => sum + m.canvasCount, 0)
          .toLocaleString()}`
      );
      console.log(
        `   Total volumes: ${manifests.reduce(
          (sum, m) => sum + (m.volumeCount || 0),
          0
        )}`
      );
    } catch (error) {
      console.error("❌ Error updating index.html:", error);
      process.exit(1);
    }
  }
}

// Export the class for potential imports
export { IndexHTMLGenerator };

// Run the script
if (import.meta.main) {
  const generator = new IndexHTMLGenerator();
  generator.execute();
}
