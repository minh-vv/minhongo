import * as fs from 'fs';
import * as path from 'path';

interface RawGrammar {
  front: string;
  back: string;
  romaji: string;
  example: string;
  jlptLevel: number;
}

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

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function generateTheoryMd(lessonTitle: string, lessonSummary: string, cards: RawGrammar[]): string {
  let markdown = `# ${lessonTitle}\n\n`;
  markdown += `## 📌 Tóm tắt\n\n${lessonSummary}\n\n`;
  markdown += `## 📚 Ngữ pháp chi tiết\n\n`;

  cards.forEach((card, index) => {
    const cleanFront = cleanText(card.front);
    const cleanBack = cleanText(card.back);
    
    markdown += `### ${index + 1}. ${cleanFront}\n\n`;
    markdown += `#### 💡 Cấu trúc & Ý nghĩa\n`;
    
    const backParts = cleanBack.split('\n\n');
    if (backParts.length >= 2) {
      markdown += `> 🔧 **Cấu trúc:** \`${backParts[0].trim()}\`\n`;
      markdown += `>\n`;
      markdown += `> 📖 **Ý nghĩa:** *${backParts.slice(1).join('\n\n').trim()}*\n\n`;
    } else {
      markdown += `\`\`\`text\n${cleanBack}\n\`\`\`\n\n`;
    }

    if (card.example && card.example.trim()) {
      markdown += `#### 📝 Ví dụ minh họa\n`;
      const examples = card.example.split('\n\n');
      examples.forEach((ex) => {
        const lines = ex.split('\n');
        if (lines.length >= 2) {
          const jp = cleanText(lines[0]);
          const vi = cleanText(lines[1]);
          markdown += `- **${jp}**\n  *→ ${vi}*\n`;
        } else if (lines.length === 1 && lines[0].trim()) {
          markdown += `- ${cleanText(lines[0])}\n`;
        }
      });
      markdown += `\n`;
    }
    markdown += `---\n\n`;
  });

  return markdown;
}

function main() {
  const dataDir = path.join(__dirname, '..', 'data');

  // ========== 1. N2 GRAMMAR PREPARE ==========
  const n2SrcPath = path.join(dataDir, 'shinkansen-n2-bunpou-lessons.json');
  const n2DestPath = path.join(dataDir, 'shinkanzen-n2-grammar-lessons.json');

  if (fs.existsSync(n2SrcPath)) {
    console.log(`Copying ${n2SrcPath} -> ${n2DestPath}`);
    const n2Content = fs.readFileSync(n2SrcPath, 'utf8');
    fs.writeFileSync(n2DestPath, n2Content, 'utf8');
    console.log('✅ Shinkanzen N2 Grammar file copied and renamed successfully!');
  } else {
    console.warn(`⚠️ Warning: ${n2SrcPath} not found!`);
  }

  // ========== 2. N1 GRAMMAR PREPARE & GROUP ==========
  const n1SrcPath = path.join(__dirname, 'parsed-vnjp-grammar-n1.json');
  const n1DestPath = path.join(dataDir, 'shinkanzen-n1-grammar-lessons.json');

  if (fs.existsSync(n1SrcPath)) {
    console.log(`Reading N1 Grammar points from ${n1SrcPath}`);
    const rawN1: RawGrammar[] = JSON.parse(fs.readFileSync(n1SrcPath, 'utf8'));
    console.log(`Found ${rawN1.length} raw grammar points.`);

    const cardsPerLesson = 2;
    const lessons: Lesson[] = [];
    let cardIdx = 0;
    let order = 1;

    while (cardIdx < rawN1.length) {
      // For the last lesson, grab any remaining cards (up to 3) so we don't have a tiny lesson of 1 card
      const remainingCount = rawN1.length - cardIdx;
      const count = (remainingCount === 3) ? 3 : Math.min(cardsPerLesson, remainingCount);

      const batch = rawN1.slice(cardIdx, cardIdx + count);
      cardIdx += count;

      const lessonTitle = `Bài ${order} — Ngữ pháp JLPT N1`;
      const lessonSummary = `Học và rèn luyện các cấu trúc ngữ pháp JLPT N1 (Phần ${order}/${Math.ceil(rawN1.length / cardsPerLesson)}).`;
      
      const cards: Card[] = batch.map(c => ({
        front: cleanText(c.front),
        back: cleanText(c.back),
        romaji: c.romaji,
        example: cleanText(c.example),
        jlptLevel: 1
      }));

      const theoryMd = generateTheoryMd(lessonTitle, lessonSummary, batch);

      const lesson: Lesson = {
        order,
        title: lessonTitle,
        summary: lessonSummary,
        theoryMd,
        skills: ['GRAMMAR'],
        estimatedMin: 30,
        decks: [
          {
            role: 'GRAMMAR',
            order: 1,
            deck: {
              name: `Shinkanzen N1 — Bài ${order} — Ngữ pháp`,
              description: `Bộ thẻ ngữ pháp JLPT N1 phần ${order}.`,
              category: 'NGUPHAP',
              jlptLevel: 1,
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
      order++;
    }

    fs.writeFileSync(n1DestPath, JSON.stringify(lessons, null, 2), 'utf8');
    console.log(`✅ Shinkanzen N1 Grammar grouped into ${lessons.length} lessons and saved to ${n1DestPath}!`);
  } else {
    console.error(`❌ Error: N1 source file not found at ${n1SrcPath}`);
  }
}

main();
