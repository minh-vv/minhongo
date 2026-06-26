import { Link } from 'react-router-dom';

export default function PageHeader({
  tag,
  title,
  subtitle,
  ghostChar,
  accentColor = 'var(--secondary)',
  gradientBg = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #0d1b5e 100%)',
  rightContent,
  backLink,
  backText = 'Quay lại',
  children,
  minHeight,
  compact = false,
}) {
  return (
    <section 
      className="relative overflow-hidden animate-fade-up" 
      style={{ minHeight: minHeight || (children ? undefined : (compact ? 90 : 130)) }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0" style={{ background: gradientBg }} />
      {/* Asanoha overlay */}
      <div className="absolute inset-0 asanoha-bg opacity-20" />
      {/* Accent right bar */}
      <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: accentColor }} />

      <div className={`relative z-10 ${compact ? 'p-5 md:p-6' : 'p-8 md:p-10'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div className="min-w-0 flex-1">
          {backLink && (
            <Link
              to={backLink}
              className={`inline-flex items-center gap-1.5 text-white/70 hover:text-white ${compact ? 'mb-2' : 'mb-4'} text-xs font-bold uppercase tracking-wider transition-colors`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {backText}
            </Link>
          )}

          {children ? (
            children
          ) : (
            <div>
              {tag && (
                <div 
                  className={`inline-flex items-center gap-2 bg-white/10 px-3 py-1 ${compact ? 'mb-2' : 'mb-4'}`} 
                  style={{ backdropFilter: 'blur(4px)' }}
                >
                  <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: accentColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                    {tag}
                  </span>
                </div>
              )}
              <h1 
                className={`font-headline ${compact ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'} font-bold text-white leading-tight`} 
                style={{ letterSpacing: '-0.02em' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className={`text-white/60 ${compact ? 'text-xs mt-1' : 'text-sm mt-2'} max-w-xl font-medium`}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>

      {ghostChar && (
        <div 
          className={`absolute -right-4 -bottom-4 font-jp font-bold text-white/[0.04] leading-none select-none pointer-events-none ${compact ? 'text-[100px]' : 'text-[160px]'}`}
        >
          {ghostChar}
        </div>
      )}
    </section>
  );
}
