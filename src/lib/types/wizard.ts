import type { Exercise, TrainingGoal } from './index';

export type WizardStep = 1 | 2 | 3 | 4;

export interface WorkoutDayDraft {
	id: string; // Temporary client-side ID
	dayNumber: number;
	name: string;
	targetMuscles: string[];
	timeBudgetMinutes: number | null;
}

export interface ExerciseSlotDraft {
	id: string; // Temporary client-side ID
	exerciseId: string;
	exercise?: Exercise; // Cached exercise data for display
	slotOrder: number;
	baseSets: number;
	setProgression: number; // e.g., 0, 0.5, 1
	repRangeMin: number;
	repRangeMax: number;
	restSeconds: number | null; // null = use exercise/user default
	supersetGroup: string | null; // 'A', 'B', 'C', or null
	notes: string;
}

export interface WizardState {
	currentStep: WizardStep;

	// Step 1: Basic Info
	blockName: string;
	goal: TrainingGoal;
	totalWeeks: number;
	daysPerWeek: number;
	timeBudgetMinutes: number | null;

	// Step 2: Workout Days
	workoutDays: WorkoutDayDraft[];

	// Step 3: Exercises per day (keyed by day ID)
	exerciseSlots: Record<string, ExerciseSlotDraft[]>;

	// Validation
	isValid: boolean;
	isDirty: boolean;
}

// Volume calculation types
export interface VolumeBreakdown {
	muscleId: string;
	muscleName: string;
	directSets: number;
	indirectSets: number;
	totalEffective: number;
	status: VolumeStatusLevel;
}

export type VolumeStatusLevel =
	| 'below_mv'
	| 'at_mev'
	| 'in_mav'
	| 'approaching_mrv'
	| 'exceeds_mrv';

export function getVolumeColor(status: VolumeStatusLevel): string {
	switch (status) {
		case 'below_mv':
			return '#ef4444'; // red
		case 'at_mev':
			return '#eab308'; // yellow
		case 'in_mav':
			return '#22c55e'; // green
		case 'approaching_mrv':
			return '#f97316'; // orange
		case 'exceeds_mrv':
			return '#ef4444'; // red
	}
}

// Time estimation types
export interface TimeBreakdown {
	workMinutes: number;
	restMinutes: number;
	transitionMinutes: number;
	totalMinutes: number;
}

export interface WeeklyTimeProjection {
	weekNumber: number;
	perDay: Record<string, TimeBreakdown>;
	totalMinutes: number;
}

// Default values for new items
export function createDefaultWorkoutDay(dayNumber: number): WorkoutDayDraft {
	return {
		id: crypto.randomUUID(),
		dayNumber,
		name: `Day ${dayNumber}`,
		targetMuscles: [],
		timeBudgetMinutes: null
	};
}

export function createDefaultExerciseSlot(
	exercise: Exercise,
	slotOrder: number
): ExerciseSlotDraft {
	return {
		id: crypto.randomUUID(),
		exerciseId: exercise.id,
		exercise,
		slotOrder,
		baseSets: 3,
		setProgression: 0.5,
		repRangeMin: exercise.default_rep_min,
		repRangeMax: exercise.default_rep_max,
		restSeconds: null, // Use default
		supersetGroup: null,
		notes: ''
	};
}

// Set progression formula
export function calculateSetsForWeek(
	baseSets: number,
	progression: number,
	weekNumber: number
): number {
	return Math.ceil(baseSets + progression * (weekNumber - 1));
}
