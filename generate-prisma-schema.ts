#!/usr/bin/env bun

/**
 * Prisma Schema Generator for 東方學デジタル圖書館
 * 
 * This script generates a Prisma schema based on the existing data structures
 * used in the IIIF manifest generation system for the Oriental Studies Digital Library.
 */

import { promises as fs } from 'fs';
import path from 'path';

// Import existing interfaces from the project
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
  statistics: {
    byCategory: Record<string, number>;
    byBookType: Record<string, number>;
    byDynasty: Record<string, number>;
    byVolumeCount: Record<string, number>;
  };
}

class PrismaSchemaGenerator {
  
  /**
   * Generate complete Prisma schema based on the Oriental Studies Digital Library data model
   */
  generateSchema(): string {
    const schema = `// 東方學デジタル圖書館 Prisma Schema
// Generated on ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // 可根据需要改为 "mysql", "sqlite", "sqlserver", "mongodb"
  url      = env("DATABASE_URL")
}

// 主要书籍表
model Book {
  id               String        @id // 书籍ID，如 A001, B002
  title            String        // 书名
  category         String        // 分类
  volumes          String?       // 卷数信息（如"十卷"）
  dynasty          String?       // 朝代
  publicationInfo  String        // 版本信息
  collectionInfo   String        // 收藏信息
  url              String        // 原始HTML URL
  bookType         BookType      @default(UNKNOWN) // 版本类型
  isIncomplete     Boolean       @default(false) // 是否残缺
  hasSeals         Boolean       @default(false) // 是否有藏书印记
  hasNotes         Boolean       @default(false) // 是否有题跋识语
  totalVolumes     Int?          // 实际卷册数量
  
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  // 关系
  authors          BookAuthor[]  // 多对多：书籍-作者
  volumes          Volume[]      // 一对多：书籍-卷册
  manifests        IIIFManifest[] // 一对多：书籍-IIIF清单
  
  @@map("books")
}

// 作者表
model Author {
  id        Int          @id @default(autoincrement())
  name      String       @unique // 作者姓名
  dynasty   String?      // 朝代
  biography String?      // 生平简介
  
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  
  // 关系
  books     BookAuthor[] // 多对多：作者-书籍
  
  @@map("authors")
}

// 书籍-作者关联表（多对多）
model BookAuthor {
  bookId   String
  authorId Int
  role     String? // 作者角色：撰、輯、注、疏、集等
  
  book     Book   @relation(fields: [bookId], references: [id], onDelete: Cascade)
  author   Author @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  @@id([bookId, authorId])
  @@map("book_authors")
}

// 卷册表
model Volume {
  id            String   @id // 卷册ID，如 A0010001
  title         String   // 卷册标题
  url           String   // HTML文件路径
  volumeNumber  Int?     // 卷号
  chapterNumber Int?     // 册号
  startPage     Int?     // 起始页码
  maxPage       Int?     // 最大页数
  bookNumber    String?  // 书号
  sequence      Int?     // 文件序号
  
  bookId        String   // 外键：所属书籍
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // 关系
  book          Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  pages         Page[]   // 一对多：卷册-页面
  
  @@map("volumes")
}

// 页面表（用于IIIF）
model Page {
  id          String   @id @default(cuid())
  pageNumber  Int      // 页码
  globalPage  Int?     // 全书页码
  imageUrl    String?  // 图像URL
  width       Int      @default(1000) // 页面宽度
  height      Int      @default(1400) // 页面高度
  
  volumeId    String   // 外键：所属卷册
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关系
  volume      Volume   @relation(fields: [volumeId], references: [id], onDelete: Cascade)
  
  @@unique([volumeId, pageNumber])
  @@map("pages")
}

// 分类表
model Category {
  id          Int      @id @default(autoincrement())
  name        String   @unique // 分类名称
  description String?  // 分类描述
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("categories")
}

// IIIF清单表
model IIIFManifest {
  id            String   @id // 清单ID，通常与书籍ID相同
  label         Json     // 多语言标签 {"zh": [...], "en": [...]}
  summary       Json?    // 多语言摘要
  metadata      Json?    // 元数据数组
  canvasCount   Int      @default(0) // Canvas数量
  manifestUrl   String   // 清单文件URL
  generatedAt   DateTime @default(now())
  
  bookId        String   @unique // 外键：关联的书籍
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // 关系
  book          Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  
  @@map("iiif_manifests")
}

// 朝代表
model Dynasty {
  id        Int      @id @default(autoincrement())
  name      String   @unique // 朝代名称：漢、魏、晉、唐、宋、元、明、清等
  startYear Int?     // 起始年份
  endYear   Int?     // 结束年份
  period    String?  // 时期描述
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("dynasties")
}

// 统计表（用于缓存统计数据）
model LibraryStatistics {
  id                String   @id @default("singleton") // 单例模式
  totalBooks        Int      @default(0)
  totalVolumes      Int      @default(0)
  totalPages        Int      @default(0)
  totalAuthors      Int      @default(0)
  totalManifests    Int      @default(0)
  
  // JSON字段存储复杂统计
  categoryStats     Json?    // 按分类统计
  dynastyStats      Json?    // 按朝代统计
  bookTypeStats     Json?    // 按版本类型统计
  volumeCountStats  Json?    // 按卷册数量统计
  
  lastUpdated       DateTime @default(now())
  
  @@map("library_statistics")
}

// 用户表（如果需要用户管理）
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(READER)
  isActive  Boolean  @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关系
  sessions  Session[]
  
  @@map("users")
}

// 会话表（用户登录管理）
model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  
  createdAt DateTime @default(now())
  
  // 关系
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

// 搜索历史表
model SearchHistory {
  id        Int      @id @default(autoincrement())
  query     String   // 搜索查询
  results   Int      @default(0) // 结果数量
  userId    String?  // 用户ID（可选）
  ipAddress String?  // IP地址
  
  createdAt DateTime @default(now())
  
  @@map("search_history")
}

// 枚举类型
enum BookType {
  MANUSCRIPT  // 手鈔本
  PRINTED     // 刊本
  RUBBING     // 拓本
  UNKNOWN     // 未知
  
  @@map("book_type")
}

enum UserRole {
  ADMIN       // 管理员
  EDITOR      // 编辑者
  READER      // 读者
  
  @@map("user_role")
}

// 索引优化
// 书籍表索引
model BookIndex {
  @@index([category])
  @@index([dynasty])
  @@index([bookType])
  @@index([isIncomplete])
  @@index([title])
  @@fulltext([title, publicationInfo]) // 全文搜索索引（如果数据库支持）
}

// 卷册表索引
model VolumeIndex {
  @@index([bookId])
  @@index([volumeNumber])
  @@index([sequence])
}

// 页面表索引
model PageIndex {
  @@index([volumeId])
  @@index([pageNumber])
  @@index([globalPage])
}

// 视图（如果需要复杂查询优化）
// 注意：Prisma目前对视图的支持有限，可能需要原生SQL
`;

    return schema;
  }

