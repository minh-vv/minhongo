import { DIALOGUES_N2 } from './ListeningDataN2';

// ==========================================
// 1. DATA ĐOẠN HỘI THOẠI (DIALOGUE SEEDS)
// ==========================================
const DIALOGUES_STATIC = [
  {
    id: 'diag-1',
    level: 'N5',
    title: 'Gặp gỡ lần đầu (はじめての挨拶)',
    description: 'Học cách chào hỏi, giới thiệu bản thân và hỏi nghề nghiệp cơ bản.',
    lines: [
      { speaker: 'A', name: 'Tanaka', text: 'はじめまして。田中です。どうぞよろしく。', romaji: 'hajimemashite. tanaka desu. douzo yoroshiku.', translation: 'Rất vui được gặp bạn. Tôi là Tanaka. Rất mong nhận được sự giúp đỡ.' },
      { speaker: 'B', name: 'Mike', text: 'はじめまして。マイクです。アメリカ từ 来ました。どうぞよろしく。', romaji: 'hajimemashite. maiku desu. amerika kara kimashita. douzo yoroshiku.', translation: 'Rất vui được gặp bạn. Tôi là Mike. Tôi đến từ Mỹ. Rất mong nhận được sự giúp đỡ.' },
      { speaker: 'A', name: 'Tanaka', text: 'マイクさんは学生ですか。', romaji: 'maiku-san wa gakusei desu ka.', translation: 'Anh Mike có phải là học sinh không?' },
      { speaker: 'B', name: 'Mike', text: 'いいえ、学生じゃありません。会社員です。IMCの社員です。', romaji: 'iie, gakusei ja arimasen. kaishain desu. aiemushii no shain desu.', translation: 'Không, tôi không phải là học sinh. Tôi là nhân viên công ty. Nhân viên của IMC.' },
    ],
    questions: [
      {
        question: 'マイクさんはどこの国から来ましたか。(Anh Mike đến từ nước nào?)',
        options: ['日本 (Nhật Bản)', 'ベトナム (Việt Nam)', 'アメリカ (Mỹ)', 'イギリス (Anh)'],
        answerIndex: 2,
        explanation: 'Trong hội thoại, Mike nói: "アメリカから来ました" (Tôi đến từ Mỹ).'
      },
      {
        question: 'マイクさんの職業は何ですか。(Nghề nghiệp của anh Mike là gì?)',
        options: ['学生 (Học sinh)', '先生 (Giáo viên)', '医者 (Bác sĩ)', '会社員 (Nhân viên công ty)'],
        answerIndex: 3,
        explanation: 'Mike phủ định việc làm học sinh ("学生じゃありません") và khẳng định mình là nhân viên công ty ("会社員です").'
      }
    ]
  },
  {
    id: 'diag-2',
    level: 'N5',
    title: 'Mua sắm đồ lưu niệm (お土産を買う)',
    description: 'Hỏi giá tiền và mua sắm các vật dụng thường ngày.',
    lines: [
      { speaker: 'A', name: 'Khách hàng', text: 'すみません、その時計はいくらですか。', romaji: 'sumimasen, sono tokei wa ikura desu ka.', translation: 'Xin hỏi, cái đồng hồ đó giá bao nhiêu tiền?' },
      { speaker: 'B', name: 'Nhân viên', text: 'これは 3,500円です。', romaji: 'kore wa sanzen gohyaku en desu.', translation: 'Cái này có giá 3.500 yên.' },
      { speaker: 'A', name: 'Khách hàng', text: 'じゃ、それをください。この傘もください。', romaji: 'ja, sore wo kudasai. kono kasa mo kudasai.', translation: 'Vậy thì tôi lấy cái đó. Vui lòng cho tôi lấy cả chiếc ô này nữa.' },
      { speaker: 'B', name: 'Nhân viên', text: 'ありがとうございます。傘は 1,200円です。全部で 4,700円です。', romaji: 'arigatou gozaimasu. kasa wa sen nihyaku en desu. zenbu de yonzen nanahyaku en desu.', translation: 'Xin cảm ơn quý khách. Ô có giá 1.200 yên. Tổng cộng là 4.700 yên ạ.' },
    ],
    questions: [
      {
        question: '時計はいくらですか。(Chiếc đồng hồ giá bao nhiêu?)',
        options: ['1,200円', '3,500円', '4,700円', '5,000円'],
        answerIndex: 1,
        explanation: 'Nhân viên trả lời: "これは 3,500円です" (Cái này giá 3.500 yên).'
      },
      {
        question: '買い物客は全部でいくら払いますか。(Khách mua hàng thanh toán tổng cộng bao nhiêu?)',
        options: ['3,500円', '1,200円', '4,700円', '5,700円'],
        answerIndex: 2,
        explanation: 'Tổng số tiền là giá đồng hồ (3.500 yên) cộng giá ô (1.200 yên) bằng 4.700 yên ("全部で 4,700円です").'
      }
    ]
  },
  {
    id: 'diag-3',
    level: 'N4',
    title: 'Hỏi đường ở nhà ga (駅での道案内)',
    description: 'Học cách hỏi vị trí nhà ga và ước lượng thời gian đi bộ.',
    lines: [
      { speaker: 'A', name: 'Người hỏi', text: 'あのう、すみません。駅はどこにありますか。', romaji: 'anou, sumimasen. eki wa doko ni arimasu ka.', translation: 'À, xin lỗi. Nhà ga nằm ở đâu thế ạ?' },
      { speaker: 'B', name: 'Người đi đường', text: '駅ですか。あそこのデパートの隣ですよ。', romaji: 'eki desu ka. asoko no depaato no tonari desu yo.', translation: 'Nhà ga hả? Ở ngay bên cạnh cửa hàng bách hóa đằng kia kìa.' },
      { speaker: 'A', name: 'Người hỏi', text: 'そうですか。歩いて行けますか。', romaji: 'sou desu ka. aruite ikemasu ka.', translation: 'Thế ạ? Đi bộ đến đó được không anh?' },
      { speaker: 'B', name: 'Người đi đường', text: 'はい、だいたい5分くらいですよ。すぐそこです。', romaji: 'hai, daitai gofun kurai desu yo. sugu soko desu.', translation: 'Vâng, đi bộ khoảng 5 phút thôi ạ. Ngay gần đó thôi.' },
      { speaker: 'A', name: 'Người hỏi', text: '助かりました。どうもありがとうございました。', romaji: 'tasukarimashita. doumo arigatou gozaimashita.', translation: 'May quá. Xin cảm ơn anh rất nhiều.' }
    ],
    questions: [
      {
        question: '駅はどこの隣にありますか。(Nhà ga nằm bên cạnh cái gì?)',
        options: ['銀行 (Ngân hàng)', 'デパート (Cửa hàng bách hóa)', '学校 (Trường học)', '病院 (Bệnh viện)'],
        answerIndex: 1,
        explanation: 'Người đi đường chỉ: "あそ公のデパートの隣ですよ" (Bên cạnh bách hóa kia kìa).'
      },
      {
        question: '駅からデパートまで歩いて何分かかりますか。(Từ nhà ga đi bộ mất bao lâu?)',
        options: ['3分', '5分', '10分', '15分'],
        answerIndex: 1,
        explanation: 'Họ nói mất khoảng 5 phút đi bộ ("だいたい5分くらい").'
      }
    ]
  }
];

