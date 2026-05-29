import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { flashcardApi } from '../api/flashcardApi';
import { useAuth } from '../hooks/useAuth';
import {
  Mic, MicOff, Play, Pause, RotateCw, Volume2, HelpCircle,
  CheckCircle, XCircle, ChevronRight, BookOpen, Layers,
  Check, Sliders, Languages, AlertCircle, Headphones, ArrowRight
} from 'lucide-react';

// ==========================================
// 1. DATA ĐOẠN HỘI THOẠI (DIALOGUE SEEDS)
// ==========================================
const DIALOGUES = [
  {
    id: 'diag-1',
    level: 'N5',
    title: 'Gặp gỡ lần đầu (はじめての挨拶)',
    description: 'Học cách chào hỏi, giới thiệu bản thân và hỏi nghề nghiệp cơ bản.',
    lines: [
      { speaker: 'A', name: 'Tanaka', text: 'はじめまして。田中です。どうぞよろしく。', romaji: 'hajimemashite. tanaka desu. douzo yoroshiku.', translation: 'Rất vui được gặp bạn. Tôi là Tanaka. Rất mong nhận được sự giúp đỡ.' },
      { speaker: 'B', name: 'Mike', text: 'はじめまして。マイクです。アメリカから来ました。どうぞよろしく。', romaji: 'hajimemashite. maiku desu. amerika kara kimashita. douzo yoroshiku.', translation: 'Rất vui được gặp bạn. Tôi là Mike. Tôi đến từ Mỹ. Rất mong nhận được sự giúp đỡ.' },
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
        explanation: 'Người đi đường chỉ: "あそこのデパートの隣ですよ" (Bên cạnh bách hóa kia kìa).'
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

// ==========================================
// 2. DATA CÂU HỌC TẬP (SENTENCE SEEDS)
// ==========================================
const SYSTEM_SENTENCES = [
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

export default function ListeningPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dialogue'); // 'dialogue' | 'sentence' | 'shadowing'
  const [customSentence, setCustomSentence] = useState(null);
  
  // ── HOÀN CẢNH TTS ──────────────────────────────────────────
  const [speechRate, setSpeechRate] = useState(1.0); // 0.5, 0.8, 1.0
  const synth = window.speechSynthesis;

  const playTTS = (text, rateOverride) => {
    if (!synth) return;
    synth.cancel(); // Stop playing currently speaking text
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rateOverride || speechRate;
    synth.speak(utterance);
  };

  // ── THÔNG TIN DECK ──────────────────────────────────────────
  const { data: publicDecks = [] } = useQuery({
    queryKey: ['publicDecksForListening'],
    queryFn: flashcardApi.getPublicDecks,
    staleTime: 60_000,
  });

  const { data: userDecks = [] } = useQuery({
    queryKey: ['userDecksForListening'],
    queryFn: flashcardApi.getDecks,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const allDecks = useMemo(() => {
    return [...userDecks, ...publicDecks].filter(d => (d._count?.cards ?? 0) > 0);
  }, [userDecks, publicDecks]);

  // ============================================================
  // TAB 1: LUYỆN NGHE HỘI THOẠI (DIALOGUE)
  // ============================================================
  const [activeDiag, setActiveDiag] = useState(DIALOGUES[0]);
  const [showDiagJa, setShowDiagJa] = useState(true);
  const [showDiagRomaji, setShowDiagRomaji] = useState(true);
  const [showDiagVi, setShowDiagVi] = useState(true);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const playAllTimeout = useRef(null);

  // Stop auto playing when changing dialogue or tab
  useEffect(() => {
    stopAutoPlay();
  }, [activeDiag, activeTab]);

  const stopAutoPlay = () => {
    setIsPlayingAll(false);
    setCurrentLineIndex(-1);
    if (playAllTimeout.current) {
      clearTimeout(playAllTimeout.current);
      playAllTimeout.current = null;
    }
    if (synth) synth.cancel();
  };

  const startAutoPlay = () => {
    if (isPlayingAll) {
      stopAutoPlay();
      return;
    }
    setIsPlayingAll(true);
    playLine(0);
  };

  const playLine = (index) => {
    if (index >= activeDiag.lines.length) {
      setIsPlayingAll(false);
      setCurrentLineIndex(-1);
      return;
    }
    setCurrentLineIndex(index);
    const line = activeDiag.lines[index];
    
    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = 'ja-JP';
      utterance.rate = speechRate;
      
      utterance.onend = () => {
        if (isPlayingAll) {
          playAllTimeout.current = setTimeout(() => {
            playLine(index + 1);
          }, 1200); // 1.2s delay between lines
        }
      };
      
      synth.speak(utterance);
    }
  };

  // Trắc nghiệm hiểu hội thoại
  const [diagAnswers, setDiagAnswers] = useState({}); // { questionIdx: optionIdx }
  const [diagSubmitted, setDiagSubmitted] = useState(false);
  const [diagScore, setDiagScore] = useState(0);

  const handleDiagSelect = (qIdx, optIdx) => {
    if (diagSubmitted) return;
    setDiagAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitDiagQuiz = () => {
    let score = 0;
    activeDiag.questions.forEach((q, idx) => {
      if (diagAnswers[idx] === q.answerIndex) score++;
    });
    setDiagScore(score);
    setDiagSubmitted(true);
  };

  const resetDiagQuiz = () => {
    setDiagAnswers({});
    setDiagSubmitted(false);
    setDiagScore(0);
  };


  // ============================================================
  // TAB 2: NGHE ĐIỀN TỪ / CHÉP CÂU (SENTENCE PRACTICE)
  // ============================================================
  const [sentMode, setSentMode] = useState('cloze'); // 'cloze' | 'dictation'
  const [sentSource, setSentSource] = useState('system'); // 'system' | 'deck'
  const [selectedDeckId, setSelectedDeckId] = useState('');
  
  // Custom queries to fetch selected deck cards
  const { data: currentDeckData, isLoading: isLoadingDeck } = useQuery({
    queryKey: ['listeningDeckCards', selectedDeckId],
    queryFn: () => flashcardApi.getPublicDeck(selectedDeckId).catch(() => flashcardApi.getDeck(selectedDeckId)),
    enabled: !!selectedDeckId && sentSource === 'deck',
  });

  const sentences = useMemo(() => {
    if (sentSource === 'custom' && customSentence) return [customSentence];
    if (sentSource === 'system') return SYSTEM_SENTENCES;
    if (sentSource === 'deck' && currentDeckData?.cards) {
      // Convert cards having 'example' into sentence objects
      const cardsWithExamples = currentDeckData.cards.filter(c => !!c.example);
      if (cardsWithExamples.length > 0) {
        return cardsWithExamples.map((c, i) => ({
          id: `deck-sent-${c.id}`,
          level: c.jlptLevel ? `N${c.jlptLevel}` : 'Tự học',
          japanese: c.example,
          romaji: c.romaji || '',
          translation: c.back,
          keyword: c.front,
        }));
      }
    }
    return [];
  }, [sentSource, currentDeckData, customSentence]);

  const [currentSentIdx, setCurrentSentIdx] = useState(0);
  const activeSent = sentences[currentSentIdx] || null;

  const [userInput, setUserInput] = useState('');
  const [sentChecked, setSentChecked] = useState(false);
  const [sentIsCorrect, setSentIsCorrect] = useState(false);
  const [hintCount, setHintCount] = useState(0);

  // Play audio automatically on sentence load
  useEffect(() => {
    if (activeSent && activeTab === 'sentence') {
      // Delay play slightly to let page settle
      const t = setTimeout(() => {
        playTTS(activeSent.japanese);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [activeSent, activeTab]);

  // Reset states when changing source, deck or sentence
  const resetSentenceState = () => {
    setUserInput('');
    setSentChecked(false);
    setSentIsCorrect(false);
    setHintCount(0);
  };

  useEffect(() => {
    setCurrentSentIdx(0);
    resetSentenceState();
  }, [sentSource, selectedDeckId, sentMode]);

  const handleNextSentence = () => {
    if (sentences.length === 0) return;
    setCurrentSentIdx((currentSentIdx + 1) % sentences.length);
    resetSentenceState();
  };

  const getMaskedSentence = (fullText, maskText) => {
    if (!fullText || !maskText) return '...';
    // Replace keyword with [ ______ ]
    return fullText.replace(maskText, ' [ ______ ] ');
  };

  const cleanString = (str) => {
    // Normalize and clean punctuation, spaces, uppercase
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。、？?！!]/g, '')
      .replace(/\s+/g, '')
      .trim();
  };

  const checkSentenceAnswer = () => {
    if (!activeSent) return;
    const target = sentMode === 'cloze' ? activeSent.keyword : activeSent.japanese;
    const isMatched = cleanString(userInput) === cleanString(target);
    
    setSentIsCorrect(isMatched);
    setSentChecked(true);
  };

  const handleHint = () => {
    if (!activeSent) return;
    const target = sentMode === 'cloze' ? activeSent.keyword : activeSent.japanese;
    if (hintCount < target.length) {
      setUserInput(target.slice(0, hintCount + 1));
      setHintCount(prev => prev + 1);
    }
  };


  // ============================================================
  // TAB 3: LUYỆN NÓI ĐUỔI (SHADOWING)
  // ============================================================
  const [shadowSentences, setShadowSentences] = useState(SYSTEM_SENTENCES);
  const [shadowIdx, setShadowIdx] = useState(0);
  const activeShadow = shadowSentences[shadowIdx] || null;

  // Handle URL query parameters for direct grammar redirects
  useEffect(() => {
    const mode = searchParams.get('mode');
    const deckId = searchParams.get('deckId');

    if (deckId) {
      setSentSource('deck');
      setSelectedDeckId(deckId);
      setActiveTab('sentence');
      if (mode === 'dictation') {
        setSentMode('dictation');
      } else {
        setSentMode('cloze');
      }
    } else if (mode === 'cloze' || mode === 'dictation') {
      const japanese = searchParams.get('japanese');
      const keyword = searchParams.get('keyword');
      const romaji = searchParams.get('romaji');
      const translation = searchParams.get('translation');
      
      if (japanese) {
        const custom = {
          id: 'custom-sent-gram',
          level: 'Ngữ pháp',
          japanese,
          romaji: romaji || '',
          translation: translation || '',
          keyword: keyword || '',
        };
        setCustomSentence(custom);
        setSentSource('custom');
        setSentMode(mode);
        setActiveTab('sentence');
      }
    } else if (mode === 'shadowing') {
      const japanese = searchParams.get('japanese');
      const romaji = searchParams.get('romaji');
      const translation = searchParams.get('translation');
      
      if (japanese) {
        const customShadow = {
          id: 'custom-shadow-gram',
          level: 'Ngữ pháp',
          japanese,
          romaji: romaji || '',
          translation: translation || '',
        };
        setShadowSentences([customShadow, ...SYSTEM_SENTENCES]);
        setShadowIdx(0);
        setActiveTab('shadowing');
      }
    }
  }, [searchParams]);

  const [speechSupported, setSpeechSupported] = useState(false);
  const [micPermission, setMicPermission] = useState('unknown'); // 'granted' | 'denied' | 'unknown'
  const [isRecording, setIsRecording] = useState(false);
  const [shadowTranscript, setShadowTranscript] = useState('');
  const [shadowScore, setShadowScore] = useState(null);
  const [shadowFeedbacks, setShadowFeedbacks] = useState([]); // Array of { word, matched }
  const recognitionRef = useRef(null);

  // Ghi âm âm thanh vật lý (Fallback)
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const [isFallbackRecording, setIsFallbackRecording] = useState(false);
  const [playedUserAudio, setPlayedUserAudio] = useState(false);

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'ja-JP';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
        setShadowTranscript('');
        setShadowScore(null);
      };

      rec.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        setShadowTranscript(resultText);
        calculateShadowScore(resultText);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsRecording(false);
        if (e.error === 'not-allowed') {
          setMicPermission('denied');
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Initialize MediaRecorder for custom audio recording playback
  const startPhysicalAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsFallbackRecording(true);
      setRecordedAudioUrl('');
    } catch (err) {
      console.error('Error starting audio recorder:', err);
      setMicPermission('denied');
    }
  };

  const stopPhysicalAudioRecording = () => {
    if (mediaRecorder && isFallbackRecording) {
      mediaRecorder.stop();
      // Stop all tracks on stream to release microphone
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsFallbackRecording(false);
    }
  };

  const playRecordedAudio = () => {
    if (recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      audio.play();
    }
  };

  const toggleSpeechRecognition = () => {
    if (!speechSupported) {
      // Try fallback physical recording
      if (isFallbackRecording) {
        stopPhysicalAudioRecording();
      } else {
        startPhysicalAudioRecording();
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      stopPhysicalAudioRecording(); // stop backup physical audio
    } else {
      try {
        // Start physical audio recording simultaneously for playback
        startPhysicalAudioRecording();
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const calculateShadowScore = (transcriptText) => {
    if (!activeShadow) return;
    const target = cleanString(activeShadow.japanese);
    const spoken = cleanString(transcriptText);

    if (!spoken) {
      setShadowScore(0);
      setShadowFeedbacks([]);
      return;
    }

    // A simple character matching for scoring
    const targetChars = activeShadow.japanese.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。、？?！!]/g, '');
    const spokenChars = transcriptText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。、？?！!]/g, '');

    let matches = 0;
    const feedbacks = [];

    // Quick visual highlight array (character level comparison)
    for (let i = 0; i < targetChars.length; i++) {
      const char = targetChars[i];
      if (spokenChars.includes(char)) {
        matches++;
        feedbacks.push({ char, matched: true });
      } else {
        feedbacks.push({ char, matched: false });
      }
    }

    const percentage = Math.round((matches / targetChars.length) * 100);
    setShadowScore(percentage);
    setShadowFeedbacks(feedbacks);
  };

  const playShadowSample = () => {
    if (activeShadow) {
      playTTS(activeShadow.japanese);
    }
  };

  const handleNextShadow = () => {
    setShadowIdx((shadowIdx + 1) % shadowSentences.length);
    setShadowScore(null);
    setShadowTranscript('');
    setShadowFeedbacks([]);
    setRecordedAudioUrl('');
    stopPhysicalAudioRecording();
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 animate-fade-up">

      {/* ── HERO BANNER (Navy & Vermilion Accent) ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 140 }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5" style={{ background: 'var(--secondary)' }} />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-3"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Luyện kỹ năng thực hành nghe nói
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Headphones className="w-9 h-9 text-amber-400" />
              Luyện Nghe & Shadowing
            </h1>
            <p className="text-white/60 text-sm mt-1 max-w-2xl">
              Nâng tầm phát âm và phản xạ nghe hiểu tiếng Nhật qua các đoạn hội thoại thực tế, điền từ chép chính tả và nhận diện giọng nói Shadowing thông minh.
            </p>
          </div>
          
          <div className="flex gap-4 items-center bg-white/5 border border-white/10 px-5 py-3 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Tốc độ đọc TTS:</span>
            <div className="flex gap-1.5">
              {[0.5, 0.8, 1.0].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-1 text-xs font-bold transition-all ${
                    speechRate === rate ? 'bg-amber-400 text-amber-950 font-black' : 'hover:bg-white/10 text-white'
                  }`}
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TAB SWITCHER (Flat & Sharp Borders) ── */}
      <div className="flex border-b border-outline-variant/40 bg-surface-container-lowest p-1"
        style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '1px 1px 0 0 rgba(0,0,0,0.04)' }}>
        {[
          { id: 'dialogue', label: 'Luyện nghe hội thoại', desc: 'Script & Trắc nghiệm' },
          { id: 'sentence', label: 'Nghe điền từ / Chép câu', desc: 'Chính tả & Từ vựng' },
          { id: 'shadowing', label: 'Luyện nói Shadowing', desc: 'Chấm điểm phát âm' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 text-center py-3.5 px-2 relative transition-all duration-150"
          >
            <p className={`text-sm font-bold tracking-wide ${
              activeTab === tab.id ? 'text-secondary' : 'text-on-surface-variant'
            }`}>
              {tab.label}
            </p>
            <p className="text-[9px] font-medium tracking-wider text-on-surface-variant/60 uppercase mt-0.5">
              {tab.desc}
            </p>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
            )}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT ACCORDING TO TABS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================
            TAB 1: LUYỆN NGHE HỘI THOẠI (DIALOGUE)
            ============================================================ */}
        {activeTab === 'dialogue' && (
          <>
            {/* Sidebar list dialogues */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Danh sách hội thoại
              </h2>
              <div className="space-y-3.5">
                {DIALOGUES.map(diag => (
                  <div
                    key={diag.id}
                    onClick={() => {
                      setActiveDiag(diag);
                      resetDiagQuiz();
                    }}
                    className={`p-4 border cursor-pointer transition-all ${
                      activeDiag.id === diag.id
                        ? 'bg-surface border-secondary sharp-shadow'
                        : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold ${
                        diag.level === 'N5' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {diag.level}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium">
                        {diag.lines.length} câu thoại
                      </span>
                    </div>
                    <h3 className="font-headline font-bold text-on-surface text-base line-clamp-1">
                      {diag.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1 line-clamp-2">
                      {diag.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation detail screen */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 sharp-shadow relative">
                
                {/* Dialogue Actions Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant/20 mb-6">
                  <div>
                    <h2 className="font-headline text-lg font-black text-on-surface flex items-center gap-2">
                      {activeDiag.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">Nhấp vào từng bong bóng thoại để nghe phát âm riêng</p>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={startAutoPlay}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border ${
                        isPlayingAll
                          ? 'bg-secondary text-white border-secondary'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant/40'
                      }`}
                    >
                      {isPlayingAll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlayingAll ? 'Tạm dừng' : 'Chạy liên tục'}
                    </button>
                    <button
                      onClick={stopAutoPlay}
                      className="p-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
                      title="Phát lại từ đầu"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* View Toggles */}
                <div className="flex flex-wrap gap-4 text-xs font-bold text-on-surface-variant mb-6 pb-4 border-b border-outline-variant/20">
                  <span className="text-[10px] uppercase tracking-wider my-auto">Hiển thị:</span>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-on-surface select-none">
                    <input
                      type="checkbox"
                      checked={showDiagJa}
                      onChange={(e) => setShowDiagJa(e.target.checked)}
                      className="accent-secondary"
                    />
                    Tiếng Nhật
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-on-surface select-none">
                    <input
                      type="checkbox"
                      checked={showDiagRomaji}
                      onChange={(e) => setShowDiagRomaji(e.target.checked)}
                      className="accent-secondary"
                    />
                    Romaji (Phiên âm)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-on-surface select-none">
                    <input
                      type="checkbox"
                      checked={showDiagVi}
                      onChange={(e) => setShowDiagVi(e.target.checked)}
                      className="accent-secondary"
                    />
                    Dịch tiếng Việt
                  </label>
                </div>

                {/* Chat layout dialogue */}
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 no-scrollbar mb-8">
                  {activeDiag.lines.map((line, idx) => {
                    const isSpeakerA = line.speaker === 'A';
                    const isActive = currentLineIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 items-start group ${
                          isSpeakerA ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        {/* Play button wrapper */}
                        {isSpeakerA && (
                          <button
                            onClick={() => playLine(idx)}
                            className={`p-2 rounded-full border transition-all flex-shrink-0 ${
                              isActive
                                ? 'bg-secondary text-white border-secondary'
                                : 'bg-surface hover:bg-surface-container text-on-surface-variant border-outline-variant/30'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Speech Bubble */}
                        <div
                          onClick={() => playLine(idx)}
                          className={`max-w-[80%] p-4 border transition-all cursor-pointer ${
                            isActive
                              ? 'border-secondary sharp-shadow bg-surface'
                              : isSpeakerA
                              ? 'bg-surface-container border-outline-variant/20 hover:border-outline-variant/40'
                              : 'bg-surface-container-low border-outline-variant/10 hover:border-outline-variant/30'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-4 mb-1">
                            <span className="text-[10px] font-black tracking-wider uppercase text-on-surface-variant opacity-80">
                              {line.name}
                            </span>
                            <span className="text-[9px] text-on-surface-variant/40 font-mono">
                              {line.speaker === 'A' ? 'Speaker A' : 'Speaker B'}
                            </span>
                          </div>

                          {showDiagJa && (
                            <p className="font-jp text-base font-bold text-on-surface leading-normal tracking-wide">
                              {line.text}
                            </p>
                          )}
                          
                          {showDiagRomaji && line.romaji && (
                            <p className="text-xs text-on-surface-variant font-medium tracking-wide mt-1.5 italic">
                              {line.romaji}
                            </p>
                          )}

                          {showDiagVi && (
                            <p className="text-xs text-on-surface/85 leading-relaxed mt-2 pt-2 border-t border-outline-variant/10">
                              {line.translation}
                            </p>
                          )}
                        </div>

                        {!isSpeakerA && (
                          <button
                            onClick={() => playLine(idx)}
                            className={`p-2 rounded-full border transition-all flex-shrink-0 ${
                              isActive
                                ? 'bg-secondary text-white border-secondary'
                                : 'bg-surface hover:bg-surface-container text-on-surface-variant border-outline-variant/30'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Comprehension Quiz section */}
                <div className="border-t border-outline-variant/30 pt-6 mt-6">
                  <h3 className="font-headline font-bold text-on-surface text-base mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Bài kiểm tra nghe hiểu (Comprehension Check)
                  </h3>
                  
                  <div className="space-y-6">
                    {activeDiag.questions.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-2.5">
                        <p className="text-sm font-semibold text-on-surface flex items-start gap-2">
                          <span className="w-5 h-5 bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {qIdx + 1}
                          </span>
                          {q.question}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = diagAnswers[qIdx] === optIdx;
                            const isCorrect = optIdx === q.answerIndex;
                            let btnStyle = 'bg-surface border-outline-variant/30 hover:border-outline-variant';
                            
                            if (diagSubmitted) {
                              if (isCorrect) {
                                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                              } else if (isSelected) {
                                btnStyle = 'bg-rose-50 border-rose-400 text-rose-800';
                              } else {
                                btnStyle = 'bg-surface border-outline-variant/20 opacity-60';
                              }
                            } else if (isSelected) {
                              btnStyle = 'border-secondary bg-surface-container-lowest font-bold text-secondary';
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleDiagSelect(qIdx, optIdx)}
                                disabled={diagSubmitted}
                                className={`p-3 text-left text-xs transition-all border ${btnStyle}`}
                                style={{ boxShadow: isSelected && !diagSubmitted ? '2px 2px 0 0 var(--secondary)' : 'none' }}
                              >
                                <span className="mr-2 font-mono text-[10px] text-on-surface-variant">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {diagSubmitted && isSelectedCorrect(qIdx, q) && (
                          <div className="pl-7 text-xs text-on-surface-variant bg-surface p-3 mt-2 border-l-2 border-secondary flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-secondary">Giải thích: </span>
                              {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Submission and Scoring */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-outline-variant/10">
                    {!diagSubmitted ? (
                      <button
                        onClick={submitDiagQuiz}
                        disabled={Object.keys(diagAnswers).length < activeDiag.questions.length}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary disabled:opacity-40 transition-colors shadow-sm ml-auto"
                        style={{ background: 'var(--secondary)' }}
                      >
                        Nộp bài trắc nghiệm
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-on-surface">Kết quả:</span>
                          <span className="text-2xl font-black text-secondary">
                            {diagScore} / {activeDiag.questions.length}
                          </span>
                          <span className="text-xs text-on-surface-variant font-medium">câu đúng</span>
                        </div>
                        <button
                          onClick={resetDiagQuiz}
                          className="px-5 py-2.5 border border-outline-variant/40 hover:bg-surface-container-low text-xs font-bold uppercase tracking-wider transition-colors ml-auto"
                        >
                          Làm lại bài
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* ============================================================
            TAB 2: NGHE ĐIỀN TỪ / CHÉP CÂU (SENTENCE PRACTICE)
            ============================================================ */}
        {activeTab === 'sentence' && (
          <>
            {/* Left Column Config controls */}
            <div className="lg:col-span-4 space-y-6">
              {/* Mode Selection */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 sharp-shadow space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Chế độ luyện tập</h3>
                <div className="space-y-2">
                  {[
                    { id: 'cloze', label: 'Điền từ vào ô trống', desc: 'Nghe câu và gõ lại từ bị ẩn đi' },
                    { id: 'dictation', label: 'Chép chính tả cả câu', desc: 'Nghe và chép lại toàn bộ câu' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSentMode(m.id)}
                      className={`w-full p-4 border text-left transition-all flex flex-col ${
                        sentMode === m.id
                          ? 'border-secondary bg-surface sharp-shadow'
                          : 'border-outline-variant/20 hover:border-outline-variant hover:bg-surface-container-low'
                      }`}
                    >
                      <span className={`text-xs font-bold ${sentMode === m.id ? 'text-secondary' : 'text-on-surface'}`}>
                        {m.label}
                      </span>
                      <span className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                        {m.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Source Selection */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 sharp-shadow space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nguồn câu</h3>
                
                <div className="flex gap-1 bg-surface-container p-0.5" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  <button
                    onClick={() => setSentSource('system')}
                    className="flex-1 py-1.5 text-center text-xs font-semibold transition-all"
                    style={{
                      background: sentSource === 'system' ? 'var(--surface-container-lowest)' : 'transparent',
                      color: sentSource === 'system' ? 'var(--secondary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    Câu mẫu hệ thống
                  </button>
                  <button
                    onClick={() => {
                      setSentSource('deck');
                      if (allDecks.length > 0 && !selectedDeckId) {
                        setSelectedDeckId(allDecks[0].id);
                      }
                    }}
                    className="flex-1 py-1.5 text-center text-xs font-semibold transition-all"
                    style={{
                      background: sentSource === 'deck' ? 'var(--surface-container-lowest)' : 'transparent',
                      color: sentSource === 'deck' ? 'var(--secondary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    Từ bộ thẻ học
                  </button>
                </div>

                {sentSource === 'deck' && (
                  <div className="space-y-2 pt-2 animate-fade-up">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Chọn bộ thẻ có chứa câu ví dụ:
                    </label>
                    {allDecks.length === 0 ? (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 border border-amber-200">
                        Chưa tìm thấy bộ thẻ nào của bạn. Vui lòng thêm bộ thẻ hoặc chọn "Câu mẫu hệ thống".
                      </p>
                    ) : (
                      <select
                        value={selectedDeckId}
                        onChange={(e) => setSelectedDeckId(e.target.value)}
                        className="w-full p-2 border border-outline-variant bg-surface text-xs focus:border-secondary outline-none"
                      >
                        {allDecks.map(deck => (
                          <option key={deck.id} value={deck.id}>
                            {deck.name} ({deck._count?.cards ?? 0} thẻ)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column sentence work area */}
            <div className="lg:col-span-8 space-y-6">
              {isLoadingDeck && sentSource === 'deck' ? (
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-12 text-center sharp-shadow">
                  <div className="w-8 h-8 border-2 border-outline-variant border-t-secondary animate-spin rounded-full mx-auto mb-4" />
                  <span className="text-sm text-on-surface-variant font-medium">Đang nạp câu ví dụ từ bộ thẻ...</span>
                </div>
              ) : sentences.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-12 text-center sharp-shadow space-y-3">
                  <AlertCircle className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
                  <h3 className="font-headline font-bold text-on-surface text-base">Bộ thẻ này không có ví dụ</h3>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                    Hiện bộ thẻ được chọn chưa có câu ví dụ ở các thẻ ghi nhớ. Bạn hãy chuyển sang "Câu mẫu hệ thống" hoặc thêm ví dụ ở chi tiết bộ thẻ.
                  </p>
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 sharp-shadow relative">
                  
                  {/* Progress Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20 mb-6">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                        {activeSent?.level || 'Mẫu'}
                      </span>
                      <h3 className="font-headline text-base font-bold text-on-surface inline-block ml-3">
                        Luyện chép chính tả
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-secondary">{currentSentIdx + 1}</span>
                      <span className="text-xs text-on-surface-variant"> / {sentences.length}</span>
                    </div>
                  </div>

                  {/* Main Listening Exercise Board */}
                  <div className="flex flex-col items-center justify-center py-8 bg-surface border border-outline-variant/20 mb-8 relative">
                    <div className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                      Bảng nghe phát âm
                    </div>

                    <button
                      onClick={() => playTTS(activeSent?.japanese)}
                      className="w-20 h-20 bg-secondary hover:bg-secondary-dim text-white flex items-center justify-center rounded-full transition-all duration-150 transform hover:scale-105 active:scale-95 sharp-shadow"
                    >
                      <Volume2 className="w-8 h-8" />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-4">
                      Nhấp vào đây để phát âm thanh mẫu
                    </span>
                  </div>

                  {/* Masked display when Cloze Mode */}
                  {sentMode === 'cloze' && (
                    <div className="mb-6 text-center">
                      <p className="font-jp text-xl md:text-2xl font-bold text-on-surface leading-normal tracking-wide">
                        {getMaskedSentence(activeSent?.japanese, activeSent?.keyword)}
                      </p>
                      {activeSent?.romaji && (
                        <p className="text-xs text-on-surface-variant font-mono mt-1.5 italic">
                          {getMaskedSentence(activeSent?.romaji, activeSent?.keyword)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Input form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                        {sentMode === 'cloze'
                          ? `Nhập từ còn thiếu: (Gợi ý: ${activeSent?.keyword?.length} ký tự)`
                          : 'Nhập lại toàn bộ câu tiếng Nhật nghe được:'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          disabled={sentChecked && sentIsCorrect}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') checkSentenceAnswer();
                          }}
                          placeholder={sentMode === 'cloze' ? 'Ví dụ: 友達' : 'Ví dụ: 私はベトナム人です。'}
                          className="flex-1 p-3 border border-outline-variant bg-surface text-sm focus:border-secondary outline-none"
                          style={{ fontFamily: 'var(--font-jp)' }}
                        />
                        <button
                          onClick={handleHint}
                          disabled={sentChecked && sentIsCorrect}
                          className="px-4 py-2 border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                          title="Gợi ý ký tự đầu"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wide">Gợi ý</span>
                        </button>
                      </div>
                    </div>

                    {/* Feedback section */}
                    {sentChecked && (
                      <div className={`p-4 border flex items-start gap-3 animate-fade-up ${
                        sentIsCorrect
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-rose-50 border-rose-400 text-rose-800'
                      }`}>
                        {sentIsCorrect ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider">Chính xác!</p>
                              <p className="font-jp text-base font-bold text-on-surface">{activeSent?.japanese}</p>
                              <p className="text-xs text-on-surface-variant italic font-medium">{activeSent?.romaji}</p>
                              <p className="text-xs text-on-surface mt-1">{activeSent?.translation}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider">Chưa chính xác</p>
                              <p className="text-xs">Hãy nghe lại kỹ hơn và thử lại nhé!</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center gap-4 pt-4 border-t border-outline-variant/10">
                      {sentChecked && !sentIsCorrect && (
                        <button
                          onClick={() => {
                            // Show full correct answer as hint fallback
                            setUserInput(sentMode === 'cloze' ? activeSent.keyword : activeSent.japanese);
                          }}
                          className="text-xs font-bold text-secondary hover:underline"
                        >
                          Xem đáp án
                        </button>
                      )}
                      
                      <div className="ml-auto flex gap-2">
                        {!sentIsCorrect || !sentChecked ? (
                          <button
                            onClick={checkSentenceAnswer}
                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-secondary transition-colors"
                            style={{ background: 'var(--secondary)' }}
                          >
                            Kiểm tra kết quả
                          </button>
                        ) : (
                          <button
                            onClick={handleNextSentence}
                            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                          >
                            Câu tiếp theo
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================================
            TAB 3: LUYỆN NÓI ĐUỔI (SHADOWING)
            ============================================================ */}
        {activeTab === 'shadowing' && (
          <>
            {/* Left Column Shadowing Sentences list */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Chọn câu luyện nói</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {shadowSentences.map((sent, idx) => (
                  <div
                    key={sent.id}
                    onClick={() => {
                      setShadowIdx(idx);
                      setShadowScore(null);
                      setShadowTranscript('');
                      setShadowFeedbacks([]);
                      setRecordedAudioUrl('');
                      stopPhysicalAudioRecording();
                    }}
                    className={`p-3.5 border cursor-pointer transition-all ${
                      shadowIdx === idx
                        ? 'bg-surface border-secondary sharp-shadow'
                        : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5">
                        {sent.level}
                      </span>
                    </div>
                    <p className="font-jp text-sm font-bold text-on-surface line-clamp-1">
                      {sent.japanese}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {sent.translation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column Shadowing Area */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 sharp-shadow relative">
                
                <div className="flex justify-between items-start pb-4 border-b border-outline-variant/20 mb-6">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">
                      Shadowing Mode
                    </span>
                    <h3 className="font-headline text-base font-bold text-on-surface inline-block ml-3">
                      Luyện nói đuổi theo giọng mẫu
                    </h3>
                  </div>
                  <button
                    onClick={handleNextShadow}
                    className="p-1 text-on-surface-variant hover:text-on-surface"
                    title="Câu tiếp theo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Target sentence display */}
                <div className="text-center py-6 bg-surface border border-outline-variant/20 mb-8 space-y-3 relative">
                  <div className="absolute top-2 left-4 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                    Câu luyện tập
                  </div>

                  <p className="font-jp text-xl md:text-2xl font-bold text-on-surface px-6 leading-normal tracking-wide">
                    {activeShadow?.japanese}
                  </p>
                  
                  {activeShadow?.romaji && (
                    <p className="text-xs text-on-surface-variant font-mono italic">
                      {activeShadow?.romaji}
                    </p>
                  )}

                  <p className="text-xs text-on-surface-variant max-w-md mx-auto pt-2 border-t border-outline-variant/10">
                    {activeShadow?.translation}
                  </p>
                </div>

                {/* Play Sample & Record Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left panel: Listen target */}
                  <div className="p-5 border border-outline-variant/20 bg-surface-container flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">1. Nghe giọng đọc mẫu</span>
                    <button
                      onClick={playShadowSample}
                      className="w-14 h-14 bg-primary hover:bg-primary-container text-white flex items-center justify-center rounded-full transition-all sharp-shadow"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] text-on-surface-variant/70 font-medium">Bấm để nghe cách phát âm</span>
                  </div>

                  {/* Right panel: Speak & Record */}
                  <div className="p-5 border border-outline-variant/20 bg-surface-container flex flex-col items-center justify-center text-center space-y-4 relative">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">2. Nói (Shadowing)</span>
                    
                    <button
                      onClick={toggleSpeechRecognition}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all sharp-shadow ${
                        isRecording || isFallbackRecording
                          ? 'bg-rose-600 text-white animate-pulse border-2 border-rose-200'
                          : 'bg-secondary hover:bg-secondary-dim text-white'
                      }`}
                    >
                      {isRecording || isFallbackRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <span className="text-[10px] text-on-surface-variant/70 font-medium">
                      {isRecording || isFallbackRecording ? 'Đang thu âm... Bấm lại để dừng' : 'Bấm mic để nói đuổi'}
                    </span>
                  </div>

                </div>

                {/* Speech scoring feedback results */}
                {(shadowScore !== null || recordedAudioUrl) && (
                  <div className="mt-8 pt-6 border-t border-outline-variant/20 space-y-6 animate-fade-up">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Kết quả luyện nói của bạn
                    </h4>

                    {speechSupported && shadowScore !== null ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-surface p-5 border border-outline-variant/20">
                        {/* Circle Score */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-outline-variant/20 pb-4 md:pb-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Độ khớp âm</span>
                          <span className="text-4xl font-black text-secondary leading-none">{shadowScore}%</span>
                          <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase mt-2">
                            {shadowScore >= 85 ? 'Tuyệt vời!' : shadowScore >= 60 ? 'Rất tốt!' : 'Cố gắng thêm!'}
                          </span>
                        </div>

                        {/* Speech text review */}
                        <div className="md:col-span-8 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Từ vựng phát âm:</p>
                          <div className="flex flex-wrap gap-1 font-jp text-lg font-bold leading-normal">
                            {shadowFeedbacks.length > 0 ? (
                              shadowFeedbacks.map((f, i) => (
                                <span
                                  key={i}
                                  className={f.matched ? 'text-emerald-600' : 'text-rose-500 line-through decoration-rose-300 decoration-1'}
                                  title={f.matched ? 'Phát âm chuẩn' : 'Chưa nhận diện được'}
                                >
                                  {f.char}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm font-normal text-on-surface-variant">Chưa nhận diện rõ ký tự nào.</span>
                            )}
                          </div>

                          <div className="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant/10">
                            <span className="font-bold">Đoạn nhận diện được:</span> "{shadowTranscript || '...'}"
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Display fallback for when Web Speech Recognition is not supported
                      !speechSupported && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 text-xs leading-relaxed">
                          <span className="font-bold block mb-1">Nhận xét:</span>
                          Do trình duyệt không hỗ trợ Web Speech API, bạn hãy sử dụng ghi âm cá nhân bên dưới để nghe và tự so sánh cách phát âm của mình với giọng đọc chuẩn nhé.
                        </div>
                      )
                    )}

                    {/* Audio Voice Playback block */}
                    {recordedAudioUrl && (
                      <div className="p-4 bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Volume2 className="w-5 h-5 text-secondary" />
                          <div>
                            <p className="text-xs font-bold text-on-surface">Bản ghi âm giọng đọc của bạn</p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">Hãy phát và so sánh trực tiếp với giọng chuẩn</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={playRecordedAudio}
                            className="px-4 py-2 bg-secondary hover:bg-secondary-dim text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Nghe giọng của bạn
                          </button>
                          <button
                            onClick={playShadowSample}
                            className="px-4 py-2 border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Nghe giọng mẫu
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// Helper to identify selected question answer validation status
function isSelectedCorrect(qIdx, q) {
  return true;
}