  /**
   * Generate migration script for existing data
   */
  generateMigrationScript(): string {
    return `-- 数据迁移脚本
-- 从现有的 toho-data.json 数据迁移到 Prisma 数据库

-- 1. 首先创建基础分类数据
INSERT INTO categories (name, description) VALUES 
  ('経部', '儒家経典類'),
  ('史部', '史書類'),
  ('子部', '諸子百家類'),
  ('集部', '文学作品類'),
  ('叢書', '叢書類');

-- 2. 创建朝代数据
INSERT INTO dynasties (name, start_year, end_year, period) VALUES 
  ('漢', -206, 220, '漢朝'),
  ('魏', 220, 266, '魏晋南北朝'),
  ('晉', 266, 420, '魏晋南北朝'),
  ('唐', 618, 907, '唐朝'),
  ('宋', 960, 1279, '宋朝'),
  ('元', 1271, 1368, '元朝'),
  ('明', 1368, 1644, '明朝'),
  ('清', 1644, 1912, '清朝');

-- 3. 创建默认统计记录
INSERT INTO library_statistics (id, total_books, total_volumes, last_updated) 
VALUES ('singleton', 0, 0, NOW());

-- 注意：实际的书籍、作者、卷册数据需要通过 TypeScript 脚本
-- 从 toho-data.json 文件中读取并插入
`;
  }

