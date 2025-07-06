import { dirname, resolve } from 'path';

interface BookVolume {
    id: string;
    title: string;
    url: string;
    volumeNumber?: number;
    chapterNumber?: number;
    startPage?: number;      // 新增：volStartPos
    maxPage?: number;        // 新增：volMaxPage  
    bookNumber?: string;     // 新增：bookNum
    sequence?: number;       // 新增：文件序号
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
    structure?: BookVolume[]; // 新增：书籍内部结构
    totalVolumes?: number;    // 新增：实际卷册数量
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

// 读取书籍详细结构
async function parseBookStructure(bookUrl: string): Promise<BookVolume[]> {
    console.log(`正在解析书籍结构: ${bookUrl}`);
    try {
        // 首先检查是否有对应的menu文件
        let menuFilePath = resolve("./html/html/", bookUrl);
        if (!bookUrl.includes('menu.html') && !bookUrl.includes('top.html')) {
            // 如果不是menu或top文件，尝试找到对应的menu文件
            const bookId = bookUrl.match(/([A-Z]\d{3})/)?.[1];
            if (bookId) {
                menuFilePath = `./html/html/${bookId}menu.html`;
            }
        }

        const menuFile = Bun.file(menuFilePath);
        if (!(await menuFile.exists())) {
            console.warn(`菜单文件不存在: ${menuFilePath}`);
            
            // 如果menu文件不存在，尝试直接扫描卷册文件
            return await scanVolumeFiles(bookUrl);
        }

        const menuText = await menuFile.text();
        const volumes: BookVolume[] = [];
        const menuDir = dirname(menuFilePath);

        // 从menu文件中提取链接到具体卷册的文件
        const lines = menuText.split('\n');
        const volumeUrls: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 匹配链接到具体卷册文件的链接
            const linkMatch = trimmedLine.match(/<a\s+href="([^"]+)"\s*>([^<]+)<\/a>/gi);
            if (linkMatch) {
                for (const match of linkMatch) {
                    const urlMatch = match.match(/<a\s+href="([^"]+)"/);
                    if (urlMatch) {
                        const url = urlMatch[1];
                        // 只处理数字编号的文件（如A0450001.html）
                        if (/[A-Z]\d{7}\.html/.test(url)) {
                            volumeUrls.push(resolve(menuDir, url));
                        }
                    }
                }
            }
        }

        // 如果从menu文件中没有找到链接，尝试扫描文件
        if (volumeUrls.length === 0) {
            return await scanVolumeFiles(bookUrl);
        }

        // 读取每个卷册文件的详细信息
        for (const volumePath of volumeUrls) {
            const volumeInfo = await parseVolumeFile(volumePath);
            if (volumeInfo) {
                volumes.push(volumeInfo);
            }
        }

        // 按volNum排序
        volumes.sort((a, b) => {
            const aNum = a.volumeNumber || 0;
            const bNum = b.volumeNumber || 0;
            return aNum - bNum;
        });

        return volumes;

    } catch (error) {
        console.error(`解析书籍结构失败 ${bookUrl}:`, error);
        return [];
    }
}

// 扫描卷册文件（当menu文件不存在时的备用方案）
async function scanVolumeFiles(bookUrl: string): Promise<BookVolume[]> {
    const volumes: BookVolume[] = [];
    const bookId = bookUrl.match(/([A-Z]\d{3})/)?.[1];
    
    if (!bookId) {
        return volumes;
    }

    // 尝试扫描可能的卷册文件
    for (let i = 1; i <= 100; i++) {
        const volumeFileName = `${bookId}${String(i).padStart(4, '0')}.html`;
        const volumeInfo = await parseVolumeFile(volumeFileName);
        if (volumeInfo) {
            volumes.push(volumeInfo);
        } else {
            // 如果连续几个文件不存在，停止扫描
            if (i > 10) break;
        }
    }

    return volumes;
}

