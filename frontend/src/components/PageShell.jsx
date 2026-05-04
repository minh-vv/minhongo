/**
 * PageShell — KikiGaki-style content page wrapper.
 *
 * Outer container: asanoha texture + left/top border + sharp shadow
 * Header:          square icon · uppercase title · mono subtitle · right-side actions
 * Divider:         thin bottom border separating header from content
 */
export default function PageShell({
  icon,
  iconBg = 'var(--primary)',
  title,
  subtitle,
  actions,
  children,
  maxWidth = 'max-w-5xl',
}) {
  const borderColor = 'rgba(206,196,186,0.3)';

  return (
    <div className={`${maxWidth} mx-auto asanoha-bg p-6 md:p-8 min-h-[60vh] relative sharp-shadow mt-4`}
      style={{
        borderLeft:  '4px solid ' + borderColor,
        borderTop:   '4px solid ' + borderColor,
      }}
    >
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 mb-8"
        style={{ borderBottom: '2px solid ' + borderColor }}>

        {/* Left: icon + text */}
        <div className="flex items-center gap-4">
          {/* Square icon — no border-radius, sharp shadow */}
          <div className="w-14 h-14 flex items-center justify-center sharp-shadow-sm flex-shrink-0"
            style={{ background: iconBg }}>
            <span className="text-on-primary">{icon}</span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-on-surface uppercase"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs font-medium text-on-surface-variant font-mono tracking-widest uppercase mt-1.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {children}
    </div>
  );
}
