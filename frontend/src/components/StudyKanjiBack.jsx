import { useMemo } from 'react';

const parseKanjiBack = (backText) => {
  const info = {
    meaning: '',
    hantext: '',
    radical: '',
    on: '',
    kun: '',
    mnemonic: '',
    examplesOn: [],
    examplesKun: []
  };
  if (!backText) return info;
  
  let currentSection = '';
  const lines = backText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('Ý nghĩa:')) {
      info.meaning = trimmed.replace('Ý nghĩa:', '').trim();
    } else if (trimmed.startsWith('Âm Hán Việt:')) {
      info.hantext = trimmed.replace('Âm Hán Việt:', '').trim();
    } else if (trimmed.startsWith('Bộ thủ:')) {
      info.radical = trimmed.replace('Bộ thủ:', '').trim();
    } else if (trimmed.startsWith('Onyomi (Âm On):') || trimmed.startsWith('Onyomi:')) {
      info.on = trimmed.replace(/Onyomi\s*\(Âm\s*On\):\s*|Onyomi:\s*/gi, '').trim();
    } else if (trimmed.startsWith('Kunyomi (Âm Kun):') || trimmed.startsWith('Kunyomi:')) {
      info.kun = trimmed.replace(/Kunyomi\s*\(Âm\s*Kun\):\s*|Kunyomi:\s*/gi, '').trim();
    } else if (trimmed.startsWith('Cách ghi nhớ:')) {
      info.mnemonic = trimmed.replace('Cách ghi nhớ:', '').trim();
    } else if (trimmed.startsWith('Ví dụ Onyomi:')) {
      currentSection = 'examplesOn';
    } else if (trimmed.startsWith('Ví dụ Kunyomi:')) {
      currentSection = 'examplesKun';
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const item = trimmed.replace(/^[-*]\s*/, '').trim();
      if (currentSection === 'examplesOn') {
        info.examplesOn.push(item);
      } else if (currentSection === 'examplesKun') {
        info.examplesKun.push(item);
      }
    }
  }
  return info;
};

export default function StudyKanjiBack({ kanji, backText }) {
  const parsed = useMemo(() => parseKanjiBack(backText), [backText]);
  
  return (
    <div className="w-full text-left space-y-2.5 max-h-[260px] overflow-y-auto pr-1 select-text scrollbar-thin">
      {/* Kanji & Meanings */}
      <div className="text-center border-b border-outline-variant/15 pb-2">
        <h3 className="font-jp font-black text-4xl text-on-surface mb-1">{kanji}</h3>
        <div className="flex justify-center gap-2 flex-wrap">
          {parsed.hantext && (
            <span className="text-[10px] font-black tracking-wider text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded uppercase">
              {parsed.hantext}
            </span>
          )}
          <span className="text-xs font-semibold text-on-surface-variant">
            Ý nghĩa: <strong className="text-on-surface">{parsed.meaning || 'Đang cập nhật'}</strong>
          </span>
        </div>
      </div>

      {/* Radical & Readings Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-surface-container-low border border-outline-variant/10 rounded">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">• Bộ thủ</span>
          <span className="font-semibold text-on-surface">{parsed.radical || '-'}</span>
        </div>
        <div className="p-2 bg-surface-container-low border border-outline-variant/10 rounded">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">• Onyomi</span>
          <span className="font-semibold font-jp text-on-surface">{parsed.on || '-'}</span>
        </div>
        <div className="p-2 bg-surface-container-low border border-outline-variant/10 rounded col-span-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">• Kunyomi</span>
          <span className="font-semibold font-jp text-on-surface">{parsed.kun || '-'}</span>
        </div>
      </div>

      {/* Mnemonic story if any */}
      {parsed.mnemonic && (
        <div className="p-2 bg-amber-500/5 border border-amber-500/15 rounded text-xs leading-relaxed italic text-on-surface-variant text-center">
          <span className="font-bold text-amber-700 dark:text-amber-400 not-italic block text-[10px] uppercase tracking-wider mb-0.5">Mnemonic</span>
          "{parsed.mnemonic}"
        </div>
      )}

      {/* Examples if any */}
      {(parsed.examplesOn.length > 0 || parsed.examplesKun.length > 0) && (
        <div className="space-y-1 border-t border-outline-variant/10 pt-2 text-xs">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">• Từ ghép ví dụ</span>
          <div className="max-h-[70px] overflow-y-auto space-y-1 pr-1 font-jp text-on-surface-variant">
            {parsed.examplesOn.map((ex, idx) => (
              <div key={`on-${idx}`} className="py-0.5 border-b border-outline-variant/5 last:border-0">• On: {ex}</div>
            ))}
            {parsed.examplesKun.map((ex, idx) => (
              <div key={`kun-${idx}`} className="py-0.5 border-b border-outline-variant/5 last:border-0">• Kun: {ex}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
