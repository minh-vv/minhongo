const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const japaneseRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/u;

function cleanExample(exampleText) {
  if (!exampleText) return '';
  const blocks = exampleText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const cleanBlocks = [];

  for (const block of blocks) {
    if (japaneseRegex.test(block)) {
      cleanBlocks.push(block);
    } else {
      console.log(`Removing non-Japanese block: "${block}"`);
    }
  }

  return cleanBlocks.join('\n\n');
}

function main() {
  const files = fs.readdirSync(DATA_DIR);
  // Match any lessons JSON file
  const lessonsFiles = files.filter(f => f.includes('lessons') && f.endsWith('.json'));

  for (const file of lessonsFiles) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Processing file: ${file}`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changes = 0;

    for (const lesson of content) {
      if (!lesson.decks) continue;
      for (const ld of lesson.decks) {
        if (!ld.deck || !ld.deck.cards) continue;
        for (const card of ld.deck.cards) {
          if (!card.example) continue;
          const cleaned = cleanExample(card.example);
          if (cleaned !== card.example) {
            card.example = cleaned;
            changes++;
          }
        }
      }
    }

    if (changes > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Updated ${file} with ${changes} example cleanups.`);
    } else {
      console.log(`No changes needed for ${file}.`);
    }
  }
}

main();
