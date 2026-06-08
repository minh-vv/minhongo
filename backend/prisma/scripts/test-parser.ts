import * as fs from 'fs';
import * as path from 'path';

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<rt>([\s\S]*?)<\/rt>/gi, '') // Remove ruby rt elements
    .replace(/<[^>]*>/g, '')              // Strip all other tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBaseJapanese(html: string): string {
  // Strips ruby tags but keeps the base text (not the readings)
  return html
    .replace(/<rt>[\s\S]*?<\/rt>/gi, '')
    .replace(/<rp>[\s\S]*?<\/rp>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractReading(html: string): string {
  // Extracts the reading from inside <rt> tags
  const matches = html.match(/<rt>([\s\S]*?)<\/rt>/gi);
  if (!matches) {
    return cleanHtml(html); // Fallback to plain text if no ruby tag
  }
  return matches.map(m => m.replace(/<[^>]*>/g, '').trim()).join('');
}

async function main() {
  const filePath = path.join(__dirname, 'vocab-sample-decrypted.html');
  const html = fs.readFileSync(filePath, 'utf8');

  // Find all <div class="boxtv"> blocks
  // Since divs can be nested, let's split by <div class="boxtv">
  const blocks = html.split('<div class="boxtv">').slice(1);
  console.log(`Found ${blocks.length} vocabulary blocks.`);

  const parsedCards: any[] = [];

  for (let block of blocks) {
    // We only want the content up to the next outer container or end of block.
    // In our file, since they are sibling divs of class "boxtv", the block ends where the next one starts,
    // but the last block might have some trailing content.
    // Let's find the closing tag matching the boxtv div.
    // A simple approach since vnjpclub HTML is quite flat:
    
    // Extract head: <div class="tuvung">...</div>
    const tuvungMatch = block.match(/<div class="tuvung">([\s\S]*?)<\/div>/i);
    if (!tuvungMatch) continue;

    const rawTuvung = tuvungMatch[1];
    // Strip leading number like "1. ", "10. "
    const cleanTuvung = rawTuvung.replace(/^\d+\.\s*/, '').replace(/<b>|<\/b>/g, '').trim();

    const front = getBaseJapanese(cleanTuvung);
    const reading = extractReading(cleanTuvung);

    // Extract Hán Việt
    const hanvietMatch = block.match(/<div class="hanviet[12]">([\s\S]*?)<\/div>/i);
    const hanviet = hanvietMatch ? cleanHtml(hanvietMatch[1]) : '';

    // Extract Nghĩa
    const nghiaMatch = block.match(/<div class="nghia[12]">([\s\S]*?)<\/div>/i);
    const nghia = nghiaMatch ? cleanHtml(nghiaMatch[1]) : '';

    const back = hanviet ? `[Hán-Việt: ${hanviet}] ${nghia}` : nghia;

    // Parse examples inside vidubox
    const examples: string[] = [];
    const viduboxMatch = block.match(/<div class="vidubox">([\s\S]*?)$/i);
    if (viduboxMatch) {
      const viduboxContent = viduboxMatch[1];
      // Find all example sentences (tuvung and nghiavidu pairs)
      // On vnjpclub, inside vidubox we have:
      // <div class="tuvung">...sentence...</div>
      // <div class="nghiavidu">...translation...</div>
      // And then possibly <div class="vidunotfirst"> with more of these.
      
      // Let's use regex to find all matching pairs
      const pairRegex = /<div class="tuvung">([\s\S]*?)<\/div>\s*<div class="nghiavidu">([\s\S]*?)<\/div>/gi;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(viduboxContent)) !== null) {
        const jpEx = getBaseJapanese(pairMatch[1].replace(/<div class="viduseq">.*?<\/div>/g, ''));
        const viEx = cleanHtml(pairMatch[2]);
        if (jpEx && viEx) {
          examples.push(`${jpEx}\n(${viEx})`);
        }
      }
    }

    const card = {
      front,
      back,
      romaji: reading,
      example: examples.join('\n\n')
    };

    parsedCards.push(card);
  }

  console.log('Parsed cards:', JSON.stringify(parsedCards.slice(0, 3), null, 2));
}

main();
