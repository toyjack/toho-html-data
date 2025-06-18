#!/usr/bin/env bun

/**
 * IIIF Manifest Generator for 東方學デジタル圖書館
 * 
 * This script generates IIIF Presentation API 3.0 compliant manifests
 * for the first 10 books from the digital library collection.
 */

import { promises as fs } from 'fs';
import path from 'path';

  const BASE_URL: string = "https://toho-digital-library.zinbun.kyoto-u.ac.jp";
  const IMAGE_SERVICE_BASE_URL: string = "https://iiif.toyjack.net/iiif";
  const OUTPUT_DIR = './docs/manifests'; // Directory to save manifests

// IIIF Presentation API 3.0 Types
interface IIIFManifest {
  "@context": [
    "http://www.w3.org/ns/anno.jsonld",
    "http://iiif.io/api/presentation/3/context.json"
  ];
  id: string;
  type: "Manifest";
  label: { [lang: string]: string[] };
  metadata: Array<{
    label: { [lang: string]: string[] };
    value: { [lang: string]: string[] };
  }>;
  summary?: { [lang: string]: string[] };
  viewingDirection?: "left-to-right" | "right-to-left";
  requiredStatement?: {
    label: { [lang: string]: string[] };
    value: { [lang: string]: string[] };
  };
  rights?: string;
  provider: Array<{
    id: string;
    type: "Agent";
    label: { [lang: string]: string[] };
    homepage: Array<{
      id: string;
      type: "Text";
      label: { [lang: string]: string[] };
      format: "text/html";
    }>;
  }>;
  items: IIIFCanvas[];
}

interface IIIFCanvas {
  id: string;
  type: "Canvas";
  label: { [lang: string]: string[] };
  height: number;
  width: number;
  items: IIIFAnnotationPage[];
}

interface IIIFAnnotationPage {
  id: string;
  type: "AnnotationPage";
  items: IIIFAnnotation[];
}

interface IIIFAnnotation {
  id: string;
  type: "Annotation";
  motivation: "painting";
  body: {
    id: string;
    type: "Image";
    format: "image/jpeg";
    height: number;
    width: number;
    service?: Array<{
      "@id": string;
      "@type": "ImageService2";
      profile: "http://iiif.io/api/image/2/level2.json";
    }>;
  };
  target: string;
}

// Book structure interfaces (from existing code)
interface BookVolume {
  id: string;
  title: string;
  url: string;
  volumeNumber?: number;
  chapterNumber?: number;
  startPage?: number;
  maxPage?: number;
  bookNumber?: string;
  sequence?: number;
}

interface BookEntry {
  id: string;
  category: string;
  title: string;
  volumes?: string;
  authors: string[];
  dynasty?: string;
  publicationInfo: string;
  collectionInfo: string;
  url: string;
  bookType: 'manuscript' | 'printed' | 'rubbing' | 'unknown';
  isIncomplete: boolean;
  hasSeals: boolean;
  hasNotes: boolean;
  structure?: BookVolume[];
  totalVolumes?: number;
}

interface LibraryData {
  metadata: {
    title: string;
    totalBooks: number;
    categories: string[];
    extractedAt: string;
    totalVolumes: number;
  };
  books: BookEntry[];
}

class IIIFManifestGenerator {

  
  constructor() {}

  /**
   * Generate a IIIF manifest for a single book
   */
  generateManifest(book: BookEntry): IIIFManifest {
    const manifestId = `${BASE_URL}/manifests/${book.id}.json`;
    
    // Create metadata entries
    const metadata = [
      {
        label: { "en": ["Title"], "zh": ["書名"] },
        value: { "zh": [book.title] }
      },
      {
        label: { "en": ["Category"], "zh": ["類別"] },
        value: { "zh": [book.category] }
      }
    ];

    // Add authors if available
    if (book.authors && book.authors.length > 0) {
      metadata.push({
        label: { "en": ["Author(s)"], "zh": ["作者"] },
        value: { "zh": book.authors }
      });
    }

    // Add dynasty if available
    if (book.dynasty) {
      metadata.push({
        label: { "en": ["Dynasty"], "zh": ["朝代"] },
        value: { "zh": [book.dynasty] }
      });
    }

    // Add publication info
    if (book.publicationInfo) {
      metadata.push({
        label: { "en": ["Publication Info"], "zh": ["版本信息"] },
        value: { "zh": [book.publicationInfo] }
      });
    }

    // Add volume info if available
    if (book.volumes) {
      metadata.push({
        label: { "en": ["Volumes"], "zh": ["卷數"] },
        value: { "zh": [book.volumes] }
      });
    }

    // Add book type
    const bookTypeMap: { [key: string]: string } = {
      manuscript: "手鈔本",
      printed: "刊本",
      rubbing: "拓本",
      unknown: "未知"
    };
    
    metadata.push({
      label: { "en": ["Book Type"], "zh": ["版本類型"] },
      value: { "zh": [bookTypeMap[book.bookType] || book.bookType] }
    });

    // Create canvases from volumes
    const canvases: IIIFCanvas[] = [];
    
    if (book.structure && book.structure.length > 0) {
      for (const volume of book.structure) {
        // Create canvases for each page in the volume
        const maxPage = volume.maxPage || 1;
        const startPage = volume.startPage || 1;
        
        for (let pageNum = 1; pageNum <= maxPage; pageNum++) {
          const globalPageNum = startPage + pageNum - 1;
          const canvas = this.createCanvas(book, volume, pageNum, globalPageNum);
          canvases.push(canvas);
        }
      }
    } else {
      // If no structure, create a single canvas as placeholder
      const canvas = this.createCanvas(book, null, 1, 1);
      canvases.push(canvas);
    }

    const manifest: IIIFManifest = {
      "@context": [
        "http://www.w3.org/ns/anno.jsonld",
        "http://iiif.io/api/presentation/3/context.json"
      ],
      id: manifestId,
      type: "Manifest",
      label: { 
        "zh": [book.title],
        "en": [book.title] 
      },
      metadata,
      summary: {
        "zh": [book.publicationInfo || ""],
        "en": [book.publicationInfo || ""]
      },
      "viewingDirection": "right-to-left",
      requiredStatement: {
        label: { "en": ["Attribution"], "zh": ["歸屬"] },
        value: { 
          "zh": ["東方學数字圖書館"], 
          "ja": ["東方學デジタル圖書館"], 
          "en": ["Oriental Studies Digital Library"] 
        }
      },
      rights: "http://creativecommons.org/licenses/by-nc/4.0/",
      provider: [{
        id: BASE_URL,
        type: "Agent",
        label: { 
          "ja": ["東方學デジタル圖書館"], 
          // "en": ["Oriental Studies Digital Library"] 
        },
        homepage: [{
          id: BASE_URL,
          type: "Text",
          label: { 
            "ja": ["東方學デジタル圖書館"], 
            // "en": ["Oriental Studies Digital Library"] 
          },
          format: "text/html"
        }]
      }],
      items: canvases
    };

    return manifest;
  }

