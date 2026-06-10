/**
 * Script tự động thêm deck GRAMMAR cho Minna N5/N4.
 * Trích xuất mẫu ngữ pháp từ theoryMd trong mỗi bài học.
 * 
 * Chạy: node add-grammar-decks.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Extract grammar patterns from theoryMd
function extractGrammarCards(theoryMd, jlptLevel) {
  const cards = [];
  
  // Split by ### headings (numbered sections like ### 1. or ### 2.)
  // Also support ## N. format (used in earlier lessons)
  const sections = theoryMd.split(/(?=^#{2,3}\s+\d+\.?\s)/m);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    // Get section title (## N. or ### N.)
    const titleMatch = section.match(/^#{2,3}\s+\d+\.?\s*(.+?)(?:\n|$)/m);
    if (!titleMatch) continue;
    
    const sectionTitle = titleMatch[1].trim();
    
    // Skip non-grammar sections
    if (sectionTitle.match(/Lưu ý phát âm|Số đếm|Luyện Đọc|Luyện Nghe|📖 Luyện|🎧 Luyện|📖 Lý thuyết|Ghi nhớ/i)) continue;
    
    // Extract grammar patterns
    const patterns = [];
    
    // Strategy 1: Backtick patterns with Japanese
    const backtickMatches = section.match(/`([^`]+)`/g);
    if (backtickMatches) {
      for (const p of backtickMatches) {
        const clean = p.replace(/`/g, '').trim();
        if (clean.match(/[ぁ-ゟァ-ヿ一-龯〜～をはがにでもへとのか]/) && clean.length > 1 && clean.length < 60) {
          if (!patterns.includes(clean)) {
            patterns.push(clean);
          }
        }
      }
    }
    
    // Strategy 2: Bold patterns **`text`** or **text** with Japanese
    const boldPatterns = section.match(/\*\*(?:`[^`]+`|[^*]+)\*\*/g);
    if (boldPatterns) {
      for (const p of boldPatterns) {
        const clean = p.replace(/\*\*/g, '').replace(/`/g, '').trim();
        if (clean.match(/[ぁ-ゟァ-ヿ一-龯〜～をはがにでもへとのか]/) && clean.length > 1 && clean.length < 60) {
          if (!patterns.includes(clean)) {
            patterns.push(clean);
          }
        }
      }
    }
    
    // Strategy 3: Japanese in title itself
    if (patterns.length === 0) {
      // Extract from title
      const jpFromTitle = sectionTitle.match(/[`「]([^`」]+)[`」]/);
      if (jpFromTitle) {
        patterns.push(jpFromTitle[1]);
      } else {
        // Try Japanese characters in the title
        const jpChars = sectionTitle.match(/[ぁ-ゟァ-ヿ一-龯〜～]+(?:[\s\/・]+[ぁ-ゟァ-ヿ一-龯〜～]+)*/g);
        if (jpChars) {
          for (const jp of jpChars) {
            if (jp.length > 1 && !patterns.includes(jp)) {
              patterns.push(jp);
            }
          }
        }
      }
    }
    
    // Extract example sentences
    const examples = [];
    // Match lines like: - **Ví dụ:** text or - text → translation
    const exampleLines = section.match(/^[\s]*[-•]\s*(?:\*\*Ví dụ:\*\*\s*)?(.+?)$/gm);
    if (exampleLines) {
      for (const line of exampleLines.slice(0, 5)) {
        let cleaned = line.replace(/^[\s]*[-•]\s*/, '').replace(/\*\*Ví dụ:\*\*\s*/, '').trim();
        // Extract only the Japanese part (before → or translation)
        const jpPart = cleaned.split(/[→⇒]/)[0]?.trim();
        if (jpPart && jpPart.match(/[ぁ-ゟァ-ヿ一-龯]/)) {
          examples.push(jpPart.replace(/`/g, ''));
        }
      }
    }
    
    // Build a clean description for the "back" of the card
    const backText = sectionTitle
      .replace(/[`「」]/g, '')
      .replace(/\(.+?\)/g, '') // Remove parentheticals
      .trim();
    
    // Use only the first 2 main patterns
    const mainPatterns = patterns.slice(0, 2);
    
    if (mainPatterns.length === 0) continue;
    
    for (let i = 0; i < mainPatterns.length; i++) {
      const front = mainPatterns[i];
      
      // Avoid duplicate fronts
      if (cards.find(c => c.front === front)) continue;
      
      cards.push({
        front,
        back: backText,
        romaji: '',
        example: examples[i] || examples[0] || '',
        jlptLevel,
      });
    }
  }
  
  return cards;
}

function processFile(filename, courseSlug, jlptLevel) {
  const filePath = path.join(DATA_DIR, filename);
  const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let totalGrammarCards = 0;
  let lessonsModified = 0;
  
  for (const lesson of lessons) {
    // Check if already has GRAMMAR deck
    const hasGrammar = lesson.decks.some(d => d.role === 'GRAMMAR');
    if (hasGrammar) {
      console.log(`  ⏭️  Bài ${lesson.order} đã có deck GRAMMAR, bỏ qua`);
      continue;
    }
    
    if (!lesson.theoryMd) {
      console.log(`  ⏭️  Bài ${lesson.order} không có theoryMd, bỏ qua`);
      continue;
    }
    
    const grammarCards = extractGrammarCards(lesson.theoryMd, jlptLevel);
    
    if (grammarCards.length === 0) {
      console.log(`  ⚠️  Bài ${lesson.order}: Không trích xuất được mẫu ngữ pháp từ theoryMd`);
      // Debug: show first 200 chars of theoryMd
      console.log(`       theoryMd starts with: ${lesson.theoryMd.substring(0, 150).replace(/\n/g, '\\n')}...`);
      continue;
    }
    
    // Add GRAMMAR deck
    const nextOrder = Math.max(...lesson.decks.map(d => d.order), -1) + 1;
    const label = courseSlug === 'minna-n5' ? 'Minna N5' : 'Minna N4';
    lesson.decks.push({
      role: 'GRAMMAR',
      order: nextOrder,
      deck: {
        name: `${label} — Bài ${lesson.order} — Ngữ pháp`,
        description: `Ngữ pháp bài ${lesson.order}: ${lesson.title}`,
        category: 'NGUPHAP',
        jlptLevel,
        cards: grammarCards,
      },
    });
    
    totalGrammarCards += grammarCards.length;
    lessonsModified++;
    console.log(`  ✅ Bài ${lesson.order}: +${grammarCards.length} thẻ ngữ pháp`);
    // Show card fronts for verification
    for (const c of grammarCards) {
      console.log(`       📝 ${c.front} → ${c.back}`);
    }
  }
  
  // Write back
  fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
  console.log(`\n  📊 Tổng kết ${filename}: ${lessonsModified} bài, ${totalGrammarCards} thẻ ngữ pháp\n`);
}

console.log('📖 Thêm deck GRAMMAR cho Minna no Nihongo...\n');

console.log('--- Minna N5 ---');
processFile('minna-n5-lessons.json', 'minna-n5', 5);

console.log('--- Minna N4 ---');
processFile('minna-n4-lessons.json', 'minna-n4', 4);

console.log('🎉 Hoàn tất!');
