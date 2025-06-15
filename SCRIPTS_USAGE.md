# IIIF Manifest Scripts Usage Guide

本文档说明如何使用IIIF manifest相关的bun脚本。

## 可用脚本

### 1. 更新Index HTML (`update-index.ts`)

**用途**: 动态生成和更新 `./manifests/index.html` 文件，显示所有IIIF manifests的概览。

**运行方式**:
```bash
# 直接运行
bun update-index.ts

# 或使用npm脚本
bun run update-index
```

**功能**:
- 扫描 `./manifests/` 目录中的所有 `.json` 文件
- 解析每个manifest文件的元数据
- 生成包含以下信息的HTML界面：
  - 书籍标题（中文和英文）
  - 朝代信息
  - 页面数量（canvas count）
  - 文件大小
  - 卷数
  - 作者信息
  - 摘要信息
- 提供manifest文件的直接链接
- 显示统计信息和最后更新时间

### 2. 生成IIIF Manifests (`generate-iiif-manifests.ts`)

**用途**: 从 `toho-data.json` 数据文件生成IIIF Presentation API 3.0兼容的manifest文件。

**运行方式**:
```bash
# 直接运行
bun generate-iiif-manifests.ts

# 或使用npm脚本  
bun run generate-manifests
```

**功能**:
- 读取 `toho-data.json` 中解析的书籍数据
- 为每本有结构数据的书籍生成IIIF manifest
- 创建包含元数据、canvas和图像注释的完整manifest
- 保存到 `./manifests/` 目录

### 3. 验证Manifests (`validate-manifests.ts`)

**用途**: 验证生成的IIIF manifest文件的格式和完整性。

**运行方式**:
```bash
# 直接运行
bun validate-manifests.ts

# 或使用npm脚本
bun run validate-manifests
```

**功能**:
- 检查JSON语法有效性
- 验证IIIF结构合规性
- 报告错误和警告
- 提供统计信息

## 工作流程

推荐的工作流程：

1. **生成manifests**:
   ```bash
   bun run generate-manifests
   ```

2. **验证manifests**:
   ```bash
   bun run validate-manifests  
   ```

3. **更新HTML界面**:
   ```bash
   bun run update-index
   ```

## 输出文件

### `./manifests/` 目录结构:
```
manifests/
├── A001.json, A002.json, ... (各种manifest文件)
├── collection.json (IIIF Collection索引)
├── index.html (动态生成的HTML界面)
├── README.md (manifests文档)
└── SUMMARY.md (生成摘要)
```

## 脚本特性

### `update-index.ts` 特性:
- ✅ 自动扫描所有manifest文件
- ✅ 解析中文和英文标题
- ✅ 提取朝代、作者、卷数等元数据
- ✅ 计算文件大小并格式化显示
- ✅ 响应式网格布局
- ✅ 美观的现代UI设计
- ✅ 显示最后更新时间
- ✅ 提供IIIF Collection链接
- ✅ 包含使用说明和外部链接

### 处理的元数据字段:
- **标题**: `label.zh[0]` 或 `label.ja[0]`
- **英文标题**: `label.en[0]`
- **朝代**: 从metadata中提取 "Dynasty" 或 "朝代"
- **作者**: 从metadata中提取 "Author(s)" 或 "作者"
- **卷数**: 从metadata中提取 "Volumes" 或 "卷數"
- **页面数**: `items.length` (canvas数量)
- **摘要**: `summary.zh[0]` 或 `summary.en[0]`

## 配置选项

在 `generate-iiif-manifests.ts` 中可以修改的配置：

```typescript
const BASE_URL = "https://toho-digital-library.zinbun.kyoto-u.ac.jp";
const IMAGE_SERVICE_BASE_URL = "http://toho.toyjack.net/iiif/3";
```

## 故障排除

如果脚本出现问题：

1. **检查依赖**: 确保安装了bun和TypeScript
2. **检查文件路径**: 确保在正确的目录运行脚本
3. **检查权限**: 确保有写入 `./manifests/` 目录的权限
4. **检查JSON格式**: 使用validate脚本检查manifest文件

## 示例输出

运行 `bun run update-index` 后的示例输出：
```
🔄 Updating index.html for IIIF Manifests...
📄 Found 318 manifest files
✅ Successfully parsed 318 manifests
📝 Updated manifests\index.html
✨ Index HTML generation completed!

📊 Summary:
   Total manifests: 318
   Total pages: 113,984
   Total volumes: 0
```

## 相关资源

- [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/)
- [Mirador IIIF Viewer](https://projectmirador.org/)
- [Universal Viewer](https://universalviewer.io/)
- [IIIF Validator](https://presentation-validator.iiif.io/)
