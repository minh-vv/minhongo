import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardApi } from '../api/flashcardApi';
import { useAuth } from '../hooks/useAuth';
import DeckList from '../components/DeckList';
import ImportAnkiModal from '../components/ImportAnkiModal';
import TodaysLessonCard from '../components/TodaysLessonCard';
import {
  IconBook, IconList, IconLayers, IconMap, IconArrowRight,
  IconArrowUpRight, IconUpload, IconPlus, IconFlame, IconBookMarked,
  IconTimer, IconTarget,
} from '../components/Icons';

/* ── helpers ────────────────────────────────────────────────── */
function getTimeInfo() {
  const h = new Date().getHours();
  if (h < 12) return { jp: 'おはようございます', kanji: '朝', period: 'Buổi sáng', sub: 'ôn lại bài cũ buổi sáng nhé' };
  if (h < 18) return { jp: 'こんにちは',        kanji: '昼', period: 'Buổi chiều', sub: 'tiếp tục luyện tập buổi chiều thôi' };
  return       { jp: 'こんばんは',             kanji: '夜', period: 'Buổi tối',   sub: 'ôn bài trước khi ngủ nhé' };
}

function getDateStr() {
  const now  = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}`;
}

/* ── quick-start cards ─────────────────────────────────────── */
const quickCards = [
  {
    path: '/kanji', label: 'Hán tự', desc: 'Kanji theo JLPT',
    accent: 'var(--primary)', accentEnd: 'var(--primary-container)',
    ghostChar: '漢',
    icon: <IconBook className="w-5 h-5" />,
  },
  {
    path: '/vocabulary', label: 'Từ vựng', desc: 'Mở rộng vốn từ',
    accent: '#1565c0', accentEnd: '#1976d2',
    ghostChar: '語',
    icon: <IconList className="w-5 h-5" />,
  },
  {
    path: '/grammar', label: 'Ngữ pháp', desc: 'Cấu trúc câu',
    accent: '#006064', accentEnd: '#00838f',
    ghostChar: '文',
    icon: <IconBook className="w-5 h-5" />,
  },
  {
    path: '/self-study', label: 'Học Flashcard', desc: 'Ghi nhớ với SRS',
    accent: 'var(--secondary)', accentEnd: 'var(--secondary-container)',
    ghostChar: '覚',
    icon: <IconLayers className="w-5 h-5" />,
  },
];

/* ── stat cards ─────────────────────────────────────────────── */
const statItems = [
  { label: 'Streak',    value: '0', sub: 'ngày liên tiếp',  icon: <IconFlame className="w-5 h-5" /> },
  { label: 'Đã luyện', value: '0', sub: 'thẻ hôm nay',    icon: <IconBookMarked className="w-5 h-5" /> },
  { label: 'Giờ học',  value: '—', sub: 'tổng cộng',       icon: <IconTimer className="w-5 h-5" /> },
  { label: 'Chính xác',value: '—', sub: 'trung bình',      icon: <IconTarget className="w-5 h-5" /> },
];

/* ── section header component ───────────────────────────────── */
function SectionHeader({ title, accent = 'var(--secondary)' }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: accent }} />
      <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div className="flex-1 h-px ml-1" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
    </div>
  );
}

/* ── main component ─────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeck, setNewDeck] = useState({ name: '', description: '', isPublic: false });

  const { data: myDecks, isLoading } = useQuery({ queryKey: ['myDecks'], queryFn: flashcardApi.getDecks });

  const createDeckMutation = useMutation({
    mutationFn: flashcardApi.createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDecks'] });
      setShowCreateModal(false);
      setNewDeck({ name: '', description: '', isPublic: false });
    },
  });

  const handleImportSuccess = (data) => {
    queryClient.invalidateQueries({ queryKey: ['myDecks'] });
    alert(`Import thành công! Đã tạo deck "${data.deckName}" với ${data.importedCount} thẻ.`);
    setShowImportModal(false);
  };

  const timeInfo    = getTimeInfo();
  const userName    = user?.name || user?.email?.split('@')[0] || 'bạn';
  const deckCount   = myDecks?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10 md:space-y-14">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-0 relative">

        {/* Left — gradient hero */}
        <div className="md:col-span-3 relative overflow-hidden animate-fade-up">
          {/* Gradient background */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 50%, #0d1b5e 100%)'
          }} />
          {/* Asanoha overlay */}
          <div className="absolute inset-0 asanoha-bg opacity-25" />
          {/* Red accent bar right edge */}
          <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />

          <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center min-h-[220px] md:min-h-[260px]">
            {/* Date badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 w-fit mb-5 animate-fade-left delay-100"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                {getDateStr()} · {timeInfo.period}
              </span>
            </div>

            {/* Japanese greeting */}
            <h1 className="font-jp text-4xl md:text-5xl font-bold text-white mb-3 leading-tight animate-fade-up delay-200"
              style={{ letterSpacing: '-0.02em' }}>
              {timeInfo.jp}
            </h1>

            <p className="text-white/60 text-base leading-relaxed animate-fade-up delay-300">
              {userName} ơi, {timeInfo.sub}.
            </p>

            <Link
              to="/self-study"
              className="mt-6 self-start px-6 py-2.5 font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
              style={{ background: 'var(--secondary)', color: 'var(--on-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--secondary)'}
            >
              Bắt đầu học ngay
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Ghost kanji */}
          <div className="absolute -right-4 -bottom-6 font-jp font-bold text-white/[0.06] leading-none select-none pointer-events-none"
            style={{ fontSize: '200px' }}>
            {timeInfo.kanji}
          </div>
        </div>

        {/* Right — stats */}
        <div className="md:col-span-2 bg-surface-container-low relative">
          <div className="h-full flex flex-col justify-center p-8 md:p-10 relative overflow-hidden animate-fade-up delay-100">
            {/* Corner decorations */}
            <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4" style={{ borderColor: 'rgba(198,40,40,0.08)' }} />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4" style={{ borderColor: 'rgba(26,35,126,0.08)' }} />

            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Thống kê của bạn</p>
            <div className="grid grid-cols-2 gap-3">
              {statItems.map((s) => (
                <div key={s.label} className="bg-surface-container-lowest p-4 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex justify-center text-on-surface-variant mb-0.5">{s.icon}</div>
                  <p className="text-2xl font-black text-on-surface leading-none mb-1">{s.value}</p>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TODAY'S LESSON ─────────────────────────────────── */}
      <section>
        <SectionHeader title="Lộ trình hôm nay" />
        <TodaysLessonCard />
      </section>

      {/* ── QUICK START ─────────────────────────────────────── */}
      <section>
        <SectionHeader title="Bắt đầu nhanh" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {quickCards.map((c, i) => (
            <div key={c.path} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <button
                onClick={() => navigate(c.path)}
                className="group relative flex flex-col p-5 md:p-6 bg-surface-container-lowest overflow-hidden transition-all hover:sharp-shadow active:scale-[0.98] h-full w-full text-left"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}
              >
                {/* Top color bar (appears on hover) */}
                <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(to right, ${c.accent}, ${c.accentEnd})` }} />

                {/* Icon */}
                <div className="p-3 w-fit mb-5 text-white transition-transform group-hover:scale-110 group-hover:rotate-[-3deg]"
                  style={{ background: c.accent }}>
                  {c.icon}
                </div>

                {/* Text */}
                <h3 className="font-headline font-bold text-on-surface mb-1.5 text-sm md:text-base flex items-center gap-1.5">
                  {c.label}
                  {/* Arrow appears on hover */}
                  <IconArrowUpRight className="w-3.5 h-3.5 text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed flex-1">{c.desc}</p>

                {/* Ghost icon in corner */}
                <div className="absolute -right-3 -bottom-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none font-jp font-bold leading-none text-on-surface select-none"
                  style={{ fontSize: 80 }}>
                  {c.ghostChar}
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE EXPLORATION ─────────────────────────────── */}
      <section>
        <SectionHeader title="Khám phá tính năng" accent="var(--primary)" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">

          {/* Big card — lộ trình AI */}
          <div className="md:col-span-3 md:row-span-2 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <button
              onClick={() => navigate('/roadmap')}
              className="group relative h-full flex flex-col justify-between p-8 md:p-10 overflow-hidden transition-all hover:sharp-shadow active:opacity-95 w-full text-left"
              style={{ minHeight: 280 }}
            >
              {/* Background */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, var(--surface-container-low), var(--surface-container), var(--surface-container-high))'
              }} />
              {/* Left red accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--secondary)' }} />
              {/* Asanoha overlay */}
              <div className="absolute inset-0 asanoha-bg opacity-[0.15]" />

              <div className="relative z-10">
                <div className="p-3 w-fit mb-6 text-white" style={{ background: 'var(--secondary)' }}>
                  <IconMap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-headline font-bold text-on-surface mb-3" style={{ letterSpacing: '-0.02em' }}>
                  Lộ trình học AI
                </h3>
                <p className="text-on-surface-variant leading-relaxed max-w-sm text-base">
                  AI phân tích trình độ và tạo lộ trình học tối ưu riêng cho bạn — từ N5 đến N1.
                </p>
              </div>

              <span className="relative z-10 mt-8 px-6 py-2.5 text-white font-bold w-fit transition-colors text-sm uppercase tracking-wider inline-flex items-center gap-2"
                style={{ background: 'var(--secondary)' }}>
                Xem lộ trình
                <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>

              {/* Ghost kanji */}
              <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity font-jp font-bold leading-none select-none pointer-events-none"
                style={{ fontSize: 200 }}>
                道
              </div>
            </button>
          </div>

          {/* Small card 1 — ngữ pháp */}
          <div className="md:col-span-2 animate-fade-up" style={{ animationDelay: '160ms' }}>
            <div className="h-full p-6 md:p-7 relative overflow-hidden" style={{ minHeight: 160 }}>
              {/* Gradient bg */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-container), #0d1b5e)'
              }} />
              <div className="absolute inset-0 asanoha-bg opacity-20" />

              <div className="relative z-10 flex flex-col justify-between h-full text-white">
                <div>
                  <div className="bg-white/15 p-2.5 w-fit mb-4" style={{ backdropFilter: 'blur(4px)' }}>
                    <IconBook className="w-5 h-5" />
                  </div>
                  <h4 className="font-headline font-bold text-lg mb-1.5">Ngữ pháp</h4>
                  <p className="text-white/60 text-sm leading-relaxed">Giải thích bằng tiếng Việt, kèm công thức và ví dụ thực tế.</p>
                </div>
                <span className="mt-5 text-[10px] font-bold uppercase tracking-widest text-white/40">Miễn phí · Không cần đăng nhập</span>
              </div>

              <div className="absolute -right-2 -bottom-4 font-jp font-bold text-white/[0.05] leading-none select-none pointer-events-none"
                style={{ fontSize: 100 }}>文</div>
            </div>
          </div>

          {/* Small card 2 — từ vựng */}
          <div className="md:col-span-2 animate-fade-up" style={{ animationDelay: '240ms' }}>
            <button
              onClick={() => navigate('/vocabulary')}
              className="group h-full p-6 md:p-7 bg-surface-container-lowest flex flex-col justify-between transition-all hover:sharp-shadow active:opacity-95 relative overflow-hidden w-full text-left"
              style={{ border: '1px solid rgba(0,0,0,0.06)', minHeight: 160 }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-container))' }} />

              <div>
                <div className="p-2.5 w-fit mb-4 text-white" style={{ background: 'var(--primary)' }}>
                  <IconList className="w-5 h-5" />
                </div>
                <h4 className="font-headline font-bold text-on-surface text-lg mb-1.5">Từ vựng</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">Nhóm theo chủ đề, kèm phiên âm và ví dụ câu.</p>
              </div>

              <span className="mt-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-secondary transition-colors inline-flex items-center gap-1.5">
                Học ngay
                <IconArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>

              <div className="absolute -right-2 -bottom-3 font-jp font-bold text-on-surface/[0.03] leading-none select-none pointer-events-none"
                style={{ fontSize: 80 }}>語</div>
            </button>
          </div>
        </div>
      </section>

      {/* ── MY DECKS ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 flex-shrink-0" style={{ background: 'var(--secondary)' }} />
            <h2 className="text-lg font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.01em' }}>
              Bộ thẻ của tôi
            </h2>
            {deckCount > 0 && (
              <span className="px-1.5 py-px text-[10px] font-bold text-on-surface-variant bg-surface-container">
                {deckCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface-variant border transition-colors hover:bg-surface-container"
              style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
              <IconUpload className="w-3.5 h-3.5" />
              Import Anki
            </button>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-on-secondary uppercase tracking-wider transition-colors hover:bg-secondary-dim"
              style={{ background: 'var(--secondary)' }}>
              <IconPlus className="w-3.5 h-3.5" />
              Tạo bộ thẻ
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-outline-variant border-t-secondary animate-spin" style={{ borderRadius: '50%' }} />
          </div>
        ) : deckCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-outline-variant/40 text-center">
            <div className="flex justify-center text-on-surface-variant mb-3"><IconLayers className="w-8 h-8" /></div>
            <p className="font-semibold text-on-surface text-sm mb-1">Chưa có bộ thẻ nào</p>
            <p className="text-xs text-on-surface-variant mb-5">Tạo bộ thẻ đầu tiên hoặc import từ Anki</p>
            <button onClick={() => setShowCreateModal(true)}
              className="px-5 py-2 text-xs font-bold text-on-secondary uppercase tracking-wider hover:bg-secondary-dim transition-colors"
              style={{ background: 'var(--secondary)' }}>
              Tạo ngay
            </button>
          </div>
        ) : (
          <DeckList decks={myDecks} title="" showManage />
        )}
      </section>

      {/* ── DISCORD CTA ─────────────────────────────────────── */}
      <section>
        <a href="https://discord.gg/minhongo" target="_blank" rel="noopener noreferrer"
          className="group relative block w-full overflow-hidden transition-all hover:sharp-shadow active:opacity-95">
          {/* Background */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, #5865F2, #4752C4, var(--primary))'
          }} />
          <div className="absolute inset-0 asanoha-bg opacity-10" />
          {/* Corner decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-white/10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-white/10 pointer-events-none" />

          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
            <div className="flex items-center gap-5">
              <div className="p-3.5 bg-white/15 flex-shrink-0" style={{ backdropFilter: 'blur(4px)' }}>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] block mb-1 text-white/60">Cộng đồng Minhongo</span>
                <h3 className="font-headline font-bold text-lg md:text-xl">Tham gia Discord để góp ý và nhận thông báo</h3>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">Gặp gỡ các bạn cùng học, đề xuất tính năng mới.</p>
              </div>
            </div>
            <span className="px-7 py-3 bg-white font-bold text-sm uppercase tracking-wider flex-shrink-0 group-hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              style={{ color: '#5865F2' }}>
              Vào Discord
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Ghost kanji */}
          <div className="absolute -right-4 -bottom-6 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none"
            style={{ fontSize: 180 }}>友</div>
        </a>
      </section>

      {/* ── CREATE DECK MODAL ─────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-md p-6 sharp-shadow" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
            <h3 className="font-headline font-bold text-on-surface mb-4">Tạo bộ thẻ mới</h3>
            <form onSubmit={(e) => { e.preventDefault(); createDeckMutation.mutate(newDeck); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tên bộ thẻ *</label>
                <input type="text" required value={newDeck.name}
                  onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface text-on-surface text-sm outline-none focus:ring-1"
                  style={{ border: '1px solid rgba(0,0,0,0.15)', focusRingColor: 'var(--secondary)' }}
                  placeholder="Ví dụ: Từ vựng N5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Mô tả</label>
                <textarea value={newDeck.description}
                  onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface text-on-surface text-sm outline-none focus:ring-1 resize-none"
                  style={{ border: '1px solid rgba(0,0,0,0.15)' }}
                  rows={3} placeholder="Mô tả ngắn về bộ thẻ..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newDeck.isPublic}
                  onChange={(e) => setNewDeck({ ...newDeck, isPublic: e.target.checked })}
                  className="w-4 h-4 border-gray-300" />
                <span className="text-xs text-on-surface-variant">Công khai cho mọi người</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={createDeckMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm font-bold text-on-secondary hover:bg-secondary-dim disabled:opacity-50 transition-colors"
                  style={{ background: 'var(--secondary)' }}>
                  {createDeckMutation.isPending ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportAnkiModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