  /**
   * Create a canvas for a page
   */
  private createCanvas(
    book: BookEntry, 
    volume: BookVolume | null, 
    pageNum: number, 
    globalPageNum: number
  ): IIIFCanvas {
    const canvasId = `${BASE_URL}/canvas/${book.id}/${volume?.id || 'p'}_${pageNum}`;
    
    // Standard page dimensions (can be adjusted based on actual scans)
    const width = 1000;
    const height = 1400;
    
    const pageLabel = volume 
      ? `${volume.title} - 第${pageNum}頁`
      : `第${pageNum}頁`;

    // Create image annotation
    const imageId = `${IMAGE_SERVICE_BASE_URL}/${book.id}/${volume?.id || 'default'}_${String(pageNum).padStart(3, '0')}.jpg`;
    
    const annotation: IIIFAnnotation = {
      id: `${canvasId}/annotation/1`,
      type: "Annotation",
      motivation: "painting",
      body: {
        id: imageId,
        type: "Image",
        format: "image/jpeg",
        height,
        width,
        service: [{
          "@id": `${IMAGE_SERVICE_BASE_URL}/${book.id}%2F${book.id}${String(pageNum).padStart(4, '0')}`,
          "@type": "ImageService2",
          profile: "http://iiif.io/api/image/2/level2.json"
        }]
      },
      target: canvasId
    };

    const annotationPage: IIIFAnnotationPage = {
      id: `${canvasId}/page/1`,
      type: "AnnotationPage", 
      items: [annotation]
    };

    const canvas: IIIFCanvas = {
      id: canvasId,
      type: "Canvas",
      label: { 
        "zh": [pageLabel],
        "en": [pageLabel]
      },
      height,
      width,
      items: [annotationPage]
    };

    return canvas;
  }

  /**
   * Save manifest to file
   */
  async saveManifest(book: BookEntry, manifest: IIIFManifest): Promise<void> {
    const manifestsDir = OUTPUT_DIR;
    await fs.mkdir(manifestsDir, { recursive: true });
    
    const filename = `${book.id}.json`;
    const filepath = path.join(manifestsDir, filename);
    
    const manifestJson = JSON.stringify(manifest, null, 2);
    await fs.writeFile(filepath, manifestJson, 'utf-8');
    
    console.log(`✅ Generated manifest: ${filename} (${manifest.items.length} canvases)`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Generating IIIF Manifests for 東方學デジタル圖書館');
    console.log('==================================================');

    // Read the parsed data
    const dataFile = await fs.readFile('./toho-data.json', 'utf-8');
    const libraryData: LibraryData = JSON.parse(dataFile);
    
    // Filter books with structure and get first 10
    const booksWithStructure = libraryData.books
      .filter(book => book.structure && book.structure.length > 0)
      // .slice(0, 10);
    
    if (booksWithStructure.length === 0) {
      console.error('❌ No books with volume structure found!');
      return;
    }

    console.log(`📚 Found ${booksWithStructure.length} books with structure to process:`);
    booksWithStructure.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} (${book.totalVolumes} volumes)`);
    });
    console.log('');

    // Generate manifests
    const generator = new IIIFManifestGenerator();
    
    for (const book of booksWithStructure) {
      try {
        const manifest = generator.generateManifest(book);
        await generator.saveManifest(book, manifest);
      } catch (error) {
        console.error(`❌ Failed to generate manifest for ${book.title}:`, error);
      }
    }

    console.log('');
    console.log('✨ IIIF Manifest generation completed!');
    console.log(`📁 Manifests saved to: ./manifests/`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`📷 Image Service: ${IMAGE_SERVICE_BASE_URL}`);
    
  } catch (error) {
    console.error('❌ Error generating manifests:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  main();
}
