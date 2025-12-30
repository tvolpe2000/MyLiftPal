/**
 * Workout Context Builder for AI Voice Logging
 *
 * Builds the context object sent to AI providers from the current workout state.
 */

import type { WorkoutContext, CompletedSet, CurrentExerciseContext, LastAction, ToolName } from './types';
import { workout } from '$lib/stores/workoutStore.svelte';

// Store last action for undo functionality
let lastActionStore: LastAction | undefined;

/**
 * Set the last action (called after each tool execution)
 */
export function setLastAction(action: { type: ToolName; data: Record<string, unknown> }): void {
	lastActionStore = {
		...action,
		timestamp: new Date().toISOString()
	};
}

/**
 * Clear the last action (called after undo)
 */
export function clearLastAction(): void {
	lastActionStore = undefined;
}

/**
 * Get the last action
 */
export function getLastAction(): LastAction | undefined {
	return lastActionStore;
}

/**
 * Find the current (first incomplete) exercise and set
 */
function findCurrentExercise(): {
	exerciseIndex: number;
	setIndex: number;
} | null {
	for (let exIdx = 0; exIdx < workout.exercises.length; exIdx++) {
		const exercise = workout.exercises[exIdx];
		for (let setIdx = 0; setIdx < exercise.sets.length; setIdx++) {
			if (!exercise.sets[setIdx].completed) {
				return { exerciseIndex: exIdx, setIndex: setIdx };
			}
		}
	}
	return null;
}

/**
 * Build current exercise context for AI
 */
function buildCurrentExerciseContext(): CurrentExerciseContext | null {
	const current = findCurrentExercise();
	if (!current) return null;

	const exercise = workout.exercises[current.exerciseIndex];
	const set = exercise.sets[current.setIndex];

	return {
		name: exercise.slot.exercise?.name || 'Unknown Exercise',
		setNumber: set.setNumber,
		totalSets: exercise.setsThisWeek,
		targetWeight: set.targetWeight || 0,
		targetReps: set.targetReps || 8,
		previousSession: set.previous
			? {
					weight: set.previous.weight || 0,
					reps: set.previous.reps || 0,
					rir: set.previous.rir ?? undefined
				}
			: undefined
	};
}

/**
 * Build list of completed sets for today
 */
function buildCompletedSets(): CompletedSet[] {
	const completed: CompletedSet[] = [];

	for (const exercise of workout.exercises) {
		for (const set of exercise.sets) {
			if (set.completed && set.actualWeight != null && set.actualReps != null) {
				completed.push({
					exercise: exercise.slot.exercise?.name || 'Unknown',
					set: set.setNumber,
					weight: set.actualWeight,
					reps: set.actualReps,
					rir: set.rir ?? undefined
				});
			}
		}
	}

	return completed;
}

/**
 * Build list of remaining exercise names
 */
function buildRemainingExercises(): string[] {
	const current = findCurrentExercise();
	if (!current) return [];

	const remaining: string[] = [];

	for (let i = current.exerciseIndex; i < workout.exercises.length; i++) {
		const exercise = workout.exercises[i];
		const hasIncomplete = exercise.sets.some((s) => !s.completed);
		if (hasIncomplete) {
			remaining.push(exercise.slot.exercise?.name || 'Unknown');
		}
	}

	return remaining;
}

/**
 * Build the full workout context for AI requests
 */
export function buildWorkoutContext(): WorkoutContext | null {
	const currentExercise = buildCurrentExerciseContext();

	// If no current exercise, workout might be complete
	if (!currentExercise) {
		return null;
	}

	return {
		currentExercise,
		completedToday: buildCompletedSets(),
		remainingExercises: buildRemainingExercises(),
		lastAction: lastActionStore
	};
}

/**
 * Get the current exercise and set indices
 */
export function getCurrentExerciseAndSet(): {
	exerciseIndex: number;
	setIndex: number;
	exercise: (typeof workout.exercises)[0];
	set: (typeof workout.exercises)[0]['sets'][0];
} | null {
	const current = findCurrentExercise();
	if (!current) return null;

	const exercise = workout.exercises[current.exerciseIndex];
	const set = exercise.sets[current.setIndex];

	return {
		...current,
		exercise,
		set
	};
}

/**
 * Get weight from the last logged set (for "same weight" commands)
 */
export function getLastLoggedWeight(): number | null {
	const completed = buildCompletedSets();
	if (completed.length === 0) return null;

	const last = completed[completed.length - 1];
	return last.weight;
}

/**
 * Get weight from the current exercise's previous session
 */
export function getCurrentExercisePreviousWeight(): number | null {
	const context = buildCurrentExerciseContext();
	return context?.previousSession?.weight ?? null;
}
