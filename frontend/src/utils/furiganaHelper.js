import jpWordReadings from './jpWordReadings.json';
import { isKanji, getHanViet } from './kanjiHvMap';

// Sort word list by length descending to match longest Kanji words first in the sentence
const sortedWords = Object.keys(jpWordReadings).sort((a, b) => b.length - a.length);

/**
 * Strips common hiragana/katakana prefixes/suffixes from a word
 * and wraps only the Kanji part with a <ruby> tag.
 * 
 * Example:
 *   getRubyHtml("お祝い", "おいわい") -> "お<ruby>祝<rt>いわ</rt></ruby>い"
 *   getRubyHtml("周り", "まわり") -> "<ruby>周<rt>まわ</rt></ruby>り"
 */
export function getRubyHtml(word, reading) {
  if (!word || !reading) return word;
  if (word === reading) return word;

  // Find common prefix
  let prefixLen = 0;
  while (
    prefixLen < word.length &&
    prefixLen < reading.length &&
    word[prefixLen] === reading[prefixLen] &&
    !isKanji(word[prefixLen])
  ) {
    prefixLen++;
  }

  // Find common suffix
  let suffixLen = 0;
  while (
    suffixLen < (word.length - prefixLen) &&
    suffixLen < (reading.length - prefixLen) &&
    word[word.length - 1 - suffixLen] === reading[reading.length - 1 - suffixLen] &&
    !isKanji(word[word.length - 1 - suffixLen])
  ) {
    suffixLen++;
  }

  const prefix = word.slice(0, prefixLen);
  const suffix = suffixLen > 0 ? word.slice(-suffixLen) : '';
  const kanjiPart = word.slice(prefixLen, suffixLen > 0 ? -suffixLen : undefined);
  const kanjiReading = reading.slice(prefixLen, suffixLen > 0 ? -suffixLen : undefined);

  if (kanjiPart && kanjiReading) {
    return `${prefix}<ruby>${kanjiPart}<rt>${kanjiReading}</rt></ruby>${suffix}`;
  }

  return `<ruby>${word}<rt>${reading}</rt></ruby>`;
}

/**
 * Scans a sentence and injects `<ruby>` markup for all matching vocabulary words.
 * To prevent replacing characters in already-injected HTML, we use a placeholder array.
 */
export function annotateSentence(sentence) {
  if (!sentence) return '';

  let tempSentence = sentence;
  const placeholders = [];

  // 1. First, search for exact matches from our dictionary of words
  for (const dictWord of sortedWords) {
    if (tempSentence.includes(dictWord)) {
      const reading = jpWordReadings[dictWord];
      const rubyHtml = getRubyHtml(dictWord, reading);
      
      // Use regex to replace all occurrences with a placeholder
      const placeholder = `__RUBY_PLACEHOLDER_${placeholders.length}__`;
      placeholders.push({ placeholder, html: rubyHtml });
      
      // Escape special characters for regex safety
      const escapedWord = dictWord.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      tempSentence = tempSentence.replace(regex, placeholder);
    }
  }

  // 2. Fallback: Identify any leftover contiguous CJK Kanji blocks and wrap them 
  // with character-by-character mapping or just leave them if they are not in dictionary.
  // Actually, we can leave them or wrap them if they are single Kanji characters.
  // Let's just leave them as plain text or try to query the dictionary.
  
  // 3. Put the placeholders back
  for (const item of placeholders) {
    tempSentence = tempSentence.replace(item.placeholder, item.html);
  }

  return tempSentence;
}

export { getHanViet };
