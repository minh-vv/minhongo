import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SYSTEM_SENTENCES } from './ListeningData';
import {
  Mic, MicOff, Volume2, Play, Pause, ChevronRight,
  Headphones, Info, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function ListeningShadowing() {
  const [searchParams] = useSearchParams();
  const [shadowSentences, setShadowSentences] = useState(SYSTEM_SENTENCES);
  const [shadowIdx, setShadowIdx] = useState(0);
  const activeShadow = shadowSentences[shadowIdx] || null;

  const [speechRate, setSpeechRate] = useState(1.0); // 0.5, 0.8, 1.0
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const playTTS = (text, rateOverride) => {
    if (!synth) return;
    synth.cancel(); // Stop playing currently speaking text
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rateOverride || speechRate;
    synth.speak(utterance);
  };

  // Handle URL query parameters for custom shadowing redirects
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'shadowing') {
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

  // Fallback physical voice recorder
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const [isFallbackRecording, setIsFallbackRecording] = useState(false);

  const cleanString = (str) => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。、？?！!]/g, '')
      .replace(/\s+/g, '')
      .trim();
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

  const calculateShadowScoreRef = useRef(calculateShadowScore);
  useEffect(() => {
    calculateShadowScoreRef.current = calculateShadowScore;
  });

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
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
        calculateShadowScoreRef.current(resultText);
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

  // Fallback physical audio recording playback
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
      if (isFallbackRecording) {
        stopPhysicalAudioRecording();
      } else {
        startPhysicalAudioRecording();
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      stopPhysicalAudioRecording();
    } else {
      try {
        startPhysicalAudioRecording();
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
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
      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 140 }}>
        <div className="absolute inset-0 bg-primary" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)'
        }} />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-secondary" />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-3" style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45 bg-secondary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Luyện kỹ năng thực hành nghe nói
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Headphones className="w-9 h-9 text-amber-400" />
              Luyện Nói Shadowing
            </h1>
            <p className="text-white/60 text-sm mt-1 max-w-2xl">
              Nâng tầm phát âm tự nhiên qua kỹ thuật Shadowing (nói đuổi). Nhận diện giọng nói thông minh để chấm điểm độ chuẩn xác.
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

      {/* ── MAIN CONTENT ACCORDING TO TABS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Shadowing Sentences list */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
            <Info className="w-4 h-4" /> Chọn câu luyện nói
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            {shadowSentences.map((sent, idx) => (
              <button
                key={sent.id}
                onClick={() => {
                  setShadowIdx(idx);
                  setShadowScore(null);
                  setShadowTranscript('');
                  setShadowFeedbacks([]);
                  setRecordedAudioUrl('');
                  stopPhysicalAudioRecording();
                }}
                className={`w-full p-3.5 border text-left cursor-pointer transition-all ${
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
              </button>
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
                  aria-label="Nghe giọng đọc chuẩn"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
                <span className="text-[10px] text-on-surface-variant/70 font-medium">Bấm để nghe cách phát âm chuẩn</span>
              </div>

              {/* Right panel: Speak & Record */}
              <div className="p-5 border border-outline-variant/20 bg-surface-container flex flex-col items-center justify-center text-center space-y-4 relative">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">2. Nói đuổi (Shadowing)</span>
                
                <button
                  onClick={toggleSpeechRecognition}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all sharp-shadow ${
                    isRecording || isFallbackRecording
                      ? 'bg-rose-600 text-white animate-pulse border-2 border-rose-200'
                      : 'bg-secondary hover:bg-secondary-dim text-white'
                  }`}
                  aria-label={isRecording || isFallbackRecording ? 'Dừng thu âm' : 'Bắt đầu nói'}
                >
                  {isRecording || isFallbackRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <span className="text-[10px] text-on-surface-variant/70 font-medium">
                  {isRecording || isFallbackRecording ? 'Đang thu âm... Bấm lại để dừng' : 'Bấm mic để bắt đầu nói'}
                </span>
              </div>

            </div>

            {/* Speech scoring feedback results */}
            {(shadowScore !== null || recordedAudioUrl) && (
              <div className="mt-8 pt-6 border-t border-outline-variant/20 space-y-6 animate-fade-up">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Kết quả thực hành của bạn
                </h4>

                {speechSupported && shadowScore !== null ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-surface p-5 border border-outline-variant/20">
                    {/* Circle Score */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-outline-variant/20 pb-4 md:pb-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Độ chính xác</span>
                      <span className="text-4xl font-black text-secondary leading-none">{shadowScore}%</span>
                      <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase mt-2">
                        {shadowScore >= 85 ? 'Tuyệt vời!' : shadowScore >= 60 ? 'Rất tốt!' : 'Hãy thử lại!'}
                      </span>
                    </div>

                    {/* Speech text review */}
                    <div className="md:col-span-8 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Chi tiết phát âm:</p>
                      <div className="flex flex-wrap gap-1 font-jp text-lg font-bold leading-normal">
                        {shadowFeedbacks.length > 0 ? (
                          shadowFeedbacks.map((f, i) => (
                            <span
                              key={i}
                              className={f.matched ? 'text-emerald-600' : 'text-rose-500 line-through decoration-rose-350 decoration-1'}
                              title={f.matched ? 'Phát âm đúng' : 'Chưa nhận diện đúng'}
                            >
                              {f.char}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-normal text-on-surface-variant">Không nhận dạng được ký tự nào.</span>
                        )}
                      </div>

                      <div className="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline-variant/10">
                        <span className="font-bold">Nhận dạng thực tế:</span> "{shadowTranscript || '...'}"
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display fallback for when Web Speech Recognition is not supported
                  !speechSupported && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 text-xs leading-relaxed">
                      <span className="font-bold block mb-1">Lưu ý:</span>
                      Trình duyệt này hiện không hỗ trợ Web Speech API để tự động chấm điểm phát âm. Bạn hãy phát bản ghi âm giọng đọc ở dưới và so sánh trực tiếp với giọng mẫu nhé!
                    </div>
                  )
                )}

                {/* Audio Voice Playback block */}
                {recordedAudioUrl && (
                  <div className="p-4 bg-surface border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-secondary" />
                      <div>
                        <p className="text-xs font-bold text-on-surface">Bản ghi âm giọng của bạn</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">Nghe lại và tự nhận xét điểm phát âm khác biệt</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={playRecordedAudio}
                        className="px-4 py-2 bg-secondary hover:bg-secondary-dim text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Nghe lại giọng bạn
                      </button>
                      <button
                        onClick={playShadowSample}
                        className="px-4 py-2 border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Nghe lại giọng mẫu
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
