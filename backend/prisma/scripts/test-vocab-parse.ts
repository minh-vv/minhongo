import * as fs from 'fs';

// Decryption algorithm
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

async function testUrl(url: string, label: string) {
  console.log(`\n========================================`);
  console.log(`Testing ${label}: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to fetch ${url}: HTTP ${res.status}`);
      return;
    }
    const html = await res.text();
    const protectedMatch = html.match(/class="ykhp-protected-content"[^>]*?data-ykhp="([\s\S]*?)"/i);
    if (!protectedMatch) {
      console.log('No ykhp protected content found on this page.');
      return;
    }
    const rawProtected = protectedMatch[1].replace(/&amp;/g, '&');
    const decrypted = dec_it(rawProtected);
    console.log(`Decrypted content successfully! Length: ${decrypted.length}`);
    console.log(`First 500 characters of decrypted HTML:`);
    console.log(decrypted.substring(0, 500));
  } catch (e: any) {
    console.error(`Error:`, e.message);
  }
}

async function main() {
  // Mimikara N2 Vocab sample
  await testUrl('https://www.vnjpclub.com/mimi-kara-n2-goi/unit-1-bai-1.html', 'Mimikara N2 Vocab');

  // Mimikara N1 Vocab sample
  await testUrl('https://www.vnjpclub.com/mimi-kara-n1-goi/unit-1.html', 'Mimikara N1 Vocab');
}

main();