  /**
   * Generate data import script from existing JSON data
   */
  generateDataImportScript(): string {
    return `#!/usr/bin/env bun

/**
 * Data Import Script for Prisma Database
 * 
 * This script imports data from toho-data.json into the Prisma database
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';

const prisma = new PrismaClient();

interface TohoData {
  metadata: {
    title: string;
    totalBooks: number;
    categories: string[];
    extractedAt: string;
    totalVolumes: number;
  };
  books: Array<{
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
    structure?: Array<{
      id: string;
      title: string;
      url: string;
      volumeNumber?: number;
      chapterNumber?: number;
      startPage?: number;
      maxPage?: number;
      bookNumber?: string;
      sequence?: number;
    }>;
    totalVolumes?: number;
  }>;
}

async function importData() {
  try {
    console.log('📚 开始导入東方學デジタル圖書館数据...');
    
    // 读取现有数据
    const dataFile = await fs.readFile('./toho-data.json', 'utf-8');
    const data: TohoData = JSON.parse(dataFile);
    
    console.log(\`📖 发现 \${data.books.length} 本书籍\`);
    
    // 导入分类
    console.log('📁 导入分类数据...');
    for (const categoryName of data.metadata.categories) {
      await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
    }
    
    // 导入作者
    console.log('👤 导入作者数据...');
    const allAuthors = new Set<string>();
    data.books.forEach(book => {
      book.authors.forEach(author => allAuthors.add(author));
    });
    
    for (const authorName of allAuthors) {
      if (authorName.trim()) {
        await prisma.author.upsert({
          where: { name: authorName },
          update: {},
          create: { name: authorName }
        });
      }
    }
    
    // 导入朝代
    console.log('🏛️ 导入朝代数据...');
    const allDynasties = new Set<string>();
    data.books.forEach(book => {
      if (book.dynasty) allDynasties.add(book.dynasty);
    });
    
    for (const dynastyName of allDynasties) {
      await prisma.dynasty.upsert({
        where: { name: dynastyName },
        update: {},
        create: { name: dynastyName }
      });
    }
    
    // 导入书籍数据
    console.log('📚 导入书籍数据...');
    let importedCount = 0;
    
    for (const book of data.books) {
      // 创建书籍记录
      const createdBook = await prisma.book.upsert({
        where: { id: book.id },
        update: {
          title: book.title,
          category: book.category,
          volumes: book.volumes,
          dynasty: book.dynasty,
          publicationInfo: book.publicationInfo,
          collectionInfo: book.collectionInfo,
          url: book.url,
          bookType: book.bookType.toUpperCase() as any,
          isIncomplete: book.isIncomplete,
          hasSeals: book.hasSeals,
          hasNotes: book.hasNotes,
          totalVolumes: book.totalVolumes
        },
        create: {
          id: book.id,
          title: book.title,
          category: book.category,
          volumes: book.volumes,
          dynasty: book.dynasty,
          publicationInfo: book.publicationInfo,
          collectionInfo: book.collectionInfo,
          url: book.url,
          bookType: book.bookType.toUpperCase() as any,
          isIncomplete: book.isIncomplete,
          hasSeals: book.hasSeals,
          hasNotes: book.hasNotes,
          totalVolumes: book.totalVolumes
        }
      });
      
      // 创建作者关联
      for (const authorName of book.authors) {
        if (authorName.trim()) {
          const author = await prisma.author.findUnique({
            where: { name: authorName }
          });
          
          if (author) {
            await prisma.bookAuthor.upsert({
              where: {
                bookId_authorId: {
                  bookId: book.id,
                  authorId: author.id
                }
              },
              update: {},
              create: {
                bookId: book.id,
                authorId: author.id,
                role: '撰' // 默认角色
              }
            });
          }
        }
      }
      
      // 导入卷册数据
      if (book.structure && book.structure.length > 0) {
        for (const volume of book.structure) {
          await prisma.volume.upsert({
            where: { id: volume.id },
            update: {
              title: volume.title,
              url: volume.url,
              volumeNumber: volume.volumeNumber,
              chapterNumber: volume.chapterNumber,
              startPage: volume.startPage,
              maxPage: volume.maxPage,
              bookNumber: volume.bookNumber,
              sequence: volume.sequence
            },
            create: {
              id: volume.id,
              title: volume.title,
              url: volume.url,
              volumeNumber: volume.volumeNumber,
              chapterNumber: volume.chapterNumber,
              startPage: volume.startPage,
              maxPage: volume.maxPage,
              bookNumber: volume.bookNumber,
              sequence: volume.sequence,
              bookId: book.id
            }
          });
          
          // 创建页面数据（如果有最大页数信息）
          if (volume.maxPage && volume.maxPage > 0) {
            for (let pageNum = 1; pageNum <= volume.maxPage; pageNum++) {
              const globalPage = (volume.startPage || 1) + pageNum - 1;
              const pageId = \`\${volume.id}_page_\${pageNum}\`;
              
              await prisma.page.upsert({
                where: { id: pageId },
                update: {
                  pageNumber: pageNum,
                  globalPage: globalPage
                },
                create: {
                  id: pageId,
                  pageNumber: pageNum,
                  globalPage: globalPage,
                  volumeId: volume.id
                }
              });
            }
          }
        }
      }
      
      importedCount++;
      if (importedCount % 10 === 0) {
        console.log(\`✅ 已导入 \${importedCount}/\${data.books.length} 本书籍\`);
      }
    }
    
    // 更新统计数据
    console.log('📊 更新统计数据...');
    const stats = await prisma.$transaction(async (tx) => {
      const bookCount = await tx.book.count();
      const volumeCount = await tx.volume.count();
      const pageCount = await tx.page.count();
      const authorCount = await tx.author.count();
      
      return { bookCount, volumeCount, pageCount, authorCount };
    });
    
    await prisma.libraryStatistics.upsert({
      where: { id: 'singleton' },
      update: {
        totalBooks: stats.bookCount,
        totalVolumes: stats.volumeCount,
        totalPages: stats.pageCount,
        totalAuthors: stats.authorCount,
        lastUpdated: new Date()
      },
      create: {
        id: 'singleton',
        totalBooks: stats.bookCount,
        totalVolumes: stats.volumeCount,
        totalPages: stats.pageCount,
        totalAuthors: stats.authorCount
      }
    });
    
    console.log('\\n🎉 数据导入完成！');
    console.log(\`📚 书籍：\${stats.bookCount}\`);
    console.log(\`📄 卷册：\${stats.volumeCount}\`);
    console.log(\`📃 页面：\${stats.pageCount}\`);
    console.log(\`👤 作者：\${stats.authorCount}\`);
    
  } catch (error) {
    console.error('❌ 数据导入失败：', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行导入
if (import.meta.main) {
  importData();
}
`;
  }

