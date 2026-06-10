/**
 * Script to clean and normalize raw lessons and cards data.
 * It removes empty parentheses (), （）, [], and unmatched brackets [], 
 * as well as order numbers from card fronts in grammar decks.
 *
 * Run: node clean-and-normalize-data.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILES_TO_CLEAN = [
  'shinkanzen-n1-grammar-lessons.json',
  'shinkanzen-n2-grammar-lessons.json',
  'shinkanzen-n3-grammar-lessons.json',
  'minna-n5-lessons.json',
  'minna-n4-lessons.json',
  'mimikara-n1-vocab-lessons.json',
  'mimikara-n2-vocab-lessons.json',
  'mimikara-n3-vocab-lessons.json'
];

function cleanString(str) {
  if (typeof str !== 'string') return str;
  
  return str
    // Remove empty parentheses/brackets (remnants of furigana extraction)
    .replace(/（\s*）/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/［\s*］/g, '')
    // Remove unmatched brackets often left in crawled grammar structural lines
    .replace(/[\[\]［］]/g, '')
    // Replace multiple spaces with a single space
    .replace(/[ 　]+/g, ' ')
    .trim();
}

function cleanFrontText(front, isGrammar) {
  let cleaned = cleanString(front);
  if (!cleaned) return cleaned;
  
  if (isGrammar) {
    // Remove leading numbers like "1. ", "12. ~", "20. "
    cleaned = cleaned.replace(/^\d+\.?\s*/, '');
    // Remove trailing indicators like " (A)", " (B)"
    cleaned = cleaned.replace(/\s*\([A-Z]\)$/, '');
    // Clean up tilde symbols to be uniform (using standard wave dash ~ or wave)
    cleaned = cleaned.replace(/[～〜]+/g, '〜');
  }
  
  return cleaned;
}

function cleanBackText(back, front) {
  if (typeof back !== 'string') return back;
  
  let cleaned = cleanString(back);
  if (!cleaned.startsWith('Hán-Việt:')) return cleaned;

  // Trích xuất phần sau "Hán-Việt:"
  const content = cleaned.substring('Hán-Việt:'.length).trim();
  
  // Đếm số lượng chữ Kanji trong front
  const kanjiCount = (front.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g) || []).length;
  
  if (kanjiCount > 0) {
    const words = content.split(/\s+/);
    if (words.length > kanjiCount) {
      const meaning = words.slice(kanjiCount).join(' ');
      // Loại bỏ các ký tự dấu câu thừa ở đầu và cuối nghĩa
      return meaning.replace(/^[\s,;:\-\–\—\.]+|[\s,;:\-\–\—\.]+$/g, '').trim();
    }
  }
  
  return content;
}

function extractFirstExample(example) {
  if (typeof example !== 'string') return example;
  
  let cleaned = cleanString(example);
  if (!cleaned) return '';

  const normalized = cleaned.replace(/\r\n/g, '\n').trim();
  
  // Tách câu ví dụ bằng dấu xuống dòng kép
  const blocks = normalized.split(/\n\s*\n/);
  if (blocks.length === 0) return '';
  
  let firstBlock = blocks[0].trim();
  
  // Nếu block đầu tiên có nhiều hơn 2 dòng, có thể là do không dùng xuống dòng kép
  const lines = firstBlock.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 2) {
    if (lines[1] && (lines[1].startsWith('(') || lines[1].startsWith('（') || lines[1].startsWith('「') || lines[1].startsWith('"'))) {
      firstBlock = lines.slice(0, 2).join('\n');
    } else {
      firstBlock = lines.slice(0, 2).join('\n');
    }
  }
  
  return firstBlock;
}

function main() {
  console.log('🧼 Bắt đầu chuẩn hóa dữ liệu JSON...');

  for (const filename of FILES_TO_CLEAN) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⏭️ Không tìm thấy ${filename}, bỏ qua.`);
      continue;
    }

    console.log(`  📂 Đang xử lý file: ${filename}...`);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lessons = JSON.parse(fileContent);

      let cleanLessonsCount = 0;
      let cleanCardsCount = 0;

      for (const lesson of lessons) {
        lesson.title = cleanString(lesson.title);
        lesson.summary = cleanString(lesson.summary);
        if (lesson.theoryMd) {
          lesson.theoryMd = cleanString(lesson.theoryMd);
        }
        cleanLessonsCount++;

        if (lesson.decks && Array.isArray(lesson.decks)) {
          for (const deckWrapper of lesson.decks) {
            const isGrammar = deckWrapper.role === 'GRAMMAR' || deckWrapper.deck?.category === 'NGUPHAP';
            
            if (deckWrapper.deck) {
              deckWrapper.deck.name = cleanString(deckWrapper.deck.name);
              deckWrapper.deck.description = cleanString(deckWrapper.deck.description);
              
              if (deckWrapper.deck.cards && Array.isArray(deckWrapper.deck.cards)) {
                const cleanedCards = [];
                for (const card of deckWrapper.deck.cards) {
                  const front = cleanFrontText(card.front, isGrammar);
                  let back = cleanString(card.back);
                  let romaji = cleanString(card.romaji);
                  let example = cleanString(card.example);

                  if (!isGrammar) {
                    back = cleanBackText(back, front);
                    // Keep all examples, do not truncate
                  }

                  // If romaji is just a number (crawled artifact in grammar), clear it
                  if (isGrammar && romaji && /^\d+$/.test(romaji)) {
                    romaji = '';
                  }

                  // Skip duplicate/empty cards or cards that are not valid Japanese structures
                  if (!front || (isGrammar && front.includes('Chủ ngữ は Bổ ngữ'))) {
                    continue;
                  }

                  card.front = front;
                  card.back = back;
                  card.romaji = romaji;
                  card.example = example;
                  
                  cleanedCards.push(card);
                  cleanCardsCount++;
                }

                
                // Update deck cards list
                deckWrapper.deck.cards = cleanedCards;
              }
            }
          }
        }
      }

      // Write cleaned data back to file
      fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
      console.log(`  ✅ Hoàn tất ${filename}: Đã chuẩn hóa ${cleanLessonsCount} bài học, ${cleanCardsCount} thẻ.`);
    } catch (error) {
      console.error(`  ❌ Lỗi khi xử lý file ${filename}:`, error);
    }
  }

  console.log('\n✨ Đã hoàn tất chuẩn hóa toàn bộ file dữ liệu trong thư mục backend/prisma/data!\n');
}

main();
