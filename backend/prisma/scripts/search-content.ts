import * as fs from 'fs';
import * as path from 'path';

function main() {
  const filePath = path.join(__dirname, 'raw.html');
  if (!fs.existsSync(filePath)) {
    console.error('raw.html not found');
    return;
  }
  const html = fs.readFileSync(filePath, 'utf-8');
  console.log(`Analyzing raw.html (size: ${html.length} characters)...`);

  // Search for any occurrence of base64 looking data or strings longer than 1000 chars without spaces
  const regex = /[A-Za-z0-9+/=]{500,}/g;
  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    count++;
    console.log(`Match ${count}: Index: ${match.index}, Length: ${match[0].length}`);
    console.log(`Snippet: ${match[0].substring(0, 100)}...`);
  }
  
  if (count === 0) {
    console.log('No large base64-like blocks found.');
  }

  // Let's also print all elements with "protected" or "data-" or similar in them
  const lines = html.split('\n');
  let lineCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('protected') || line.includes('ykhp') || line.includes('data-') || line.includes('dec_it')) {
      lineCount++;
      if (lineCount < 20) {
        console.log(`Line ${i+1}: ${line.trim().substring(0, 120)}...`);
      }
    }
  }
  console.log(`Total lines matching search: ${lineCount}`);
}

main();
