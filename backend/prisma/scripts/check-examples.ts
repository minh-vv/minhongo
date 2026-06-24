import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.card.findMany({
    where: {
      deck: {
        category: 'NGUPHAP'
      }
    },
    select: {
      id: true,
      front: true,
      example: true,
    }
  });

  console.log(`Checking ${cards.length} cards...`);
  let issuesCount = 0;

  for (const card of cards) {
    if (!card.example) continue;

    // Split using the same parser logic
    const blocks = card.example.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let ja = '';
      let vi = '';
      if (lines.length >= 2) {
        ja = lines[0];
        vi = lines[1];
      } else {
        const regex = /([^（(]+)[（(]([^）)]+)[）)]/;
        const match = block.match(regex);
        if (match) {
          ja = match[1].trim();
          vi = match[2].trim();
        } else {
          ja = block;
          vi = '';
        }
      }

      // Check if ja has no Japanese characters (hiragana, katakana, kanji)
      const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/u.test(ja);
      if (!hasJapanese && ja.trim().length > 0) {
        issuesCount++;
        console.log(`[ISSUE ${issuesCount}] Card ID: ${card.id} [${card.front}]`);
        console.log(`  Raw Block: "${block}"`);
        console.log(`  Parsed -> ja: "${ja}", vi: "${vi}"`);
        console.log('----------------------------------------------------');
      }
    }
  }

  console.log(`Total issues found: ${issuesCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
