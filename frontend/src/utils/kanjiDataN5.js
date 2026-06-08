/**
 * Database static cho các chữ Kanji N5 cơ bản.
 * Cung cấp bộ thủ, câu chuyện liên tưởng và từ ghép mẫu (Jukugo).
 */

const KANJI_N5_DATABASE = {
  '一': {
    radicals: ['一'],
    radicalExplanation: 'Bộ Nhất (一) - số một',
    mnemonic: 'Chỉ cần một đường gạch ngang duy nhất là viết xong chữ một.',
    jukugo: [
      { word: '一つ', reading: 'ひとつ', meaning: 'Một cái' },
      { word: '一人', reading: 'ひとり', meaning: 'Một người' },
      { word: '一日', reading: 'ついたち / いちにち', meaning: 'Ngày mùng 1 / Một ngày' }
    ]
  },
  '二': {
    radicals: ['二'],
    radicalExplanation: 'Bộ Nhị (二) - số hai',
    mnemonic: 'Vẽ thêm một gạch ngang nữa dưới nét gạch thứ nhất để biểu thị số hai.',
    jukugo: [
      { word: '二つ', reading: 'ふたつ', meaning: 'Hai cái' },
      { word: '二人', reading: 'ふたり', meaning: 'Hai người' },
      { word: '二日', reading: 'ふつか', meaning: 'Ngày mùng 2 / Hai ngày' }
    ]
  },
  '三': {
    radicals: ['三'],
    radicalExplanation: 'Bộ Tam (三) - số ba',
    mnemonic: 'Ba đường gạch song song xếp chồng lên nhau biểu thị số ba.',
    jukugo: [
      { word: '三つ', reading: 'みっつ', meaning: 'Ba cái' },
      { word: '三人', reading: 'さんにん', meaning: 'Ba người' },
      { word: '三日', reading: 'みっか', meaning: 'Ngày mùng 3 / Ba ngày' }
    ]
  },
  '四': {
    radicals: ['囗', '儿'],
    radicalExplanation: 'Bộ Vi (囗) - vây quanh + Bộ Nhân (儿) - đôi chân',
    mnemonic: 'Bốn bức tường vây quanh (囗) đôi chân (儿) đang di chuyển.',
    jukugo: [
      { word: '四つ', reading: 'よっつ', meaning: 'Bốn cái' },
      { word: '四人', reading: 'よにん', meaning: 'Bốn người' },
      { word: '四日', reading: 'よっか', meaning: 'Ngày mùng 4 / Bốn ngày' }
    ]
  },
  '五': {
    radicals: ['二', '乂'],
    radicalExplanation: 'Bộ Nhị (二) - hai gạch + Bộ Xoa (乂) - dấu chéo',
    mnemonic: 'Số 5 giống như hai (二) ngón tay bắt chéo (乂) lại với nhau.',
    jukugo: [
      { word: '五つ', reading: 'いつつ', meaning: 'Năm cái' },
      { word: '五人', reading: 'ごにん', meaning: 'Năm người' },
      { word: '五日', reading: 'いつか', meaning: 'Ngày mùng 5 / Năm ngày' }
    ]
  },
  '六': {
    radicals: ['亠', '八'],
    radicalExplanation: 'Bộ Đầu (亠) - nét chấm ở trên + Bộ Bát (八) - số tám',
    mnemonic: 'Đội mũ (亠) lên đầu rồi mở rộng hai chân ra như số tám (八) là số sáu.',
    jukugo: [
      { word: '六つ', reading: 'むっつ', meaning: 'Sáu cái' },
      { word: '六人', reading: 'ろくにん', meaning: 'Sáu người' },
      { word: '六日', reading: 'むいか', meaning: 'Ngày mùng 6 / Sáu ngày' }
    ]
  },
  '七': {
    radicals: ['一'],
    radicalExplanation: 'Bộ Nhất (一) quay ngược lại nét gạch đứng',
    mnemonic: 'Chữ số 7 lộn ngược phần móc dưới lên giống như nét vẽ này.',
    jukugo: [
      { word: '七つ', reading: 'ななつ', meaning: 'Bảy cái' },
      { word: '七人', reading: 'しちにん / ななにん', meaning: 'Bảy người' },
      { word: '七日', reading: 'なのか', meaning: 'Ngày mùng 7 / Bảy ngày' }
    ]
  },
  '八': {
    radicals: ['八'],
    radicalExplanation: 'Bộ Bát (八) - xòe ra hai bên',
    mnemonic: 'Hai nét vẽ đối xứng như hai làn khói lan rộng ra hai bên chỉ số tám.',
    jukugo: [
      { word: '八つ', reading: 'やっつ', meaning: 'Tám cái' },
      { word: '八人', reading: 'はちにん', meaning: 'Tám người' },
      { word: '八日', reading: 'ようか', meaning: 'Ngày mùng 8 / Tám ngày' }
    ]
  },
  '九': {
    radicals: ['乙'],
    radicalExplanation: 'Bộ Ất (乙) - uốn éo',
    mnemonic: 'Chữ cửu (九) vẽ cong và kéo lên giống như cái móc câu uốn éo.',
    jukugo: [
      { word: '九つ', reading: 'ここのつ', meaning: 'Chín cái' },
      { word: '九人', reading: 'きゅうにん / くにん', meaning: 'Chín người' },
      { word: '九日', reading: 'ここのか', meaning: 'Ngày mùng 9 / Chín ngày' }
    ]
  },
  '十': {
    radicals: ['十'],
    radicalExplanation: 'Bộ Thập (十) - hình chữ thập',
    mnemonic: 'Hình chữ thập nối liền dọc và ngang thể hiện sự đầy đủ, trọn vẹn (số mười).',
    jukugo: [
      { word: '十', reading: 'とお / じゅう', meaning: 'Mười cái / Số mười' },
      { word: '十日', reading: 'とおか', meaning: 'Ngày mùng 10 / Mười ngày' },
      { word: '十分', reading: 'じゅうぶん', meaning: 'Đầy đủ, sung túc' }
    ]
  },
  '百': {
    radicals: ['一', '白'],
    radicalExplanation: 'Bộ Nhất (一) - một + Bộ Bạch (白) - màu trắng',
    mnemonic: 'Đặt một (一) gạch ngang trên chữ Bạch (白 - trắng) để tạo ra chữ Bách (100).',
    jukugo: [
      { word: '三百', reading: 'さんびゃく', meaning: 'Ba trăm' },
      { word: '六百', reading: 'ろっぴゃく', meaning: 'Sáu trăm' },
      { word: '八百', reading: 'はっぴゃく', meaning: 'Tám trăm' }
    ]
  },
  '千': {
    radicals: ['一', '十'],
    radicalExplanation: 'Nét phẩy chéo + Bộ Thập (十) - mười',
    mnemonic: 'Chữ Thập (十) có thêm một nét gạch chéo ở đầu tượng trưng cho Thiên (1000).',
    jukugo: [
      { word: '千円', reading: 'せんえん', meaning: 'Một ngàn yên' },
      { word: '三千', reading: 'さんぜん', meaning: 'Ba ngàn' },
      { word: '千葉県', reading: 'ちばけん', meaning: 'Tỉnh Chiba' }
    ]
  },
  '万': {
    radicals: ['一', '勹'],
    radicalExplanation: 'Bộ Nhất (一) - một + Bộ Bao (勹) - bao bọc',
    mnemonic: 'Số 10,000 (Vạn) được gói bọc cẩn thận như tiền cất vào rương.',
    jukugo: [
      { word: '一万円', reading: 'いちまんえん', meaning: 'Mười ngàn yên' },
      { word: '万歳', reading: 'ばんざい', meaning: 'Vạn tuế (Banzai!)' },
      { word: '万国', reading: 'ばんこく', meaning: 'Vạn quốc, mọi quốc gia' }
    ]
  },
  '円': {
    radicals: ['冂', '儿'],
    radicalExplanation: 'Bộ Quynh (冂) - biên giới + Bộ Nhân (儿) - đôi chân',
    mnemonic: 'Đồng tiền yên Nhật tròn trịa có đường bao quanh (冂) và các nét bên trong.',
    jukugo: [
      { word: '百円', reading: 'ひゃくえん', meaning: 'Một trăm yên' },
      { word: '円い', reading: 'まるい', meaning: 'Tròn' },
      { word: '円高', reading: 'えんだか', meaning: 'Yên lên giá' }
    ]
  },
  '日': {
    radicals: ['日'],
    radicalExplanation: 'Bộ Nhật (日) - mặt trời, ngày',
    mnemonic: 'Hình ảnh mặt trời tròn có tia sáng ở giữa, sau này được viết vuông thành chữ Nhật.',
    jukugo: [
      { word: '日本', reading: 'にほん / にっぽん', meaning: 'Nhật Bản' },
      { word: '日曜日', reading: 'にちようび', meaning: 'Chủ nhật' },
      { word: '毎日', reading: 'まいにち', meaning: 'Mỗi ngày' }
    ]
  },
  '月': {
    radicals: ['月'],
    radicalExplanation: 'Bộ Nguyệt (月) - mặt trăng, tháng',
    mnemonic: 'Hình ảnh vầng trăng khuyết có các đám mây vắt ngang ở giữa.',
    jukugo: [
      { word: '月曜日', reading: 'げつようび', meaning: 'Thứ hai' },
      { word: '一月', reading: 'いちがつ', meaning: 'Tháng một' },
      { word: '毎月', reading: 'まいつき', meaning: 'Mỗi tháng' }
    ]
  },
  '火': {
    radicals: ['火'],
    radicalExplanation: 'Bộ Hỏa (火) - ngọn lửa',
    mnemonic: 'Hình ảnh ngọn lửa bùng cháy đang bốc lên với hai tia lửa bắn sang hai bên.',
    jukugo: [
      { word: '火曜日', reading: 'かようび', meaning: 'Thứ ba' },
      { word: '火山', reading: 'かざん', meaning: 'Núi lửa' },
      { word: '火事', reading: 'かじ', meaning: 'Hỏa hoạn' }
    ]
  },
  '水': {
    radicals: ['水'],
    radicalExplanation: 'Bộ Thủy (水) - dòng nước',
    mnemonic: 'Hình ảnh dòng sông chảy ở giữa với các bọt nước bắn ra xung quanh.',
    jukugo: [
      { word: '水曜日', reading: 'すいようび', meaning: 'Thứ tư' },
      { word: '水', reading: 'みず', meaning: 'Nước' },
      { word: '水道', reading: 'すいどう', meaning: 'Nước máy, đường ống nước' }
    ]
  },
  '木': {
    radicals: ['木'],
    radicalExplanation: 'Bộ Mộc (木) - cây cối',
    mnemonic: 'Hình vẽ thân cây có cành lá xòe ngang và rễ cắm sâu xuống đất.',
    jukugo: [
      { word: '木曜日', reading: 'もくようび', meaning: 'Thứ năm' },
      { word: '木', reading: 'き', meaning: 'Cái cây' },
      { word: '木々', reading: 'きぎ', meaning: 'Nhiều cây cối' }
    ]
  },
  '金': {
    radicals: ['金'],
    radicalExplanation: 'Bộ Kim (金) - vàng, tiền bạc',
    mnemonic: 'Dưới mái nhà có các thỏi vàng quý giá lấp lánh chôn dưới lòng đất.',
    jukugo: [
      { word: '金曜日', reading: 'きんようび', meaning: 'Thứ sáu' },
      { word: 'お金', reading: 'おかね', meaning: 'Tiền bạc' },
      { word: '金メダル', reading: 'きんめだる', meaning: 'Huy chương vàng' }
    ]
  },
  '土': {
    radicals: ['土'],
    radicalExplanation: 'Bộ Thổ (土) - đất cát',
    mnemonic: 'Mầm cây nhỏ đang vươn lên từ mặt đất cát phẳng.',
    jukugo: [
      { word: '土曜日', reading: 'どようび', meaning: 'Thứ bảy' },
      { word: '土', reading: 'つち', meaning: 'Đất' },
      { word: '土地', reading: 'とち', meaning: 'Đất đai, khu đất' }
    ]
  },
  '山': {
    radicals: ['山'],
    radicalExplanation: 'Bộ Sơn (山) - núi non',
    mnemonic: 'Hình vẽ ba ngọn núi nhấp nhô đứng cạnh nhau.',
    jukugo: [
      { word: '山', reading: 'やま', meaning: 'Núi' },
      { word: '富士山', reading: 'ふじさん', meaning: 'Núi Phú Sĩ' },
      { word: '山林', reading: 'さんりん', meaning: 'Sơn lâm, rừng núi' }
    ]
  },
  '川': {
    radicals: ['巛'],
    radicalExplanation: 'Bộ Xuyên (川) - dòng sông',
    mnemonic: 'Ba nét vẽ biểu thị các dòng nước chảy song song của con sông.',
    jukugo: [
      { word: '川', reading: 'かわ', meaning: 'Sông' },
      { word: '小川', reading: 'おがわ', meaning: 'Rạch nước nhỏ, suối nhỏ' },
      { word: '荒川', reading: 'あらかわ', meaning: 'Sông Arakawa (ở Tokyo)' }
    ]
  },
  '田': {
    radicals: ['田'],
    radicalExplanation: 'Bộ Điền (田) - ruộng lúa',
    mnemonic: 'Thửa ruộng được chia thành bốn ô vuông nhỏ nhờ các bờ đất ở giữa.',
    jukugo: [
      { word: '田んぼ', reading: 'たんぼ', meaning: 'Cánh đồng lúa' },
      { word: '山田さん', reading: 'やまださん', meaning: 'Anh/Chị Yamada' },
      { word: '水田', reading: 'すいでん', meaning: 'Ruộng nước' }
    ]
  },
  '口': {
    radicals: ['口'],
    radicalExplanation: 'Bộ Khẩu (口) - cái miệng',
    mnemonic: 'Hình vẽ chiếc miệng há rộng khi nói.',
    jukugo: [
      { word: '口', reading: 'くち', meaning: 'Cái miệng' },
      { word: '入口', reading: 'いりぐち', meaning: 'Lối vào' },
      { word: '出口', reading: 'でぐち', meaning: 'Lối ra' }
    ]
  },
  '人': {
    radicals: ['人'],
    radicalExplanation: 'Bộ Nhân (人) - con người',
    mnemonic: 'Hình vẽ một người đang đứng nghiêng, chống hai chân vững chãi xuống đất.',
    jukugo: [
      { word: '日本人', reading: 'にほんじん', meaning: 'Người Nhật' },
      { word: '三人', reading: 'さんにん', meaning: 'Ba người' },
      { word: '大人', reading: 'おとな', meaning: 'Người lớn' }
    ]
  },
  '子': {
    radicals: ['子'],
    radicalExplanation: 'Bộ Tử (子) - đứa con',
    mnemonic: 'Hình vẽ một đứa trẻ sơ sinh đang quấn tã, dang rộng hai tay ra.',
    jukugo: [
      { word: '子ども', reading: 'こども', meaning: 'Trẻ em, con cái' },
      { word: '電子', reading: 'でんし', meaning: 'Điện tử' },
      { word: '様子', reading: 'ようす', meaning: 'Tình trạng, vẻ bề ngoài' }
    ]
  },
  '手': {
    radicals: ['手'],
    radicalExplanation: 'Bộ Thủ (手) - bàn tay',
    mnemonic: 'Hình vẽ bàn tay xòe ra với các ngón tay mảnh khảnh.',
    jukugo: [
      { word: '手', reading: 'て', meaning: 'Bàn tay' },
      { word: '上手', reading: 'じょうず', meaning: 'Giỏi, khéo léo' },
      { word: '下手', reading: 'へた', meaning: 'Dở, kém cỏi' }
    ]
  },
  '目': {
    radicals: ['目'],
    radicalExplanation: 'Bộ Mục (目) - mắt',
    mnemonic: 'Hình vẽ con mắt được xoay dọc lại để dễ viết.',
    jukugo: [
      { word: '目', reading: 'め', meaning: 'Con mắt' },
      { word: '一日目', reading: 'いちにちめ', meaning: 'Ngày thứ nhất' },
      { word: '目的', reading: 'もくてき', meaning: 'Mục đích' }
    ]
  },
  '耳': {
    radicals: ['耳'],
    radicalExplanation: 'Bộ Nhĩ (耳) - tai',
    mnemonic: 'Hình vẽ chiếc tai người với vành tai và dái tai.',
    jukugo: [
      { word: '耳', reading: 'みみ', meaning: 'Cái tai' },
      { word: '耳鼻科', reading: 'じびか', meaning: 'Khoa tai mũi họng' }
    ]
  },
  '足': {
    radicals: ['足'],
    radicalExplanation: 'Bộ Túc (足) - chân',
    mnemonic: 'Phần trên là đầu gối, phần dưới là bàn chân đang đứng trên mặt đất.',
    jukugo: [
      { word: '足', reading: 'あし', meaning: 'Cái chân' },
      { word: '足りる', reading: 'たりる', meaning: 'Đầy đủ, đủ dùng' },
      { word: '遠足', reading: 'えんそく', meaning: 'Dã ngoại, đi chơi xa' }
    ]
  },
  '上': {
    radicals: ['一'],
    radicalExplanation: 'Bộ Nhất (一) làm chuẩn mực nền đất',
    mnemonic: 'Có một điểm nằm ở phía trên (上) vạch nằm ngang chỉ mặt đất.',
    jukugo: [
      { word: '上', reading: 'うえ', meaning: 'Phía trên' },
      { word: '上げる', reading: 'あげる', meaning: 'Nâng lên, tăng lên' },
      { word: '上着', reading: 'うわぎ', meaning: 'Áo khoác ngoài' }
    ]
  },
  '下': {
    radicals: ['一'],
    radicalExplanation: 'Bộ Nhất (一) làm chuẩn mực mặt đất',
    mnemonic: 'Có một vật treo/nằm ở phía dưới (下) vạch nằm ngang chỉ mặt đất.',
    jukugo: [
      { word: '下', reading: 'した', meaning: 'Phía dưới' },
      { word: '下げる', reading: 'さげる', meaning: 'Hạ xuống, giảm xuống' },
      { word: '地下鉄', reading: 'ちかてつ', meaning: 'Tàu điện ngầm' }
    ]
  },
  '左': {
    radicals: ['𠂇', '工'],
    radicalExplanation: 'Bộ Tả (𠂇) - bàn tay trái + Bộ Công (工) - công cụ làm việc',
    mnemonic: 'Tay trái (𠂇) cầm thước công cụ (工) trợ giúp công việc.',
    jukugo: [
      { word: '左', reading: 'ひだり', meaning: 'Bên trái' },
      { word: '左折', reading: 'させつ', meaning: 'Rẽ trái' },
      { word: '左右', reading: 'さゆう', meaning: 'Tả hữu, trái phải' }
    ]
  },
  '右': {
    radicals: ['𠂇', '口'],
    radicalExplanation: 'Bộ Hữu (𠂇) - bàn tay phải + Bộ Khẩu (口) - cái miệng',
    mnemonic: 'Tay phải (𠂇) cầm thức ăn đưa vào miệng (口) ăn.',
    jukugo: [
      { word: '右', reading: 'みぎ', meaning: 'Bên phải' },
      { word: '右折', reading: 'うせつ', meaning: 'Rẽ phải' },
      { word: '右手', reading: 'みぎて', meaning: 'Tay phải' }
    ]
  },
  '中': {
    radicals: ['丨', '口'],
    radicalExplanation: 'Nét sổ dọc (丨) xuyên qua Bộ Khẩu (口) ở giữa',
    mnemonic: 'Vẽ một nét thẳng đứng xuyên thẳng qua chính giữa (中) của cái hộp.',
    jukugo: [
      { word: '中', reading: 'なか', meaning: 'Bên trong' },
      { word: '一日中', reading: 'いちにちじゅう', meaning: 'Suốt cả ngày' },
      { word: '中国', reading: 'ちゅうごく', meaning: 'Trung Quốc' }
    ]
  },
  '外': {
    radicals: ['夕', '卜'],
    radicalExplanation: 'Bộ Tịch (夕) - buổi tối + Bộ Bốc (卜) - xem bói',
    mnemonic: 'Buổi tối (夕) chạy ra ngoài (外) xem bói toán (卜).',
    jukugo: [
      { word: '外', reading: 'そと', meaning: 'Bên ngoài' },
      { word: '外国', reading: 'がいこく', meaning: 'Nước ngoài' },
      { word: '外科', reading: 'げか', meaning: 'Khoa ngoại' }
    ]
  },
  '前': {
    radicals: ['丷', '一', '月', '刂'],
    radicalExplanation: 'Bộ Nhục (月) - xác thịt + Bộ Đao (刂) - con dao',
    mnemonic: 'Trước (前) khi lên bàn mổ, dùng dao (刂) xử lý vết thương trên da thịt (月).',
    jukugo: [
      { word: '前', reading: 'まえ', meaning: 'Phía trước' },
      { word: '名前', reading: 'なまえ', meaning: 'Tên gọi' },
      { word: '午前', reading: 'ごぜん', meaning: 'Buổi sáng (AM)' }
    ]
  },
  '後': {
    radicals: ['彳', '幺', '夂'],
    radicalExplanation: 'Bộ Xích (彳) - bước ngắn + Bộ Yêu (幺) - nhỏ bé + Bộ Truy (夂) - đi chậm',
    mnemonic: 'Dắt sợi dây nhỏ (幺) đi bộ chậm rãi (夂) ở phía sau (後) trên đường đi (彳).',
    jukugo: [
      { word: '後ろ', reading: 'うしろ', meaning: 'Phía sau' },
      { word: '午後', reading: 'ごご', meaning: 'Buổi chiều (PM)' },
      { word: '最後', reading: 'さいご', meaning: 'Cuối cùng' }
    ]
  },
  '安': {
    radicals: ['宀', '女'],
    radicalExplanation: 'Bộ Miên (宀) - mái nhà + Bộ Nữ (女) - phụ nữ',
    mnemonic: 'Người phụ nữ (女) ở dưới mái nhà (宀) thì luôn yên AN, an tâm.',
    jukugo: [
      { word: '安い', reading: 'やすい', meaning: 'Rẻ' },
      { word: '安全', reading: 'あんぜん', meaning: 'An toàn' },
      { word: '安心', reading: 'あんしん', meaning: 'An tâm' }
    ]
  },
  '高': {
    radicals: ['高'],
    radicalExplanation: 'Bộ Cao (高) - cao ráo',
    mnemonic: 'Hình vẽ một tòa lâu đài cao tầng có cổng và mái lầu nhô cao.',
    jukugo: [
      { word: '高い', reading: 'たかい', meaning: 'Cao, đắt' },
      { word: '高校', reading: 'こうこう', meaning: 'Trường THPT' },
      { word: '最高', reading: 'さいこう', meaning: 'Tuyệt vời nhất, tối cao' }
    ]
  },
  '新': {
    radicals: ['立', '木', '斤'],
    radicalExplanation: 'Bộ Lập (立) - đứng + Bộ Mộc (木) - cây + Bộ Cân (斤) - cây rìu',
    mnemonic: 'Đứng (立) cầm rìu (斤) chặt cây gỗ (木) để làm nhà MỚI.',
    jukugo: [
      { word: '新しい', reading: 'あたらしい', meaning: 'Mới' },
      { word: '新聞', reading: 'しんぶん', meaning: 'Tờ báo' },
      { word: '新年', reading: 'しんねん', meaning: 'Năm mới' }
    ]
  },
  '古': {
    radicals: ['十', '口'],
    radicalExplanation: 'Bộ Thập (十) - mười + Bộ Khẩu (口) - cái miệng',
    mnemonic: 'Lời nói truyền qua mười (十) cái miệng (口) thì trở nên CỔ xưa.',
    jukugo: [
      { word: '古い', reading: 'ふるい', meaning: 'Cũ kỹ' },
      { word: '中古', reading: 'ちゅうこ', meaning: 'Hàng đã qua sử dụng' },
      { word: '古代', reading: 'こだい', meaning: 'Thời cổ đại' }
    ]
  },
  '学': {
    radicals: ['子'],
    radicalExplanation: 'Bộ Tử (子) - đứa con dưới mái trường',
    mnemonic: 'Đứa trẻ (子) dưới mái trường đang hăng say HỌC tập tích lũy kiến thức.',
    jukugo: [
      { word: '学生', reading: 'がくせい', meaning: 'Học sinh, sinh viên' },
      { word: '学校', reading: 'がっこう', meaning: 'Trường học' },
      { word: '大学', reading: 'だいがく', meaning: 'Trường đại học' }
    ]
  },
  '校': {
    radicals: ['木', '交'],
    radicalExplanation: 'Bộ Mộc (木) - cây cối + Bộ Giao (交) - giao lưu',
    mnemonic: 'Trường học (校) được dựng bằng gỗ (木) là nơi học sinh giao lưu (交) bạn bè.',
    jukugo: [
      { word: '学校', reading: 'がっこう', meaning: 'Trường học' },
      { word: '高校', reading: 'こうこう', meaning: 'Trường THPT' },
      { word: '校長', reading: 'こうちょう', meaning: 'Hiệu trưởng' }
    ]
  },
  '生': {
    radicals: ['生'],
    radicalExplanation: 'Bộ Sinh (生) - sinh ra, sống',
    mnemonic: 'Mầm cây non sinh trưởng vươn lên phát triển mạnh mẽ từ mặt đất.',
    jukugo: [
      { word: '先生', reading: 'せんせい', meaning: 'Thầy cô giáo, bác sĩ' },
      { word: '生きる', reading: 'いきる', meaning: 'Sống, tồn tại' },
      { word: '誕生日', reading: 'たんじょうび', meaning: 'Ngày sinh nhật' }
    ]
  }
};

/**
 * Trả về dữ liệu Kanji chi tiết.
 * Nếu không có trong database N5, tạo dữ liệu fallback tự động.
 * 
 * @param {string} kanjiChar - Chữ Kanji đơn (ví dụ: '安')
 * @returns {object} Dữ liệu cấu trúc bộ thủ, câu chuyện và từ ghép
 */
export function getKanjiData(kanjiChar) {
  if (!kanjiChar || kanjiChar.length === 0) return null;
  const char = kanjiChar[0]; // Chỉ lấy ký tự đầu tiên
  
  if (KANJI_N5_DATABASE[char]) {
    return KANJI_N5_DATABASE[char];
  }
  
  // Dữ liệu fallback cho các cấp độ khác
  return {
    radicals: [],
    radicalExplanation: 'Đang cập nhật bộ thủ cho chữ này...',
    mnemonic: 'Đang cập nhật câu chuyện liên tưởng Hán tự...',
    jukugo: [
      { word: `${char}語`, reading: '...', meaning: `Từ ghép chứa chữ ${char}` }
    ]
  };
}
