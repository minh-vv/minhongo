import * as fs from 'fs';
import * as path from 'path';

interface GrammarCard {
  front: string;
  back: string;
  romaji: string;
  example: string;
  jlptLevel: number;
}

// Decryption algorithm extracted from vnjpclub.com
function dec_it(data: string): string {
  if (!data) return data;
  data = data.split('@').join('CAg');
  data = data.split('!').join('W5');
  data = data.split('*').join('CAgI');
  data = data.split('$').join('dGhl');
  data = data.split('%').join('YXN');
  data = data.split('&').join('YW');
  
  try {
    const clean = data.replace(/[^A-Za-z0-9+/=]/g, '');
    return Buffer.from(clean, 'base64').toString('utf-8');
  } catch (e) {
    return data;
  }
}

// Clean HTML tags and formatting
function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<rt>([\s\S]*?)<\/rt>/gi, '') // Remove ruby pronunciation rt elements
    .replace(/<[^>]*>/g, '')              // Strip all other tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to sleep for a random time (to prevent blocking)
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': randomUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi,en-US;q=0.7,en;q=0.3',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      return await res.text();
    } catch (err: any) {
      console.warn(`⚠️ [Attempt ${attempt}/${retries}] Error fetching ${url}: ${err.message}`);
      if (attempt === retries) throw err;
      await sleep(2000 * attempt); // exponential backoff
    }
  }
  throw new Error('Fetch failed');
}

