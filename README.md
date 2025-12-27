# MyLiftPal

A Progressive Web App (PWA) for tracking hypertrophy-focused weight training with intelligent volume management.

## Features

- **Training Block Wizard**: Create periodized training programs with templates (PPL, Upper/Lower, Full Body, etc.)
- **Volume Tracking**: Real-time weekly volume per muscle group with visual indicators (Low/Good/High)
- **Smart Suggestions**: Auto-suggest weight/reps based on previous session performance
- **Offline Support**: Download workouts for use without internet, auto-sync when reconnected
- **Time Estimation**: Project workout duration accounting for progressive overload
- **In-App Changelog**: Stay informed about updates and upcoming features

## Tech Stack

- **Framework**: SvelteKit with Svelte 5 (runes syntax)
- **Styling**: Tailwind CSS v4 + CSS custom properties for theming
- **Backend**: Supabase (Auth + PostgreSQL with RLS)
- **Icons**: lucide-svelte
- **Build**: Vite 7

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/MyLiftPal.git
cd MyLiftPal

# Install dependencies
npm install

# Copy environment file and add your Supabase credentials
cp .env.example .env
```

### Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript checking
npm run lint         # Linting and formatting check
```

## Project Structure

```
src/
├── lib/
│   ├── components/     # UI components (wizard, workout, ui)
│   ├── stores/         # Svelte 5 runes stores
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities (volume, time, progression)
│   └── db/             # Supabase client
├── routes/             # SvelteKit routes
│   ├── auth/           # Login, signup, forgot password
│   ├── blocks/         # Training blocks management
│   ├── exercises/      # Exercise library
│   ├── settings/       # User settings
│   └── changelog/      # App updates and roadmap

docs/                   # Development documentation
specs/                  # Product specifications
supabase/               # Database migrations and scripts
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Development guidance for AI assistants
- **[docs/ROADMAP.md](./docs/ROADMAP.md)**: Feature status and upcoming work
- **[docs/AI_ASSISTANT.md](./docs/AI_ASSISTANT.md)**: Voice assistant architecture (planned)
- **[docs/devlog.md](./docs/devlog.md)**: Development progress notes

## License

Private - All rights reserved
