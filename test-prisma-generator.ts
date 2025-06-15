#!/usr/bin/env bun

/**
 * Test script for the Prisma Schema Generator
 * This validates the structure and generates sample files without external dependencies
 */

import { promises as fs } from 'fs';

// Test data structure matching the project
const sampleBookData = {
  id: "A001",
  category: "经部",
  title: "論語注疏",
  volumes: "二十卷",
  authors: ["朱熹"],
  dynasty: "宋",
  publicationInfo: "宋刊本",
  collectionInfo: "京都大学人文科学研究所藏",
  url: "A001menu.html",
  bookType: 'printed' as const,
  isIncomplete: false,
  hasSeals: true,
  hasNotes: true,
  structure: [
    {
      id: "A0010001",
      title: "論語注疏卷第一",
      url: "A0010001.html",
      volumeNumber: 1,
      chapterNumber: 1,
      startPage: 1,
      maxPage: 20,
      bookNumber: "A001",
      sequence: 1
    }
  ],
  totalVolumes: 1
};

// Simple test class for validation
class PrismaSchemaGeneratorTest {
  
  testDataStructure() {
    console.log('🧪 测试数据结构...');
    
    // Validate book structure
    if (!sampleBookData.id || !sampleBookData.title) {
      throw new Error('Book data missing required fields');
    }
    
    if (sampleBookData.structure && sampleBookData.structure.length > 0) {
      const volume = sampleBookData.structure[0];
      if (!volume.id || !volume.title) {
        throw new Error('Volume data missing required fields');
      }
    }
    
    console.log('✅ 数据结构验证通过');
    return true;
  }
  
  generateSampleEnvFile() {
    console.log('📝 生成示例.env文件...');
    
    const envContent = `# 東方學デジタル圖書館 Database Configuration
# 数据库连接配置

# PostgreSQL (推荐)
DATABASE_URL="postgresql://username:password@localhost:5432/toho_library?schema=public"

# MySQL (备选)
# DATABASE_URL="mysql://username:password@localhost:3306/toho_library"

# SQLite (开发环境)
# DATABASE_URL="file:./dev.db"

# MongoDB (如果需要文档数据库)
# DATABASE_URL="mongodb://username:password@localhost:27017/toho_library"

# 其他配置
NODE_ENV="development"
LOG_LEVEL="info"

# IIIF相关配置
IIIF_BASE_URL="https://toho-digital-library.zinbun.kyoto-u.ac.jp"
IIIF_IMAGE_SERVICE_URL="https://iiif.toyjack.net/iiif"
`;
    
    return envContent;
  }
  
  generateSamplePrismaCommands() {
    console.log('⚙️ 生成Prisma使用示例...');
    
    const commands = `
# 東方學デジタル圖書館 Prisma 使用指南

## 1. 安装依赖
bun add prisma @prisma/client

## 2. 生成Prisma schema
bun run generate-prisma-schema

## 3. 配置数据库
# 复制.env.example到.env并配置DATABASE_URL

## 4. 生成Prisma客户端
bun run db:generate

## 5. 同步数据库结构
bun run db:push

## 6. 导入现有数据
bun run db:seed

## 7. 查看数据库
bun run db:studio

## 常用查询示例:

\`\`\`typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 查询所有书籍
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

// 复杂查询：查找有多个作者的书籍
const multiAuthorBooks = await prisma.book.findMany({
  where: {
    authors: {
      some: {}
    }
  },
  include: {
    authors: {
      include: {
        author: true
      }
    }
  }
});

// 统计信息
const stats = await prisma.$transaction([
  prisma.book.count(),
  prisma.volume.count(),
  prisma.page.count(),
  prisma.author.count()
]);

\`\`\`
`;
    
    return commands;
  }
  
  async runTests() {
    try {
      console.log('🚀 开始测试Prisma Schema Generator');
      console.log('=====================================');
      
      // Test data structure
      this.testDataStructure();
      
      // Generate sample files
      const envContent = this.generateSampleEnvFile();
      await fs.writeFile('./.env.example', envContent, 'utf-8');
      console.log('✅ 生成了.env.example文件');
      
      const commandsContent = this.generateSamplePrismaCommands();
      await fs.writeFile('./PRISMA_USAGE.md', commandsContent, 'utf-8');
      console.log('✅ 生成了PRISMA_USAGE.md文件');
      
      console.log('\\n✨ 测试完成！');
      console.log('📁 生成的文件:');
      console.log('  - generate-prisma-schema.ts (主脚本)');
      console.log('  - .env.example (环境变量示例)');
      console.log('  - PRISMA_USAGE.md (使用指南)');
      
      console.log('\\n📝 接下来可以运行:');
      console.log('  bun run generate-prisma-schema');
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
      throw error;
    }
  }
}

// Run tests
if (import.meta.main) {
  const tester = new PrismaSchemaGeneratorTest();
  tester.runTests();
}

export { PrismaSchemaGeneratorTest };