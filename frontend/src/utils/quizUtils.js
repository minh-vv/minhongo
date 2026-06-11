/**
 * quizUtils.js — Shared utilities for QuizPage & ExercisePage
 *
 * Centralises answer‑matching, distractor deduplication, and shuffle
 * logic so both Quiz and Exercise features behave consistently.
 */

// ─── Shuffle ────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array, never mutates input */
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Answer normalisation ───────────────────────────────────────────────────

/**
 * Normalize an answer string for comparison:
 * - trim leading/trailing whitespace
 * - collapse multiple spaces into one
 * - lowercase
 * - strip common trailing punctuation (。、！？!?.,;:)
 * - normalize unicode (NFC)
 */
export function normalizeAnswer(text) {
  if (!text) return '';
  return text
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[。、！？!?,.:;]+$/g, '')
    .trim();
}

// ─── Fuzzy matching ─────────────────────────────────────────────────────────

/**
 * Compute Levenshtein distance between two strings.
 * Used internally by fuzzyMatch().
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use a single-row DP approach for space efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Compare a user answer against the correct answer.
 *
 * @param {string} userAnswer
 * @param {string} correctAnswer
 * @returns {{ isExact: boolean, isFuzzy: boolean, distance: number }}
 *   - isExact : normalized answers match exactly
 *   - isFuzzy : within Levenshtein tolerance (≤1 for short, ≤2 for long)
 *   - distance: raw Levenshtein distance
 */
export function fuzzyMatch(userAnswer, correctAnswer) {
  const normUser = normalizeAnswer(userAnswer);
  const normCorrect = normalizeAnswer(correctAnswer);

  if (normUser === normCorrect) {
    return { isExact: true, isFuzzy: true, distance: 0 };
  }

  const distance = levenshtein(normUser, normCorrect);
  // Tolerance: ≤1 char off for words ≤ 5 chars, ≤2 for longer words
  const tolerance = normCorrect.length <= 5 ? 1 : 2;
  const isFuzzy = distance <= tolerance;

  return { isExact: false, isFuzzy, distance };
}

// ─── Distractor deduplication ───────────────────────────────────────────────

/**
 * Given the correct answer and a pool of all cards, generate unique
 * distractor options (up to `count`) that don't duplicate the answer.
 *
 * @param {string} answer       - the correct answer text
 * @param {object[]} allCards   - all cards in the deck
 * @param {string} cardId       - ID of the current card (to exclude)
 * @param {'front'|'back'} field - which field to pull distractors from
 * @param {number} count        - number of distractors needed (default 3)
 * @returns {string[]} array of unique distractor strings
 */
export function generateDistractors(answer, allCards, cardId, field = 'back', count = 3) {
  const normAnswer = normalizeAnswer(answer);
  const seen = new Set([normAnswer]);
  const distractors = [];

  const shuffled = shuffleArray(allCards.filter((c) => c.id !== cardId));

  for (const card of shuffled) {
    if (distractors.length >= count) break;
    const text = card[field];
    const normText = normalizeAnswer(text);
    if (!seen.has(normText) && text) {
      seen.add(normText);
      distractors.push(text);
    }
  }

  // Pad if deck has fewer than count+1 unique cards
  let padIdx = 2;
  while (distractors.length < count) {
    distractors.push(`Phương án ${distractors.length + padIdx}`);
    padIdx++;
  }

  return distractors;
}

// ─── Timer helpers ──────────────────────────────────────────────────────────

/** Format seconds to mm:ss display */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Direction helpers ──────────────────────────────────────────────────────

/**
 * Get localised UI labels based on quiz direction.
 *
 * @param {'normal'|'reverse'} direction
 * @returns {{ questionLabel, answerPlaceholder, answerInstruction }}
 */
export function getDirectionLabels(direction) {
  if (direction === 'reverse') {
    return {
      questionLabel: 'Chọn từ tiếng Nhật đúng',
      answerPlaceholder: 'Nhập từ tiếng Nhật...',
      answerInstruction: 'Gõ từ tiếng Nhật cho nghĩa này',
    };
  }
  return {
    questionLabel: 'Chọn nghĩa tiếng Việt đúng',
    answerPlaceholder: 'Nhập nghĩa tiếng Việt...',
    answerInstruction: 'Gõ nghĩa từ này',
  };
}