async function main() {
  const levelArg = process.argv[2];
  if (!levelArg || !['5', '4', '3', '2', '1'].includes(levelArg)) {
    console.error('❌ Vui lòng truyền tham số cấp độ jlpt (5, 4, 3, 2, 1). Ví dụ: npx ts-node prisma/scripts/crawl-vnjp-grammar.ts 3');
    process.exit(1);
  }
  const targetLevel = parseInt(levelArg, 10);
  console.log(`🤖 VNJPCLUB CRAWLER: Khởi động cào dữ liệu ngữ pháp N${targetLevel}...`);

  try {
    const urls: { url: string; level: number }[] = [];
    const uniqueUrls = new Set<string>();

    // 1. Fetch sitemaps dynamically to find target level URLs
    const sitemapIndexUrl = 'https://www.vnjpclub.com/sitemap_index.xml';
    console.log(`🌐 Đang quét sitemap index từ: ${sitemapIndexUrl}`);
    try {
      const indexXml = await fetchWithRetry(sitemapIndexUrl);
      const locRegex = /<loc>([\s\S]*?)<\/loc>/g;
      const sitemaps: string[] = [];
      let smMatch;
      while ((smMatch = locRegex.exec(indexXml)) !== null) {
        sitemaps.push(smMatch[1]);
      }

      const pattern = new RegExp(`https://www\\.vnjpclub\\.com/ngu-phap-n${targetLevel}/[^<]+\\.html`, 'i');
      for (const sm of sitemaps) {
        console.log(`   Scanning child sitemap: ${sm}`);
        try {
          const smXml = await fetchWithRetry(sm);
          const locRegex2 = /<loc>([\s\S]*?)<\/loc>/g;
          let urlMatch;
          while ((urlMatch = locRegex2.exec(smXml)) !== null) {
            const url = urlMatch[1].trim();
            if (pattern.test(url) && !uniqueUrls.has(url)) {
              uniqueUrls.add(url);
              urls.push({ url, level: targetLevel });
            }
          }
        } catch (e: any) {
          console.warn(`   ⚠️ Lỗi khi tải sitemap con ${sm}: ${e.message}`);
        }
      }
    } catch (e: any) {
      console.error(`⚠️ Lỗi khi quét sitemap index: ${e.message}`);
    }

    // 2. Đặc biệt cho N5: Cào thêm trang danh mục N5 đề phòng sitemap thiếu
    if (targetLevel === 5) {
      const n5CategoryUrl = 'https://www.vnjpclub.com/ngu-phap-n5/';
      console.log(`🌐 Đang cào thêm danh mục N5 từ: ${n5CategoryUrl}`);
      try {
        const n5IndexHtml = await fetchWithRetry(n5CategoryUrl);
        const n5UrlRegex = /href="(https:\/\/www\.vnjpclub\.com\/ngu-phap-n5\/[^"]+\.html)"/g;
        let n5Match;
        while ((n5Match = n5UrlRegex.exec(n5IndexHtml)) !== null) {
          const url = n5Match[1];
          if (!uniqueUrls.has(url)) {
            uniqueUrls.add(url);
            urls.push({ url, level: 5 });
          }
        }
      } catch (e: any) {
        console.error(`⚠️ Lỗi khi tải danh mục N5: ${e.message}`);
      }
    }

    console.log(`📊 Tìm thấy: ${urls.length} bài viết ngữ pháp N${targetLevel}.`);
    const results: GrammarCard[] = [];
    const maxToCrawl = urls.length;

    console.log(`\n🚀 Bắt đầu cào ${maxToCrawl} bài viết với cơ chế giãn cách ngẫu nhiên (tránh bị chặn)...`);

    for (let i = 0; i < Math.min(urls.length, maxToCrawl); i++) {
      const item = urls[i];
      console.log(`\n[${i + 1}/${maxToCrawl}] Đang xử lý bài: ${item.url}`);

      try {
        const html = await fetchWithRetry(item.url);
        
        // Extract title
        let title = '';
        const titleMatch = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                           html.match(/<title>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          title = cleanHtml(titleMatch[1]).split('-')[0].trim();
        }

        // Extract obfuscated protected content
        const protectedMatch = html.match(/class="ykhp-protected-content"[^>]*?data-ykhp="([\s\S]*?)"/i);
        if (!protectedMatch) {
          console.warn(`  ⚠️ Không tìm thấy nội dung bảo vệ trên trang này (có thể là bài viết trống hoặc yêu cầu VIP). Bỏ qua.`);
          continue;
        }

        // Decode HTML entities (especially &amp; -> &) in the raw attribute value
        const rawProtected = protectedMatch[1].replace(/&amp;/g, '&');

        // Decrypt content
        const decryptedHtml = dec_it(rawProtected);
        
        // Parse grammar structure and meaning from decrypted HTML table
        let meaning = '';
        let structure = '';
        const tableRows = decryptedHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
        if (tableRows && tableRows.length > 1) {
          // Parse the header columns to locate "Cấu trúc" and "Ý nghĩa" indices
          const headerCols = tableRows[0].match(/<th[^>]*>([\s\S]*?)<\/th>|<td[^>]*>([\s\S]*?)<\/td>/gi);
          let structureIdx = 1;
          let meaningIdx = 2;
          
          if (headerCols) {
            for (let c = 0; c < headerCols.length; c++) {
              const text = cleanHtml(headerCols[c]).toLowerCase();
              if (text.includes('cấu trúc')) {
                structureIdx = c;
              } else if (text.includes('ý nghĩa') || text.includes('công dụng')) {
                meaningIdx = c;
              }
            }
          }

          // Read the first content row
          const cols = tableRows[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
          if (cols && cols.length > Math.max(structureIdx, meaningIdx)) {
            structure = cleanHtml(cols[structureIdx]);
            meaning = cleanHtml(cols[meaningIdx]);
          }
        }

        // Fallbacks if tables are not present
        if (!structure) structure = title;
        if (!meaning) {
          const meaningMatch = decryptedHtml.match(/Ý nghĩa chính[\s\S]*?<li>([\s\S]*?)<\/li>/i) ||
                               decryptedHtml.match(/Nghĩa cơ bản[\s\S]*?<li>([\s\S]*?)<\/li>/i);
          if (meaningMatch) {
            meaning = cleanHtml(meaningMatch[1]);
          } else {
            meaning = 'Mẫu ngữ pháp JLPT N' + item.level;
          }
        }

        // Parse examples
        const examples: string[] = [];
        const exampleSecMatch = decryptedHtml.match(/Ví dụ minh họa[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i) ||
                                 decryptedHtml.match(/Ví dụ[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
        if (exampleSecMatch) {
          const liMatches = exampleSecMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
          if (liMatches) {
            for (const li of liMatches) {
              const liContent = li.replace(/<li[^>]*>|<\/li>/g, '').trim();
              if (liContent) {
                const jpPart = liContent.split(/<br[^>]*>/gi)[0] || '';
                const viPart = liContent.split(/<br[^>]*>/gi)[1] || '';
                
                const cleanJp = cleanHtml(jpPart);
                const cleanVi = cleanHtml(viPart);
                if (cleanJp && cleanVi) {
                  examples.push(`${cleanJp}\n${cleanVi}`);
                } else {
                  examples.push(cleanHtml(liContent));
                }
              }
            }
          }
        }

        // Build example string
        const exampleStr = examples.slice(0, 3).join('\n\n');

        // URL slug as romaji reference
        const romaji = item.url.split('/').pop()?.replace('.html', '') || '';

        const card: GrammarCard = {
          front: title,
          back: `${structure}\n\nÝ nghĩa: ${meaning}`,
          romaji,
          example: exampleStr,
          jlptLevel: item.level
        };

        results.push(card);
        console.log(`  ✅ Cào thành công: "${card.front}" (N${card.jlptLevel})`);
        console.log(`     Ý nghĩa: ${meaning.substring(0, 50)}...`);

      } catch (err: any) {
        console.error(`  ❌ Lỗi khi xử lý bài viết ${item.url}:`, err.message);
      }

      // Add a random delay between 1.2 and 2.5 seconds to avoid detection/rate-limit
      const delay = 1200 + Math.random() * 1300;
      await sleep(delay);
    }

    console.log(`\n📊 Tổng kết cào dữ liệu từ VNJPCLUB:`);
    console.log(`   - Số lượng cào thành công: ${results.length}/${maxToCrawl} bài viết`);
    
    // Write results to JSON file
    const outputFilePath = path.join(__dirname, `parsed-vnjp-grammar-n${targetLevel}.json`);
    fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`💾 Đã ghi file JSON thành công tại: ${outputFilePath}`);

  } catch (err: any) {
    console.error(`❌ Lỗi nghiêm trọng trong tiến trình cào dữ liệu:`, err.message);
  }
}

main();
