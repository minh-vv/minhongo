import * as fs from 'fs';
import * as path from 'path';

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Failed');
}

async function main() {
  const filePath = path.join(__dirname, 'raw.html');
  if (!fs.existsSync(filePath)) {
    console.error('raw.html not found');
    return;
  }
  const html = fs.readFileSync(filePath, 'utf-8');

  // Find all <script src="..."> tags
  const srcRegex = /<script[^>]*src="([^"]+)"/gi;
  const urls: string[] = [];
  let match;
  while ((match = srcRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} external scripts. Scanning...`);

  for (const url of urls) {
    console.log(`Checking script: ${url}`);
    try {
      const content = await fetchWithRetry(url);
      if (content.includes('dec_it') || content.includes('ykhp-protected')) {
        console.log(`\n🎉 Found decryption logic in: ${url}`);
        
        // Find dec_it function implementation
        const decItIdx = content.indexOf('dec_it');
        if (decItIdx !== -1) {
          console.log('dec_it context:');
          console.log(content.substring(decItIdx - 100, decItIdx + 800));
        }
        
        const ykhpIdx = content.indexOf('ykhp-protected');
        if (ykhpIdx !== -1) {
          console.log('ykhp-protected context:');
          console.log(content.substring(ykhpIdx - 100, ykhpIdx + 500));
        }
      }
    } catch (e: any) {
      console.error(`  Error fetching ${url}: ${e.message}`);
    }
  }
}

main();
