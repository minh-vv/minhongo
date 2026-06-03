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
