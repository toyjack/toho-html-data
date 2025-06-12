#!/usr/bin/env bun

/**
 * IIIF Manifest Validation Script
 * 
 * Simple validation to check that generated manifests conform to basic IIIF structure
 */

import { promises as fs } from 'fs';
import path from 'path';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    canvasCount: number;
    totalImages: number;
  };
}

class IIIFValidator {
  
  async validateManifest(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      file: path.basename(filePath),
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        canvasCount: 0,
        totalImages: 0
      }
    };

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const manifest = JSON.parse(content);

      // Check required IIIF 3.0 properties
      this.checkRequiredProperties(manifest, result);
      
      // Check context
      this.checkContext(manifest, result);
      
      // Check type
      if (manifest.type !== 'Manifest') {
        result.errors.push(`Type should be 'Manifest', found: ${manifest.type}`);
      }

      // Check items (canvases)
      this.checkCanvases(manifest, result);

      // Check metadata structure
      this.checkMetadata(manifest, result);

      // Check provider
      this.checkProvider(manifest, result);

      result.valid = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Failed to parse JSON: ${error}`);
      result.valid = false;
    }

    return result;
  }

  private checkRequiredProperties(manifest: any, result: ValidationResult): void {
    const required = ['@context', 'id', 'type', 'label', 'items'];
    
    for (const prop of required) {
      if (!manifest[prop]) {
        result.errors.push(`Missing required property: ${prop}`);
      }
    }
  }

  private checkContext(manifest: any, result: ValidationResult): void {
    const context = manifest['@context'];
    if (!Array.isArray(context)) {
      result.errors.push('@context should be an array');
      return;
    }

    const expectedContexts = [
      'http://www.w3.org/ns/anno.jsonld',
      'http://iiif.io/api/presentation/3/context.json'
    ];

    for (const expected of expectedContexts) {
      if (!context.includes(expected)) {
        result.errors.push(`Missing required context: ${expected}`);
      }
    }
  }

  private checkCanvases(manifest: any, result: ValidationResult): void {
    if (!manifest.items || !Array.isArray(manifest.items)) {
      result.errors.push('items should be an array of canvases');
      return;
    }

    result.stats.canvasCount = manifest.items.length;

    for (let i = 0; i < manifest.items.length; i++) {
      const canvas = manifest.items[i];
      
      if (canvas.type !== 'Canvas') {
        result.errors.push(`Canvas ${i} should have type 'Canvas'`);
      }

      if (!canvas.id) {
        result.errors.push(`Canvas ${i} missing id`);
      }

      if (!canvas.label) {
        result.errors.push(`Canvas ${i} missing label`);
      }

      if (!canvas.height || !canvas.width) {
        result.errors.push(`Canvas ${i} missing dimensions`);
      }

      // Check annotation pages
      if (!canvas.items || !Array.isArray(canvas.items)) {
        result.errors.push(`Canvas ${i} missing annotation pages`);
        continue;
      }

      for (const annoPage of canvas.items) {
        if (annoPage.type !== 'AnnotationPage') {
          result.errors.push(`Canvas ${i} annotation page should have type 'AnnotationPage'`);
        }

        if (annoPage.items && Array.isArray(annoPage.items)) {
          result.stats.totalImages += annoPage.items.length;
          
          for (const anno of annoPage.items) {
            if (anno.type !== 'Annotation') {
              result.errors.push(`Canvas ${i} annotation should have type 'Annotation'`);
            }
            if (anno.motivation !== 'painting') {
              result.errors.push(`Canvas ${i} annotation should have motivation 'painting'`);
            }
          }
        }
      }
    }
  }

  private checkMetadata(manifest: any, result: ValidationResult): void {
    if (manifest.metadata && Array.isArray(manifest.metadata)) {
      for (let i = 0; i < manifest.metadata.length; i++) {
        const meta = manifest.metadata[i];
        if (!meta.label || !meta.value) {
          result.warnings.push(`Metadata item ${i} should have both label and value`);
        }
      }
    }
  }

  private checkProvider(manifest: any, result: ValidationResult): void {
    if (!manifest.provider || !Array.isArray(manifest.provider)) {
      result.warnings.push('Manifest should include provider information');
      return;
    }

    for (const provider of manifest.provider) {
      if (provider.type !== 'Agent') {
        result.warnings.push('Provider should have type "Agent"');
      }
      if (!provider.label) {
        result.warnings.push('Provider should have a label');
      }
    }
  }
}

async function main() {
  console.log('🔍 Validating IIIF Manifests');
  console.log('=============================');

  const manifestsDir = './manifests';
  const validator = new IIIFValidator();
  
  try {
    const files = await fs.readdir(manifestsDir);
    const manifestFiles = files.filter(f => f.endsWith('.json') && f !== 'collection.json');
    
    let totalValid = 0;
    let totalCanvases = 0;
    let totalImages = 0;
    
    for (const file of manifestFiles) {
      const filePath = path.join(manifestsDir, file);
      const result = await validator.validateManifest(filePath);
      
      console.log(`\n📄 ${result.file}`);
      console.log(`   Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Canvases: ${result.stats.canvasCount}`);
      console.log(`   Images: ${result.stats.totalImages}`);
      
      if (result.errors.length > 0) {
        console.log('   Errors:');
        result.errors.forEach(error => console.log(`     - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('   Warnings:');
        result.warnings.forEach(warning => console.log(`     - ${warning}`));
      }
      
      if (result.valid) {
        totalValid++;
      }
      totalCanvases += result.stats.canvasCount;
      totalImages += result.stats.totalImages;
    }
    
    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`Total manifests: ${manifestFiles.length}`);
    console.log(`Valid manifests: ${totalValid}`);
    console.log(`Total canvases: ${totalCanvases}`);
    console.log(`Total images: ${totalImages}`);
    console.log(`Success rate: ${Math.round((totalValid / manifestFiles.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
