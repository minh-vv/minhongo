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
const FALLBACK_JA = [
  '日本', '学生', '先生', '学校', '友達', '本', '車', '水', '魚', '肉', '野菜', 
  '果物', '時間', '今日', '明日', '昨日', '毎日', '日本語', '英語', '電話', 
  '部屋', '食堂', '机', '椅子', '手紙', '写真', '音楽', '映画', '旅行', '宿題'
];

const FALLBACK_VI = [
  'Nhật Bản', 'Học sinh', 'Giáo viên', 'Trường học', 'Bạn bè', 'Sách', 'Ô tô', 'Nước', 'Cá', 'Thịt', 'Rau',
  'Hoa quả', 'Thời gian', 'Hôm nay', 'Ngày mai', 'Hôm qua', 'Mỗi ngày', 'Tiếng Nhật', 'Tiếng Anh', 'Điện thoại',
  'Căn phòng', 'Nhà ăn', 'Cái bàn', 'Cái ghế', 'Thư', 'Bức ảnh', 'Âm nhạc', 'Bộ phim', 'Du lịch', 'Bài tập về nhà'
];

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

  // Pad if deck has fewer than count+1 unique cards with quality words
  const fallbacks = field === 'front' ? FALLBACK_JA : FALLBACK_VI;
  let fallbackIdx = 0;
  while (distractors.length < count && fallbackIdx < fallbacks.length) {
    const fallbackText = fallbacks[fallbackIdx];
    const normFallback = normalizeAnswer(fallbackText);
    if (!seen.has(normFallback)) {
      seen.add(normFallback);
      distractors.push(fallbackText);
    }
    fallbackIdx++;
  }

  // Emergency final fallback padding
  let padIdx = 2;
  while (distractors.length < count) {
    distractors.push(field === 'front' ? `言葉 ${distractors.length + padIdx}` : `Phương án ${distractors.length + padIdx}`);
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
  
  // Handle double consonants: e.g. kk -> っk, tch -> っch (excluding 'n' since 'nn' maps to 'ん')
  text = text.replace(/tc/g, 'っc');
  text = text.replace(/([bcdfghjklmprstvwxyz])\1/g, 'っ$1');
  
  const mapping = {
    // 4 chars
    'nnya': 'んにゃ', 'nnyu': 'んにゅ', 'nnyo': 'んにょ',
    
    // 3 chars
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
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
    'nna': 'んな', 'nni': 'んに', 'nnu': 'んぬ', 'nne': 'んね', 'nno': 'んの',
    
    // 2 chars
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'nn': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
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
    for (let len = 4; len >= 1; len--) {
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
  
  // Phonetic normalization: long vowel symbols 'ー' can be normalized if needed,
  // but we remove the global 'は' -> 'わ' conversion to prevent wrong spelling matching.
  
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
      const tolerance = normR.length <= 3 ? 0 : normR.length <= 6 ? 1 : 2;
      if (distance <= tolerance) {
        return { isExact: false, isFuzzy: true, distance };
      }
    }
  }
  
  return { isExact: false, isFuzzy: false, distance: 99 };
}

/**
 * Generates smart grammatical distractors for sentence completion questions.
 * Focuses on particles, verb/adjective inflections, or grammar suffix variations.
 * Falls back to deck-based distractors if it cannot generate enough smart distractors.
 *
 * @param {string} answer - the correct target word/phrase (e.g. card.front)
 * @param {object[]} allCards - other cards in the deck
 * @param {string} cardId - current card ID
 * @param {number} count - number of distractors needed
 * @returns {string[]} array of unique distractors
 */
