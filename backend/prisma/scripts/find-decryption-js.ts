import * as fs from 'fs';
import * as path from 'path';

function main() {
  const filePath = path.join(__dirname, 'raw.html');
  if (!fs.existsSync(filePath)) {
    console.error('raw.html not found');
    return;
  }
  const html = fs.readFileSync(filePath, 'utf-8');

  // Extract all <script> tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1];
    count++;
    
    // Check if script content contains decryption indicators
    if (scriptContent.includes('atob') || scriptContent.includes('split') || scriptContent.includes('dec_it')) {
      console.log(`\n--- Script ${count} contains decryption indicators (length: ${scriptContent.length}) ---`);
      console.log(scriptContent.substring(0, 500) + (scriptContent.length > 500 ? '\n...' : ''));
    }
  }
}

main();