// 解析单个卷册文件
async function parseVolumeFile(volumePath: string): Promise<BookVolume | null> {
    try {
        const volumeFile = Bun.file(volumePath);
        
        if (!(await volumeFile.exists())) {
            return null;
        }

        const volumeText = await volumeFile.text();
        const volumeUrl = volumePath.split('/').pop() || '';
        
        // 提取JavaScript变量
        const volNumMatch = volumeText.match(/var\s+volNum\s*=\s*(\d+)/);
        const volNameMatch = volumeText.match(/var\s+volName\s*=\s*["'](.*?)["']/);
        const volStartPosMatch = volumeText.match(/var\s+volStartPos\s*=\s*(\d+)/);
        const volMaxPageMatch = volumeText.match(/var\s+volMaxPage\s*=\s*(\d+)/);
        const bookNumMatch = volumeText.match(/var\s+bookNum\s*=\s*["']([^"']+)["']/);

        if (!volNumMatch || !volNameMatch) {
            return null;
        }

        const volNum = parseInt(volNumMatch[1]);
        const volName = volNameMatch[1];
        const volStartPos = volStartPosMatch ? parseInt(volStartPosMatch[1]) : undefined;
        const volMaxPage = volMaxPageMatch ? parseInt(volMaxPageMatch[1]) : undefined;
        const bookNum = bookNumMatch ? bookNumMatch[1] : '';

        // 提取卷号信息（从volName中）
        let volumeNumber: number | undefined = volNum;
        let chapterNumber: number | undefined;

        // 尝试从volName中提取更精确的卷号信息
        const chineseVolumeMatch = volName.match(/卷第([一二三四五六七八九十百千万\d]+)/);
        if (chineseVolumeMatch) {
            volumeNumber = parseChineseNumber(chineseVolumeMatch[1]);
        }

        const chineseChapterMatch = volName.match(/第([一二三四五六七八九十百千万\d]+)册/);
        if (chineseChapterMatch) {
            chapterNumber = parseChineseNumber(chineseChapterMatch[1]);
        }

        // 从文件名中提取序号作为备用
        const fileNumberMatch = volumeUrl.match(/(\d{4})\.html$/);
        const fileSequence = fileNumberMatch ? parseInt(fileNumberMatch[1]) : volNum;

        return {
            id: volumeUrl.replace('.html', ''),
            title: volName,
            url: volumeUrl,
            volumeNumber: volumeNumber,
            chapterNumber: chapterNumber,
            // 新增字段
            startPage: volStartPos,
            maxPage: volMaxPage,
            bookNumber: bookNum,
            sequence: fileSequence
        };

    } catch (error) {
        console.error(`解析卷册文件失败 ${volumePath}:`, error);
        return null;
    }
}

// 中文数字转阿拉伯数字
function parseChineseNumber(chineseNum: string): number {
    if (/^\d+$/.test(chineseNum)) {
        return parseInt(chineseNum);
    }
    
    const chineseDigits: { [key: string]: number } = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
        '百': 100, '千': 1000, '万': 10000
    };
    
    let result = 0;
    let current = 0;
    let unit = 1;
    
    for (let i = chineseNum.length - 1; i >= 0; i--) {
        const char = chineseNum[i];
        const digit = chineseDigits[char];
        
        if (digit >= 10) {
            if (digit > unit) {
                unit = digit;
                if (current === 0) current = 1;
            } else {
                unit = digit;
            }
        } else {
            current = digit;
        }
        
        if (current > 0 && unit > 0) {
            result += current * unit;
            current = 0;
            if (unit < 10) unit = 1;
        }
    }
    
    return result || 1;
}

// 解析书籍信息的辅助函数
function parseBookInfo(title: string, description: string): Partial<BookEntry> {
    const result: Partial<BookEntry> = {
        authors: [],
        publicationInfo: description,
        collectionInfo: '',
        bookType: 'unknown',
        isIncomplete: false,
        hasSeals: false,
        hasNotes: false
    };

    // 提取卷数信息
    const volumeMatch = title.match(/([一二三四五六七八九十百千万不分]+卷)/);
    if (volumeMatch) {
        result.volumes = volumeMatch[1];
    }

    // 判断是否为残本
    result.isIncomplete = title.includes('殘') || title.includes('零片') || description.includes('残') || description.includes('存卷');

    // 判断版本类型
    if (description.includes('鈔本') || description.includes('手稿') || description.includes('手簡')) {
        result.bookType = 'manuscript';
    } else if (description.includes('刊本') || description.includes('活字印本') || description.includes('石印本')) {
        result.bookType = 'printed';
    } else if (description.includes('拓本')) {
        result.bookType = 'rubbing';
    }

    // 检查是否有藏书印记
    result.hasSeals = description.includes('圖記') || description.includes('印記');

    // 检查是否有题跋识语
    result.hasNotes = description.includes('識語') || description.includes('题跋') || description.includes('校語');

    // 提取朝代信息
    const dynastyMatch = description.match(/(漢|魏|晉|南北朝|隋|唐|五代|宋|遼|金|元|明|淸|清|民國)/);
    if (dynastyMatch) {
        result.dynasty = dynastyMatch[1];
    }

    // 提取作者信息
    const authorPatterns = [
        /([^　\s]+)撰/g,
        /([^　\s]+)輯/g,
        /([^　\s]+)注/g,
        /([^　\s]+)疏/g,
        /([^　\s]+)集/g
    ];

    authorPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(description)) !== null) {
            const author = match[1].trim();
            if (author && !result.authors!.includes(author)) {
                result.authors!.push(author);
            }
        }
    });

    return result;
}

