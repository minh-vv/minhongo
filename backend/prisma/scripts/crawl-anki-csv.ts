import * as fs from 'fs';
import * as path from 'path';

interface ParsedVocab {
  kanji: string;
  reading: string;
  meaning: string;
  tags: string[];
}

async function main() {
  const url = 'https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/master/src/n4.csv';
  console.log(`🤖 CRAWLER: Khởi động cào dữ liệu từ vựng JLPT N4 từ open-anki-jlpt-decks...`);
  console.log(`🌐 Đang tải dữ liệu từ raw URL: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Lỗi tải file: HTTP ${res.status}`);
    }

    const csvText = await res.text();
    console.log(`✅ Đã tải thành công CSV (${(csvText.length / 1024).toFixed(2)} KB). Bắt đầu phân tách dữ liệu...`);

    const lines = csvText.split('\n');
    const parsedData: ParsedVocab[] = [];

    // Bỏ qua dòng tiêu đề (expression,reading,meaning,tags,guid)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Phân tách CSV đơn giản (hỗ trợ phân tách dấu phẩy trong ngoặc kép)
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 3) continue;

      const kanji = matches[0].replace(/^"|"$/g, '').trim();
      const reading = matches[1].replace(/^"|"$/g, '').trim();
      const meaning = matches[2].replace(/^"|"$/g, '').trim();
      const tagsString = matches[3] ? matches[3].replace(/^"|"$/g, '').trim() : '';
      const tags = tagsString.split(/\s+/).filter(Boolean);

      parsedData.push({
        kanji,
        reading,
        meaning,
        tags
      });
    }

    console.log(`📊 Đã phân tách xong ${parsedData.length} từ vựng JLPT N4 chất lượng cao!`);

    // Lưu kết quả ra file JSON thô trong thư mục scripts
    const outputFilePath = path.join(__dirname, 'parsed-n4-scraped.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(parsedData, null, 2), 'utf-8');
    
    console.log(`💾 Đã ghi file cơ sở dữ liệu JSON thô thành công:`);
    console.log(`   📍 Đường dẫn: ${outputFilePath}`);

    // Hiển thị xem thử 3 bản ghi đầu tiên để nghiệm thu
    console.log('\n🔍 BẢN GHI NGHIỆM THU (3 Từ đầu tiên):');
    console.log(JSON.stringify(parsedData.slice(0, 3), null, 2));

  } catch (err: any) {
    console.error('❌ Lỗi tiến trình cào dữ liệu:', err.message);
  }
}

main();
