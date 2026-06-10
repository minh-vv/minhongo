import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

export default function CollapsibleExample({ 
  example, 
  onSpeak, 
  variant = 'card', // 'card' or 'text'
  containerClass = '',
  maxHeightClass = '',
  titleColorClass = '',
  textColorClass = '',
  secondaryTextColorClass = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!example) return null;

  // Split example by double newlines to separate individual example blocks or notes
  const blocks = example.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  if (blocks.length === 0) return null;

  const firstBlock = blocks[0];
  const hasMore = blocks.length > 1;

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Determine styles based on variant
  const isTextMode = variant === 'text';

  const defaultContainer = containerClass || (
    isTextMode 
      ? "w-full text-left" 
      : "w-full text-left pl-3 border-l-2 border-secondary py-0.5"
  );
  
  const defaultMaxHeight = maxHeightClass || (
    isTextMode 
      ? "" 
      : "max-h-[120px]"
  );

  const defaultTitleColor = titleColorClass || "text-on-surface-variant/60";
  const defaultTextColor = textColorClass || "text-on-surface";
  const defaultSecondaryTextColor = secondaryTextColorClass || "text-on-surface-variant";

  if (isTextMode) {
    return (
      <div 
        className={`${defaultContainer} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`text-sm leading-relaxed font-jp ${defaultTextColor} whitespace-pre-line`}>
          {firstBlock}
        </p>

        {hasMore && (
          <div className="mt-1 flex flex-col">
            {!isExpanded ? (
              <button
                onClick={handleToggle}
                className="text-[11px] font-bold text-secondary hover:text-primary transition-colors flex items-center gap-0.5 mt-0.5 self-start hover:underline"
              >
                <ChevronDown className="w-3 h-3" /> Xem thêm ví dụ ({blocks.length - 1})
              </button>
            ) : (
              <>
                <div className="space-y-2.5 mt-2 pl-2 border-l border-dashed border-outline-variant/30">
                  {blocks.slice(1).map((block, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase">
                          Ví dụ {idx + 2}
                        </span>
                        {onSpeak && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSpeak(block);
                            }}
                            className="p-0.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-secondary transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className={`font-jp leading-relaxed ${defaultSecondaryTextColor} whitespace-pre-line`}>
                        {block}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleToggle}
                  className="text-[11px] font-bold text-secondary hover:text-primary transition-colors flex items-center gap-0.5 mt-1.5 self-start hover:underline"
                >
                  <ChevronUp className="w-3 h-3" /> Thu gọn
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Card mode (for Flashcards, SRS, etc.)
  return (
    <div 
      className={`${defaultContainer} ${isExpanded ? 'max-h-[220px]' : defaultMaxHeight} flex flex-col transition-all duration-300 overflow-y-auto custom-scrollbar`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-0.5 mb-1.5">
        <p className={`text-[9px] font-bold ${defaultTitleColor} uppercase tracking-wider`}>
          Ví dụ câu
        </p>
        <div className="flex items-center gap-2">
          {onSpeak && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSpeak(firstBlock);
              }}
              className="p-0.5 hover:bg-surface-container rounded text-secondary hover:text-secondary-hover transition-colors"
              title="Nghe câu ví dụ"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className={`text-sm font-medium leading-relaxed font-jp ${defaultTextColor} whitespace-pre-line`}>
        {firstBlock}
      </p>

      {hasMore && (
        <div className="mt-2 pt-1.5 border-t border-dashed border-outline-variant/20 flex flex-col">
          {!isExpanded ? (
            <button
              onClick={handleToggle}
              className="text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors flex items-center gap-1 mt-1 self-start"
            >
              <ChevronDown className="w-3.5 h-3.5" /> Xem thêm ví dụ ({blocks.length - 1})
            </button>
          ) : (
            <>
              <div className="space-y-3 mt-1.5 mb-2">
                {blocks.slice(1).map((block, idx) => (
                  <div key={idx} className="pt-2 border-t border-outline-variant/10 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-semibold text-on-surface-variant/40 bg-surface-container-high px-1 rounded">
                        Ví dụ {idx + 2}
                      </span>
                      {onSpeak && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSpeak(block);
                          }}
                          className="p-0.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-secondary transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className={`text-sm font-medium leading-relaxed font-jp ${defaultSecondaryTextColor} whitespace-pre-line`}>
                      {block}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleToggle}
                className="text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors flex items-center gap-1 mt-1 self-start"
              >
                <ChevronUp className="w-3.5 h-3.5" /> Thu gọn
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
