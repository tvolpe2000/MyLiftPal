import { browser } from '$app/environment';

export type ThemeId = 'emerald' | 'blue' | 'cyan' | 'indigo' | 'orange' | 'slate' | 'red' | 'pink';

export interface ThemeColors {
	accent: string;
	accentHover: string;
	accentMuted: string;
	bgPrimary: string;
	bgSecondary: string;
	bgTertiary: string;
	border: string;
	textPrimary: string;
	textSecondary: string;
	textMuted: string;
}

export interface Theme {
	id: ThemeId;
	name: string;
	colors: ThemeColors;
}

export const themes: Record<ThemeId, Theme> = {
	emerald: {
		id: 'emerald',
		name: 'Emerald',
		colors: {
			accent: '#10b981',
			accentHover: '#34d399',
			accentMuted: 'rgba(16, 185, 129, 0.2)',
			bgPrimary: '#0a120f',
			bgSecondary: '#0f1a16',
			bgTertiary: '#162420',
			border: '#1f2f29',
			textPrimary: '#ffffff',
			textSecondary: '#a1a1aa',
			textMuted: '#71717a'
		}
	},
	blue: {
		id: 'blue',
		name: 'Blue',
		colors: {
			accent: '#3b82f6',
			accentHover: '#60a5fa',
			accentMuted: 'rgba(59, 130, 246, 0.2)',
			bgPrimary: '#0a0a12',
			bgSecondary: '#0f0f1a',
			bgTertiary: '#161624',
			border: '#1f1f3a',
			textPrimary: '#ffffff',
			textSecondary: '#a1a1aa',
			textMuted: '#71717a'
		}
	},
	cyan: {
		id: 'cyan',
		name: 'Cyan',
		colors: {
			accent: '#06b6d4',
			accentHover: '#22d3ee',
			accentMuted: 'rgba(6, 182, 212, 0.2)',
			bgPrimary: '#0a1214',
			bgSecondary: '#0f191c',
			bgTertiary: '#162124',
			border: '#1f2f32',
			textPrimary: '#ffffff',
			textSecondary: '#a1a1aa',
			textMuted: '#71717a'
		}
	},
	indigo: {
		id: 'indigo',
		name: 'Indigo',
		colors: {
			accent: '#6366f1',
			accentHover: '#818cf8',
			accentMuted: 'rgba(99, 102, 241, 0.2)',
			bgPrimary: '#0c0a14',
			bgSecondary: '#110f1c',
			bgTertiary: '#181626',
			border: '#252040',
			textPrimary: '#ffffff',
			textSecondary: '#a1a1aa',
			textMuted: '#71717a'
		}
	},
	orange: {
		id: 'orange',
		name: 'Orange',
		colors: {
			accent: '#f97316',
			accentHover: '#fb923c',
			accentMuted: 'rgba(249, 115, 22, 0.2)',
			bgPrimary: '#0f0d0a',
			bgSecondary: '#1a1610',
			bgTertiary: '#241e16',
			border: '#3a3020',
			textPrimary: '#ffffff',
			textSecondary: '#a1a1aa',
			textMuted: '#71717a'
		}
	},
	slate: {
		id: 'slate',
		name: 'Slate',
		colors: {
			accent: '#3b82f6',
			accentHover: '#60a5fa',
			accentMuted: 'rgba(59, 130, 246, 0.2)',
			bgPrimary: '#0f172a',
			bgSecondary: '#1e293b',
			bgTertiary: '#334155',
			border: '#475569',
			textPrimary: '#ffffff',
			textSecondary: '#cbd5e1',
			textMuted: '#94a3b8'
		}
	},
	red: {
		id: 'red',
		name: 'Red',
		colors: {
			accent: '#ef4444',
			accentHover: '#f87171',
			accentMuted: 'rgba(239, 68, 68, 0.2)',
			bgPrimary: '#120a0a',
			bgSecondary: '#1a0f0f',
			bgTertiary: '#241616',
			border: '#3a2020',
			textPrimary: '#ffffff',
			textSecondary: '#a1a1aa',
			textMuted: '#71717a'
		}
	},
	pink: {
		id: 'pink',
		name: 'Pink',
		colors: {
			accent: '#ec4899',
			accentHover: '#f472b6',
			accentMuted: 'rgba(236, 72, 153, 0.2)',
			bgPrimary: '#120a10',
			bgSecondary: '#1a0f17',
			bgTertiary: '#24161f',
			border: '#3a2032',
			textPrimary: '#ffffff',
			textSecondary: '#a1a1aa',
			textMuted: '#71717a'
		}
	}
};

const STORAGE_KEY = 'myliftpal-theme';

function createThemeStore() {
	let currentTheme = $state<ThemeId>('emerald');

	function applyTheme(themeId: ThemeId) {
		if (!browser) return;

		const theme = themes[themeId];
		const root = document.documentElement;

		root.style.setProperty('--color-accent', theme.colors.accent);
		root.style.setProperty('--color-accent-hover', theme.colors.accentHover);
		root.style.setProperty('--color-accent-muted', theme.colors.accentMuted);
		root.style.setProperty('--color-bg-primary', theme.colors.bgPrimary);
		root.style.setProperty('--color-bg-secondary', theme.colors.bgSecondary);
		root.style.setProperty('--color-bg-tertiary', theme.colors.bgTertiary);
		root.style.setProperty('--color-border', theme.colors.border);
		root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
		root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
		root.style.setProperty('--color-text-muted', theme.colors.textMuted);
	}

	function initialize() {
		if (!browser) return;

		const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
		if (stored && themes[stored]) {
			currentTheme = stored;
		}
		applyTheme(currentTheme);
	}

	function setTheme(themeId: ThemeId) {
		if (!themes[themeId]) return;

		currentTheme = themeId;
		applyTheme(themeId);

		if (browser) {
			localStorage.setItem(STORAGE_KEY, themeId);
		}
	}

	return {
		get current() {
			return currentTheme;
		},
		get theme() {
			return themes[currentTheme];
		},
		initialize,
		setTheme
	};
}

export const theme = createThemeStore();
