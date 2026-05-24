import * as fs from 'fs';
import * as path from 'path';

interface GrammarEntry {
  concept: string;
  subEntry: string;
  volume: string;
  page: string;
  english: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const url = 'https://raw.githubusercontent.com/mbrown1413/jp-dict-crossref/master/dojg.csv';
  console.log(`🤖 CRAWLER: Khởi động cào cơ sở dữ liệu Ngữ pháp DOJG từ GitHub...`);
  console.log(`🌐 Đang tải dữ liệu từ: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Lỗi HTTP! status: ${res.status}`);
    }

    const csvText = await res.text();
    console.log(`✅ Tải thành công CSV (${(csvText.length / 1024).toFixed(2)} KB). Bắt đầu phân tích cấu trúc...`);

    const lines = csvText.split('\n');
    const grammarList: GrammarEntry[] = [];

    // Bỏ qua tiêu đề (Concept,Sub-entry,Volume,Page,English,hjgp,dojp)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line);
      if (cols.length < 5) continue;

      const concept = cols[0].replace(/^"|"$/g, '').trim();
      const subEntry = cols[1].replace(/^"|"$/g, '').trim();
      const volume = cols[2].replace(/^"|"$/g, '').trim();
      const page = cols[3].replace(/^"|"$/g, '').trim();
      const english = cols[4].replace(/^"|"$/g, '').trim();

      // Chỉ lọc lấy volume "basic" tương ứng với trình độ N5 & N4
      if (volume.toLowerCase() === 'basic') {
        grammarList.push({
          concept,
          subEntry,
          volume,
          page,
          english
        });
      }
    }

    console.log(`📊 Đã lọc và trích xuất thành công ${grammarList.length} điểm ngữ pháp N5/N4 (Basic) chuẩn DOJG!`);

    // Ghi tệp JSON lưu trữ
    const outputFilePath = path.join(__dirname, 'parsed-dojg-grammar.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(grammarList, null, 2), 'utf-8');

    console.log(`💾 Đã ghi file thành công:`);
    console.log(`   📍 Đường dẫn: ${outputFilePath}`);

    // Nghiệm thu 5 điểm ngữ pháp đầu tiên
    console.log('\n🔍 BẢN GHI NGHIỆM THU (5 Điểm ngữ pháp đầu tiên):');
    console.log(JSON.stringify(grammarList.slice(0, 5), null, 2));

  } catch (err: any) {
    console.error('❌ Lỗi tiến trình cào dữ liệu ngữ pháp:', err.message);
  }
}

main();
