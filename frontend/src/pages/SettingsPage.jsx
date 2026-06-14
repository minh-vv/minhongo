import { useSettings } from '../contexts/SettingsContext';
import { IconSettings, IconVolume, IconCheck } from '../components/Icons';

export default function SettingsPage() {
  const {
    theme, setTheme,
    autoPlayAudio, setAutoPlayAudio,
    jpFontScale, setJpFontScale,
    showRomaji, setShowRomaji,
    language, setLanguage,
  } = useSettings();

  const THEMES = [
    { id: 'light', label: 'Chế độ sáng', desc: 'Giao diện truyền thống ấm áp', previewBg: 'bg-[#f8f4ef]', text: 'text-[#1c1b18]' },
    { id: 'dark', label: 'Chế độ tối', desc: 'Trải nghiệm dịu mắt tối ấm', previewBg: 'bg-[#141312]', text: 'text-[#f5f0eb]' },
    { id: 'system', label: 'Hệ thống', desc: 'Tự động đồng bộ với thiết bị', previewBg: 'bg-gradient-to-r from-[#f8f4ef] to-[#141312]', text: 'text-on-surface' },
  ];

  const FONT_SCALES = [
    { value: 1.0, label: '100%', labelSub: 'Mặc định' },
    { value: 1.15, label: '115%', labelSub: 'Dễ đọc' },
    { value: 1.3, label: '130%', labelSub: 'Phóng to' },
  ];

  const LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
        <div className="w-12 h-12 bg-surface-container border border-outline-variant/30 flex items-center justify-center text-primary sharp-shadow-sm">
          <IconSettings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Cài đặt cá nhân</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary mt-0.5">Tùy biến trải nghiệm học tập của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Controls */}
        <div className="md:col-span-2 space-y-8">
          {/* Theme card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 space-y-4">
            <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-secondary inline-block" />
              Chủ đề giao diện
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 border text-left flex flex-col justify-between transition-all duration-150 h-32 relative hover:-translate-y-0.5 sharp-shadow-sm ${
                      active ? 'border-secondary bg-secondary/5' : 'border-outline-variant/40 bg-surface'
                    }`}
                  >
                    <div className="w-full">
                      <p className={`text-xs font-bold ${active ? 'text-secondary' : 'text-on-surface'}`}>{t.label}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1 leading-snug">{t.desc}</p>
                    </div>
                    
                    {/* Preview box */}
                    <div className={`w-full h-6 border border-outline-variant/30 rounded mt-3 ${t.previewBg} flex items-center justify-center overflow-hidden`}>
                      <span className={`text-[9px] font-bold ${t.text}`}>あA</span>
                    </div>

                    {active && (
                      <span className="absolute top-2 right-2 text-secondary">
                        <IconCheck className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font scale card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 space-y-4">
            <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-secondary inline-block" />
              Cỡ chữ tiếng Nhật
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Phóng to hoặc thu nhỏ riêng biệt các khối chữ tiếng Nhật (Kanji/Kana) để giúp bạn dễ nhìn nét chữ hơn mà không làm ảnh hưởng tới bố cục chung.
            </p>
            <div className="flex gap-3">
              {FONT_SCALES.map((scale) => {
                const active = jpFontScale === scale.value;
                return (
                  <button
                    key={scale.value}
                    onClick={() => setJpFontScale(scale.value)}
                    className={`flex-1 py-3 text-center border transition-all duration-150 sharp-shadow-sm ${
                      active
                        ? 'border-secondary bg-secondary/5 text-secondary font-black'
                        : 'border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <p className="text-sm font-bold">{scale.label}</p>
                    <p className="text-[9px] font-semibold opacity-70 mt-0.5">{scale.labelSub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Study Preferences card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 space-y-5">
            <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-secondary inline-block" />
              Tùy chọn học tập
            </h3>

            {/* Romaji toggle */}
            <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
              <div>
                <p className="text-sm font-bold text-on-surface">Phiên âm Romaji</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Hiển thị chữ la-tinh hỗ trợ đọc từ vựng</p>
              </div>
              <button
                onClick={() => setShowRomaji(!showRomaji)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${
                  showRomaji ? 'bg-secondary justify-end' : 'bg-surface-container-high justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 mx-1" />
              </button>
            </div>

            {/* TTS toggle */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <IconVolume className="w-4 h-4 text-on-surface-variant" />
                  Tự động phát phát âm (TTS)
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Tự động đọc từ tiếng Nhật khi hiển thị thẻ ghi nhớ</p>
              </div>
              <button
                onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${
                  autoPlayAudio ? 'bg-secondary justify-end' : 'bg-surface-container-high justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 mx-1" />
              </button>
            </div>
          </div>

          {/* Language card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 sharp-shadow p-6 space-y-4">
            <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-secondary inline-block" />
              Ngôn ngữ hiển thị
            </h3>
            <div className="flex gap-3">
              {LANGUAGES.map((lang) => {
                const active = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex-1 py-3.5 px-4 border text-left flex items-center gap-3 transition-all duration-150 sharp-shadow-sm ${
                      active ? 'border-secondary bg-secondary/5 font-bold' : 'border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <span className="text-sm flex-1">{lang.label}</span>
                    {active && <IconCheck className="w-4 h-4 text-secondary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Live Preview */}
        <div className="space-y-4">
          <div className="sticky top-24">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5">
              Live Preview (Xem thử)
            </p>
            <div className="bg-surface-container-lowest border border-outline-variant/40 sharp-shadow p-6 space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 asanoha-bg opacity-5 pointer-events-none" />

              {/* Title decoration */}
              <div className="flex justify-between items-center relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-secondary bg-secondary/5 border border-secondary/20 px-2 py-0.5">
                  Thẻ Xem Thử
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/50">
                  Minhongo Preview
                </span>
              </div>

              {/* Preview Content */}
              <div className="text-center py-6 relative z-10 border-y border-dashed border-outline-variant/30 space-y-2">
                <p className="font-jp font-bold text-on-surface leading-tight tracking-wide text-center" style={{ fontSize: '3rem' }}>
                  日本語
                </p>
                {showRomaji && (
                  <p className="text-secondary text-sm font-semibold tracking-wide font-jp-sans">
                    nihongo
                  </p>
                )}
                <p className="text-xs text-on-surface-variant/40 font-medium pt-2">
                  (Mặt trước thẻ ghi nhớ)
                </p>
              </div>

              {/* Bottom text */}
              <div className="text-xs text-on-surface-variant leading-relaxed">
                <p className="font-bold text-[10px] uppercase text-primary tracking-wider mb-1">
                  Thông tin hiển thị:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                  <li>Theme: <span className="font-bold text-on-surface">{theme === 'system' ? 'Hệ thống' : theme === 'dark' ? 'Tối' : 'Sáng'}</span></li>
                  <li>Font scale: <span className="font-bold text-on-surface">{jpFontScale * 100}%</span></li>
                  <li>Romaji: <span className="font-bold text-on-surface">{showRomaji ? 'Bật' : 'Tắt'}</span></li>
                  <li>Autoplay TTS: <span className="font-bold text-on-surface">{autoPlayAudio ? 'Bật' : 'Tắt'}</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
