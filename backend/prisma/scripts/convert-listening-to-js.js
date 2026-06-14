/**
 * convert-listening-to-js.js
 * Convert parsed-listening-n2.json → DIALOGUES format for ListeningData.js
 * 
 * Run: node prisma/scripts/convert-listening-to-js.js
 */

const fs = require('fs');
const path = require('path');

const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'parsed-listening-n2.json'), 'utf-8')
);

function mapSpeaker(speaker) {
  // Ｍ (male) → 'A' (left side), Ｆ (female) → 'B' (right side)
  const s = speaker.toUpperCase();
  if (s.includes('M') || s === 'Ｍ') return 'A';
  if (s.includes('F') || s === 'Ｆ') return 'B';
  return 'A'; // default left
}

function generateTitle(d) {
  // e.g. "N2 Bài 1 - １番: 兄と妹がケーキ屋でケーキを選んでいます"
  const baiNum = d.id.match(/bai-(\d+)/)?.[1] || '?';
  const context = d.context.length > 30 ? d.context.substring(0, 30) + '...' : d.context;
  return `N2 Bài ${baiNum} - ${d.exerciseNumber}: ${context}`;
}

function generateDescription(d) {
  return d.contextVi || `Luyện nghe hội thoại JLPT N2 - ${d.pageTitle}`;
}

function generateExplanation(d) {
  const correct = d.question.options[d.question.answerIndex];
  const correctVi = d.question.optionsVi?.[d.question.answerIndex] || '';
  const base = d.question.explanation?.trim();
  const answerStr = correctVi ? `${correct} (${correctVi})` : correct;
  if (base) {
    return `Đáp án đúng: ${answerStr}. ${base}`.substring(0, 300);
  }
  return `Đáp án đúng: ${answerStr}`;
}

const dialogues = rawData.map((d, i) => {
  // Map lines
  let prevSpeaker = null;
  const lines = d.lines.map((line, idx) => {
    let speaker;
    if (line.speaker) {
      speaker = mapSpeaker(line.speaker);
    } else {
      // No speaker tag - alternate based on context or use previous
      speaker = prevSpeaker === 'A' ? 'B' : 'A';
    }
    prevSpeaker = speaker;

    return {
      speaker,
      name: line.speaker === 'Ｍ' || line.speaker === 'M' ? '男性' :
            line.speaker === 'Ｆ' || line.speaker === 'F' ? '女性' :
            line.name || (speaker === 'A' ? '話者A' : '話者B'),
      text: line.text,
      romaji: '',  // No romaji available from crawled data
      translation: line.translation,
    };
  });

  // Map question
  const questionText = d.question.question
    ? `${d.question.question}${d.question.questionVi ? ` (${d.question.questionVi})` : ''}`
    : '';

  const questions = questionText
    ? [{
        question: questionText,
        options: d.question.options.map((opt, oi) => {
          const vi = d.question.optionsVi?.[oi];
          return vi ? `${opt} (${vi})` : opt;
        }),
        answerIndex: d.question.answerIndex,
        explanation: generateExplanation(d),
      }]
    : [];

  return {
    id: d.id,
    level: 'N2',
    title: generateTitle(d),
    description: generateDescription(d),
    audioSrc: d.audioSrc,  // Extra field for audio
    context: d.context,
    contextVi: d.contextVi,
    lines,
    questions,
  };
}).filter(d => d.lines.length > 0 && d.questions.length > 0);

console.log(`✅ Converted ${dialogues.length} dialogues`);
console.log('\nSample:');
const first = dialogues[0];
console.log(`ID: ${first.id}`);
console.log(`Title: ${first.title}`);
console.log(`Lines: ${first.lines.length}`);
console.log(`Questions: ${first.questions.length}`);
console.log(`First question: ${first.questions[0].question.substring(0, 80)}...`);
console.log(`Options: ${first.questions[0].options.join(' | ')}`);
console.log(`Answer: ${first.questions[0].answerIndex}`);

// Write as JS export
const jsContent = `// ==========================================
// DATA NGHE HIỂU N2 - VNJPCLUB (auto-generated)
// Source: https://www.vnjpclub.com/luyen-nghe-n2/
// Generated: ${new Date().toISOString()}
// ==========================================
export const DIALOGUES_N2 = ${JSON.stringify(dialogues, null, 2)};
`;

const outputPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'pages', 'Listening', 'ListeningDataN2.js');
fs.writeFileSync(outputPath, jsContent, 'utf-8');
console.log(`\n💾 Đã lưu: ${outputPath}`);
console.log(`   ${dialogues.length} dialogues ready to import`);

// Also save as JSON for reference
const jsonPath = path.join(__dirname, 'converted-listening-n2.json');
fs.writeFileSync(jsonPath, JSON.stringify(dialogues, null, 2), 'utf-8');
console.log(`💾 Đã lưu: ${jsonPath}`);
