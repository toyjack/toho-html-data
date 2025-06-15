# 東方學デジタル圖書館 Prisma Schema 生成器

这个项目为東方學デジタル圖書館（Oriental Studies Digital Library）提供了一个完整的Prisma数据库schema生成和数据迁移解决方案。

## 📋 功能特性

- **完整的数据模型**: 基于现有IIIF清单系统的数据结构设计
- **多语言支持**: 支持中文、日文、英文的元数据存储
- **灵活的数据库支持**: 支持PostgreSQL、MySQL、SQLite、MongoDB
- **自动数据迁移**: 从现有toho-data.json自动导入数据
- **类型安全**: 完全类型化的Prisma客户端
- **优化索引**: 为查询性能优化的数据库索引

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装Prisma
bun add prisma @prisma/client

# 或使用npm
npm install prisma @prisma/client
```

### 2. 生成Prisma Schema

```bash
# 运行生成脚本
bun run generate-prisma-schema

# 这将创建:
# - prisma/schema.prisma (数据库模式)
# - prisma/migration.sql (SQL迁移脚本)  
# - import-data-to-prisma.ts (数据导入脚本)
```

### 3. 配置数据库

```bash
# 复制环境变量示例
cp .env.example .env

# 编辑.env文件，配置数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/toho_library?schema=public"
```

### 4. 初始化数据库

```bash
# 生成Prisma客户端
bun run db:generate

# 推送schema到数据库
bun run db:push

# 导入现有数据
bun run db:seed
```

### 5. 管理数据库

```bash
# 打开Prisma Studio (数据库GUI)
bun run db:studio

# 重置数据库并重新导入
bun run db:reset
```

## 📊 数据模型概览

### 核心实体

1. **Book (书籍)** - 主要书籍信息
2. **Author (作者)** - 作者信息
3. **Volume (卷册)** - 书籍的卷册结构
4. **Page (页面)** - 页面信息（用于IIIF）
5. **Category (分类)** - 书籍分类
6. **Dynasty (朝代)** - 朝代信息
7. **IIIFManifest (IIIF清单)** - IIIF元数据

### 关系结构

```
Book (书籍)
├── BookAuthor (多对多) → Author (作者)
├── Volume (一对多) → Page (一对多)
└── IIIFManifest (一对一)

Category (分类) ← Book (分类)
Dynasty (朝代) ← Book (朝代引用)
```

## 🔍 查询示例

### 基本查询

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 查询所有书籍（包含作者和卷册）
const books = await prisma.book.findMany({
  include: {
    authors: {
      include: {
        author: true
      }
    },
    volumes: true
  }
});

// 按朝代查询
const songBooks = await prisma.book.findMany({
  where: {
    dynasty: '宋'
  }
});

// 按分类查询
const jingbu = await prisma.book.findMany({
  where: {
    category: '经部'
  }
});
```

### 复杂查询

```typescript
// 查找有完整结构的书籍
const completeBooks = await prisma.book.findMany({
  where: {
    isIncomplete: false,
    volumes: {
      some: {}
    }
  },
  include: {
    volumes: {
      include: {
        pages: true
      }
    }
  }
});

// 统计信息
const stats = await prisma.libraryStatistics.findUnique({
  where: { id: 'singleton' }
});

// 全文搜索（如果数据库支持）
const searchResults = await prisma.book.findMany({
  where: {
    OR: [
      { title: { contains: '論語' } },
      { publicationInfo: { contains: '論語' } }
    ]
  }
});
```

## 🗂️ 文件结构

```
├── generate-prisma-schema.ts    # 主生成脚本
├── test-prisma-generator.ts     # 测试脚本
├── import-data-to-prisma.ts     # 数据导入脚本 (生成)
├── prisma/
│   ├── schema.prisma            # Prisma模式文件 (生成)
│   └── migration.sql            # SQL迁移脚本 (生成)
├── .env.example                 # 环境变量示例
└── PRISMA_README.md            # 本文档
```

## 📈 性能优化

### 索引策略

生成的schema包含以下索引优化：

```sql
-- 书籍表索引
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_dynasty ON books(dynasty);
CREATE INDEX idx_books_book_type ON books(book_type);
CREATE INDEX idx_books_title ON books(title);

-- 卷册表索引
CREATE INDEX idx_volumes_book_id ON volumes(book_id);
CREATE INDEX idx_volumes_sequence ON volumes(sequence);

-- 页面表索引
CREATE INDEX idx_pages_volume_id ON pages(volume_id);
CREATE INDEX idx_pages_page_number ON pages(page_number);
```

### 查询优化建议

1. **使用include谨慎**: 只包含需要的关联数据
2. **分页查询**: 对大量数据使用skip和take
3. **选择字段**: 使用select只获取需要的字段
4. **批量操作**: 使用事务进行批量插入/更新

## 🔧 自定义配置

### 数据库提供者

在`prisma/schema.prisma`中修改数据库提供者：

```prisma
datasource db {
  provider = "postgresql" // 或 "mysql", "sqlite", "sqlserver", "mongodb"
  url      = env("DATABASE_URL")
}
```

### 添加自定义字段

1. 修改`generate-prisma-schema.ts`中的模型定义
2. 重新运行生成脚本
3. 使用`prisma db push`更新数据库

## 🛠️ 故障排除

### 常见问题

1. **连接失败**: 检查DATABASE_URL配置
2. **权限错误**: 确保数据库用户有CREATE权限
3. **数据类型错误**: 检查现有数据的格式
4. **内存不足**: 大量数据导入时可能需要分批处理

### 日志调试

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## 📚 相关资源

- [Prisma官方文档](https://www.prisma.io/docs/)
- [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/)
- [東方學デジタル圖書館](https://toho-digital-library.zinbun.kyoto-u.ac.jp/)

## 🤝 贡献

欢迎提交Issues和Pull Requests来改进这个工具。

## 📄 许可证

本项目遵循项目原有的许可证。