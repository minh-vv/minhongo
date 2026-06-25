import { NavLink } from 'react-router-dom';
import { MessageSquare, Keyboard, Mic } from 'lucide-react';

export default function ListeningNav() {
  const tabs = [
    {
      path: '/listening/dialogue',
      label: 'Nghe hội thoại',
      icon: <MessageSquare className="w-4 h-4" />,
      desc: 'Hội thoại thực tế & trắc nghiệm'
    },
    {
      path: '/listening/sentence',
      label: 'Điền từ & chép câu',
      icon: <Keyboard className="w-4 h-4" />,
      desc: 'Chép chính tả cloze/dictation'
    },
    {
      path: '/listening/shadowing',
      label: 'Nói đuổi Shadowing',
      icon: <Mic className="w-4 h-4" />,
      desc: 'Luyện phát âm & chấm điểm'
    }
  ];

  return (
    <div className="w-full bg-surface-container-lowest border-b border-outline-variant/30 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start md:justify-center overflow-x-auto no-scrollbar py-2 md:py-0">
          <nav className="flex space-x-2 md:space-x-8" aria-label="Listening practice modes">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-3 md:py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-secondary text-secondary bg-surface-container-low/10'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50'
                  }`
                }
              >
                {tab.icon}
                <div className="text-left">
                  <span className="block">{tab.label}</span>
                  <span className="hidden md:block text-[8px] text-on-surface-variant/60 font-normal normal-case tracking-normal mt-0.5">
                    {tab.desc}
                  </span>
                </div>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