// 生成书籍ID
function generateBookId(url: string, index: number): string {
    const match = url.match(/([A-Z]\d{3})/);
    if (match) {
        return match[1];
    }
    
    // 对于特殊路径，生成自定义ID
    if (url.includes('ShiSanJingZhuShu')) {
        return `SJ${String(index).padStart(3, '0')}`;
    }
    if (url.includes('BaoJuanWuShiZhong')) {
        return `BJ${String(index).padStart(3, '0')}`;
    }
    
    return `UNKNOWN${String(index).padStart(3, '0')}`;
}

const books: BookEntry[] = [];
let bookIndex = 0;

async function processTopFile(filePath: string, currentCategory = "") {
    console.log(`正在解析目录文件: ${filePath}`);
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
        console.error(`目录文件不存在: ${filePath}`);
        return;
    }
    const text = await file.text();
    const lines = text.split('\n');
    let category = currentCategory;

    for (const line of lines) {
        const trimmedLine = line.trim();

        const h2Match = trimmedLine.match(/<h2[^>]*>([^<]+)<\/h2>/);
        if (h2Match) {
            category = h2Match[1];
            console.log(`处理分类: ${category}`);
            continue;
        }

        const linkMatch = trimmedLine.match(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>(?:\s*　([^<]*?))?(?:<br\s*\/?>|$)/);
        if (linkMatch && category) {
            const url = linkMatch[1];
            const title = linkMatch[2].trim();
            const description = linkMatch[3] ? linkMatch[3].trim() : "";

            if (url.endsWith('top.html')) {
                const newPath = resolve(dirname(filePath), url);
                await processTopFile(newPath, category);
            } else {
                console.log(`处理书籍: ${title}`);
                const bookInfo = parseBookInfo(title, description);
                const structure = await parseBookStructure(url);
                
                const book: BookEntry = {
                    id: generateBookId(url, bookIndex++),
                    category: category,
                    title: title,
                    url: url,
                    volumes: bookInfo.volumes,
                    authors: bookInfo.authors || [],
                    dynasty: bookInfo.dynasty,
                    publicationInfo: description,
                    collectionInfo: bookInfo.collectionInfo || '',
                    bookType: bookInfo.bookType || 'unknown',
                    isIncomplete: bookInfo.isIncomplete || false,
                    hasSeals: bookInfo.hasSeals || false,
                    hasNotes: bookInfo.hasNotes || false,
                    structure: structure,
                    totalVolumes: structure.length
                };
                
                books.push(book);
            }
        }
    }
}

