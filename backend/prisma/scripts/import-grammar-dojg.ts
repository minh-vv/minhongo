import { PrismaClient, DeckCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ScrapedGrammar {
  concept: string;
  subEntry: string;
  volume: string;
  page: string;
  english: string;
}

// Tập hợp các khái niệm ngữ pháp cốt lõi thuộc N5
const N5_CONCEPTS = new Set([
  'は', 'が', 'を', 'に', 'で', 'へ', 'も', 'と', 'の', 'や', 'から', 'まで', 
  'です', 'だ', 'ます', 'ある', 'いる', 'どう', 'もう', 'まだ', '一番', 'いちばん', 
  'ください', '下さい', 'ましょう', 'たい', 'より', 'ながら', 'ね', 'よ', 'か', 
  'ごろ', 'まい', '毎', 'だけ', 'くらい', 'ぐらい', 'あげる', 'くれる', 'もらう', 
  'みる', '行く', 'いく', '来る', 'くる', 'ね', 'よ', 'だろ', 'でしょう'
]);

async function main() {
  console.log('🚀 Bắt đầu import dữ liệu ngữ pháp DOJG Basic (N5/N4) vào cơ sở dữ liệu...');

  // 1. Tìm admin user làm chủ sở hữu deck
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    throw new Error('❌ Không tìm thấy tài khoản Admin để sở hữu deck! Hãy chạy npm run seed trước.');
  }
  console.log(`👤 Admin phụ trách: ${admin.email}`);

  // 2. Đọc file parsed-dojg-grammar.json
  const dataPath = path.join(__dirname, 'parsed-dojg-grammar.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`❌ Không tìm thấy file dữ liệu: ${dataPath}. Hãy chạy crawl-grammar trước!`);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const grammarPoints: ScrapedGrammar[] = JSON.parse(rawData);
  console.log(`📚 Đọc thành công ${grammarPoints.length} điểm ngữ pháp từ file JSON.`);

  // 3. Đảm bảo deck N5 và N4 tồn tại
  const deckN5 = await prisma.deck.upsert({
    where: { id: 'nguphap-jlpt-n5' },
    update: {
      name: 'Ngữ pháp JLPT N5 (DOJG Basic)',
      description: 'Tổng hợp cấu trúc ngữ pháp N5 cơ bản được cào từ cơ sở dữ liệu từ điển A Dictionary of Japanese Grammar (DOJG).',
      category: DeckCategory.NGUPHAP,
      isPublic: true,
      jlptLevel: 5,
    },
    create: {
      id: 'nguphap-jlpt-n5',
      name: 'Ngữ pháp JLPT N5 (DOJG Basic)',
      description: 'Tổng hợp cấu trúc ngữ pháp N5 cơ bản được cào từ cơ sở dữ liệu từ điển A Dictionary of Japanese Grammar (DOJG).',
      category: DeckCategory.NGUPHAP,
      isPublic: true,
      jlptLevel: 5,
      userId: admin.id,
    },
  });

  const deckN4 = await prisma.deck.upsert({
    where: { id: 'nguphap-jlpt-n4' },
    update: {
      name: 'Ngữ pháp JLPT N4 (DOJG Basic)',
      description: 'Tổng hợp cấu trúc ngữ pháp N4 trung cấp được cào từ cơ sở dữ liệu từ điển A Dictionary of Japanese Grammar (DOJG).',
      category: DeckCategory.NGUPHAP,
      isPublic: true,
      jlptLevel: 4,
    },
    create: {
      id: 'nguphap-jlpt-n4',
      name: 'Ngữ pháp JLPT N4 (DOJG Basic)',
      description: 'Tổng hợp cấu trúc ngữ pháp N4 trung cấp được cào từ cơ sở dữ liệu từ điển A Dictionary of Japanese Grammar (DOJG).',
      category: DeckCategory.NGUPHAP,
      isPublic: true,
      jlptLevel: 4,
      userId: admin.id,
    },
  });

  console.log(`✅ Đã thiết lập/đồng bộ 2 Decks ngữ pháp:`);
  console.log(`   - N5: ${deckN5.id} ("${deckN5.name}")`);
  console.log(`   - N4: ${deckN4.id} ("${deckN4.name}")`);

  // 4. Duyệt qua từng điểm ngữ pháp và thêm thẻ học
  let n5Count = 0;
  let n4Count = 0;

  for (let i = 0; i < grammarPoints.length; i++) {
    const p = grammarPoints[i];
    
    // Quyết định level N5 hay N4 dựa trên heuristics
    let jlptLevel = 4;
    let deckId = deckN4.id;

    // Nếu concept nằm trong list N5_CONCEPTS hoặc có chứa từ khóa thuộc N5
    const isN5 = Array.from(N5_CONCEPTS).some(concept => 
      p.concept === concept || p.concept.includes(concept)
    );

    if (isN5) {
      jlptLevel = 5;
      deckId = deckN5.id;
      n5Count++;
    } else {
      n4Count++;
    }

    const subSuffix = p.subEntry ? ` [${p.subEntry}]` : '';
    const cardId = `dojg-grammar-${i + 1}`;

    const front = `${p.concept}${subSuffix}`;
    const back = p.english || 'Cấu trúc ngữ pháp tiếng Nhật cơ bản.';
    const romaji = p.page ? `DOJG p. ${p.page.replace(/^B\.\s*/, '')}` : 'DOJG Basic';
    const example = `Mẫu ngữ pháp: ${p.concept}\nTrang trong sách: ${p.page}\nPhân nhóm: ${p.volume}`;

    await prisma.card.upsert({
      where: { id: cardId },
      update: {
        front,
        back,
        romaji,
        example,
        jlptLevel,
        deckId,
      },
      create: {
        id: cardId,
        front,
        back,
        romaji,
        example,
        jlptLevel,
        deckId,
      },
    });
  }

  console.log(`\n🎉 HOÀN THÀNH TIẾN TRÌNH IMPORT!`);
  console.log(`   ✅ Tổng số điểm ngữ pháp đã xử lý: ${grammarPoints.length}`);
  console.log(`   ✅ Đã thêm vào Deck N5: ${n5Count} thẻ`);
  console.log(`   ✅ Đã thêm vào Deck N4: ${n4Count} thẻ`);
  console.log(`============================================================\n`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi tiến trình import:', e.message);
  })
  .finally(() => {
    prisma.$disconnect();
  });
