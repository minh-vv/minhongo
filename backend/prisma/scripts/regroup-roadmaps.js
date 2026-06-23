const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function splitIntoBalancedChunks(array, maxChunkSize) {
  const total = array.length;
  const numChunks = Math.ceil(total / maxChunkSize);
  const chunks = [];
  let start = 0;
  for (let i = 0; i < numChunks; i++) {
    const size = Math.ceil((total - start) / (numChunks - i));
    chunks.push(array.slice(start, start + size));
    start += size;
  }
  return chunks;
}

// ─────────────────────────────────────────────────────────────
// 1. RE-SPLIT MIMIKARA N1 VOCAB LESSONS
// ─────────────────────────────────────────────────────────────
function splitN1Vocab() {
  const filePath = path.join(DATA_DIR, 'mimikara-n1-vocab-lessons.json');
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File not found: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);
  const originalLessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const newLessons = [];
  let currentOrder = 1;

  for (const lesson of originalLessons) {
    const deckWrapper = lesson.decks[0];
    if (!deckWrapper || !deckWrapper.deck || !deckWrapper.deck.cards) {
      newLessons.push(lesson);
      continue;
    }

    const cards = deckWrapper.deck.cards;
    if (cards.length <= 25) {
      lesson.order = currentOrder++;
      newLessons.push(lesson);
      continue;
    }

    // Split cards into chunks of max 25 cards
    const cardChunks = splitIntoBalancedChunks(cards, 25);

    // Split theoryMd
    let header = '';
    let entries = [];
    const lines = lesson.theoryMd.split('\n');
    const firstHeadingIndex = lines.findIndex(l => l.trim().startsWith('### '));
    if (firstHeadingIndex !== -1) {
      header = lines.slice(0, firstHeadingIndex).join('\n') + '\n';
      const bodyText = lines.slice(firstHeadingIndex).join('\n');
      entries = bodyText.split(/\n(?=###\s*\d+\.)/);
    } else {
      header = lesson.theoryMd;
    }

    cardChunks.forEach((chunkCards, subIdx) => {
      const subTitle = `${lesson.title} (Phần ${subIdx + 1})`;
      const subSummary = `Học và rèn luyện ${chunkCards.length} từ vựng JLPT N1 - ${lesson.title} (Phần ${subIdx + 1}/${cardChunks.length}).`;
      
      // Extract matching theory blocks
      const chunkEntries = entries.slice(
        subIdx * Math.ceil(entries.length / cardChunks.length),
        (subIdx + 1) * Math.ceil(entries.length / cardChunks.length)
      );
      
      const subTheoryMd = header.replace(/# [^\n]+/, `# ${subTitle}`) + chunkEntries.map((entry, idx) => {
        return entry.replace(/^###\s*\d+\./, `### ${idx + 1}.`);
      }).join('\n');

      const subLesson = {
        order: currentOrder++,
        title: subTitle,
        summary: subSummary,
        theoryMd: subTheoryMd,
        skills: lesson.skills,
        estimatedMin: 20,
        decks: [
          {
            role: deckWrapper.role,
            order: deckWrapper.order,
            deck: {
              name: `${deckWrapper.deck.name} — Phần ${subIdx + 1}`,
              description: `${deckWrapper.deck.description} — Phần ${subIdx + 1}`,
              category: deckWrapper.deck.category,
              jlptLevel: deckWrapper.deck.jlptLevel,
              cards: chunkCards
            }
          }
        ],
        test: {
          passScore: lesson.test?.passScore || 70,
          questionCount: Math.min(10, chunkCards.length)
        }
      };

      newLessons.push(subLesson);
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(newLessons, null, 2), 'utf8');
  console.log(`✅ Mimikara N1 Vocab split successfully from ${originalLessons.length} units to ${newLessons.length} lessons!`);
}

// ─────────────────────────────────────────────────────────────
// 2. RE-GROUP SHINKANZEN N3 GRAMMAR LESSONS
// ─────────────────────────────────────────────────────────────
function groupN3Grammar() {
  const filePath = path.join(DATA_DIR, 'shinkanzen-n3-grammar-lessons.json');
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File not found: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);
  const originalLessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const newLessons = [];
  const groupSize = 5;
  let newOrder = 1;

  for (let i = 0; i < originalLessons.length; i += groupSize) {
    const chunk = originalLessons.slice(i, i + groupSize);
    
    // Merge cards
    const mergedCards = [];
    chunk.forEach(l => {
      const cards = l.decks[0]?.deck.cards || [];
      mergedCards.push(...cards);
    });

    // Merge theoryMd
    const mergedTheoryBlocks = [];
    chunk.forEach((l, idx) => {
      let content = l.theoryMd;
      // Re-number header from ### 1. to ### {index + 1}.
      content = content.replace(/^###\s*\d+\./, `### ${idx + 1}.`);
      mergedTheoryBlocks.push(content);
    });

    const lessonTitle = `Bài ${newOrder} — Ngữ pháp JLPT N3`;
    const lessonSummary = `Học và rèn luyện ${mergedCards.length} cấu trúc ngữ pháp JLPT N3 (Phần ${newOrder}/${Math.ceil(originalLessons.length / groupSize)}).`;
    const groupedTheoryMd = `# ${lessonTitle}\n\n## 📚 Ngữ pháp chi tiết\n\n` + mergedTheoryBlocks.join('\n\n---\n\n');

    const groupedLesson = {
      order: newOrder,
      title: lessonTitle,
      summary: lessonSummary,
      theoryMd: groupedTheoryMd,
      skills: ['GRAMMAR'],
      estimatedMin: 30,
      decks: [
        {
          role: 'GRAMMAR',
          order: 1,
          deck: {
            name: `Shinkanzen N3 — Bài ${newOrder} — Ngữ pháp`,
            description: `Bộ thẻ ngữ pháp JLPT N3 phần ${newOrder}.`,
            category: 'NGUPHAP',
            jlptLevel: 3,
            cards: mergedCards
          }
        }
      ],
      test: {
        passScore: 70,
        questionCount: Math.min(10, mergedCards.length)
      }
    };

    newLessons.push(groupedLesson);
    newOrder++;
  }

  fs.writeFileSync(filePath, JSON.stringify(newLessons, null, 2), 'utf8');
  console.log(`✅ Shinkanzen N3 Grammar grouped successfully from ${originalLessons.length} lessons to ${newLessons.length} lessons!`);
}

// ─────────────────────────────────────────────────────────────
// 3. RE-GROUP SHINKANZEN N1 GRAMMAR LESSONS
// ─────────────────────────────────────────────────────────────
function groupN1Grammar() {
  const filePath = path.join(DATA_DIR, 'shinkanzen-n1-grammar-lessons.json');
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File not found: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);
  const originalLessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const newLessons = [];
  const groupSize = 3; // each has 2 cards, so 3 lessons = 6 cards
  let newOrder = 1;

  for (let i = 0; i < originalLessons.length; i += groupSize) {
    const chunk = originalLessons.slice(i, i + groupSize);
    
    // Merge cards
    const mergedCards = [];
    chunk.forEach(l => {
      const cards = l.decks[0]?.deck.cards || [];
      mergedCards.push(...cards);
    });

    // Merge theoryMd
    const mergedTheoryBlocks = [];
    let currentCardIdx = 0;
    chunk.forEach((l) => {
      // Find all heading blocks
      let content = l.theoryMd;
      
      // Since each lesson might have multiple cards (e.g. 2 cards), we split by ### heading and re-number
      let header = '';
      let entries = [];
      const lines = content.split('\n');
      const firstHeadingIndex = lines.findIndex(line => line.trim().startsWith('### '));
      if (firstHeadingIndex !== -1) {
        header = lines.slice(0, firstHeadingIndex).join('\n') + '\n';
        const bodyText = lines.slice(firstHeadingIndex).join('\n');
        entries = bodyText.split(/\n(?=###\s*\d+\.)/);
      } else {
        header = content;
      }

      entries.forEach((entry) => {
        if (!entry.trim()) return;
        const renumbered = entry.replace(/^###\s*\d+\./, `### ${currentCardIdx + 1}.`);
        mergedTheoryBlocks.push(renumbered);
        currentCardIdx++;
      });
    });

    const lessonTitle = `Bài ${newOrder} — Ngữ pháp JLPT N1`;
    const lessonSummary = `Học và rèn luyện ${mergedCards.length} cấu trúc ngữ pháp JLPT N1 (Phần ${newOrder}/${Math.ceil(originalLessons.length / groupSize)}).`;
    const groupedTheoryMd = `# ${lessonTitle}\n\n## 📚 Ngữ pháp chi tiết\n\n` + mergedTheoryBlocks.join('\n\n---\n\n');

    const groupedLesson = {
      order: newOrder,
      title: lessonTitle,
      summary: lessonSummary,
      theoryMd: groupedTheoryMd,
      skills: ['GRAMMAR'],
      estimatedMin: 30,
      decks: [
        {
          role: 'GRAMMAR',
          order: 1,
          deck: {
            name: `Shinkanzen N1 — Bài ${newOrder} — Ngữ pháp`,
            description: `Bộ thẻ ngữ pháp JLPT N1 phần ${newOrder}.`,
            category: 'NGUPHAP',
            jlptLevel: 1,
            cards: mergedCards
          }
        }
      ],
      test: {
        passScore: 70,
        questionCount: Math.min(10, mergedCards.length)
      }
    };

    newLessons.push(groupedLesson);
    newOrder++;
  }

  fs.writeFileSync(filePath, JSON.stringify(newLessons, null, 2), 'utf8');
  console.log(`✅ Shinkanzen N1 Grammar grouped successfully from ${originalLessons.length} lessons to ${newLessons.length} lessons!`);
}

function main() {
  console.log('🚀 Starting regrouping and calculation of roadmaps...');
  splitN1Vocab();
  groupN3Grammar();
  groupN1Grammar();
  console.log('🎉 Finished regrouping all roadmaps!');
}

main();
