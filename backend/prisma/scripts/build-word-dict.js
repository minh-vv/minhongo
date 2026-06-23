const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'utils', 'jpWordReadings.json');

const files = [
  'minna-n5-lessons.json',
  'minna-n4-lessons.json',
  'mimikara-n3-vocab-lessons.json',
  'mimikara-n2-vocab-lessons.json',
  'mimikara-n1-vocab-lessons.json'
];

function isKanji(char) {
  const code = char.charCodeAt(0);
  return code >= 0x4e00 && code <= 0x9faf;
}

function hasKanji(str) {
  for (let i = 0; i < str.length; i++) {
    if (isKanji(str[i])) return true;
  }
  return false;
}

function cleanReading(r) {
  if (!r) return '';
  // Clean up any extra info in readings (like "/" or "," or spaces)
  let clean = r.split('/')[0].split(',')[0].trim().toLowerCase();
  return clean;
}

function main() {
  console.log('📖 Generating Japanese word readings dictionary...');
  const wordDict = {};

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${file}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lessons = JSON.parse(content);

      for (const lesson of lessons) {
        if (!lesson.decks) continue;
        for (const ld of lesson.decks) {
          if (ld.role !== 'VOCAB' && ld.deck?.category !== 'TUVUNG') continue;
          if (!ld.deck || !ld.deck.cards) continue;

          for (const card of ld.deck.cards) {
            const word = card.front?.trim();
            const reading = cleanReading(card.romaji);

            if (word && reading && hasKanji(word)) {
              // Store word if it has Kanji and a valid reading
              // Don't overwrite existing words unless the new reading is valid and different
              if (!wordDict[word]) {
                wordDict[word] = reading;
              }
            }
          }
        }
      }
      console.log(`✅ Processed ${file}`);
    } catch (e) {
      console.error(`❌ Error processing ${file}:`, e.message);
    }
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(wordDict, null, 2), 'utf8');
  const count = Object.keys(wordDict).length;
  console.log(`🎉 Successfully created dictionary with ${count} words at:\n  ${OUTPUT_FILE}`);
}

main();
