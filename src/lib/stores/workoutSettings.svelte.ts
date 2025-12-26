import { browser } from '$app/environment';

export type WeightInputStyle = 'buttons' | 'scroll';
export type RepInputStyle = 'buttons' | 'scroll';
export type WeightIncrement = 2.5 | 5 | 10;

export interface WorkoutPreferences {
	weightInputStyle: WeightInputStyle;
	repInputStyle: RepInputStyle;
	defaultWeightIncrement: WeightIncrement;
	repQuickSelectValues: number[];
}

const STORAGE_KEY = 'myliftpal-workout-settings';

const DEFAULT_PREFERENCES: WorkoutPreferences = {
	weightInputStyle: 'scroll',
	repInputStyle: 'buttons',
	defaultWeightIncrement: 5,
	repQuickSelectValues: [6, 8, 10, 12, 15]
};

function createWorkoutSettingsStore() {
	let preferences = $state<WorkoutPreferences>({ ...DEFAULT_PREFERENCES });

	function initialize() {
		if (!browser) return;

		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as Partial<WorkoutPreferences>;
				preferences = {
					...DEFAULT_PREFERENCES,
					...parsed
				};
			} catch {
				// Invalid JSON, use defaults
				preferences = { ...DEFAULT_PREFERENCES };
			}
		}
	}

	function save() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
	}

	function setWeightInputStyle(style: WeightInputStyle) {
		preferences.weightInputStyle = style;
		save();
	}

	function setRepInputStyle(style: RepInputStyle) {
		preferences.repInputStyle = style;
		save();
	}

	function setDefaultWeightIncrement(increment: WeightIncrement) {
		preferences.defaultWeightIncrement = increment;
		save();
	}

	function setRepQuickSelectValues(values: number[]) {
		preferences.repQuickSelectValues = values;
		save();
	}

	return {
		get weightInputStyle() {
			return preferences.weightInputStyle;
		},
		get repInputStyle() {
			return preferences.repInputStyle;
		},
		get defaultWeightIncrement() {
			return preferences.defaultWeightIncrement;
		},
		get repQuickSelectValues() {
			return preferences.repQuickSelectValues;
		},
		initialize,
		setWeightInputStyle,
		setRepInputStyle,
		setDefaultWeightIncrement,
		setRepQuickSelectValues
	};
}

export const workoutSettings = createWorkoutSettingsStore();
