import * as fs from 'fs';
import * as path from 'path';

function dec_it(data: string): string {
  if (!data) return data;
  data = data.split('@').join('CAg');
  data = data.split('!').join('W5');
  data = data.split('*').join('CAgI');
  data = data.split('$').join('dGhl');
  data = data.split('%').join('YXN');
  data = data.split('&').join('YW');
  
  try {
    const clean = data.replace(/[^A-Za-z0-9+/=]/g, '');
    return Buffer.from(clean, 'base64').toString('utf-8');
  } catch (e) {
    return data;
  }
}

async function main() {
  const url = 'https://www.vnjpclub.com/mimikara-n3-tu-vung/unit-1-bai-1.html';
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.error(`HTTP Error: ${res.status}`);
      return;
    }
    const html = await res.text();
    const protectedMatch = html.match(/class="ykhp-protected-content"[^>]*?data-ykhp="([\s\S]*?)"/i);
    if (!protectedMatch) {
      console.error('ykhp-protected-content not found');
      return;
    }
    const decrypted = dec_it(protectedMatch[1].replace(/&amp;/g, '&'));
    fs.writeFileSync(path.join(__dirname, 'vocab-sample-decrypted.html'), decrypted, 'utf8');
    console.log('Successfully wrote decrypted HTML to vocab-sample-decrypted.html');
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
  }
}

main();
