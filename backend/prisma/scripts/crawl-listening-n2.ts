/**
 * crawl-listening-n2.ts
 * Cào dữ liệu nghe hiểu N2 từ vnjpclub.com
 * Output: parsed-listening-n2.json (dùng cho ListeningData.js)
 *
 * Chạy: npx ts-node prisma/scripts/crawl-listening-n2.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// TYPES
// ============================================================

interface DialogueLine {
  speaker: string;     // 'M' | 'F' | ''
  name: string;        // tên nhân vật (nếu rõ) hoặc ''
  text: string;        // tiếng Nhật
  translation: string; // tiếng Việt
}

interface ListeningQuestion {
  question: string;       // câu hỏi tiếng Nhật
  questionVi: string;     // câu hỏi tiếng Việt
  options: string[];      // 4 đáp án tiếng Nhật
  optionsVi: string[];    // 4 đáp án tiếng Việt
  answerIndex: number;    // 0-indexed vị trí đáp án đúng
  explanation: string;    // 解説 (giải thích từ bài gốc, JP)
}

interface ListeningDialogue {
  id: string;
  sourceUrl: string;
  level: string;           // 'N2'
  pageTitle: string;       // "Bài-(1)"
  exerciseNumber: string;  // "１番", "２番" ...
  context: string;         // câu context JP (ngữ cảnh hội thoại)
  contextVi: string;       // câu context VN
  audioSrc: string;        // URL audio (relative hoặc absolute)
  lines: DialogueLine[];
  question: ListeningQuestion;
}

// ============================================================
// HELPERS
// ============================================================

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

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&aacute;/g, '\u00E1').replace(/&agrave;/g, '\u00E0').replace(/&atilde;/g, '\u00E3')
    .replace(/&acirc;/g, '\u00E2')
    .replace(/&eacute;/g, '\u00E9').replace(/&egrave;/g, '\u00E8').replace(/&ecirc;/g, '\u00EA')
    .replace(/&iacute;/g, '\u00ED').replace(/&igrave;/g, '\u00EC')
    .replace(/&oacute;/g, '\u00F3').replace(/&ograve;/g, '\u00F2').replace(/&ocirc;/g, '\u00F4')
    .replace(/&otilde;/g, '\u00F5')
    .replace(/&uacute;/g, '\u00FA').replace(/&ugrave;/g, '\u00F9').replace(/&ucirc;/g, '\u00FB')
    .replace(/&Agrave;/g, '\u00C0').replace(/&Aacute;/g, '\u00C1')
    .replace(/&Eacute;/g, '\u00C9').replace(/&Egrave;/g, '\u00C8')
    .replace(/&Iacute;/g, '\u00CD').replace(/&Oacute;/g, '\u00D3')
    .replace(/&Uacute;/g, '\u00DA')
    .replace(/&hellip;/g, '\u2026').replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '\u2013').replace(/&mdash;/g, '\u2014')
    .replace(/&#[0-9]+;/g, '');
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<rt>([\s\S]*?)<\/rt>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(text: string): string {
  return decodeHtmlEntities(cleanHtml(text)).trim();
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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi,en-US;q=0.7,en;q=0.3',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.vnjpclub.com/',
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err: any) {
      console.warn(`⚠️ [Attempt ${attempt}/${retries}] Lỗi tải ${url}: ${err.message}`);
      if (attempt === retries) throw err;
      await sleep(2000 * attempt);
    }
  }
  throw new Error('Fetch failed');
}

// ============================================================
// PARSER: extract tudich blocks (JP + VN pairs)
// ============================================================

interface TuDich {
  jp: string;
  vi: string;
}

function extractTuDichBlocks(html: string): TuDich[] {
  const results: TuDich[] = [];
  const blockRegex = /<div\s+class="tudich">([\s\S]*?)<\/div>\s*(?:<\/span>|)\s*(?:<div\s+class="kqdich">[\s\S]*?<div\s+class="nddich">([\s\S]*?)<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>)/gi;
  
  // Alternative simpler approach: find candich and nddich pairs sequentially
  const candichRegex = /<div\s+class="candich">([\s\S]*?)<\/div>/gi;
  const nddichRegex = /<div\s+class="nddich">([\s\S]*?)<\/div>/gi;

  const jpTexts: string[] = [];
  const viTexts: string[] = [];

  let m: RegExpExecArray | null;
  while ((m = candichRegex.exec(html)) !== null) {
    jpTexts.push(cleanText(m[1]));
  }
  while ((m = nddichRegex.exec(html)) !== null) {
    viTexts.push(cleanText(m[1]));
  }

  const count = Math.min(jpTexts.length, viTexts.length);
  for (let i = 0; i < count; i++) {
    if (jpTexts[i] && viTexts[i]) {
      results.push({ jp: jpTexts[i], vi: viTexts[i] });
    }
  }

  return results;
}

// ============================================================
// PARSER: parse a single exercise (番) section from tab_content HTML
// ============================================================

interface ExerciseBlock {
  number: string;       // "１番", "２番", ...
  numberIdx: number;    // 1, 2, 3, ...
  audioSrc: string;
  options: string[];    // 4 JP options
  answerRaw: string;    // 正答 raw text e.g. "１．四角いケーキ"
  answerIdx: number;    // 0-indexed
  slideHtml: string;    // slide-content HTML (contains dialogue + options vi + explanation)
  beforeSlideHtml: string; // HTML before first slide (contains audio + jp options)
}

function parseExerciseBlocks(tabHtml: string): ExerciseBlock[] {
  const blocks: ExerciseBlock[] = [];

  // Find all <strong>X番</strong> positions
  const exercisePattern = /<strong[^>]*>([１２３４５６７８９0-9]+番)<\/strong>/gi;
  let exMatch: RegExpExecArray | null;
  const allPositions: { index: number; number: string }[] = [];

  while ((exMatch = exercisePattern.exec(tabHtml)) !== null) {
    allPositions.push({ index: exMatch.index, number: exMatch[1].trim() });
  }

  // Deduplicate: keep only FIRST occurrence of each 番 number
  // (Each exercise has its number appearing twice: once in question, once in slide-content answer)
  const seen = new Set<string>();
  const positions: { index: number; number: string }[] = [];
  for (const pos of allPositions) {
    if (!seen.has(pos.number)) {
      seen.add(pos.number);
      positions.push(pos);
    }
  }

  // Build sections: each section spans from current position to the next FIRST occurrence
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : tabHtml.length;
    const sectionHtml = tabHtml.slice(start, end);

    // Extract audio src
    const audioMatch = sectionHtml.match(/<source\s+src="([^"]+)"/i);
    const audioSrc = audioMatch ? audioMatch[1] : '';

    // Find slide-content (this divides the question options from the answer section)
    const slideStart = sectionHtml.indexOf('<div class="slide-content');
    const beforeSlide = slideStart >= 0 ? sectionHtml.slice(0, slideStart) : sectionHtml;
    const slideHtml = slideStart >= 0 ? sectionHtml.slice(slideStart) : '';

    // Extract JP options from beforeSlide: <span style="font-size: 18px;">N　</span>xxxxx
    // Also: <p>N　xxxxx</p> directly
    const options: string[] = [];
    const optionRegex = /<span[^>]*font-size[^>]*>[１２３４\d]\s*<\/span>([\s\S]*?)(?=<\/p>)/gi;
    let optMatch: RegExpExecArray | null;
    while ((optMatch = optionRegex.exec(beforeSlide)) !== null) {
      options.push(cleanText(optMatch[1]));
    }
    // Also try direct <p>4　xxx</p> pattern (option 4 often has no span)
    const opt4Match = beforeSlide.match(/<p>([４4]　[^<]+)<\/p>/i);
    if (opt4Match && options.length === 3) {
      const opt4Text = cleanText(opt4Match[1].replace(/^[４4]　/, ''));
      options.push(opt4Text);
    }

    // Extract correct answer from slideHtml: <strong>正答</strong>　N．xxxxx
    const answerMatch = slideHtml.match(/正答[\s\S]*?([１２３４\d])[\s\S]*?(?:<\/p>|$)/i);
    let answerIdx = 0;
    let answerRaw = '';
    if (answerMatch) {
      answerRaw = cleanText(answerMatch[0]).replace(/正答/g, '').trim();
      const numChar = answerMatch[1];
      const numMap: { [k: string]: number } = { '１': 0, '２': 1, '３': 2, '４': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      answerIdx = numMap[numChar] ?? 0;
    }

    // Extract number index
    const numStr = positions[i].number.replace('番', '');
    const numMap2: { [k: string]: number } = { '１': 1, '２': 2, '３': 3, '４': 4, '５': 5, '６': 6, '７': 7, '８': 8, '９': 9 };
    const numberIdx = (numMap2[numStr] ?? parseInt(numStr, 10)) || (i + 1);

    blocks.push({
      number: positions[i].number,
      numberIdx,
      audioSrc,
      options,
      answerRaw,
      answerIdx,
      slideHtml,
      beforeSlideHtml: beforeSlide,
    });
  }

  return blocks;
}

// ============================================================
// PARSER: parse a full lesson HTML and extract all dialogues
// ============================================================

function parseLessonPage(html: string, url: string): ListeningDialogue[] {
  const results: ListeningDialogue[] = [];

  // Page title
  const titleMatch = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  const pageTitle = titleMatch ? cleanText(titleMatch[1]) : 'Bài không rõ';

  // Find ykhp-protected-content
  const ykhpMatch = html.match(/class="ykhp-protected-content"[^>]*?data-ykhp="([\s\S]*?)"/);
  if (!ykhpMatch) {
    console.warn('  ⚠️ Không tìm thấy nội dung protected. Bỏ qua.');
    return [];
  }

  const rawProtected = ykhpMatch[1].replace(/&amp;/g, '&');
  const decodedHtml = dec_it(rawProtected);

  // Extract tab sections: 問題I, 問題II, 問題III, etc.
  const tabRegex = /<div\s+class="tab_content"\s+id="tab(\d+)">([\s\S]*?)(?=<div\s+class="tab_content"|$)/gi;
  let tabMatch: RegExpExecArray | null;

  while ((tabMatch = tabRegex.exec(decodedHtml)) !== null) {
    const tabId = tabMatch[1];
    const tabHtml = tabMatch[2];

    // Skip tab1 (Giới thiệu / Introduction)
    if (tabId === '1') continue;

    // Get tab title
    const tabTitleMatch = tabHtml.match(/<h2>([\s\S]*?)<\/h2>/i);
    const tabTitle = tabTitleMatch ? cleanText(tabTitleMatch[1]) : `Tab ${tabId}`;

    // Parse exercise blocks within this tab
    const exerciseBlocks = parseExerciseBlocks(tabHtml);

    for (const block of exerciseBlocks) {
      // Extract dialogue lines from slideHtml (the answer section)
      const pairs = extractTuDichBlocks(block.slideHtml);

      // First 2 pairs are typically: context + question
      const context = pairs.length > 0 ? pairs[0].jp : '';
      const contextVi = pairs.length > 0 ? pairs[0].vi : '';
      const questionJp = pairs.length > 1 ? pairs[1].jp : '';
      const questionVi = pairs.length > 1 ? pairs[1].vi : '';

      // Dialogue lines: start from pair index 2 until we hit option-like text (contains １．２．etc)
      const dialogueLines: DialogueLine[] = [];
      const optionPattern = /^[１２３４\d][．.]/;
      let optionStartIdx = pairs.length;

      for (let i = 2; i < pairs.length; i++) {
        if (optionPattern.test(pairs[i].jp)) {
          optionStartIdx = i;
          break;
        }
        // Parse speaker prefix: Ｍ：, Ｆ：, Ｆ１：, Ｍ１：
        const speakerMatch = pairs[i].jp.match(/^([ＭＦMF][１２１2]?)[\s\uff1a：:]+(.+)/);
        if (speakerMatch) {
          dialogueLines.push({
            speaker: speakerMatch[1].replace(/[１２]/g, '').trim(),
            name: '',
            text: speakerMatch[2].trim(),
            translation: pairs[i].vi,
          });
        } else {
          dialogueLines.push({
            speaker: '',
            name: '',
            text: pairs[i].jp,
            translation: pairs[i].vi,
          });
        }
      }

      // Options VI from pairs (after dialogue, before 正答)
      const optionsVi: string[] = [];
      for (let i = optionStartIdx; i < pairs.length && i < optionStartIdx + 4; i++) {
        // Remove leading number like "１．"
        const viText = pairs[i].vi.replace(/^[１２３４\d][．.]/, '').trim();
        optionsVi.push(viText);
      }

      // Explanation (覚えておきたい会話表現 section)
      const explanationMatch = block.slideHtml.match(/覚えておきたい会話表現([\s\S]*?)(?=<div class="slide|$)/i);
      const explanation = explanationMatch ? cleanText(explanationMatch[1]).replace(/\s+/g, ' ').substring(0, 300) : '';

      // Audio URL: make absolute
      const audioSrc = block.audioSrc
        ? (block.audioSrc.startsWith('http') ? block.audioSrc : `https://www.vnjpclub.com${block.audioSrc}`)
        : '';

      const id = `n2-${url.split('/').pop()?.replace('.html', '') || 'bai'}-${tabId}-${block.numberIdx}`;

      results.push({
        id,
        sourceUrl: url,
        level: 'N2',
        pageTitle,
        exerciseNumber: block.number,
        context,
        contextVi,
        audioSrc,
        lines: dialogueLines,
        question: {
          question: questionJp,
          questionVi,
          options: block.options,
          optionsVi: optionsVi.length === 4 ? optionsVi : block.options.map(() => ''),
          answerIndex: block.answerIdx,
          explanation,
        }
      });
    }
  }

  return results;
}

// ============================================================
// GET ALL LESSON URLS
// ============================================================

async function getListeningUrls(): Promise<string[]> {
  const urls: string[] = [];
  const seen = new Set<string>();
  const BASE = 'https://www.vnjpclub.com';
  const PATTERN = /https:\/\/www\.vnjpclub\.com\/luyen-nghe-n2\/[^<"]+\.html/gi;

  console.log('🌐 Tìm URLs từ sitemap...');

  try {
    const sitemapIndex = await fetchWithRetry(`${BASE}/sitemap_index.xml`);
    const sitemapUrls: string[] = [];
    const locRegex = /<loc>([\s\S]*?)<\/loc>/g;
    let m: RegExpExecArray | null;
    while ((m = locRegex.exec(sitemapIndex)) !== null) {
      sitemapUrls.push(m[1].trim());
    }

    for (const smUrl of sitemapUrls) {
      try {
        await sleep(500);
        const smXml = await fetchWithRetry(smUrl);
        const locRegex2 = /<loc>([\s\S]*?)<\/loc>/g;
        while ((m = locRegex2.exec(smXml)) !== null) {
          const url = m[1].trim();
          if (/\/luyen-nghe-n2\/[^<"]+\.html/i.test(url) && !seen.has(url)) {
            seen.add(url);
            urls.push(url);
          }
        }
      } catch (e: any) {
        console.warn(`  ⚠️ Lỗi sitemap ${smUrl}: ${e.message}`);
      }
    }
  } catch (e: any) {
    console.warn(`⚠️ Lỗi sitemap index: ${e.message}`);
  }

  // Fallback: lấy từ trang danh mục
  if (urls.length === 0) {
    console.log('📋 Fallback: tải trang danh mục...');
    const listHtml = await fetchWithRetry(`${BASE}/luyen-nghe-n2/`);
    let m2: RegExpExecArray | null;
    while ((m2 = PATTERN.exec(listHtml)) !== null) {
      const url = m2[0];
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
  }

  // Sort bai-1.html, bai-2.html, ...
  urls.sort((a, b) => {
    const numA = parseInt(a.match(/bai-(\d+)/)?.[1] || '0');
    const numB = parseInt(b.match(/bai-(\d+)/)?.[1] || '0');
    return numA - numB;
  });

  console.log(`📊 Tìm thấy ${urls.length} bài nghe.`);
  return urls;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🎧 VNJPCLUB LISTENING CRAWLER: Khởi động cào dữ liệu nghe hiểu N2...\n');

  const maxBai = parseInt(process.argv[2] || '30', 10);
  console.log(`⚙️  Sẽ cào tối đa ${maxBai} bài.`);

  const urls = await getListeningUrls();
  const targetUrls = urls.slice(0, maxBai);

  const allDialogues: ListeningDialogue[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetUrls.length; i++) {
    const url = targetUrls[i];
    console.log(`\n[${i + 1}/${targetUrls.length}] Đang cào: ${url}`);

    try {
      const html = await fetchWithRetry(url);
      const dialogues = parseLessonPage(html, url);

      if (dialogues.length > 0) {
        allDialogues.push(...dialogues);
        successCount++;
        console.log(`  ✅ Cào thành công: ${dialogues.length} bài tập (${dialogues.map(d => d.exerciseNumber).join(', ')})`);
      } else {
        console.warn(`  ⚠️ Không tìm thấy bài tập nào.`);
        failCount++;
      }
    } catch (err: any) {
      console.error(`  ❌ Lỗi: ${err.message}`);
      failCount++;
    }

    // Delay ngẫu nhiên để tránh bị block
    const delay = 1500 + Math.random() * 1500;
    await sleep(delay);
  }

  console.log(`\n📊 Tổng kết:`);
  console.log(`   - Thành công: ${successCount}/${targetUrls.length} bài`);
  console.log(`   - Thất bại:   ${failCount}/${targetUrls.length} bài`);
  console.log(`   - Tổng bài tập luyện nghe: ${allDialogues.length}`);

  // Write output
  const outputPath = path.join(__dirname, 'parsed-listening-n2.json');
  fs.writeFileSync(outputPath, JSON.stringify(allDialogues, null, 2), 'utf-8');
  console.log(`\n💾 Đã lưu: ${outputPath}`);

  // Preview
  if (allDialogues.length > 0) {
    const first = allDialogues[0];
    console.log(`\n📋 Preview bài đầu tiên:`);
    console.log(`   ID: ${first.id}`);
    console.log(`   Bài: ${first.pageTitle} - ${first.exerciseNumber}`);
    console.log(`   Context: ${first.context}`);
    console.log(`   Context VI: ${first.contextVi}`);
    console.log(`   Câu hỏi JP: ${first.question.question}`);
    console.log(`   Câu hỏi VI: ${first.question.questionVi}`);
    console.log(`   Đáp án đúng: ${first.question.answerIndex + 1}. ${first.question.options[first.question.answerIndex]}`);
    console.log(`   Số dòng hội thoại: ${first.lines.length}`);
    console.log(`   Audio: ${first.audioSrc}`);
  }
}

main().catch(console.error);
