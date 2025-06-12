# IIIF Manifests - 東方學デジタル圖書館

This directory contains IIIF Presentation API 3.0 compliant manifests for the first 10 books from the Oriental Studies Digital Library (東方學デジタル圖書館).

## Generated Manifests

| File | Book ID | Title | Dynasty | Volumes | Canvases |
|------|---------|-------|---------|---------|----------|
| A027.json | A027 | 尚書正義　二十卷 | 漢 | 20 | 777 |
| A029.json | A029 | 周易筮述　八卷 | 淸 | 4 | 341 |
| A042.json | A042 | 新鐫鄒臣虎先生詩經翼註講意　不分卷 | - | 7 | 314 |
| A044.json | A044 | 毛詩 二十卷 | - | 2 | 196 |
| A046.json | A046 | 尚書譜　五卷 | 清 | 6 | 141 |
| A048.json | A048 | 古文尚書冤詞補正 不分卷 | - | 1 | 39 |
| A049.json | A049 | 書序答問  一卷 | 淸 | 1 | 17 |
| A050.json | A050 | 古文尚書條辨  五卷 | - | 2 | 154 |
| A053.json | A053 | 律呂新書淺釋 | - | 1 | 39 |
| A064.json | A064 | 周禮正義殘 | - | 1 | 21 |

## IIIF Specification Compliance

All manifests comply with **IIIF Presentation API 3.0** specification and include:

- **Multilingual support**: Labels and metadata in both Chinese (`zh`) and English (`en`)
- **Rich metadata**: Title, category, authors, dynasty, publication info, volumes, and book type
- **Canvas structure**: Each page represented as a canvas with proper dimensions
- **Image annotations**: Each canvas contains painting annotations with image resources
- **Image services**: IIIF Image API 2.0 service references for deep zoom capabilities
- **Attribution**: Proper rights and provider information

## Manifest Structure

Each manifest includes:

### Core Properties
- `@context`: IIIF 3.0 and Web Annotation contexts
- `id`: Unique manifest identifier
- `type`: "Manifest"
- `label`: Book title in Chinese and English
- `items`: Array of canvas objects representing pages

### Metadata
- **Title** (書名): Original book title
- **Category** (類別): Traditional Chinese book classification
- **Author(s)** (作者): Book authors when available
- **Dynasty** (朝代): Historical period when available  
- **Publication Info** (版本信息): Detailed publication information
- **Volumes** (卷數): Volume count in traditional Chinese
- **Book Type** (版本類型): Manuscript (手鈔本), printed (刊本), etc.

### Rights & Attribution
- **Rights**: Creative Commons BY-NC 4.0 license
- **Attribution**: Oriental Studies Digital Library
- **Provider**: Link to digital library homepage

## URL Structure

### Manifest URLs
```
https://toho-digital-library.example.org/manifests/{BOOK_ID}.json
```

### Canvas URLs  
```
https://toho-digital-library.example.org/canvas/{BOOK_ID}/{VOLUME_ID}_{PAGE_NUMBER}
```

### Image URLs
```
https://iiif.toho-digital-library.example.org/{BOOK_ID}/{VOLUME_ID}_{PAGE_NUMBER_PADDED}.jpg
```

### Image Service URLs
```
https://iiif.toho-digital-library.example.org/{BOOK_ID}/{VOLUME_ID}_{PAGE_NUMBER_PADDED}
```

## Usage Examples

### Loading in IIIF Viewers

**Mirador 3:**
```javascript
const config = {
  id: 'mirador-viewer',
  windows: [{
    manifestId: 'https://toho-digital-library.example.org/manifests/A029.json'
  }]
};
Mirador.viewer(config);
```

**Universal Viewer:**
```html
<div id="uv" style="width: 800px; height: 600px;"></div>
<script>
  const urlDataProvider = new UV.URLDataProvider();
  const uv = new UV.Viewer(document.getElementById('uv'), {
    iiifResourceUri: 'https://toho-digital-library.example.org/manifests/A029.json'
  });
</script>
```

**OpenSeadragon with IIIF:**
```javascript
OpenSeadragon({
  id: 'viewer',
  tileSources: 'https://iiif.toho-digital-library.example.org/A029/A0290001_001/info.json'
});
```

## Technical Notes

1. **Image Dimensions**: Default canvas size set to 1000×1400 pixels (typical for Chinese classical texts)
2. **Image Format**: JPEG format specified for compatibility
3. **Service Profile**: IIIF Image API 2.0 Level 2 compliance
4. **Pagination**: Sequential page numbering within each volume
5. **Volume Structure**: Preserves original volume organization from source data

## Generation Details

- **Generated on**: June 12, 2025
- **Source data**: toho-data.json (parsed from HTML catalog)
- **Generator**: generate-iiif-manifests.ts
- **Total books processed**: 10
- **Total canvases**: 2,039 pages across all manifests
- **IIIF version**: Presentation API 3.0

## Validation

These manifests can be validated using:
- [IIIF Validator](https://presentation-validator.iiif.io/)
- [IIIF Manifest Editor](https://manifest-editor.netlify.app/)

## License

The manifests themselves are provided under CC BY-NC 4.0. Original content rights remain with the respective institutions and collections.
