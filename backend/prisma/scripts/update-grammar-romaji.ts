import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, '..', 'data');
const SCRIPTS_DIR = __dirname;

function replaceVerbForms(text: string): string {
  if (!text) return text;
  
  // 1. V-teiru / V-te-iru -> Vている
  text = text.replace(/V[- ]te[- ]?iru(?![a-zA-Z])/gi, 'Vている');
  
  // 2. V-te-aru / V-te-aru -> Vてある
  text = text.replace(/V[- ]te[- ]?aru(?![a-zA-Z])/gi, 'Vてある');
  
  // 3. V-tara -> Vたら
  text = text.replace(/V[- ]tara(?![a-zA-Z])/gi, 'Vたら');
  
  // 4. V-masu -> Vます
  text = text.replace(/V[- ]masu(?![a-zA-Z])/gi, 'Vます');
  
  // 5. V-nai -> Vない
  text = text.replace(/V[- ]nai(?![a-zA-Z])/gi, 'Vない');
  
  // 6. V-ru -> Vる
  text = text.replace(/V[- ]ru(?![a-zA-Z])/gi, 'Vる');
  text = text.replace(/V[- ]る/gu, 'Vる');
  
  // 7. V-te -> Vて
  text = text.replace(/V[- ]te(?![a-zA-Z])/gi, 'Vて');
  text = text.replace(/V[- ]て/gu, 'Vて');
  
  // 8. V-ta -> Vた
  text = text.replace(/V[- ]ta(?![a-zA-Z])/gi, 'Vた');
  text = text.replace(/V[- ]た/gu, 'Vた');
  
  // 9. V-ba -> Vば
  text = text.replace(/V[- ]ba(?![a-zA-Z])/gi, 'Vば');
  text = text.replace(/V[- ]ば/gu, 'Vば');
  
  return text;
}

function walkAndReplace(obj: any): any {
  if (typeof obj === 'string') {
    return replaceVerbForms(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => walkAndReplace(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      if (key === 'romaji') {
        res[key] = obj[key]; // Skip replacing in romaji keys
      } else {
        res[key] = walkAndReplace(obj[key]);
      }
    }
    return res;
  }
  return obj;
}

// Recursively find all JSON files in a directory
function findJsonFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findJsonFiles(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  }
  return results;
}

async function main() {
  console.log('🔄 Bắt đầu chuyển đổi các thể động từ sang Hiragana (Vる)...');

  // --- PART 1: Update JSON files ---
  const jsonFiles = [
    ...findJsonFiles(DATA_DIR),
    ...findJsonFiles(SCRIPTS_DIR)
  ];

  console.log(`Found ${jsonFiles.length} JSON files to process.`);
  for (const filePath of jsonFiles) {
    // Skip package-lock.json if found (just in case)
    if (filePath.includes('package-lock') || filePath.includes('package.json')) continue;

    console.log(`Processing file: ${path.basename(filePath)}`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      const updated = walkAndReplace(parsed);
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (e) {
      console.error(`❌ Lỗi khi xử lý file ${filePath}:`, e);
    }
  }
  console.log('✅ Đã cập nhật xong toàn bộ file JSON.');

  // --- PART 2: Update Database ---
  console.log('🔄 Đang kết nối CSDL và cập nhật bảng Lesson...');
  const lessons = await prisma.lesson.findMany();
  let updatedLessonsCount = 0;
  for (const lesson of lessons) {
    const updatedTheory = replaceVerbForms(lesson.theoryMd);
    if (updatedTheory !== lesson.theoryMd) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { theoryMd: updatedTheory }
      });
      updatedLessonsCount++;
    }
  }
  console.log(`✅ Cập nhật xong ${updatedLessonsCount}/${lessons.length} bài học (Lesson).`);

  console.log('🔄 Đang cập nhật bảng Card...');
  const cards = await prisma.card.findMany();
  let updatedCardsCount = 0;
  for (const card of cards) {
    const updatedFront = replaceVerbForms(card.front);
    const updatedBack = replaceVerbForms(card.back);
    const updatedExample = card.example ? replaceVerbForms(card.example) : null;

    if (updatedFront !== card.front || updatedBack !== card.back || updatedExample !== card.example) {
      await prisma.card.update({
        where: { id: card.id },
        data: {
          front: updatedFront,
          back: updatedBack,
          example: updatedExample
        }
      });
      updatedCardsCount++;
    }
  }
  console.log(`✅ Cập nhật xong ${updatedCardsCount}/${cards.length} thẻ học (Card).`);
  
  console.log('🎉 Hoàn tất quá trình cập nhật!');
}

main()
  .catch(err => {
    console.error('❌ Lỗi nghiêm trọng:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