await processTopFile("./html/html/top.html");

// 统计信息生成
const categories = [...new Set(books.map(book => book.category))];
const totalVolumes = books.reduce((sum, book) => sum + (book.totalVolumes || 0), 0);

const statistics = {
    byCategory: {} as Record<string, number>,
    byBookType: {} as Record<string, number>,
    byDynasty: {} as Record<string, number>,
    byVolumeCount: {} as Record<string, number>
};

// 按分类统计
categories.forEach(category => {
    statistics.byCategory[category] = books.filter(book => book.category === category).length;
});

// 按版本类型统计
['manuscript', 'printed', 'rubbing', 'unknown'].forEach(type => {
    statistics.byBookType[type] = books.filter(book => book.bookType === type).length;
});

// 按朝代统计
books.forEach(book => {
    if (book.dynasty) {
        statistics.byDynasty[book.dynasty] = (statistics.byDynasty[book.dynasty] || 0) + 1;
    }
});

// 按卷册数量统计
books.forEach(book => {
    const volumeCount = book.totalVolumes || 0;
    const range = volumeCount === 0 ? '0' : 
                  volumeCount <= 5 ? '1-5' :
                  volumeCount <= 10 ? '6-10' :
                  volumeCount <= 20 ? '11-20' :
                  volumeCount <= 50 ? '21-50' : '50+';
    statistics.byVolumeCount[range] = (statistics.byVolumeCount[range] || 0) + 1;
});

// 构建最终数据结构
const libraryData: LibraryData = {
    metadata: {
        title: "東方學デジタル圖書館",
        totalBooks: books.length,
        categories: categories,
        extractedAt: new Date().toISOString(),
        totalVolumes: totalVolumes
    },
    books: books,
    statistics: statistics
};

// JSON データを出力
const jsonContent = JSON.stringify(libraryData, null, 2);
console.log(`\n提取完成！共处理 ${books.length} 本书籍，${totalVolumes} 个卷册`);
console.log(`分类统计:`, statistics.byCategory);
console.log(`卷册数量分布:`, statistics.byVolumeCount);

// ファイルに保存
await Bun.write("toho-data.json", jsonContent);
console.log("JSONファイルが生成されました: toho-data.json");

// 生成详细报告
const detailedReport = {
    总计书籍: books.length,
    总计卷册: totalVolumes,
    分类数量: categories.length,
    完整书籍: books.filter(b => !b.isIncomplete).length,
    残缺书籍: books.filter(b => b.isIncomplete).length,
    有藏书印记: books.filter(b => b.hasSeals).length,
    有题跋识语: books.filter(b => b.hasNotes).length,
    刊本数量: books.filter(b => b.bookType === 'printed').length,
    抄本数量: books.filter(b => b.bookType === 'manuscript').length,
    拓本数量: books.filter(b => b.bookType === 'rubbing').length,
    有详细结构: books.filter(b => b.structure && b.structure.length > 0).length,
    最大卷册数: Math.max(...books.map(b => b.totalVolumes || 0)),
    平均卷册数: (totalVolumes / books.length).toFixed(2)
};

console.log('\n=== 详细数据报告 ===');
console.log(detailedReport);

// 输出一些示例结构
console.log('\n=== 书籍结构示例 ===');
const booksWithStructure = books.filter(b => b.structure && b.structure.length > 0).slice(0, 3);
booksWithStructure.forEach(book => {
    console.log(`\n${book.title} (${book.totalVolumes}卷册):`);
    book.structure?.slice(0, 5).forEach(vol => {
        console.log(`  - ${vol.title} (${vol.url})`);
    });
    if (book.structure && book.structure.length > 5) {
        console.log(`  ... 还有 ${book.structure.length - 5} 个卷册`);
    }
});
