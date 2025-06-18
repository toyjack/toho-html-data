-- 数据迁移脚本
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
