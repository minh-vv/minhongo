import { PrismaClient, DeckCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password,
      name: 'Test User',
    },
  });

  console.log('User:', user.email);

  // ========== HÁN TỰ (Kanji) ==========
  const kanjiDeckN5 = await prisma.deck.upsert({
    where: { id: 'hantu-jlpt-n5' },
    update: {},
    create: {
      id: 'hantu-jlpt-n5',
      name: 'Hán tự N5',
      description: '213 chữ Hán tự N5 - JLPT N5 Kanji',
      isPublic: true,
      category: DeckCategory.HANTU,
      jlptLevel: 5,
      userId: user.id,
    },
  });

  const kanjiData = [
    { front: '日', back: 'Nhật, ngày', romaji: 'nichi, hi', jlptLevel: 5 },
    { front: '月', back: 'Nguyệt, tháng', romaji: 'getsu, tsuki', jlptLevel: 5 },
    { front: '火', back: 'Hỏa, lửa', romaji: 'ka, hi', jlptLevel: 5 },
    { front: '水', back: 'Thủy, nước', romaji: 'sui, mizu', jlptLevel: 5 },
    { front: '木', back: 'Mộc, cây', romaji: 'moku, ki', jlptLevel: 5 },
    { front: '金', back: 'Kim, vàng', romaji: 'kin, kane', jlptLevel: 5 },
    { front: '土', back: 'Thổ, đất', romaji: 'do, tsuchi', jlptLevel: 5 },
    { front: '人', back: 'Nhân, người', romaji: 'jin, hito', jlptLevel: 5 },
    { front: '大', back: 'Đại, lớn', romaji: 'dai, ōkii', jlptLevel: 5 },
    { front: '小', back: 'Tiểu, nhỏ', romaji: 'shō, chiisai', jlptLevel: 5 },
  ];

  for (const kanji of kanjiData) {
    await prisma.card.upsert({
      where: { id: `hantu-${kanji.front}` },
      update: {},
      create: {
        id: `hantu-${kanji.front}`,
        front: kanji.front,
        back: kanji.back,
        romaji: kanji.romaji,
        jlptLevel: kanji.jlptLevel,
        example: `${kanji.front}曜日 (${kanji.romaji.split(',')[0]}youbi)`,
        deckId: kanjiDeckN5.id,
      },
    });
  }

  console.log(`Created ${kanjiData.length} kanji cards`);

  // ========== TỪ VỰNG (Vocabulary) ==========
  const vocabDeckN5 = await prisma.deck.upsert({
    where: { id: 'tuvung-jlpt-n5' },
    update: {},
    create: {
      id: 'tuvung-jlpt-n5',
      name: 'Từ vựng N5',
      description: 'Từ vựng N5 phổ biến cho người mới bắt đầu',
      isPublic: true,
      category: DeckCategory.TUVUNG,
      jlptLevel: 5,
      userId: user.id,
    },
  });

  const vocabData = [
    { front: 'こんにちは', back: 'Xin chào', romaji: 'Konnichiwa', jlptLevel: 5 },
    { front: 'ありがとう', back: 'Cảm ơn', romaji: 'Arigatou', jlptLevel: 5 },
    { front: 'すみません', back: 'Xin lỗi', romaji: 'Sumimasen', jlptLevel: 5 },
    { front: 'はい', back: 'Vâng/Có', romaji: 'Hai', jlptLevel: 5 },
    { front: 'いいえ', back: 'Không', romaji: 'Iie', jlptLevel: 5 },
    { front: '日本', back: 'Nhật Bản', romaji: 'Nihon', jlptLevel: 5 },
    { front: '学生', back: 'Học sinh', romaji: 'Gakusei', jlptLevel: 5 },
    { front: '先生', back: 'Thầy/Cô giáo', romaji: 'Sensei', jlptLevel: 5 },
    { front: '学校', back: 'Trường học', romaji: 'Gakkou', jlptLevel: 5 },
    { front: '本', back: 'Sách', romaji: 'Hon', jlptLevel: 5 },
  ];

  for (const vocab of vocabData) {
    await prisma.card.upsert({
      where: { id: `vocab-${vocab.front}` },
      update: {},
      create: {
        id: `vocab-${vocab.front}`,
        front: vocab.front,
        back: vocab.back,
        romaji: vocab.romaji,
        jlptLevel: vocab.jlptLevel,
        example: `こんにちは、${vocab.front}。`,
        deckId: vocabDeckN5.id,
      },
    });
  }

  console.log(`Created ${vocabData.length} vocabulary cards`);

  // ========== NGỮ PHÁP (Grammar) ==========
  const grammarDeckN5 = await prisma.deck.upsert({
    where: { id: 'nguphap-jlpt-n5' },
    update: {},
    create: {
      id: 'nguphap-jlpt-n5',
      name: 'Ngữ pháp N5',
      description: 'Cấu trúc ngữ pháp N5 cơ bản',
      isPublic: true,
      category: DeckCategory.NGUPHAP,
      jlptLevel: 5,
      userId: user.id,
    },
  });

  const grammarData = [
    { front: 'は (wa)', back: 'Trợ từ chủ đề', romaji: 'wa', jlptLevel: 5 },
    { front: 'が (ga)', back: 'Trợ từ chủ ngữ', romaji: 'ga', jlptLevel: 5 },
    { front: 'を (wo/o)', back: 'Trợ từ đối tượng', romaji: 'wo', jlptLevel: 5 },
    { front: 'に (ni)', back: 'Trợ từ thời gian/địa điểm', romaji: 'ni', jlptLevel: 5 },
    { front: 'で (de)', back: 'Trợ từ nơi chốn/phương tiện', romaji: 'de', jlptLevel: 5 },
    { front: 'です/だ', back: 'Là (động từ to be)', romaji: 'desu/da', jlptLevel: 5 },
    { front: 'ます (masu)', back: 'Đuôi động từ lịch sự', romaji: 'masu', jlptLevel: 5 },
    { front: 'ません (masen)', back: 'Phủ định lịch sự', romaji: 'masen', jlptLevel: 5 },
    { front: 'ました (mashita)', back: 'Quá khứ lịch sự', romaji: 'mashita', jlptLevel: 5 },
    { front: 'ませんした (masendeshita)', back: 'Quá khứ phủ định', romaji: 'masendeshita', jlptLevel: 5 },
  ];

  for (const grammar of grammarData) {
    await prisma.card.upsert({
      where: { id: `grammar-${grammar.front.replace(/[^a-zA-Z]/g, '')}` },
      update: {},
      create: {
        id: `grammar-${grammar.front.replace(/[^a-zA-Z]/g, '')}`,
        front: grammar.front,
        back: grammar.back,
        romaji: grammar.romaji,
        jlptLevel: grammar.jlptLevel,
        example: `私は学生です。(Watashi wa gakusei desu.)`,
        deckId: grammarDeckN5.id,
      },
    });
  }

  console.log(`Created ${grammarData.length} grammar cards`);

  // ========== TỰ HỌC (User's own deck) ==========
  await prisma.deck.upsert({
    where: { id: 'demo-deck-jlpt-n5' },
    update: {},
    create: {
      id: 'demo-deck-jlpt-n5',
      name: 'Deck mẫu của tôi',
      description: 'Deck mẫu để bạn thực hành',
      isPublic: true,
      category: DeckCategory.TUHOC,
      jlptLevel: 5,
      userId: user.id,
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
