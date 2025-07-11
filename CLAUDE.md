# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **IIIF (International Image Interoperability Framework) manifest generation system** for the **東方學デジタル圖書館 (Oriental Studies Digital Library)**. The system extracts metadata from HTML files and generates IIIF Presentation API 3.0 compliant manifests for digital book collections.

## Core Architecture

### Data Processing Pipeline
1. **HTML Parsing** (`index.ts`) - Extracts book metadata and structure from HTML menu files
2. **IIIF Generation** (`generate-iiif-manifests.ts`) - Creates IIIF manifests from parsed data
3. **Index Generation** (`update-index.ts`) - Creates browsable HTML interface for manifests
4. **Validation** (`validate-manifests.ts`) - Validates generated IIIF manifests
5. **Database Schema** (`generate-prisma-schema.ts`) - Generates Prisma schema for database storage

### Key Data Structures

The system works with these main interfaces:

- **BookEntry**: Core book metadata with structure information
- **BookVolume**: Individual volume/chapter within a book with page ranges
- **IIIFManifest**: IIIF Presentation API 3.0 compliant manifest structure
- **LibraryData**: Complete library collection with statistics

## Development Commands

### Primary Workflow
```bash
# Parse HTML files and extract book structure (generates toho-data.json)
bun run index.ts

# Generate IIIF manifests from parsed data
bun run generate-manifests

# Validate generated manifests for IIIF compliance  
bun run validate-manifests

# Update HTML index for browsing manifests
bun run update-index
```

### Database Management (Prisma)
```bash
# Generate Prisma schema and setup files
bun run generate-prisma-schema

# Initialize database (after configuring .env)
bun run db:generate
bun run db:push
bun run db:seed

# Database administration
bun run db:studio
bun run db:reset
```

### Quick Commands
```bash
# Install dependencies
bun install

# Run basic parsing
bun run start
```

## File Organization

### Input Files
- `html/` - Contains original HTML files with book metadata and navigation
- `toho-data.json` - Parsed book data (generated by index.ts)

### Generated Output
- `manifests/` - IIIF manifest files (.json) and browsable index.html
- Each book gets its own `{BookID}.json` manifest file

### Key Configuration

**Base URLs** (in generate-iiif-manifests.ts:13-14):
```typescript
const BASE_URL = "https://toho-digital-library.zinbun.kyoto-u.ac.jp";
const IMAGE_SERVICE_BASE_URL = "https://iiif.toyjack.net/iiif";
```

**Note**: Some scripts referenced in package.json may not exist yet:
- `validate-manifests.ts` - IIIF manifest validation script
- `generate-prisma-schema.ts` - Prisma schema generation
- `import-data-to-prisma.ts` - Database import script

## HTML Structure Parsing Logic

The system expects specific HTML patterns:

1. **Category Headers**: `<h2>` tags define book categories
2. **Book Links**: `<a href="...">BookTitle</a>` with optional description
3. **Menu Files**: Books can have `{BookID}menu.html` files linking to volumes
4. **Volume Files**: Individual volumes as `{BookID}{SequenceNumber}.html`

### Volume File JavaScript Variables
The parser extracts these JavaScript variables from volume HTML files:
- `volNum` - Volume number
- `volName` - Volume title
- `volStartPos` - Starting page position
- `volMaxPage` - Maximum pages in volume
- `bookNum` - Book identifier

## IIIF Manifest Structure

Generated manifests follow IIIF Presentation API 3.0:

- **Multi-language labels**: Chinese (zh), Japanese (ja), English (en)
- **Viewing direction**: Right-to-left (traditional Chinese texts)
- **Metadata fields**: Dynasty, authors, publication info, volume count
- **Canvas creation**: One canvas per page with proper dimensions
- **Image service integration**: Links to IIIF image server

## TypeScript Configuration

- **Runtime**: Bun (fast JavaScript runtime)
- **Module system**: ESNext with bundler resolution
- **Type checking**: Strict mode enabled
- **File extensions**: TypeScript files can import with extensions

## Data Processing Patterns

### Chinese Text Processing
- **Number conversion**: Converts Chinese numerals (一二三四五) to Arabic numbers
- **Dynasty extraction**: Recognizes Chinese dynasty names from descriptions
- **Author parsing**: Extracts authors using patterns like "某某撰", "某某輯"
- **Volume parsing**: Handles complex volume numbering systems

### Error Handling
- **File existence checks**: Gracefully handles missing menu/volume files
- **Backup scanning**: Falls back to sequential file scanning when menu files missing
- **JSON validation**: Validates manifest structure before output

## Development Notes

### When Adding New Features
1. Follow the existing data flow: HTML → parsed data → IIIF → validation
2. Update all relevant interfaces when changing data structures
3. Test with the validation script after generating manifests
4. Update the HTML index after structural changes

### Common Tasks
- **Adding metadata fields**: Update BookEntry interface and parsing logic in index.ts
- **Modifying IIIF output**: Edit generateManifest() in generate-iiif-manifests.ts
- **Changing validation rules**: Update validator methods in validate-manifests.ts
- **HTML interface changes**: Modify generateHTML() in update-index.ts

### Image Service Integration
The system assumes images are served via a IIIF Image API server. Image URLs follow the pattern:
`{IMAGE_SERVICE_BASE_URL}/{BookID}/{VolumeID}_{PageNumber}.jpg`

### Performance Considerations
- Processing large HTML collections can be memory-intensive
- The system processes all books sequentially (not parallelized)
- Generated manifest files can be large for books with many pages
- Use the validation script to check for structural issues before deployment