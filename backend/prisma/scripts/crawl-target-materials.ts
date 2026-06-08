import * as fs from 'fs';
import * as path from 'path';

interface Card {
  front: string;
  back: string;
  romaji: string;
  example: string;
  jlptLevel: number;
}

interface Lesson {
  order: number;
  title: string;
  summary: string;
  theoryMd: string;
  skills: string[];
  estimatedMin: number;
  decks: {
    role: string;
    order: number;
    deck: {
      name: string;
      description: string;
      category: string;
      jlptLevel: number;
      cards: Card[];
    };
  }[];
  test: {
    passScore: number;
    questionCount: number;
  };
}

// Decryption algorithm from vnjpclub.com
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

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<rt>([\s\S]*?)<\/rt>/gi, '') // Remove ruby rt elements
    .replace(/<[^>]*>/g, '')              // Strip all other tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBaseJapanese(html: string): string {
  return html
    .replace(/<rt>[\s\S]*?<\/rt>/gi, '')
    .replace(/<rp>[\s\S]*?<\/rp>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractReading(html: string): string {
  const matches = html.match(/<rt>([\s\S]*?)<\/rt>/gi);
  if (!matches) {
    return cleanHtml(html);
  }
  return matches.map(m => m.replace(/<[^>]*>/g, '').trim()).join('');
}

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
      await sleep(2000 * attempt);
    }
  }
  throw new Error('Fetch failed');
}

// Sort helpers
function parseVocabUrl(url: string): { unit: number; bai: number } {
  // Extract patterns like unit-1-bai-2.html or unit-1.html
  const filename = url.split('/').pop() || '';
  const unitMatch = filename.match(/unit[-_](\d+)/i);
  const baiMatch = filename.match(/bai[-_](\d+)/i);
  const unit = unitMatch ? parseInt(unitMatch[1], 10) : 0;
  const bai = baiMatch ? parseInt(baiMatch[1], 10) : 1; // Default to 1 if no bai (e.g. N1 units)
  return { unit, bai };
}

