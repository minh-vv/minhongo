import 'dotenv/config';

async function main() {
  const url = 'https://raw.githubusercontent.com/mbrown1413/jp-dict-crossref/master/dojg.csv';
  console.log(`🌐 Fetching Raw DOJG Japanese Grammar Database: ${url}`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const csvText = await res.text();
    console.log('\n✅ Successfully fetched Grammar CSV!');
    console.log('📄 Grammar CSV Preview (first 1000 characters):');
    console.log(csvText.substring(0, 1000));
  } catch (err: any) {
    console.error('❌ Error fetching:', err.message);
  }
}

main();
