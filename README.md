# 東方學デジタル圖書館 IIIF系统使用指南

本文档说明IIIF（国际图像互操作性框架）manifest生成系统的使用方法。

## 核心工作流程

### 完整数据处理流程

1. **HTML解析** (`index.ts`) - 从HTML菜单文件提取书籍元数据和结构
2. **IIIF生成** (`generate-iiif-manifests.ts`) - 根据解析数据创建IIIF清单
3. **索引生成** (`update-index.ts`) - 创建可浏览的HTML界面


## 可用脚本

### 1. HTML数据解析 (`index.ts`)

**用途**: 从HTML文件中提取书籍元数据和结构信息，生成 `toho-data.json`。

**运行方式**:
```bash
# 解析HTML文件并提取书籍结构
bun run index.ts
# 或
bun run start
```

### 2. 生成IIIF Manifests (`generate-iiif-manifests.ts`)

**用途**: 从 `toho-data.json` 数据文件生成IIIF Presentation API 3.0兼容的manifest文件。

**运行方式**:
```bash
bun run generate-manifests
```

### 3. 更新Index HTML (`update-index.ts`)

**用途**: 动态生成和更新 `./manifests/index.html` 文件，显示所有IIIF manifests的概览。

**运行方式**:
```bash
bun run update-index
```


## 推荐工作流程

```bash
# 1. 解析HTML文件并提取书籍结构 (生成toho-data.json)
bun run index.ts

# 2. 生成IIIF manifests
bun run generate-manifests

# 4. 更新HTML索引界面
bun run update-index
```

**功能**:
- 扫描 `./docs/` 目录中的所有 `.json` 文件
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

## 文件组织

### 输入文件
- `html/` - 包含原始HTML文件，含有书籍元数据和导航信息
- `toho-data.json` - 解析后的书籍数据 (由index.ts生成)

### 生成输出
- `manifests/` - IIIF manifest文件(.json)和可浏览的index.html
- 每本书生成对应的 `{BookID}.json` manifest文件

### 目录结构:
```
docs/
├── A001.json, A002.json, ... (各种manifest文件) 
├── collection.json (IIIF Collection索引)
├── index.html (动态生成的HTML界面)
└── README.md (manifests文档)
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

## 关键配置

### IIIF配置 (generate-iiif-manifests.ts:13-14)

```typescript
const BASE_URL = "https://toho-digital-library.zinbun.kyoto-u.ac.jp";
const IMAGE_SERVICE_BASE_URL = "https://iiif.toyjack.net/iiif";
```

### 图像服务集成
系统假设图像通过IIIF图像API服务器提供。图像URL遵循以下模式：
`{IMAGE_SERVICE_BASE_URL}/{BookID}/{VolumeID}_{PageNumber}.jpg`

## 故障排除

如果脚本出现问题：

1. **检查依赖**: 确保安装了bun和TypeScript
2. **检查文件路径**: 确保在正确的目录运行脚本
3. **检查权限**: 确保有写入 `./docs/` 目录的权限
4. **检查JSON格式**: 使用validate脚本检查manifest文件

## IIIF Manifest结构

生成的manifest遵循IIIF Presentation API 3.0规范：

- **多语言标签**: 中文(zh)、日文(ja)、英文(en)
- **浏览方向**: 从右到左（传统中文文本）
- **元数据字段**: 朝代、作者、出版信息、卷数
- **Canvas创建**: 每页一个canvas，具有适当的尺寸
- **图像服务集成**: 链接到IIIF图像服务器

## 中文文本处理

### 特殊处理逻辑
- **数字转换**: 将中文数字（一二三四五）转换为阿拉伯数字
- **朝代提取**: 从描述中识别中文朝代名称
- **作者解析**: 使用"某某撰"、"某某輯"等模式提取作者
- **卷数解析**: 处理复杂的卷数编号系统

## 开发注意事项

### 添加新功能时
1. 遵循现有数据流：HTML → 解析数据 → IIIF → 验证
2. 更改数据结构时更新所有相关接口
3. 生成manifest后使用验证脚本测试
4. 结构变更后更新HTML索引

### 常见任务
- **添加元数据字段**: 更新BookEntry接口和index.ts中的解析逻辑
- **修改IIIF输出**: 编辑generate-iiif-manifests.ts中的generateManifest()
- **更改验证规则**: 更新validate-manifests.ts中的验证方法
- **HTML界面更改**: 修改update-index.ts中的generateHTML()

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