// Merge N5/N4 static dialogues + N2 crawled dialogues
export const DIALOGUES = [...DIALOGUES_STATIC, ...DIALOGUES_N2];

// ==========================================

// 2. DATA CÂU HỌC TẬP (SENTENCE SEEDS)
// ==========================================
export const SYSTEM_SENTENCES = [
  { id: 'sent-1', level: 'N5', japanese: '私はベトナム人です。', romaji: 'watashi wa betonamujin desu.', translation: 'Tôi là người Việt Nam.', keyword: 'ベトナム人' },
  { id: 'sent-2', level: 'N5', japanese: 'これは私の本です。', romaji: 'kore wa watashi no hon desu.', translation: 'Đây là sách của tôi.', keyword: '本' },
  { id: 'sent-3', level: 'N5', japanese: 'トイレはあそこにあります。', romaji: 'toire wa asoko ni arimasu.', translation: 'Nhà vệ sinh ở đằng kia.', keyword: 'あそこ' },
  { id: 'sent-4', level: 'N5', japanese: '毎朝七時に起きます。', romaji: 'maiasa shichiji ni okimasu.', translation: 'Hằng sáng tôi thức dậy lúc 7 giờ.', keyword: '起きます' },
  { id: 'sent-5', level: 'N5', japanese: '友達と一緒にデパートへ行きます。', romaji: 'tomodachi to issho ni depaato he ikimasu.', translation: 'Tôi đi bách hóa cùng với bạn bè.', keyword: '友達' },
  { id: 'sent-6', level: 'N4', japanese: '日本語が少し話せます。', romaji: 'nihongo ga sukoshi hanasemasu.', translation: 'Tôi có thể nói được một chút tiếng Nhật.', keyword: '話せます' },
  { id: 'sent-7', level: 'N4', japanese: '雨が降ったら、旅行へ行きません。', romaji: 'ame ga futtara, ryokou he ikimasen.', translation: 'Nếu trời mưa, tôi sẽ không đi du lịch.', keyword: '旅行' },
  { id: 'sent-8', level: 'N4', japanese: '日本へ行くために、貯金しています。', romaji: 'nihon he iku tame ni, chokin shiteimasu.', translation: 'Tôi đang tiết kiệm tiền để đi Nhật Bản.', keyword: '貯金' },
  { id: 'sent-9', level: 'N3', japanese: 'もっと日本語を練習しなければならない。', romaji: 'motto nihongo wo renshuu shinakereba naranai.', translation: 'Tôi phải luyện tập tiếng Nhật nhiều hơn nữa.', keyword: '練習' },
  { id: 'sent-10', level: 'N3', japanese: '試験に合格できるように祈っています。', romaji: 'shiken ni goukaku dekiru you ni inotteimasu.', translation: 'Tôi cầu nguyện để có thể đỗ kỳ thi.', keyword: '合格' },
];
