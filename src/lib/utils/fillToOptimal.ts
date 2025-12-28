// Fill to Optimal Algorithm
// Analyzes current workout volume and suggests exercises to reach MEV for each muscle

import {
	getMevForMuscle,
	getVolumeProgram,
	getRecommendedRestSeconds,
	type TrainingGoal,
	type LifterLevel
} from '$lib/data/volumePrograms';
import type { Exercise } from '$lib/types';
import type { ExerciseSlotDraft, WorkoutDayDraft } from '$lib/types/wizard';

export interface MuscleVolume {
	muscleId: string;
	muscleName: string;
	directSets: number;
	indirectSets: number;
	totalEffectiveSets: number;
}

export interface FillSuggestion {
	muscleId: string;
	muscleName: string;
	currentSets: number;
	targetSets: number; // MEV for this muscle
	setsToAdd: number;
	suggestedExercises: Exercise[];
}

export interface FillResult {
	suggestions: FillSuggestion[];
	totalSetsToAdd: number;
	musclesBelowMev: number;
}

// Secondary muscle contribution weights
const SECONDARY_MUSCLE_WEIGHT = 0.5; // 50% contribution from secondary muscles

/**
 * Calculate current volume for each muscle based on exercise slots
 */
export function calculateMuscleVolume(
	slots: ExerciseSlotDraft[],
	muscleGroups: Map<string, string> // muscleId -> displayName
): MuscleVolume[] {
	const volumeMap = new Map<string, MuscleVolume>();

	// Initialize all muscles
	for (const [muscleId, displayName] of muscleGroups) {
		volumeMap.set(muscleId, {
			muscleId,
			muscleName: displayName,
			directSets: 0,
			indirectSets: 0,
			totalEffectiveSets: 0
		});
	}

	// Calculate volume from each slot
	for (const slot of slots) {
		const exercise = slot.exercise;
		if (!exercise) continue;

		const sets = slot.baseSets;

		// Add direct sets for primary muscle
		const primaryVolume = volumeMap.get(exercise.primary_muscle);
		if (primaryVolume) {
			primaryVolume.directSets += sets;
			primaryVolume.totalEffectiveSets += sets;
		}

		// Add indirect sets for secondary muscles
		for (const secondary of exercise.secondary_muscles || []) {
			const secondaryVolume = volumeMap.get(secondary.muscle);
			if (secondaryVolume) {
				const contribution = sets * secondary.weight * SECONDARY_MUSCLE_WEIGHT;
				secondaryVolume.indirectSets += contribution;
				secondaryVolume.totalEffectiveSets += contribution;
			}
		}
	}

	return Array.from(volumeMap.values()).filter((v) => v.totalEffectiveSets > 0 || v.directSets > 0);
}

/**
 * Calculate fill suggestions for a specific workout day
 */
export function calculateFillSuggestions(
	day: WorkoutDayDraft,
	slots: ExerciseSlotDraft[],
	level: LifterLevel,
	muscleGroups: Map<string, string>,
	availableExercises: Exercise[]
): FillResult {
	const currentVolume = calculateMuscleVolume(slots, muscleGroups);
	const volumeMap = new Map(currentVolume.map((v) => [v.muscleId, v]));

	const suggestions: FillSuggestion[] = [];

	// Check each target muscle for this day
	for (const muscleId of day.targetMuscles) {
		const current = volumeMap.get(muscleId);
		const currentSets = current?.totalEffectiveSets ?? 0;
		const targetSets = getMevForMuscle(muscleId, level);

		if (currentSets < targetSets) {
			const setsToAdd = Math.ceil(targetSets - currentSets);
			const muscleName = muscleGroups.get(muscleId) || muscleId;

			// Find exercises for this muscle that aren't already in the day
			const existingExerciseIds = new Set(slots.map((s) => s.exerciseId));
			const candidateExercises = availableExercises.filter(
				(ex) => ex.primary_muscle === muscleId && !existingExerciseIds.has(ex.id)
			);

			// Sort by equipment variety (prefer different equipment than what's already used)
			const existingEquipment = new Set(slots.map((s) => s.exercise?.equipment));
			candidateExercises.sort((a, b) => {
				const aUsed = existingEquipment.has(a.equipment) ? 1 : 0;
				const bUsed = existingEquipment.has(b.equipment) ? 1 : 0;
				return aUsed - bUsed;
			});

			suggestions.push({
				muscleId,
				muscleName,
				currentSets: Math.round(currentSets * 10) / 10, // Round to 1 decimal
				targetSets,
				setsToAdd,
				suggestedExercises: candidateExercises.slice(0, 3)
			});
		}
	}

	// Sort by sets needed (most needed first)
	suggestions.sort((a, b) => b.setsToAdd - a.setsToAdd);

	return {
		suggestions,
		totalSetsToAdd: suggestions.reduce((sum, s) => sum + s.setsToAdd, 0),
		musclesBelowMev: suggestions.length
	};
}

