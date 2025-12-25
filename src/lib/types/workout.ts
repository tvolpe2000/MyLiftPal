// Workout tracking types

import type {
	Exercise,
	ExerciseSlot,
	WorkoutSession,
	LoggedSet,
	WorkoutDay,
	TrainingBlockStatus
} from './index';

// Extended types for workout UI
export interface ExerciseSlotWithExercise extends ExerciseSlot {
	exercise: Exercise;
}

export interface WorkoutDayWithSlots extends WorkoutDay {
	exercise_slots: ExerciseSlotWithExercise[];
}

export interface TrainingBlockWithDays {
	id: string;
	name: string;
	total_weeks: number;
	current_week: number;
	current_day: number;
	status: TrainingBlockStatus;
	workout_days: WorkoutDay[];
}

// UI state for individual sets
export interface SetState {
	id: string | null; // null for unsaved sets
	setNumber: number;
	targetWeight: number | null;
	targetReps: number;
	actualWeight: number | null;
	actualReps: number | null;
	rir: number | null;
	completed: boolean;
}

// UI state for exercises with their sets
export interface ExerciseState {
	slot: ExerciseSlotWithExercise;
	setsThisWeek: number;
	sets: SetState[];
	isExpanded: boolean;
}

// Active set input tracking
export interface ActiveSetInput {
	exerciseIndex: number;
	setIndex: number;
}

// Main workout state
export interface WorkoutState {
	trainingBlock: TrainingBlockWithDays | null;
	currentWorkoutDay: WorkoutDayWithSlots | null;
	session: WorkoutSession | null;
	exercises: ExerciseState[];
	loading: boolean;
	error: string;
	isSaving: boolean;
	activeSetInput: ActiveSetInput | null;
}

// Set input data from modal
export interface SetInputData {
	weight: number;
	reps: number;
	rir: number | null;
}