function parseGrammarUrl(url: string): number {
  // Extract number from np-1.html or similar
  const filename = url.split('/').pop() || '';
  const match = filename.match(/np[-_](\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

// Vocab Parser
function parseVocabPage(html: string, decryptedHtml: string, jlptLevel: number): Card[] {
  const blocks = decryptedHtml.split('<div class="boxtv">').slice(1);
  const cards: Card[] = [];

  for (let block of blocks) {
    const tuvungMatch = block.match(/<div class="tuvung">([\s\S]*?)<\/div>/i);
    if (!tuvungMatch) continue;

    const rawTuvung = tuvungMatch[1];
    const cleanTuvung = rawTuvung.replace(/^\d+\.\s*/, '').replace(/<b>|<\/b>/g, '').trim();

    const front = getBaseJapanese(cleanTuvung);
    const reading = extractReading(cleanTuvung);

    const hanvietMatch = block.match(/<div class="hanviet[12]">([\s\S]*?)<\/div>/i);
    const hanviet = hanvietMatch ? cleanHtml(hanvietMatch[1]) : '';

    const nghiaMatch = block.match(/<div class="nghia[12]">([\s\S]*?)<\/div>/i);
    const nghia = nghiaMatch ? cleanHtml(nghiaMatch[1]) : '';

    const back = hanviet ? `[Hán-Việt: ${hanviet}] ${nghia}` : nghia;

    const examples: string[] = [];
    const viduboxMatch = block.match(/<div class="vidubox">([\s\S]*?)$/i);
    if (viduboxMatch) {
      const viduboxContent = viduboxMatch[1];
      const pairRegex = /<div class="tuvung">([\s\S]*?)<\/div>\s*<div class="nghiavidu">([\s\S]*?)<\/div>/gi;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(viduboxContent)) !== null) {
        const jpEx = getBaseJapanese(pairMatch[1].replace(/<div class="viduseq">.*?<\/div>/g, ''));
        const viEx = cleanHtml(pairMatch[2]);
        if (jpEx && viEx) {
          examples.push(`${jpEx}\n(${viEx})`);
        }
      }
    }

    cards.push({
      front,
      back,
      romaji: reading,
      example: examples.join('\n\n'),
      jlptLevel
    });
  }

  return cards;
}

// Grammar Parser
function parseGrammarPage(html: string, decryptedHtml: string, url: string, jlptLevel: number): { theoryMd: string; cards: Card[] } {
  // Title
  let pageTitle = '';
  const titleMatch = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    pageTitle = cleanHtml(titleMatch[1]).split('-')[0].trim();
  }

  // Split by parts A, B, C if present
  const parts = decryptedHtml.split(/~~~\s*([A-Z])\s*~~~/gi);
  let theoryMd = `# ${pageTitle}\n\n`;
  const cards: Card[] = [];

  if (parts.length > 1) {
    // Has parts
    for (let i = 1; i < parts.length; i += 2) {
      const partLetter = parts[i].trim();
      const partContent = parts[i + 1] || '';
      
      const boxnpMatch = partContent.match(/<div class=['"]boxnp['"]>([\s\S]*?)<\/div>/i);
      if (!boxnpMatch) continue;
      const boxContent = boxnpMatch[1];

      // Parse formula (after settings4.png)
      const settingsIndex = boxContent.indexOf('settings4.png');
      let formula = '';
      if (settingsIndex !== -1) {
        const afterSettings = boxContent.substring(settingsIndex);
        const nextImgIndex = afterSettings.indexOf('<img');
        const brbrIndex = afterSettings.indexOf('<br><br>');
        const limitIndex = Math.min(
          nextImgIndex !== -1 ? nextImgIndex : Infinity,
          brbrIndex !== -1 ? brbrIndex : Infinity
        );
        formula = cleanHtml(afterSettings.substring(0, limitIndex !== Infinity ? limitIndex : undefined)
          .replace(/settings4\.png['"]\s*width=['"]\s*\d+\s*['"]\s*>\s*\[?/, '')
          .replace(/\]\s*$/, ''));
      }

      // Parse explanation (after next1.png or second part)
      const nextIndex = boxContent.indexOf('next1.png');
      let explanation = '';
      if (nextIndex !== -1) {
        const afterNext = boxContent.substring(nextIndex);
        const vdIndex = afterNext.toLowerCase().indexOf('ví dụ:');
        const limitIndex = vdIndex !== -1 ? vdIndex : undefined;
        explanation = cleanHtml(afterNext.substring(0, limitIndex)
          .replace(/next1\.png['"]\s*width=['"]\s*\d+\s*['"]\s*>/, ''));
      }

      // Parse examples
      const examples: { jp: string; vi: string }[] = [];
      const pairRegex = /(\d+)\.\s*([\s\S]*?)<div class=['"]vnjp-vd-tr['"][^>]*>([\s\S]*?)<\/div>/gi;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(boxContent)) !== null) {
        const jp = getBaseJapanese(pairMatch[2].replace(/<u>/g, '').replace(/<\/u>/g, ''));
        const vi = cleanHtml(pairMatch[3]);
        if (jp && vi) {
          examples.push({ jp, vi });
        }
      }

      // Build card
      const partTitle = `${pageTitle} (${partLetter})`;
      const cardBack = `Cấu trúc: ${formula}\n\nÝ nghĩa: ${explanation}`;
      const exampleStr = examples.map(ex => `${ex.jp}\n(${ex.vi})`).join('\n\n');

      cards.push({
        front: partTitle,
        back: cardBack,
        romaji: pageTitle.toLowerCase().replace(/[^a-z0-9]/g, ''),
        example: exampleStr,
        jlptLevel
      });

      // Append to theoryMd
      theoryMd += `## Phần ${partLetter}\n`;
      theoryMd += `> 🔧 **Cấu trúc:** \`${formula}\`\n`;
      theoryMd += `>\n`;
      theoryMd += `> 📖 **Ý nghĩa:** *${explanation}*\n\n`;
      theoryMd += `### Ví dụ:\n`;
      examples.forEach(ex => {
        theoryMd += `- **${ex.jp}**\n  *→ ${ex.vi}*\n`;
      });
      theoryMd += `\n`;
    }
  } else {
    // Single part
    const boxnpMatch = decryptedHtml.match(/<div class=['"]boxnp['"]>([\s\S]*?)<\/div>/i);
    if (boxnpMatch) {
      const boxContent = boxnpMatch[1];
      const settingsIndex = boxContent.indexOf('settings4.png');
      let formula = '';
      if (settingsIndex !== -1) {
        const afterSettings = boxContent.substring(settingsIndex);
        const nextImgIndex = afterSettings.indexOf('<img');
        const brbrIndex = afterSettings.indexOf('<br><br>');
        const limitIndex = Math.min(
          nextImgIndex !== -1 ? nextImgIndex : Infinity,
          brbrIndex !== -1 ? brbrIndex : Infinity
        );
        formula = cleanHtml(afterSettings.substring(0, limitIndex !== Infinity ? limitIndex : undefined)
          .replace(/settings4\.png['"]\s*width=['"]\s*\d+\s*['"]\s*>\s*\[?/, '')
          .replace(/\]\s*$/, ''));
      }

      const nextIndex = boxContent.indexOf('next1.png');
      let explanation = '';
      if (nextIndex !== -1) {
        const afterNext = boxContent.substring(nextIndex);
        const vdIndex = afterNext.toLowerCase().indexOf('ví dụ:');
        explanation = cleanHtml(afterNext.substring(0, vdIndex !== -1 ? vdIndex : undefined)
          .replace(/next1\.png['"]\s*width=['"]\s*\d+\s*['"]\s*>/, ''));
      }

      const examples: { jp: string; vi: string }[] = [];
      const pairRegex = /(\d+)\.\s*([\s\S]*?)<div class=['"]vnjp-vd-tr['"][^>]*>([\s\S]*?)<\/div>/gi;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(boxContent)) !== null) {
        const jp = getBaseJapanese(pairMatch[2].replace(/<u>/g, '').replace(/<\/u>/g, ''));
        const vi = cleanHtml(pairMatch[3]);
        if (jp && vi) {
          examples.push({ jp, vi });
        }
      }

      const cardBack = `Cấu trúc: ${formula}\n\nÝ nghĩa: ${explanation}`;
      const exampleStr = examples.map(ex => `${ex.jp}\n(${ex.vi})`).join('\n\n');

      cards.push({
        front: pageTitle,
        back: cardBack,
        romaji: pageTitle.toLowerCase().replace(/[^a-z0-9]/g, ''),
        example: exampleStr,
        jlptLevel
      });

      theoryMd += `> 🔧 **Cấu trúc:** \`${formula}\`\n`;
      theoryMd += `>\n`;
      theoryMd += `> 📖 **Ý nghĩa:** *${explanation}*\n\n`;
      theoryMd += `### Ví dụ:\n`;
      examples.forEach(ex => {
        theoryMd += `- **${ex.jp}**\n  *→ ${ex.vi}*\n`;
      });
      theoryMd += `\n`;
    } else {
      // Fallback
      theoryMd += `> 📝 *Nội dung lý thuyết ngữ pháp bài học này đang được cập nhật.*\n`;
      cards.push({
        front: pageTitle,
        back: `Mẫu ngữ pháp JLPT N${jlptLevel}`,
        romaji: pageTitle.toLowerCase().replace(/[^a-z0-9]/g, ''),
        example: '',
        jlptLevel
      });
    }
  }

  return { theoryMd, cards };
}

// Generate premium theory for Vocab Lessons
function generateVocabTheoryMd(title: string, cards: Card[]): string {
  let markdown = `# ${title}\n\n`;
  markdown += `## 📚 Từ vựng chi tiết\n\n`;
  
  cards.forEach((card, index) => {
    markdown += `### ${index + 1}. ${card.front} (${card.romaji})\n`;
    markdown += `- **Ý nghĩa:** *${card.back}*\n`;
    if (card.example) {
      markdown += `- **Ví dụ:**\n${card.example.split('\n\n').map(ex => `  * ${ex.replace(/\n/g, '\n    ')}`).join('\n')}\n`;
    }
    markdown += `\n---\n\n`;
  });

  return markdown;
}

async function main() {
  const category = process.argv[2];
  if (!category || !['mimikara-n3-vocab', 'mimikara-n2-vocab', 'mimikara-n1-vocab', 'shinkanzen-n3-grammar'].includes(category)) {
    console.error('❌ Vui lòng truyền tham số hợp lệ: mimikara-n3-vocab, mimikara-n2-vocab, mimikara-n1-vocab, shinkanzen-n3-grammar');
    process.exit(1);
  }

  console.log(`🚀 CRAWLER KHỞI ĐỘNG: Đang chuẩn bị cào dữ liệu cho "${category}"...`);

  // Map settings
  let level = 3;
  let sitemapMatchPattern = '';
  let textbook = '';
  let skill = 'VOCABULARY';
  let isGrammar = false;

  if (category === 'mimikara-n3-vocab') {
    level = 3;
    sitemapMatchPattern = 'https://www.vnjpclub.com/mimikara-n3-tu-vung/';
    textbook = 'Mimikara Oboeru N3';
    skill = 'VOCABULARY';
  } else if (category === 'mimikara-n2-vocab') {
    level = 2;
    sitemapMatchPattern = 'https://www.vnjpclub.com/mimi-kara-n2-goi/';
    textbook = 'Mimikara Oboeru N2';
    skill = 'VOCABULARY';
  } else if (category === 'mimikara-n1-vocab') {
    level = 1;
    sitemapMatchPattern = 'https://www.vnjpclub.com/mimi-kara-n1-goi/';
    textbook = 'Mimikara Oboeru N1';
    skill = 'VOCABULARY';
  } else if (category === 'shinkanzen-n3-grammar') {
    level = 3;
    sitemapMatchPattern = 'https://www.vnjpclub.com/shinkanzen-n3-bunpo/';
    textbook = 'Shinkanzen Master N3';
    skill = 'GRAMMAR';
    isGrammar = true;
  }

  // 1. Fetch child sitemaps to get target URLs
  const sitemapIndexUrl = 'https://www.vnjpclub.com/sitemap_index.xml';
  console.log(`🌐 Đang quét sitemap index từ: ${sitemapIndexUrl}`);
  const uniqueUrls = new Set<string>();
  const targetUrls: string[] = [];

  try {
    const indexXml = await fetchWithRetry(sitemapIndexUrl);
    const locRegex = /<loc>([\s\S]*?)<\/loc>/g;
    const sitemaps: string[] = [];
    let smMatch;
    while ((smMatch = locRegex.exec(indexXml)) !== null) {
      sitemaps.push(smMatch[1]);
    }

    const pattern = new RegExp(sitemapMatchPattern.replace(/\//g, '\\/') + '[^<]+\\.html', 'i');

    for (const sm of sitemaps) {
      console.log(`   Scanning child sitemap: ${sm}...`);
      try {
        const smXml = await fetchWithRetry(sm);
        const locRegex2 = /<loc>([\s\S]*?)<\/loc>/g;
        let urlMatch;
        while ((urlMatch = locRegex2.exec(smXml)) !== null) {
          const url = urlMatch[1].trim();
          if (pattern.test(url) && !uniqueUrls.has(url)) {
            uniqueUrls.add(url);
            targetUrls.push(url);
          }
        }
      } catch (e: any) {
        console.warn(`   ⚠️ Lỗi sitemap con ${sm}: ${e.message}`);
      }
    }
  } catch (e: any) {
    console.error(`⚠️ Lỗi quét sitemap index: ${e.message}`);
    process.exit(1);
  }

  console.log(`📊 Tìm thấy: ${targetUrls.length} bài viết.`);

  if (targetUrls.length === 0) {
    console.error('❌ Không tìm thấy URL nào. Dừng tiến trình.');
    process.exit(1);
  }

  // Sort URLs numerically
  if (isGrammar) {
    targetUrls.sort((a, b) => parseGrammarUrl(a) - parseGrammarUrl(b));
  } else {
    targetUrls.sort((a, b) => {
      const infoA = parseVocabUrl(a);
      const infoB = parseVocabUrl(b);
      if (infoA.unit !== infoB.unit) return infoA.unit - infoB.unit;
      return infoA.bai - infoB.bai;
    });
  }

  console.log(`\n🚀 Sắp xếp thành công. URL đầu tiên: ${targetUrls[0]}`);
  console.log(`🚀 URL cuối cùng: ${targetUrls[targetUrls.length - 1]}`);

  // 2. Fetch and parse each URL
  const lessons: Lesson[] = [];
  const maxToCrawl = targetUrls.length;

  for (let i = 0; i < maxToCrawl; i++) {
    const url = targetUrls[i];
    const order = i + 1;
    console.log(`\n[${order}/${maxToCrawl}] Đang xử lý: ${url}`);

    try {
      const html = await fetchWithRetry(url);
      
      const protectedMatch = html.match(/class="ykhp-protected-content"[^>]*?data-ykhp="([\s\S]*?)"/i);
      if (!protectedMatch) {
        console.warn(`  ⚠️ Trang trống hoặc yêu cầu VIP. Bỏ qua.`);
        continue;
      }

      const decrypted = dec_it(protectedMatch[1].replace(/&amp;/g, '&'));
      
      // Page Title
      let pageTitle = '';
      const titleMatch = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                         html.match(/<title>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        pageTitle = cleanHtml(titleMatch[1]).split('-')[0].trim();
      } else {
        pageTitle = `Bài học ${order}`;
      }

      let theoryMd = '';
      let cards: Card[] = [];

      if (isGrammar) {
        // Parse Grammar
        const res = parseGrammarPage(html, decrypted, url, level);
        theoryMd = res.theoryMd;
        cards = res.cards;
      } else {
        // Parse Vocab
        cards = parseVocabPage(html, decrypted, level);
        theoryMd = generateVocabTheoryMd(pageTitle, cards);
      }

      if (cards.length === 0) {
        console.warn(`  ⚠️ Không tìm thấy thẻ nào trên trang này. Bỏ qua.`);
        continue;
      }

      // Construct Lesson Schema
      const deckName = `${textbook} — Bài ${order} — ${isGrammar ? 'Ngữ pháp' : 'Từ vựng'}`;
      const deckDescription = `${isGrammar ? 'Ngữ pháp' : 'Từ vựng'} bài số ${order} bám sát sách ${textbook}.`;
      const deckCategory = isGrammar ? 'NGUPHAP' : 'TUVUNG';

      const lesson: Lesson = {
        order,
        title: pageTitle,
        summary: `${isGrammar ? 'Ngữ pháp' : 'Từ vựng'} bài số ${order} sách ${textbook} (${cards.length} thẻ).`,
        theoryMd,
        skills: [skill],
        estimatedMin: 30,
        decks: [
          {
            role: isGrammar ? 'GRAMMAR' : 'VOCAB',
            order: 0,
            deck: {
              name: deckName,
              description: deckDescription,
              category: deckCategory,
              jlptLevel: level,
              cards
            }
          }
        ],
        test: {
          passScore: 70,
          questionCount: Math.min(10, cards.length)
        }
      };

      lessons.push(lesson);
      console.log(`  ✅ Cào thành công! Số lượng thẻ: ${cards.length}`);

    } catch (err: any) {
      console.error(`  ❌ Lỗi khi xử lý URL ${url}:`, err.message);
    }

    // Delay between page calls to prevent rate limits
    await sleep(1000 + Math.random() * 1000);
  }

  // Write lessons to JSON
  const outputFilename = `${category}-lessons.json`;
  const outputFilePath = path.join(__dirname, '..', 'data', outputFilename);
  fs.writeFileSync(outputFilePath, JSON.stringify(lessons, null, 2), 'utf-8');
  console.log(`\n💾 ĐÃ GHI FILE JSON THÀNH CÔNG: ${outputFilePath} (${lessons.length} bài học)`);
}

main();
