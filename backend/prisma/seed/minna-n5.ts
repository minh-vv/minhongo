// Nội dung 5 bài đầu của Minna no Nihongo N5 — viết lại bằng tiếng Việt.
// Cấu trúc bài bám sách Minna nhưng phần giải thích là tự biên soạn.

export type VocabEntry = {
  front: string; // Nhật (kanji/hiragana)
  back: string; // Nghĩa tiếng Việt
  romaji: string;
  example: string;
};

export type LessonSeed = {
  order: number;
  title: string;
  summary: string;
  theoryMd: string;
  vocab: VocabEntry[];
};

export const MINNA_N5_LESSONS: LessonSeed[] = [
  // ============================================================
  // BÀI 1 — わたしは Mike です
  // ============================================================
  {
    order: 1,
    title: 'Bài 1 — Tự giới thiệu (わたしは ◯◯ です)',
    summary: 'Mẫu câu "Tôi là...", trợ từ は, ですか hỏi, kính ngữ さん.',
    theoryMd: `# Bài 1 — Tự giới thiệu

## 1. Mẫu câu cơ bản: \`N1 は N2 です\`

**Cấu trúc:** \`Chủ ngữ は Bổ ngữ です\`

- \`は\` (đọc là **wa**, không phải ha) là trợ từ đánh dấu chủ đề của câu.
- \`です\` (desu) đứng cuối câu, mang nghĩa "là" (lịch sự).

### Ví dụ

- わたしは マイク です。 → *Tôi là Mike.*
- あの ひとは せんせい です。 → *Người kia là giáo viên.*

## 2. Câu phủ định: \`じゃ ありません\`

Thay \`です\` bằng \`じゃ ありません\` (hoặc trang trọng hơn: \`では ありません\`).

- わたしは がくせい じゃ ありません。 → *Tôi không phải học sinh.*

## 3. Câu hỏi: \`〜ですか\`

Thêm \`か\` vào cuối câu. **Không cần dấu chấm hỏi** trong tiếng Nhật.

- あなたは マイクさん ですか。 → *Bạn có phải là Mike không?*
- はい、マイクです。 → *Vâng, tôi là Mike.*
- いいえ、マイクじゃ ありません。 → *Không, tôi không phải Mike.*

## 4. Hậu tố \`〜さん\`

Đặt sau **tên người khác** để thể hiện sự tôn trọng.
**Không bao giờ dùng \`さん\` cho chính mình.**

- マイクさん (Anh Mike), たなかさん (Anh/Chị Tanaka)

## 5. \`も\` — "cũng"

Thay \`は\` bằng \`も\` khi muốn nói "X cũng…".

- マイクさんは アメリカじん です。
- わたし**も** アメリカじん です。 → *Tôi cũng là người Mỹ.*

## Lưu ý phát âm

- \`は\` ở vai trò trợ từ luôn đọc là **wa**.
- \`です\` thường rút gọn cuối câu thành **des** (âm \`u\` gần như câm).

---
**Sau bài này bạn sẽ làm được:** giới thiệu tên, nghề nghiệp, quốc tịch; hỏi và đáp lại có/không.`,
    vocab: [
      { front: 'わたし', back: 'Tôi', romaji: 'watashi', example: 'わたしは マイクです。' },
      { front: 'あなた', back: 'Bạn', romaji: 'anata', example: 'あなたは がくせいですか。' },
      { front: 'あの ひと', back: 'Người kia', romaji: 'ano hito', example: 'あのひとは せんせいです。' },
      { front: '〜さん', back: 'Hậu tố tôn xưng (anh/chị/ông/bà)', romaji: '-san', example: 'たなかさん' },
      { front: 'せんせい', back: 'Giáo viên', romaji: 'sensei', example: 'やまださんは せんせいです。' },
      { front: 'がくせい', back: 'Học sinh, sinh viên', romaji: 'gakusei', example: 'わたしは がくせいです。' },
      { front: 'かいしゃいん', back: 'Nhân viên công ty', romaji: 'kaishain', example: 'マイクさんは かいしゃいんです。' },
      { front: 'ぎんこういん', back: 'Nhân viên ngân hàng', romaji: 'ginkouin', example: 'やまださんは ぎんこういんです。' },
      { front: 'いしゃ', back: 'Bác sĩ', romaji: 'isha', example: 'ちちは いしゃです。' },
      { front: 'にほん', back: 'Nhật Bản', romaji: 'nihon', example: 'わたしは にほんじんです。' },
      { front: 'アメリカ', back: 'Mỹ', romaji: 'amerika', example: 'マイクさんは アメリカじんです。' },
      { front: 'ベトナム', back: 'Việt Nam', romaji: 'betonamu', example: 'わたしは ベトナムじんです。' },
      { front: 'はい', back: 'Vâng / Có', romaji: 'hai', example: 'はい、そうです。' },
      { front: 'いいえ', back: 'Không', romaji: 'iie', example: 'いいえ、ちがいます。' },
      { front: 'はじめまして', back: 'Lần đầu gặp mặt', romaji: 'hajimemashite', example: 'はじめまして。マイクです。' },
    ],
  },
  // ============================================================
  // BÀI 2 — これは ほんです
  // ============================================================
  {
    order: 2,
    title: 'Bài 2 — これ・それ・あれ (Đồ vật xung quanh)',
    summary: 'Đại từ chỉ vật, trợ từ の sở hữu, câu hỏi なんですか.',
    theoryMd: `# Bài 2 — Đồ vật xung quanh

## 1. これ・それ・あれ・どれ

Ba "phạm vi khoảng cách":

- **これ** (kore) — *cái này* (gần người nói)
- **それ** (sore) — *cái đó* (gần người nghe)
- **あれ** (are) — *cái kia* (xa cả hai)
- **どれ** (dore) — *cái nào* (câu hỏi)

### Ví dụ

- これは ほん です。 → *Đây là quyển sách.*
- それは なん ですか。 → *Cái đó là gì?*

## 2. この・その・あの + N

Đứng **trước danh từ**:

- この ほんは わたしの です。 → *Quyển sách này là của tôi.*

## 3. Trợ từ \`の\` — "của"

\`N1 の N2\` → N2 thuộc về / liên quan đến N1.

- わたしの ほん → *sách của tôi*
- にほんごの ほん → *sách tiếng Nhật*
- マイクさんの かばん → *cặp của Mike*

## 4. \`そうです\` / \`そうじゃ ありません\`

Trả lời câu hỏi có/không khi không có nội dung cụ thể:

- これは ペンですか。 — はい、**そうです**。
- いいえ、**そうじゃ ありません**。

## 5. \`〜か、〜か\` (Câu hỏi lựa chọn)

- これは ペンですか、シャープペンシルですか。
  → *Đây là bút bi hay bút chì kim?*

---
**Sau bài này bạn sẽ làm được:** chỉ và hỏi tên đồ vật xung quanh, nói "của ai".`,
    vocab: [
      { front: 'これ', back: 'Cái này', romaji: 'kore', example: 'これは ほんです。' },
      { front: 'それ', back: 'Cái đó', romaji: 'sore', example: 'それは なんですか。' },
      { front: 'あれ', back: 'Cái kia', romaji: 'are', example: 'あれは くるまです。' },
      { front: 'ほん', back: 'Sách', romaji: 'hon', example: 'これは にほんごの ほんです。' },
      { front: 'ペン', back: 'Bút', romaji: 'pen', example: 'これは ペンです。' },
      { front: 'えんぴつ', back: 'Bút chì', romaji: 'enpitsu', example: 'えんぴつを かして ください。' },
      { front: 'かぎ', back: 'Chìa khóa', romaji: 'kagi', example: 'これは わたしの かぎです。' },
      { front: 'とけい', back: 'Đồng hồ', romaji: 'tokei', example: 'あれは とけいです。' },
      { front: 'かさ', back: 'Ô, dù', romaji: 'kasa', example: 'これは わたしの かさです。' },
      { front: 'かばん', back: 'Cặp, túi', romaji: 'kaban', example: 'マイクさんの かばんです。' },
      { front: 'くるま', back: 'Xe ô tô', romaji: 'kuruma', example: 'あれは ぎんこうの くるまです。' },
      { front: 'なん／なに', back: 'Cái gì', romaji: 'nan / nani', example: 'それは なんですか。' },
      { front: 'だれ', back: 'Ai', romaji: 'dare', example: 'これは だれの ほんですか。' },
      { front: 'にほんご', back: 'Tiếng Nhật', romaji: 'nihongo', example: 'にほんごの ほんです。' },
      { front: 'そうです', back: '"Đúng vậy"', romaji: 'sou desu', example: 'はい、そうです。' },
    ],
  },
  // ============================================================
  // BÀI 3 — ここは しょくどうです
  // ============================================================
  {
    order: 3,
    title: 'Bài 3 — ここ・そこ・あそこ (Địa điểm)',
    summary: 'Đại từ chỉ nơi chốn, hỏi giá tiền, đếm tiền yên.',
    theoryMd: `# Bài 3 — Địa điểm

## 1. ここ・そこ・あそこ・どこ

Cùng logic 3 khoảng cách:

- **ここ** — *ở đây*
- **そこ** — *ở đó*
- **あそこ** — *ở kia*
- **どこ** — *ở đâu*

### Ví dụ

- ここは しょくどう です。 → *Ở đây là nhà ăn.*
- でんわは どこ ですか。 → *Điện thoại ở đâu?*

## 2. こちら・そちら・あちら・どちら

Dạng **lịch sự hơn**, dùng cho địa điểm hoặc người (thay tên người tôn trọng):

- こちらは やまださんです。 → *Đây là anh Yamada.*
- あの ぎんこうは どちらの ぎんこうですか。 → *Ngân hàng kia là ngân hàng nào (của hãng nào)?*

## 3. Mẫu \`N1 は N2 です\` với địa điểm

- トイレは あそこ です。 → *Nhà vệ sinh ở đằng kia.*
- やまださんは じむしょ です。 → *Anh Yamada (đang) ở văn phòng.*

## 4. Hỏi giá: \`いくら ですか\`

- これは いくら ですか。 → *Cái này bao nhiêu tiền?*
- 500 (ごひゃく) えん です。 → *500 yên.*

## 5. Số đếm 100 - 9,999

- 100: ひゃく
- 200: にひゃく … 300: **さんびゃく** (biến âm)
- 600: **ろっぴゃく**, 800: **はっぴゃく** (biến âm)
- 1,000: せん, 3,000: **さんぜん** (biến âm)

Hãy ghi nhớ các trường hợp biến âm — đây là điểm dễ sai.

---
**Sau bài này bạn sẽ làm được:** hỏi vị trí, giới thiệu người tôn trọng, hỏi giá.`,
    vocab: [
      { front: 'ここ', back: 'Ở đây', romaji: 'koko', example: 'ここは しょくどうです。' },
      { front: 'そこ', back: 'Ở đó', romaji: 'soko', example: 'そこは じむしょです。' },
      { front: 'あそこ', back: 'Ở kia', romaji: 'asoko', example: 'トイレは あそこです。' },
      { front: 'どこ', back: 'Ở đâu', romaji: 'doko', example: 'やまださんは どこですか。' },
      { front: 'こちら', back: 'Ở đây (lịch sự)', romaji: 'kochira', example: 'こちらは やまださんです。' },
      { front: 'きょうしつ', back: 'Phòng học', romaji: 'kyoushitsu', example: 'きょうしつは 2かいです。' },
      { front: 'しょくどう', back: 'Nhà ăn', romaji: 'shokudou', example: 'しょくどうは どこですか。' },
      { front: 'じむしょ', back: 'Văn phòng', romaji: 'jimusho', example: 'じむしょは あそこです。' },
      { front: 'うけつけ', back: 'Quầy lễ tân', romaji: 'uketsuke', example: 'うけつけは 1かいです。' },
      { front: 'トイレ', back: 'Nhà vệ sinh', romaji: 'toire', example: 'トイレは どこですか。' },
      { front: 'かいだん', back: 'Cầu thang', romaji: 'kaidan', example: 'かいだんは あちらです。' },
      { front: 'エレベーター', back: 'Thang máy', romaji: 'erebētā', example: 'エレベーターは あそこです。' },
      { front: 'いくら', back: 'Bao nhiêu (tiền)', romaji: 'ikura', example: 'これは いくらですか。' },
      { front: 'えん', back: 'Đồng yên', romaji: 'en', example: '500えんです。' },
      { front: 'デパート', back: 'Cửa hàng bách hóa', romaji: 'depāto', example: 'デパートは どこですか。' },
    ],
  },
  // ============================================================
  // BÀI 4 — Thời gian, động từ ます
  // ============================================================
  {
    order: 4,
    title: 'Bài 4 — Giờ giấc & Động từ thể ます',
    summary: 'Hỏi giờ, động từ ます, thời gian xuất hiện trong câu.',
    theoryMd: `# Bài 4 — Giờ giấc & Động từ thể ます

## 1. Hỏi giờ: \`いま 何時 (なんじ) ですか\`

- いま 9じ です。 → *Bây giờ là 9 giờ.*
- いま 9じ 15ふん です。 → *Bây giờ là 9 giờ 15 phút.*

### Cách đọc giờ (lưu ý biến âm)

- 1じ ichi-ji, 2じ ni-ji, **3じ san-ji**
- **4じ yo-ji** (không phải yon/shi)
- **7じ shichi-ji**, **9じ ku-ji**

### Phút (ふん / ぷん)

- 1ぷん **ip**-pun, 3ぷん **san**-pun, **4ぷん yon-pun**
- 6ぷん **rop**-pun, 8ぷん **hap**-pun (hoặc hachi-fun), 10ぷん **jup**-pun

## 2. Mẫu \`N (giờ) に〜ます\`

Trợ từ **に** đứng sau **giờ cụ thể**, chỉ thời điểm hành động xảy ra.

- 7じ に おきます。 → *7 giờ thức dậy.*
- 11じ に ねます。 → *11 giờ đi ngủ.*

## 3. Thể \`〜ます\` của động từ

\`〜ます\` là **đuôi lịch sự** của động từ, dùng được trong mọi tình huống lịch sự.

- おきます (thức dậy)
- ねます (đi ngủ)
- べんきょうします (học bài)
- やすみます (nghỉ)
- はたらきます (làm việc)

### Phủ định: \`〜ません\`

- きょう べんきょうしません。 → *Hôm nay không học bài.*

### Quá khứ: \`〜ました\` / \`〜ませんでした\`

- きのう 7じに おきました。 → *Hôm qua tôi thức dậy lúc 7 giờ.*
- きのう やすみませんでした。 → *Hôm qua tôi đã không nghỉ.*

## 4. \`〜から〜まで\`

- 9じ **から** 5じ **まで** はたらきます。 → *Tôi làm việc từ 9 đến 5 giờ.*

## 5. Thứ trong tuần

げつようび (T2), かようび (T3), すいようび (T4), もくようび (T5), きんようび (T6), どようび (T7), にちようび (CN)

---
**Sau bài này bạn sẽ làm được:** kể được lịch sinh hoạt một ngày bằng động từ thể \`ます\`.`,
    vocab: [
      { front: 'おきます', back: 'Thức dậy', romaji: 'okimasu', example: '7じに おきます。' },
      { front: 'ねます', back: 'Đi ngủ', romaji: 'nemasu', example: '11じに ねます。' },
      { front: 'はたらきます', back: 'Làm việc', romaji: 'hatarakimasu', example: '9じから 5じまで はたらきます。' },
      { front: 'べんきょうします', back: 'Học bài', romaji: 'benkyou shimasu', example: 'まいにち にほんごを べんきょうします。' },
      { front: 'やすみます', back: 'Nghỉ ngơi', romaji: 'yasumimasu', example: 'にちようびは やすみます。' },
      { front: 'おわります', back: 'Kết thúc', romaji: 'owarimasu', example: 'じゅぎょうは 5じに おわります。' },
      { front: 'いま', back: 'Bây giờ', romaji: 'ima', example: 'いま なんじですか。' },
      { front: 'なんじ', back: 'Mấy giờ', romaji: 'nan-ji', example: 'いま なんじですか。' },
      { front: 'ごぜん', back: 'Sáng (AM)', romaji: 'gozen', example: 'ごぜん 9じです。' },
      { front: 'ごご', back: 'Chiều (PM)', romaji: 'gogo', example: 'ごご 3じです。' },
      { front: 'あさ', back: 'Buổi sáng', romaji: 'asa', example: 'あさ 6じに おきます。' },
      { front: 'ばん／よる', back: 'Buổi tối / đêm', romaji: 'ban / yoru', example: 'ばん 11じに ねます。' },
      { front: 'きょう', back: 'Hôm nay', romaji: 'kyou', example: 'きょうは げつようびです。' },
      { front: 'きのう', back: 'Hôm qua', romaji: 'kinou', example: 'きのう やすみませんでした。' },
      { front: 'あした', back: 'Ngày mai', romaji: 'ashita', example: 'あした 9じに きます。' },
    ],
  },
  // ============================================================
  // BÀI 5 — Động từ di chuyển + へ
  // ============================================================
  {
    order: 5,
    title: 'Bài 5 — Động từ di chuyển (いきます／きます／かえります)',
    summary: 'Trợ từ へ chỉ hướng, で chỉ phương tiện, と cùng với ai.',
    theoryMd: `# Bài 5 — Đi lại

## 1. \`〜へ いきます／きます／かえります\`

Bộ ba động từ di chuyển cơ bản:

- **いきます** (ikimasu) — *đi*
- **きます** (kimasu) — *đến*
- **かえります** (kaerimasu) — *về*

Trợ từ **\`へ\`** (đọc là **e**) đứng sau **địa điểm đích**.

- きょう がっこう へ いきます。 → *Hôm nay tôi đi học.*
- 6じに うち へ かえります。 → *6 giờ tôi về nhà.*

## 2. Phương tiện: \`〜で〜へ いきます\`

Trợ từ **\`で\`** đứng sau **phương tiện**.

- でんしゃ **で** とうきょう **へ** いきます。 → *Đi tàu điện đến Tokyo.*
- バス で がっこう へ いきます。 → *Đi xe buýt đến trường.*

### Ngoại lệ: **あるいて** (đi bộ)

Không dùng \`で\` cho "đi bộ":

- あるいて かえります。 → *Đi bộ về.*

## 3. Cùng với ai: \`〜と〜へ〜\`

- ともだち と デパートへ いきます。 → *Đi với bạn tới cửa hàng bách hóa.*
- ひとり で いきます。 → *Đi một mình.* (lưu ý \`ひとりで\` là cụm cố định)

## 4. Hỏi địa điểm: \`どこ へ いきますか\`

- きのう どこへ いきましたか。 — *Hôm qua bạn đã đi đâu?*
- どこ(へ) も いきませんでした。 → *Tôi đã không đi đâu cả.*

(\`どこも \` + phủ định = "không đâu cả")

## 5. Thời điểm tương đối

- きのう (hôm qua), きょう (hôm nay), あした (ngày mai)
- せんしゅう (tuần trước), こんしゅう (tuần này), らいしゅう (tuần sau)
- せんげつ (tháng trước), こんげつ (tháng này), らいげつ (tháng sau)
- きょねん (năm ngoái), ことし (năm nay), らいねん (năm sau)

---
**Sau bài này bạn sẽ làm được:** kể được mình đi đâu, bằng gì, với ai, khi nào.`,
    vocab: [
      { front: 'いきます', back: 'Đi', romaji: 'ikimasu', example: 'がっこうへ いきます。' },
      { front: 'きます', back: 'Đến', romaji: 'kimasu', example: 'にほんへ きました。' },
      { front: 'かえります', back: 'Về', romaji: 'kaerimasu', example: '6じに うちへ かえります。' },
      { front: 'でんしゃ', back: 'Tàu điện', romaji: 'densha', example: 'でんしゃで いきます。' },
      { front: 'ちかてつ', back: 'Tàu điện ngầm', romaji: 'chikatetsu', example: 'ちかてつで しんじゅくへ いきます。' },
      { front: 'バス', back: 'Xe buýt', romaji: 'basu', example: 'バスで がっこうへ いきます。' },
      { front: 'タクシー', back: 'Taxi', romaji: 'takushī', example: 'タクシーで かえります。' },
      { front: 'じてんしゃ', back: 'Xe đạp', romaji: 'jitensha', example: 'じてんしゃで きました。' },
      { front: 'あるいて', back: 'Đi bộ', romaji: 'aruite', example: 'あるいて かえります。' },
      { front: 'ともだち', back: 'Bạn bè', romaji: 'tomodachi', example: 'ともだちと いきます。' },
      { front: 'ひとりで', back: 'Một mình', romaji: 'hitori de', example: 'ひとりで いきます。' },
      { front: 'うち', back: 'Nhà mình', romaji: 'uchi', example: 'うちへ かえります。' },
      { front: 'がっこう', back: 'Trường học', romaji: 'gakkou', example: 'まいにち がっこうへ いきます。' },
      { front: 'らいしゅう', back: 'Tuần sau', romaji: 'raishuu', example: 'らいしゅう にほんへ いきます。' },
      { front: 'せんしゅう', back: 'Tuần trước', romaji: 'senshuu', example: 'せんしゅう ともだちと いきました。' },
    ],
  },
];
