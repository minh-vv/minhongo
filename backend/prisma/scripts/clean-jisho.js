const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning Jisho Decks ---');
  const deckIds = [
    'jisho-tuvung-jlpt-n5',
    'jisho-tuvung-jlpt-n4',
    'jisho-tuvung-jlpt-n3',
    'jisho-tuvung-jlpt-n2',
    'jisho-tuvung-jlpt-n1'
  ];

  for (const id of deckIds) {
    const deck = await prisma.deck.findUnique({ where: { id } });
    if (deck) {
      console.log(`Deleting deck: ${id} (${deck.name})...`);
      // Delete cards progress first if any (actually, onDelete: Cascade should do it for Cards, but what about CardProgress?)
      // Let's check schema:
      // model CardProgress { card Card @relation(fields: [cardId], references: [id], onDelete: Cascade) }
      // So deleting cards will cascade delete card progress.
      // model ReviewLog doesn't have cascade delete configured automatically via relations, but there is no foreign key constraint, just userId, cardId, deckId strings.
      // Wait, let's also delete ReviewLogs for these decks to be clean.
      await prisma.reviewLog.deleteMany({ where: { deckId: id } });
      await prisma.deck.delete({ where: { id } });
      console.log(`Deleted deck: ${id}`);
    } else {
      console.log(`Deck not found: ${id}`);
    }
  }

  console.log('Jisho decks cleanup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