export function generateSmartDistractorsForSentence(answer, allCards, cardId, count = 3) {
  const cleanAnswer = answer
    .replace(/^[〜~]/, '')
    .replace(/[〜~]$/, '')
    .replace(/[（\(].*?[）\)]/g, '')
    .trim();

  const seen = new Set([normalizeAnswer(cleanAnswer), normalizeAnswer(answer)]);
  const trimAnswer = cleanAnswer;
  const distractors = [];

  // Helper to add clean options
  const addOption = (opt) => {
    if (distractors.length >= count) return;
    const cleanOpt = opt.trim();
    const norm = normalizeAnswer(cleanOpt);
    if (!seen.has(norm) && cleanOpt !== '') {
      seen.add(norm);
      distractors.push(cleanOpt);
    }
  };

  // 1. Particles: if it is a single/double character common particle
  const commonParticles = ['に', 'が', 'を', 'は', 'で', 'も', 'と', 'へ', 'の', 'から', 'まで', 'より', 'や', 'し', 'ね', 'よ'];
  if (commonParticles.includes(trimAnswer)) {
    // Select other particles randomly
    const candidates = commonParticles.filter(p => p !== trimAnswer).sort(() => 0.5 - Math.random());
    for (const c of candidates) {
      addOption(c);
    }
  }

  // 2. Verb/Adjective / Suffix Inflections
  // A. Ends with て / で (Te-form or Te-form like grammar suffixes: e.g. にともなって, あたって, に際して)
  if (distractors.length < count && (trimAnswer.endsWith('て') || trimAnswer.endsWith('で')) && trimAnswer.length > 1) {
    if (trimAnswer.endsWith('って')) {
      const stem = trimAnswer.slice(0, -2);
      const variations = [
        stem + 'う',
        stem + 'った',
        stem + 'わない',
        stem + 'います',
        stem + 'い',
        stem + 'えば'
      ];
      for (const v of variations) addOption(v);
    } else if (trimAnswer.endsWith('して')) {
      const stem = trimAnswer.slice(0, -2);
      const variations = [
        stem + 'する',
        stem + 'した',
        stem + 'しない',
        stem + 'します',
        stem + 'し',
        stem + 'すれば'
      ];
      for (const v of variations) addOption(v);
    } else if (trimAnswer.endsWith('くて')) {
      const stem = trimAnswer.slice(0, -2);
      const variations = [
        stem + 'い',
        stem + 'かった',
        stem + 'くない',
        stem + 'ければ',
        stem + 'く',
        stem + 'さ'
      ];
      for (const v of variations) addOption(v);
    } else if (trimAnswer.endsWith('て')) {
      const stem = trimAnswer.slice(0, -1);
      const variations = [
        stem + 'る',
        stem + 'た',
        stem + 'ない',
        stem + 'ます',
        stem + 'れば',
        stem + 'よう'
      ];
      for (const v of variations) addOption(v);
    } else if (trimAnswer.endsWith('んで')) {
      const stem = trimAnswer.slice(0, -2);
      const variations = [
        stem + 'む',
        stem + 'ぶ',
        stem + 'んだ',
        stem + 'まない',
        stem + 'ばない',
        stem + 'みます',
        stem + 'びます'
      ];
      for (const v of variations) addOption(v);
    } else if (trimAnswer.endsWith('いで')) {
      const stem = trimAnswer.slice(0, -2);
      const variations = [
        stem + 'ぐ',
        stem + 'いだ',
        stem + 'がない',
        stem + 'ぎます',
        stem + 'げば'
      ];
      for (const v of variations) addOption(v);
    } else if (trimAnswer.endsWith('いて')) {
      const stem = trimAnswer.slice(0, -2);
      const variations = [
        stem + 'く',
        stem + 'いた',
        stem + 'かない',
        stem + 'きます',
        stem + 'けば'
      ];
      for (const v of variations) addOption(v);
    } else {
      const stem = trimAnswer.slice(0, -1);
      const variations = [
        stem + (trimAnswer.endsWith('で') ? 'だ' : 'た'),
        stem + (trimAnswer.endsWith('で') ? 'ず' : 'ない'),
        stem + 'る',
        stem + 'ます'
      ];
      for (const v of variations) addOption(v);
    }
  }

  // B. i-Adjective inflection: ends with い (e.g. 新しい, 高い)
  if (distractors.length < count && trimAnswer.endsWith('い') && trimAnswer.length > 1 && !trimAnswer.endsWith('てい')) {
    const stem = trimAnswer.slice(0, -1);
    const variations = [
      stem + 'かった',
      stem + 'くない',
      stem + 'ければ',
      stem + 'く',
      stem + 'さ'
    ];
    for (const v of variations) addOption(v);
  }

  // C. Verb inflection: ends with dictionary verb endings
  const verbEndings = ['う', 'つ', 'る', 'む', 'ぬ', 'ぶ', 'く', 'ぐ', 'す'];
  const lastChar = trimAnswer.slice(-1);
  if (distractors.length < count && verbEndings.includes(lastChar) && trimAnswer.length > 1) {
    const stem = trimAnswer.slice(0, -1);
    let options = [];
    if (lastChar === 'く') {
      options = [stem + 'いて', stem + 'いた', stem + 'かない', stem + 'きます', stem + 'けば'];
    } else if (lastChar === 'ぐ') {
      options = [stem + 'いで', stem + 'いだ', stem + 'がない', stem + 'ぎます', stem + 'げば'];
    } else if (lastChar === 'す') {
      options = [stem + 'して', stem + 'した', stem + 'さない', stem + 'します', stem + 'せば'];
    } else if (lastChar === 'つ') {
      options = [stem + 'って', stem + 'った', stem + 'たない', stem + 'chます', stem + 'てば'];
    } else if (lastChar === 'ぬ') {
      options = [stem + 'んで', stem + 'んだ', stem + 'なない', stem + 'にます', stem + 'ねば'];
    } else if (lastChar === 'ぶ') {
      options = [stem + 'んで', stem + 'んだ', stem + 'ばない', stem + 'びます', stem + 'べば'];
    } else if (lastChar === 'む') {
      options = [stem + 'んで', stem + 'んだ', stem + 'まない', stem + 'みます', stem + 'めば'];
    } else if (lastChar === 'う') {
      options = [stem + 'って', stem + 'った', stem + 'わない', stem + 'います', stem + 'えば'];
    } else if (lastChar === 'る') {
      options = [
        stem + 'て', stem + 'た', stem + 'ない', stem + 'ます',
        stem + 'って', stem + 'った', stem + 'らない', stem + 'ります', stem + 'れば'
      ];
    }
    options.sort(() => 0.5 - Math.random());
    for (const o of options) {
      addOption(o);
    }
  }

  // 3. Fallback to similar cards in the same deck (e.g. other grammar structures or vocabulary)
  if (distractors.length < count) {
    const deckPool = allCards.filter(c => c.id !== cardId).map(c => c.front);
    deckPool.sort(() => 0.5 - Math.random());
    for (const word of deckPool) {
      addOption(word);
    }
  }

  // 4. Final safety fallbacks (use smarter, level-appropriate words if we know them)
  const fallbackJa = [
    'これ', 'それ', 'あれ', 'どれ', 'ここ', 'そこ', 'あそこ', 'どこ',
    'なに', 'だれ', 'いつ', 'どうして', 'nghĩa', 'いくら', 'いくつ',
    'しかし', '그리고', 'だから', '즉', 'たとえば', '또는',
    'いつも', 'ときどき', 'ぜんぜん', 'ちかく', 'すこし', 'とても'
  ];
  fallbackJa.sort(() => 0.5 - Math.random());
  let fallbackIdx = 0;
  while (distractors.length < count && fallbackIdx < fallbackJa.length) {
    addOption(fallbackJa[fallbackIdx]);
    fallbackIdx++;
  }

  // Emergency safety pads
  let padIdx = 2;
  while (distractors.length < count) {
    distractors.push(`言葉 ${distractors.length + padIdx}`);
    padIdx++;
  }

  return distractors;
}