/**
 * Generate exercise slots from fill suggestions
 */
export function generateFillExercises(
	suggestions: FillSuggestion[],
	goal: TrainingGoal,
	level: LifterLevel,
	startOrder: number
): ExerciseSlotDraft[] {
	const program = getVolumeProgram(goal, level);
	const slots: ExerciseSlotDraft[] = [];
	let slotOrder = startOrder;

	for (const suggestion of suggestions) {
		if (suggestion.suggestedExercises.length === 0) continue;

		// Use the first suggested exercise
		const exercise = suggestion.suggestedExercises[0];
		const setsPerExercise = Math.min(suggestion.setsToAdd, 4); // Max 4 sets per exercise

		slots.push({
			id: crypto.randomUUID(),
			exerciseId: exercise.id,
			exercise: exercise,
			slotOrder: slotOrder++,
			baseSets: setsPerExercise,
			setProgression: program.weeklyIncrement / 10, // Scale down for single exercise
			repRangeMin: program.repRangeMin,
			repRangeMax: program.repRangeMax,
			restSeconds: getRecommendedRestSeconds(goal),
			supersetGroup: null,
			notes: ''
		});

		// If we need more than 4 sets, add another exercise
		if (suggestion.setsToAdd > 4 && suggestion.suggestedExercises.length > 1) {
			const secondExercise = suggestion.suggestedExercises[1];
			const remainingSets = Math.min(suggestion.setsToAdd - 4, 4);

			slots.push({
				id: crypto.randomUUID(),
				exerciseId: secondExercise.id,
				exercise: secondExercise,
				slotOrder: slotOrder++,
				baseSets: remainingSets,
				setProgression: program.weeklyIncrement / 10,
				repRangeMin: program.repRangeMin,
				repRangeMax: program.repRangeMax,
				restSeconds: getRecommendedRestSeconds(goal),
				supersetGroup: null,
				notes: ''
			});
		}
	}

	return slots;
}

/**
 * Check if a day is at or above MEV for all target muscles
 */
export function isDayAtMev(
	day: WorkoutDayDraft,
	slots: ExerciseSlotDraft[],
	level: LifterLevel,
	muscleGroups: Map<string, string>
): boolean {
	const result = calculateFillSuggestions(day, slots, level, muscleGroups, []);
	return result.musclesBelowMev === 0;
}

/**
 * Get volume summary for a day
 */
export interface DayVolumeSummary {
	totalSets: number;
	musclesAtMev: number;
	musclesBelowMev: number;
	targetMuscleCount: number;
}

export function getDayVolumeSummary(
	day: WorkoutDayDraft,
	slots: ExerciseSlotDraft[],
	level: LifterLevel,
	muscleGroups: Map<string, string>
): DayVolumeSummary {
	const result = calculateFillSuggestions(day, slots, level, muscleGroups, []);
	const totalSets = slots.reduce((sum, s) => sum + s.baseSets, 0);

	return {
		totalSets,
		musclesAtMev: day.targetMuscles.length - result.musclesBelowMev,
		musclesBelowMev: result.musclesBelowMev,
		targetMuscleCount: day.targetMuscles.length
	};
}
