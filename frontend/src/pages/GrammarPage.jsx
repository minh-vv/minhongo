import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  HelpCircle,
  Loader2,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { flashcardApi } from '../api/flashcardApi';

const JLPT_LEVELS = [5, 4, 3, 2, 1];

/** Sáº¯p xáº¿p sá»‘ bÃ i cá»§a giÃ¡o trÃ¬nh */
const getLessonNumber = (name) => {
  const match = name.match(/BÃ i\s*(\d+)/i);
  return match ? parseInt(match[1]) : 999;
};

export default function GrammarPage() {
  const navigate = useNavigate();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    flashcardApi.getPublicDecks()
      .then((data) => {
        const grammarDecks = data.filter((d) => d.category === 'NGUPHAP');
        setDecks(grammarDecks);
      })
      .catch((err) => console.error('Lá»—i khi táº£i danh sÃ¡ch bá»™ tháº» ngá»¯ phÃ¡p:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredDecks = useMemo(() => {
    let result = decks;
    if (selectedLevel !== null) result = result.filter((d) => d.jlptLevel === selectedLevel);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const numA = getLessonNumber(a.name);
      const numB = getLessonNumber(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [decks, selectedLevel, searchQuery]);

  const totalGrammarPoints = decks.reduce((sum, d) => sum + (d._count?.cards || 0), 0);

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 min-h-screen">

      {/* â”€â”€ HERO BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative overflow-hidden animate-fade-up border-2 border-primary" style={{ minHeight: 140 }}>
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 asanoha-bg opacity-15" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-secondary" />

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 mb-3"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="w-1.5 h-1.5 rotate-45 bg-secondary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                Há»c & Tra Cá»©u ChuyÃªn SÃ¢u
              </span>
            </div>
            <h1 className="font-jp text-3xl md:text-4xl font-bold text-white tracking-wide">
              æ–‡æ³• â€¢ TRANG Há»ŒC NGá»® PHÃP
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl font-medium">
              Click vÃ o bÃ i há»c Ä‘á»ƒ xem lÃ½ thuyáº¿t Ä‘áº§y Ä‘á»§, vÃ­ dá»¥ thá»±c táº¿ vÃ  luyá»‡n táº­p ngay.
            </p>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center bg-white/5 px-5 py-3 border border-white/10 sharp-shadow-sm">
              <p className="text-2xl font-black text-white leading-none">{decks.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">BÃ i há»c</p>
            </div>
            <div className="text-center bg-white/5 px-5 py-3 border border-white/10 sharp-shadow-sm">
              <p className="text-2xl font-black text-white leading-none">{totalGrammarPoints}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Cáº¥u trÃºc</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-6 -bottom-6 font-jp font-bold text-white/[0.03] leading-none select-none pointer-events-none text-[180px]">
          æ–‡
        </div>
      </section>

      {/* â”€â”€ SEARCH & LEVEL FILTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-4 border-b border-outline-variant/40">

        {/* JLPT Level tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setSelectedLevel(null)}
            className="whitespace-nowrap px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider border border-outline-variant/60 sharp-shadow-sm shrink-0"
            style={selectedLevel === null
              ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
              : { background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }
            }
          >
            Táº¥t cáº£
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className="whitespace-nowrap px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider border border-outline-variant/60 sharp-shadow-sm shrink-0"
              style={selectedLevel === level
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : { background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }
              }
            >
              JLPT N{level}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="TÃ¬m kiáº¿m bÃ i há»c ngá»¯ phÃ¡p..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant focus:outline-none border-2 border-outline-variant/40"
          />
        </div>
      </div>

      {/* â”€â”€ LESSON LIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-on-surface-variant font-medium">Äang náº¡p dá»¯ liá»‡u ngá»¯ phÃ¡p...</p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-container-lowest border border-outline-variant/30 p-8 sharp-shadow">
          <HelpCircle className="w-16 h-16 text-on-surface-variant/40 mb-4" />
          <h3 className="font-bold text-on-surface text-lg">KhÃ´ng tÃ¬m tháº¥y bÃ i há»c phÃ¹ há»£p</h3>
          <p className="text-on-surface-variant text-sm mt-1 max-w-md">
            HÃ£y thá»­ Ä‘á»•i cáº¥p Ä‘á»™ JLPT hoáº·c tá»« khÃ³a tÃ¬m kiáº¿m khÃ¡c.
          </p>
          <button
            onClick={() => { setSelectedLevel(null); setSearchQuery(''); }}
            className="mt-4 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border-2 border-primary hover:bg-primary hover:text-white transition-all sharp-shadow-sm"
          >
            Äáº·t láº¡i bá»™ lá»c
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-on-surface-variant px-1">
            <p>
              Hiá»ƒn thá»‹ <span className="font-bold text-on-surface">{filteredDecks.length}</span> bÃ i há»c ngá»¯ phÃ¡p
            </p>
            {selectedLevel && (
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase bg-primary/10 text-primary">
                JLPT N{selectedLevel}
              </span>
            )}
          </div>

          {/* Lesson cards grid â€” click to navigate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDecks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => navigate(`/grammar/${deck.id}`)}
                className="group bg-surface-container-lowest border-2 border-outline-variant/50 overflow-hidden transition-all sharp-shadow hover:sharp-shadow-sm hover:-translate-y-0.5 text-left w-full"
              >
                {/* Top accent on hover */}
                <div
                  className="h-1 w-full transition-all"
                  style={{ background: 'var(--primary)', opacity: 0 }}
                  ref={(el) => {
                    if (el) {
                      el.closest('button').addEventListener('mouseenter', () => { el.style.opacity = '1'; });
                      el.closest('button').addEventListener('mouseleave', () => { el.style.opacity = '0'; });
                    }
                  }}
                />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* JLPT badge */}
                    <div className="w-12 h-12 bg-primary/5 text-primary flex-shrink-0 flex flex-col items-center justify-center border border-primary/20">
                      <span className="text-[10px] font-bold text-primary/75 leading-none">JLPT</span>
                      <span className="text-lg font-bold leading-none mt-0.5">N{deck.jlptLevel || '?'}</span>
                    </div>

                    {/* Title + description */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-jp font-bold text-on-surface text-base leading-snug group-hover:text-primary transition-colors">
                        {deck.name}
                      </h3>
                      {deck.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                          {deck.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/20">
                    <span className="text-xs font-semibold px-2 py-1 bg-surface-container text-on-surface border border-outline-variant/40">
                      {deck._count?.cards || 0} Ä‘iá»ƒm ngá»¯ phÃ¡p
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Xem lÃ½ thuyáº¿t <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}