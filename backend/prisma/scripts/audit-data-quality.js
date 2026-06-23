/**
 * Script: Audit chất lượng dữ liệu theo feedback của Loan
 * 
 * Kiểm tra:
 * 1. Từ vựng thiếu Kanji (chỉ có Hiragana)
 * 2. Câu ví dụ thiếu nghĩa tiếng Việt
 * 3. Card thiếu nghĩa (back rỗng)
 * 4. Ngữ pháp giải thích quá ngắn/sơ sài
 * 5. Thống kê tổng quan chất lượng dữ liệu
 * 
 * Run: node prisma/scripts/audit-data-quality.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const ALL_FILES = [
  'minna-n5-lessons.json',
  'minna-n4-lessons.json',
  'mimikara-n3-vocab-lessons.json',
  'mimikara-n2-vocab-lessons.json',
  'mimikara-n1-vocab-lessons.json',
  'shinkanzen-n3-grammar-lessons.json',
  'shinkanzen-n2-grammar-lessons.json',
  'shinkanzen-n1-grammar-lessons.json',
];

// Regex patterns
const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const HIRAGANA_RE = /[\u3040-\u309f]/;
const KATAKANA_RE = /[\u30a0-\u30ff]/;

function hasVietnamese(text) {
  if (!text) return false;
  // Vietnamese diacritics
  return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text);
}

function analyzeFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const stats = {
    file: filename,
    totalLessons: lessons.length,
    vocabDecks: 0,
    grammarDecks: 0,
    kanjiDecks: 0,
    totalVocabCards: 0,
    totalGrammarCards: 0,
    
    // Vocab issues
    vocabNoKanji: [],      // Vocab cards that only have hiragana (could use kanji)
    vocabNoBack: [],       // Cards missing meaning
    vocabShortBack: [],    // Cards with very short meaning (<3 chars)
    vocabNoExample: [],    // Cards missing example
    vocabExampleNoViet: [], // Examples without Vietnamese translation
    
    // Grammar issues
    grammarShortBack: [],  // Grammar cards with very brief explanation
    grammarNoExample: [],  // Grammar cards without examples
    grammarExampleNoViet: [], // Grammar examples without Vietnamese
  };

  for (const lesson of lessons) {
    for (const deckWrapper of (lesson.decks || [])) {
      const role = deckWrapper.role;
      const deck = deckWrapper.deck;
      if (!deck || !deck.cards) continue;

      const isVocab = role === 'VOCAB';
      const isGrammar = role === 'GRAMMAR';
      const isKanji = role === 'KANJI';

      if (isVocab) stats.vocabDecks++;
      if (isGrammar) stats.grammarDecks++;
      if (isKanji) stats.kanjiDecks++;

      for (const card of deck.cards) {
        if (isVocab) {
          stats.totalVocabCards++;

          // Check if front is only hiragana (no kanji)
          const front = card.front || '';
          const hasKanji = KANJI_RE.test(front);
          const hasHiragana = HIRAGANA_RE.test(front);
          const hasKatakana = KATAKANA_RE.test(front);
          
          if (!hasKanji && (hasHiragana || hasKatakana)) {
            stats.vocabNoKanji.push({
              lesson: lesson.title,
              front: card.front,
              back: card.back,
              romaji: card.romaji,
            });
          }

          // Check missing meaning
          if (!card.back || card.back.trim() === '') {
            stats.vocabNoBack.push({
              lesson: lesson.title,
              front: card.front,
              romaji: card.romaji,
            });
          } else if (card.back.trim().length < 3) {
            stats.vocabShortBack.push({
              lesson: lesson.title,
              front: card.front,
              back: card.back,
            });
          }

          // Check example quality
          if (!card.example || card.example.trim() === '') {
            stats.vocabNoExample.push({
              lesson: lesson.title,
              front: card.front,
            });
          } else if (!hasVietnamese(card.example)) {
            stats.vocabExampleNoViet.push({
              lesson: lesson.title,
              front: card.front,
              example: card.example.substring(0, 80),
            });
          }
        }

        if (isGrammar) {
          stats.totalGrammarCards++;

          // Check grammar explanation quality
          const back = card.back || '';
          if (back.length < 20) {
            stats.grammarShortBack.push({
              lesson: lesson.title,
              front: card.front,
              back: back,
            });
          }

          // Check example quality
          if (!card.example || card.example.trim() === '') {
            stats.grammarNoExample.push({
              lesson: lesson.title,
              front: card.front,
            });
          } else if (!hasVietnamese(card.example)) {
            stats.grammarExampleNoViet.push({
              lesson: lesson.title,
              front: card.front,
              example: card.example.substring(0, 80),
            });
          }
        }
      }
    }
  }

  return stats;
}

function printReport(allStats) {
  console.log('\n' + '═'.repeat(80));
  console.log('  📊 BÁO CÁO KIỂM TRA CHẤT LƯỢNG DỮ LIỆU MINHONGO');
  console.log('═'.repeat(80));

  let grandTotalVocab = 0;
  let grandTotalGrammar = 0;
  let grandNoKanji = 0;
  let grandNoBack = 0;
  let grandNoExample = 0;
  let grandExNoViet = 0;
  let grandGramShort = 0;
  let grandGramNoEx = 0;
  let grandGramExNoViet = 0;

  for (const stats of allStats) {
    if (!stats) continue;
    
    console.log('\n' + '─'.repeat(80));
    console.log(`  📂 ${stats.file}`);
    console.log('─'.repeat(80));
    console.log(`  Tổng lessons: ${stats.totalLessons} | Vocab cards: ${stats.totalVocabCards} | Grammar cards: ${stats.totalGrammarCards}`);

    grandTotalVocab += stats.totalVocabCards;
    grandTotalGrammar += stats.totalGrammarCards;

    if (stats.vocabNoKanji.length > 0) {
      grandNoKanji += stats.vocabNoKanji.length;
      console.log(`\n  🔤 Từ vựng KHÔNG CÓ KANJI (chỉ Hiragana/Katakana): ${stats.vocabNoKanji.length}/${stats.totalVocabCards}`);
      // Show first 5 examples
      stats.vocabNoKanji.slice(0, 5).forEach(c => {
        console.log(`     ├ ${c.front} (${c.romaji || '?'}) = ${c.back || '??'}`);
      });
      if (stats.vocabNoKanji.length > 5) {
        console.log(`     └ ... và ${stats.vocabNoKanji.length - 5} từ khác`);
      }
    }

    if (stats.vocabNoBack.length > 0) {
      grandNoBack += stats.vocabNoBack.length;
      console.log(`\n  ❌ Từ vựng THIẾU NGHĨA TIẾNG VIỆT: ${stats.vocabNoBack.length}`);
      stats.vocabNoBack.slice(0, 5).forEach(c => {
        console.log(`     ├ ${c.front} (${c.romaji || '?'})`);
      });
    }

    if (stats.vocabNoExample.length > 0) {
      grandNoExample += stats.vocabNoExample.length;
      console.log(`\n  📝 Từ vựng THIẾU CÂU VÍ DỤ: ${stats.vocabNoExample.length}/${stats.totalVocabCards}`);
    }

    if (stats.vocabExampleNoViet.length > 0) {
      grandExNoViet += stats.vocabExampleNoViet.length;
      console.log(`\n  🇻🇳 Câu ví dụ THIẾU DỊCH TIẾNG VIỆT: ${stats.vocabExampleNoViet.length}/${stats.totalVocabCards}`);
      stats.vocabExampleNoViet.slice(0, 5).forEach(c => {
        console.log(`     ├ ${c.front}: "${c.example}"`);
      });
      if (stats.vocabExampleNoViet.length > 5) {
        console.log(`     └ ... và ${stats.vocabExampleNoViet.length - 5} từ khác`);
      }
    }

    if (stats.grammarShortBack.length > 0) {
      grandGramShort += stats.grammarShortBack.length;
      console.log(`\n  ⚠️  Ngữ pháp GIẢI THÍCH QUÁ NGẮN (<20 ký tự): ${stats.grammarShortBack.length}/${stats.totalGrammarCards}`);
      stats.grammarShortBack.slice(0, 5).forEach(c => {
        console.log(`     ├ ${c.front}: "${c.back}"`);
      });
    }

    if (stats.grammarNoExample.length > 0) {
      grandGramNoEx += stats.grammarNoExample.length;
      console.log(`\n  📝 Ngữ pháp THIẾU CÂU VÍ DỤ: ${stats.grammarNoExample.length}/${stats.totalGrammarCards}`);
    }

    if (stats.grammarExampleNoViet.length > 0) {
      grandGramExNoViet += stats.grammarExampleNoViet.length;
      console.log(`\n  🇻🇳 Ngữ pháp ví dụ THIẾU DỊCH TIẾNG VIỆT: ${stats.grammarExampleNoViet.length}/${stats.totalGrammarCards}`);
      stats.grammarExampleNoViet.slice(0, 3).forEach(c => {
        console.log(`     ├ ${c.front}: "${c.example}"`);
      });
    }
  }

  // Grand summary
  console.log('\n' + '═'.repeat(80));
  console.log('  📈 TỔNG KẾT TOÀN HỆ THỐNG');
  console.log('═'.repeat(80));
  console.log(`  Tổng từ vựng: ${grandTotalVocab} | Tổng ngữ pháp: ${grandTotalGrammar}`);
  console.log('');
  console.log(`  🔤 Từ vựng không có Kanji:           ${grandNoKanji} (${(grandNoKanji/grandTotalVocab*100).toFixed(1)}%)`);
  console.log(`  ❌ Từ vựng thiếu nghĩa TV:            ${grandNoBack}`);
  console.log(`  📝 Từ vựng thiếu câu ví dụ:           ${grandNoExample} (${(grandNoExample/grandTotalVocab*100).toFixed(1)}%)`);
  console.log(`  🇻🇳 Ví dụ từ vựng thiếu dịch TV:      ${grandExNoViet} (${(grandExNoViet/grandTotalVocab*100).toFixed(1)}%)`);
  console.log(`  ⚠️  Ngữ pháp giải thích sơ sài:        ${grandGramShort}`);
  console.log(`  📝 Ngữ pháp thiếu câu ví dụ:          ${grandGramNoEx}`);
  console.log(`  🇻🇳 Ví dụ ngữ pháp thiếu dịch TV:     ${grandGramExNoViet}`);
  console.log('\n' + '═'.repeat(80));
}

function main() {
  console.log('🔍 Bắt đầu kiểm tra chất lượng dữ liệu...');
  
  const results = ALL_FILES.map(f => analyzeFile(f)).filter(Boolean);
  printReport(results);
}

main();
