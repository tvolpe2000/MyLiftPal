# Architecture Decision Records

This document tracks key technical decisions and their rationale.

## Template

```markdown
### [Decision Title]
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded

**Context:** What is the situation that requires a decision?

**Decision:** What was decided?

**Rationale:** Why this choice over alternatives?

**Consequences:** What are the trade-offs?
```

---

## Decisions

### Use Supabase for Backend
**Date:** 2024-12
**Status:** Accepted

**Context:** Need a backend for auth, database, and real-time sync with offline support.

**Decision:** Use Supabase as the backend-as-a-service platform.

**Rationale:**
- Built-in auth with multiple providers
- PostgreSQL database with Row Level Security
- Real-time subscriptions for sync
- Good free tier for MVP
- JavaScript client library works well with SvelteKit

**Consequences:**
- Vendor dependency on Supabase
- Need to handle offline sync manually (Supabase doesn't have built-in offline)

---

### Use SvelteKit with Svelte 5
**Date:** 2024-12
**Status:** Accepted

**Context:** Need a modern framework for building a PWA.

**Decision:** Use SvelteKit with Svelte 5 (runes syntax).

**Rationale:**
- Excellent performance (compiled, minimal runtime)
- Great developer experience
- Built-in SSR/SSG options
- Svelte 5 runes provide clearer reactivity model
- Good PWA support

**Consequences:**
- Svelte 5 is newer, some ecosystem packages may lag
- Team needs to learn runes syntax (`$state`, `$props`, etc.)

---

### Use Tailwind CSS v4
**Date:** 2024-12
**Status:** Accepted

**Context:** Need a styling solution that supports rapid UI development.

**Decision:** Use Tailwind CSS v4 with the Vite plugin.

**Rationale:**
- Utility-first approach speeds up development
- v4 has simpler setup (just `@import 'tailwindcss'`)
- Works well with component-based architecture
- Easy to implement design system tokens

**Consequences:**
- HTML can get verbose with many utility classes
- Need to extract components for repeated patterns

<!-- Add new decisions above this line -->
