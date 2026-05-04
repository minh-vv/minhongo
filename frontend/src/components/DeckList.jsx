import { Link } from 'react-router-dom';

export default function DeckList({ decks, title, showManage = false }) {
  if (!decks || decks.length === 0) {
    return <div className="py-10 text-center text-sm text-on-surface-variant">Chưa có bộ thẻ nào.</div>;
  }

  return (
    <div>
      {title && <h2 className="font-headline font-bold text-on-surface mb-4">{title}</h2>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {decks.map((deck) => (
          <div key={deck.id}
            className="group bg-surface-container-lowest p-5 transition-all hover:sharp-shadow-sm relative overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            {/* Top accent on hover */}
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'var(--secondary)' }} />

            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-on-surface mb-0.5 leading-tight">{deck.name}</h3>
                {deck.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{deck.description}</p>
                )}
              </div>
              {deck.isPublic && (
                <span className="ml-2 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                  style={{ background: 'rgba(0,128,0,0.08)', color: '#166534' }}>
                  Công khai
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-4">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <span>{deck._count?.cards || 0} thẻ</span>
              {deck.user && <span className="ml-auto">bởi {deck.user.name || deck.user.email}</span>}
            </div>

            <div className="flex gap-2">
              {showManage && (
                <Link to={`/deck/${deck.id}`}
                  className="flex-1 text-center py-1.5 px-3 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                  Quản lý
                </Link>
              )}
              <Link to={`/study/${deck.id}`}
                className="flex-1 text-center py-1.5 px-3 text-xs font-bold text-on-secondary uppercase tracking-wider transition-colors hover:bg-secondary-dim"
                style={{ background: 'var(--secondary)' }}>
                Học ngay
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