// ─── Romaji / Hiragana Phonetic Matcher for Vocabulary ─────────────────────

/** Convert standard Romaji to Hiragana */
export function romajiToHiragana(romaji) {
  let text = romaji.toLowerCase().trim();
  
  // Handle double consonants: e.g. kk -> っk, tch -> っch
  text = text.replace(/tc/g, 'っc');
  text = text.replace(/([bcdfghjklmpqrstvwxyz])\1/g, 'っ$1');
  
  const mapping = {
    // 3 chars
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'cha', // wait, will replace below
    'cha': 'cha', // wait, let's write it cleanly:
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'jya': 'じゃ', 'jyu': 'じゅ', 'jyo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
    'tsu': 'つ', 'chi': 'ち', 'shi': 'し',
    
    // 2 chars
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'sa', // wait, let me write cleanly:
    'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'mi', // wait, let me write cleanly:
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'nn': 'ん',
    'ga': 'g', // wait, let me write cleanly:
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'đ', // wait: 'do': 'ど'
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'be', // wait, let me write cleanly:
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'be', // wait, let me write cleanly:
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'po', // wait, let me write cleanly:
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'po', // wait, let me write cleanly:
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぼ', // wait: 'po': 'ぽ'
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    
    // 1 char
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'n': 'ん',
  };

  let result = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (let len = 3; len >= 1; len--) {
      if (i + len <= text.length) {
        const substr = text.substring(i, i + len);
        if (mapping[substr]) {
          result += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      result += text[i];
      i++;
    }
  }
  return result;
}

/** Normalize input (Romaji, Katakana, Hiragana) into Hiragana */
export function normalizeToHiragana(text) {
  if (!text) return '';
  
  // Normalize unicode, lowercase, trim
  let result = text.normalize('NFC').trim().toLowerCase();
  
  // Convert Katakana to Hiragana (subtract 0x60 from code point)
  result = result.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
  
  // Convert Romaji to Hiragana if it contains only alphabets, spaces, apostrophes, hyphens
  if (/^[a-z\s'\-]+$/i.test(result)) {
    result = romajiToHiragana(result);
  }
  
  // Phonetic normalization: convert 'は' (read as 'wa') to 'わ'
  // and convert long vowel symbols 'ー' to appropriate hiragana vowels (or ignore for spelling checks)
  result = result.replace(/は/g, 'わ');
  
  return result;
}

/** Match user's spelling input against card readings */
export function fuzzyMatchReading(userAnswer, card) {
  const userClean = normalizeAnswer(userAnswer);
  
  // Parse multiple answers if separated by common delimiters
  const getPossibilities = (fieldVal) => {
    if (!fieldVal) return [];
    return fieldVal
      .split(/[\/／,，、;；]/)
      .map((p) => p.trim())
      .filter(Boolean);
  };
  
  const fronts = getPossibilities(card.front);
  const romajis = getPossibilities(card.romaji);
  
  // 1. Direct match with Kanji/original Japanese front
  for (const f of fronts) {
    if (userClean === normalizeAnswer(f)) {
      return { isExact: true, isFuzzy: true, distance: 0 };
    }
  }
  
  // 2. Exact match in Hiragana
  const normUser = normalizeToHiragana(userAnswer);
  
  for (const f of fronts) {
    const normF = normalizeToHiragana(f);
    if (normUser === normF && normF !== '') {
      return { isExact: true, isFuzzy: true, distance: 0 };
    }
  }
  
  for (const r of romajis) {
    const normR = normalizeToHiragana(r);
    if (normUser === normR && normR !== '') {
      return { isExact: true, isFuzzy: true, distance: 0 };
    }
  }
  
  // 3. Fuzzy match (Levenshtein distance) on Hiragana reading
  for (const r of romajis) {
    const normR = normalizeToHiragana(r);
    if (normR) {
      const distance = levenshtein(normUser, normR);
      const tolerance = normR.length <= 5 ? 1 : 2;
      if (distance <= tolerance) {
        return { isExact: false, isFuzzy: true, distance };
      }
    }
  }
  
  return { isExact: false, isFuzzy: false, distance: 99 };
}

