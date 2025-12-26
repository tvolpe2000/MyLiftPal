// Progression recommendation utilities

import type { PreviousSetData } from '$lib/types/workout';

export interface ProgressionSuggestion {
	weight: number;
	weightDelta: number; // +5, 0, -5, etc.
	reps: number;
	reason: string;
}

/**
 * Calculate progression suggestion based on previous session performance.
 *
 * Logic:
 * - RIR >= 3 and hit rep target → increase weight
 * - RIR 2 and hit rep target → increase weight (smaller)
 * - RIR 1 → maintain weight, try for more reps
 * - RIR 0 or missed reps → maintain or decrease weight
 */
export function getProgressionSuggestion(
	previous: PreviousSetData | null,
	repRangeMin: number,
	repRangeMax: number,
	weightIncrement: number = 5
): ProgressionSuggestion | null {
	if (!previous || previous.weight === null || previous.reps === null) {
		return null;
	}

	const { weight, reps, rir } = previous;
	const midReps = Math.round((repRangeMin + repRangeMax) / 2);
	const hitTopOfRange = reps >= repRangeMax;
	const hitBottomOfRange = reps >= repRangeMin;

	// RIR 3+ and hit top of rep range → increase weight
	if (rir !== null && rir >= 3 && hitTopOfRange) {
		return {
			weight: weight + weightIncrement,
			weightDelta: weightIncrement,
			reps: midReps,
			reason: `You had ${rir} reps left last time at ${reps} reps`
		};
	}

	// RIR 2 and hit rep range → small increase or same weight with more reps
	if (rir !== null && rir === 2 && hitTopOfRange) {
		return {
			weight: weight + weightIncrement,
			weightDelta: weightIncrement,
			reps: repRangeMin, // Start lower in rep range with new weight
			reason: `Strong set last time, ready for more weight`
		};
	}

	// RIR 2 but not at top of range → same weight, push reps
	if (rir !== null && rir === 2 && hitBottomOfRange) {
		return {
			weight: weight,
			weightDelta: 0,
			reps: Math.min(reps + 1, repRangeMax),
			reason: `Try for ${reps + 1} reps this time`
		};
	}

	// RIR 1 → maintain weight, try for reps
	if (rir !== null && rir === 1) {
		return {
			weight: weight,
			weightDelta: 0,
			reps: reps,
			reason: `Close to failure last time, match or beat ${reps} reps`
		};
	}

	// RIR 0 (failure) or missed bottom of rep range → same weight or decrease
	if (rir === 0 || !hitBottomOfRange) {
		if (!hitBottomOfRange) {
			return {
				weight: weight,
				weightDelta: 0,
				reps: repRangeMin,
				reason: `Missed rep target last time, focus on form`
			};
		}
		return {
			weight: weight,
			weightDelta: 0,
			reps: reps,
			reason: `Hit failure last time, maintain and recover`
		};
	}

	// Default: no RIR logged, suggest same weight
	return {
		weight: weight,
		weightDelta: 0,
		reps: reps,
		reason: `Match your previous performance`
	};
}

/**
 * Format weight delta for display
 */
export function formatWeightDelta(delta: number): string {
	if (delta > 0) return `+${delta}`;
	if (delta < 0) return `${delta}`;
	return 'same';
}
