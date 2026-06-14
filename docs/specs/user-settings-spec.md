# Spec: User Settings Feature

## Objective
Provide regular users with a comprehensive settings dashboard to personalize their learning experience on Minhongo. Currently, the "Cài đặt" (Settings) option in the sidebar only opens a language selector, and many settings are placeholders or missing. 

This feature will implement a dedicated `/settings` page where users can configure:
1. **Appearance**: Toggle theme (Light, Dark, Auto/System), scale Japanese text size, and configure Romaji assistance.
2. **Audio**: Toggle auto-play TTS audio when flashcards or grammar cards are shown.
3. **Application Language**: Toggle interface language (Tiếng Việt, English).

Success looks like a responsive, visually stunning settings dashboard adhering to the project's Japanese aesthetic, with instant settings application and persistent configuration via `localStorage`.

---

## Tech Stack
- **Frontend**: React (React Router v7, `@tanstack/react-query`, TailwindCSS).
- **Icons**: `lucide-react` (or matching custom icons from the design system).
- **State Persistence**: `localStorage` (no database changes needed for UI/audio preferences).

---

## Commands
- **Dev Server**: `npm run dev` (in `frontend/` directory)
- **Build**: `npm run build` (in `frontend/` directory)
- **Lint**: `npm run lint` (in `frontend/` directory)

---

## Project Structure
- `frontend/src/pages/SettingsPage.jsx` [NEW] — Main page for settings.
- `frontend/src/contexts/SettingsContext.jsx` [NEW] — React Context to manage settings globally (theme class toggling, TTS configuration, Romaji config, and font size scaling).
- `frontend/src/components/AppLayout.jsx` [MODIFY] — Redirect "Cài đặt" nav item to the settings page instead of using the hover dropdown.
- `frontend/src/index.css` [MODIFY] — Add CSS variables and palette override for warm Dark Mode and global Noto Serif JP text scaling.

---

## Code Style
One snippet showing the global theme and CSS variable injection:
```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [autoPlayAudio, setAutoPlayAudio] = useState(() => localStorage.getItem('autoPlayAudio') !== 'false');
  const [jpFontScale, setJpFontScale] = useState(() => parseFloat(localStorage.getItem('jpFontScale')) || 1.0);
  const [showRomaji, setShowRomaji] = useState(() => localStorage.getItem('showRomaji') !== 'false');

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
    
    // Apply font scale
    root.style.setProperty('--jp-font-scale', `${jpFontScale}`);
  }, [theme, jpFontScale]);

  const value = { theme, setTheme, autoPlayAudio, setAutoPlayAudio, jpFontScale, setJpFontScale, showRomaji, setShowRomaji };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
```

---

## Testing & Verification Strategy
- **Visual Checks**: Toggle light/dark themes and confirm all containers, backgrounds, texts, and buttons update harmoniously without contrast errors.
- **Accessibility**: Ensure keyboard focus works on all settings switches, buttons, and dropdowns.
- **Persistence**: Reload the page or close/reopen browser tabs to confirm selections are preserved in `localStorage`.
- **Text-to-Speech Verification**: When autoplay is off, flashcards should load silently. When autoplay is on, TTS should pronounce Japanese text immediately upon card activation.

---

## Boundaries
- **Always**: Use CSS variables for custom colors so that themes toggle clean and fast.
- **Ask first**: If we need to sync these settings to the backend database. (Currently assuming `localStorage` is sufficient for display/audio parameters).
- **Never**: Force native system audio if Web Speech API is not supported (provide graceful mute/degradation).

---

## Success Criteria
- [ ] A new route `/settings` is accessible and displays a settings UI.
- [ ] Changing theme to "Dark" switches the app colors using a custom Japanese-charcoal theme.
- [ ] Changing font size updates the scale of `.font-jp` Japanese text.
- [ ] State for settings is loaded and saved to `localStorage` automatically.
- [ ] Settings icon/link in sidebar routes to `/settings`.
- [ ] No compilation or console errors during development or build.

---

## Open Questions for Human Review
1. **Should settings be synced to the database?**
   - *Recommendation*: Keep visual settings (Theme, Font Scale, Romaji) and Audio settings (TTS) in `localStorage` for now. This keeps performance instant and avoids database overhead or schema changes.
2. **What style of dark mode do you prefer?**
   - *Recommendation*: A charcoal/warm dark mode palette (`#121212` / `#1e1e1e` with soft beige accents) which matches the warm Japanese feel of the site better than pure black.
