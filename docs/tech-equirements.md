### Requirements Overview

**Non-Functional Requirements:**

- **Performance:** <100ms interaction response, smooth 60fps animations
- **Offline-First:** Complete functionality without network; Dexie.js local persistence
- **Accessibility:** WCAG AA compliance, full keyboard navigation, screen reader support, `prefers-reduced-motion` respect
- **Time Handling:** Browser local timezone; countdowns resume correctly after app closure
- **Data Ownership:** No server, no cloud sync, no external dependencies in v1
- **No Background Processing:** Time Engine evaluates only on user actions and app load

### Technical Constraints & Dependencies

- **Next.js** (already initialized )
- **shadcn/ui + Tailwind CSS** for UI component system
- **Dexie.js** for IndexedDB abstraction (chosen over raw IndexedDB for simpler API, TypeScript support, migration handling)
- **No real-time backend** — purely client-side application
- **No push notifications** — visual nudges only
- **browser primary** - must be smooth and responsive to all screen sizes (mobile, tablet, desktop)
