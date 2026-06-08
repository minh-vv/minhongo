import * as fs from 'fs';

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('Failed');
}

async function main() {
  const sitemapUrl = 'https://www.vnjpclub.com/sitemap_index.xml';
  console.log(`Fetching sitemap index: ${sitemapUrl}`);
  try {
    const xml = await fetchWithRetry(sitemapUrl);
    console.log(`Fetched sitemap index successfully. Size: ${xml.length} bytes`);
    
    // Extract all sitemaps
    const locRegex = /<loc>([\s\S]*?)<\/loc>/g;
    const sitemaps: string[] = [];
    let match;
    while ((match = locRegex.exec(xml)) !== null) {
      sitemaps.push(match[1]);
    }
    
    console.log(`Sitemaps found:`);
    for (const sm of sitemaps) {
      console.log(`- ${sm}`);
    }

    const allUrls: string[] = [];
    for (const sm of sitemaps) {
      console.log(`Fetching child sitemap: ${sm}...`);
      try {
        const smXml = await fetchWithRetry(sm);
        const locRegex2 = /<loc>([\s\S]*?)<\/loc>/g;
        let match2;
        let count = 0;
        while ((match2 = locRegex2.exec(smXml)) !== null) {
          allUrls.push(match2[1]);
          count++;
        }
        console.log(`  -> Found ${count} URLs`);
      } catch (e: any) {
        console.error(`  -> Error fetching sitemap ${sm}: ${e.message}`);
      }
    }
    
    console.log(`\nTotal URLs across all sitemaps: ${allUrls.length}`);
    
    // Filter and group URLs
    const patterns: Record<string, number> = {};
    const sampleUrls: Record<string, string[]> = {};
    
    for (const url of allUrls) {
      // Get category or pattern
      let pattern = 'other';
      if (url.includes('/ngu-phap-')) {
        const parts = url.match(/ngu-phap-[^/]+/);
        if (parts) pattern = parts[0];
      } else if (url.includes('/minna-no-nihongo/')) {
        pattern = 'minna-no-nihongo';
      } else {
        const parts = url.split('/');
        if (parts.length > 3) {
          pattern = parts[3];
        }
      }
      
      patterns[pattern] = (patterns[pattern] || 0) + 1;
      if (!sampleUrls[pattern]) sampleUrls[pattern] = [];
      if (sampleUrls[pattern].length < 10) {
        sampleUrls[pattern].push(url);
      }
    }
    
    console.log('\n📊 URL Pattern Summary:');
    for (const [pattern, count] of Object.entries(patterns)) {
      console.log(`- ${pattern}: ${count} URLs`);
      console.log(`  Samples:`);
      for (const sample of sampleUrls[pattern]) {
        console.log(`    * ${sample}`);
      }
    }
    
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

main();