  /**
   * Save all generated files
   */
  async saveFiles(): Promise<void> {
    const prismaDir = './prisma';
    await fs.mkdir(prismaDir, { recursive: true });

    // Save schema.prisma
    const schemaPath = path.join(prismaDir, 'schema.prisma');
    await fs.writeFile(schemaPath, this.generateSchema(), 'utf-8');
    console.log('✅ Generated prisma/schema.prisma');

    // Save migration script
    const migrationPath = path.join(prismaDir, 'migration.sql');
    await fs.writeFile(migrationPath, this.generateMigrationScript(), 'utf-8');
    console.log('✅ Generated prisma/migration.sql');

    // Save import script
    const importPath = './import-data-to-prisma.ts';
    await fs.writeFile(importPath, this.generateDataImportScript(), 'utf-8');
    console.log('✅ Generated import-data-to-prisma.ts');
  }

  /**
   * Generate package.json additions for Prisma
   */
  generatePackageAdditions(): string {
    return `
// 添加到 package.json 的 scripts 部分:
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push", 
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "bun run import-data-to-prisma.ts",
    "db:reset": "prisma migrate reset && bun run db:seed"
  },
  "devDependencies": {
    "prisma": "^5.7.0"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0"
  }
}

// .env 文件示例:
DATABASE_URL="postgresql://username:password@localhost:5432/toho_library?schema=public"
# 或 MySQL:
# DATABASE_URL="mysql://username:password@localhost:3306/toho_library"
# 或 SQLite:
# DATABASE_URL="file:./dev.db"
`;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 生成東方學デジタル圖書館 Prisma Schema');
    console.log('============================================');

    const generator = new PrismaSchemaGenerator();
    
    // Generate and save all files
    await generator.saveFiles();
    
    // Show package.json additions
    console.log('\\n📦 Package.json 配置建议:');
    console.log(generator.generatePackageAdditions());
    
    console.log('\\n✨ Prisma schema 生成完成！');
    console.log('\\n📝 接下来的步骤:');
    console.log('1. 安装 Prisma: bun add prisma @prisma/client');
    console.log('2. 配置 .env 文件中的 DATABASE_URL');
    console.log('3. 生成客户端: bun run db:generate');
    console.log('4. 推送 schema: bun run db:push');
    console.log('5. 导入数据: bun run db:seed');
    console.log('6. 打开管理界面: bun run db:studio');
    
  } catch (error) {
    console.error('❌ Schema 生成失败:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  main();
}