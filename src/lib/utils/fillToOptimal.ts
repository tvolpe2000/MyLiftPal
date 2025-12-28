// Fill to Optimal Algorithm (Block-Level)
// Analyzes weekly volume across ALL days and suggests exercises to reach MEV for each muscle

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
	targetDayId: string; // Which day to add this exercise to
	targetDayName: string;
	suggestedExercises: Exercise[];
}

export interface BlockFillResult {
	suggestions: FillSuggestion[];
	totalSetsToAdd: number;
	musclesBelowMev: number;
}

// Secondary muscle contribution weights
const SECONDARY_MUSCLE_WEIGHT = 0.5; // 50% contribution from secondary muscles

/**
 * Calculate current weekly volume for each muscle across ALL days in the block
 */
export function calculateBlockMuscleVolume(
	allSlots: Map<string, ExerciseSlotDraft[]>, // dayId -> slots
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

	// Calculate volume from each slot across all days
	for (const [, slots] of allSlots) {
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
	}

	return Array.from(volumeMap.values());
}

/**
 * Find the best day to add an exercise for a given muscle
 * Prefers days that already target this muscle and have fewer exercises
 */
function findBestDayForMuscle(
	muscleId: string,
	days: WorkoutDayDraft[],
	allSlots: Map<string, ExerciseSlotDraft[]>
): { dayId: string; dayName: string } | null {
	// Filter to days that target this muscle
	const targetingDays = days.filter((d) => d.targetMuscles.includes(muscleId));

	if (targetingDays.length === 0) {
		// No days explicitly target this muscle - find days with exercises hitting it
		for (const day of days) {
			const slots = allSlots.get(day.id) || [];
			const hitsThisMuscle = slots.some(
				(s) =>
					s.exercise?.primary_muscle === muscleId ||
					s.exercise?.secondary_muscles?.some((sec) => sec.muscle === muscleId)
			);
			if (hitsThisMuscle) {
				return { dayId: day.id, dayName: day.name };
			}
		}
		return null;
	}

	// Sort by number of exercises (prefer days with fewer to balance)
	targetingDays.sort((a, b) => {
		const aSlots = allSlots.get(a.id)?.length || 0;
		const bSlots = allSlots.get(b.id)?.length || 0;
		return aSlots - bSlots;
	});

	return { dayId: targetingDays[0].id, dayName: targetingDays[0].name };
}

/**
 * Calculate fill suggestions for the entire block (all days combined)
 */
export function calculateBlockFillSuggestions(
	days: WorkoutDayDraft[],
	allSlots: Map<string, ExerciseSlotDraft[]>,
	level: LifterLevel,
	muscleGroups: Map<string, string>,
	availableExercises: Exercise[]
): BlockFillResult {
	const currentVolume = calculateBlockMuscleVolume(allSlots, muscleGroups);
	const volumeMap = new Map(currentVolume.map((v) => [v.muscleId, v]));

	const suggestions: FillSuggestion[] = [];

	// Collect ALL target muscles from all days (unique)
	const allTargetMuscles = new Set<string>();
	for (const day of days) {
		for (const muscle of day.targetMuscles) {
			allTargetMuscles.add(muscle);
		}
	}

	// Get all existing exercise IDs across the block
	const existingExerciseIds = new Set<string>();
	for (const [, slots] of allSlots) {
		for (const slot of slots) {
			existingExerciseIds.add(slot.exerciseId);
		}
	}

	// Check each target muscle for the entire block
	for (const muscleId of allTargetMuscles) {
		const current = volumeMap.get(muscleId);
		const currentSets = current?.totalEffectiveSets ?? 0;
		const targetSets = getMevForMuscle(muscleId, level);

		if (currentSets < targetSets) {
			const setsToAdd = Math.ceil(targetSets - currentSets);
			const muscleName = muscleGroups.get(muscleId) || muscleId;

			// Find best day to add this exercise
			const bestDay = findBestDayForMuscle(muscleId, days, allSlots);
			if (!bestDay) continue; // No suitable day found

			// Find exercises for this muscle that aren't already in the block
			const candidateExercises = availableExercises.filter(
				(ex) => ex.primary_muscle === muscleId && !existingExerciseIds.has(ex.id)
			);

			// Sort by equipment variety (prefer different equipment than what's already used)
			const existingEquipment = new Set<string>();
			for (const [, slots] of allSlots) {
				for (const slot of slots) {
					if (slot.exercise?.equipment) {
						existingEquipment.add(slot.exercise.equipment);
					}
				}
			}
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
				targetDayId: bestDay.dayId,
				targetDayName: bestDay.dayName,
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
 * Generate exercise slots from fill suggestions, grouped by day
 */
export function generateBlockFillExercises(
	suggestions: FillSuggestion[],
	goal: TrainingGoal,
	level: LifterLevel,
	currentSlotCounts: Map<string, number> // dayId -> current slot count
): Map<string, ExerciseSlotDraft[]> {
	const program = getVolumeProgram(goal, level);
	const result = new Map<string, ExerciseSlotDraft[]>();

	for (const suggestion of suggestions) {
		if (suggestion.suggestedExercises.length === 0) continue;

		const dayId = suggestion.targetDayId;
		if (!result.has(dayId)) {
			result.set(dayId, []);
		}

		const daySlots = result.get(dayId)!;
		const startOrder = (currentSlotCounts.get(dayId) || 0) + daySlots.length;

		// Use the first suggested exercise
		const exercise = suggestion.suggestedExercises[0];
		const setsPerExercise = Math.min(suggestion.setsToAdd, 4); // Max 4 sets per exercise

		daySlots.push({
			id: crypto.randomUUID(),
			exerciseId: exercise.id,
			exercise: exercise,
			slotOrder: startOrder,
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

			daySlots.push({
				id: crypto.randomUUID(),
				exerciseId: secondExercise.id,
				exercise: secondExercise,
				slotOrder: startOrder + 1,
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

	return result;
}

/**
 * Check if the entire block is at or above MEV for all target muscles
 */
export function isBlockAtMev(
	days: WorkoutDayDraft[],
	allSlots: Map<string, ExerciseSlotDraft[]>,
	level: LifterLevel,
	muscleGroups: Map<string, string>
): boolean {
	const result = calculateBlockFillSuggestions(days, allSlots, level, muscleGroups, []);
	return result.musclesBelowMev === 0;
}

/**
 * Get volume summary for the entire block
 */
export interface BlockVolumeSummary {
	totalSets: number;
	musclesAtMev: number;
	musclesBelowMev: number;
	targetMuscleCount: number;
}

export function getBlockVolumeSummary(
	days: WorkoutDayDraft[],
	allSlots: Map<string, ExerciseSlotDraft[]>,
	level: LifterLevel,
	muscleGroups: Map<string, string>
): BlockVolumeSummary {
	const result = calculateBlockFillSuggestions(days, allSlots, level, muscleGroups, []);

	let totalSets = 0;
	for (const [, slots] of allSlots) {
		totalSets += slots.reduce((sum, s) => sum + s.baseSets, 0);
	}

	// Count unique target muscles
	const allTargetMuscles = new Set<string>();
	for (const day of days) {
		for (const muscle of day.targetMuscles) {
			allTargetMuscles.add(muscle);
		}
	}

	return {
		totalSets,
		musclesAtMev: allTargetMuscles.size - result.musclesBelowMev,
		musclesBelowMev: result.musclesBelowMev,
		targetMuscleCount: allTargetMuscles.size
	};
}

// ============================================================================
// DEPRECATED: Old per-day functions kept for backwards compatibility
// ============================================================================

/** @deprecated Use calculateBlockMuscleVolume instead */
export function calculateMuscleVolume(
	slots: ExerciseSlotDraft[],
	muscleGroups: Map<string, string>
): MuscleVolume[] {
	const slotsMap = new Map<string, ExerciseSlotDraft[]>();
	slotsMap.set('day', slots);
	return calculateBlockMuscleVolume(slotsMap, muscleGroups);
}

/** @deprecated Use calculateBlockFillSuggestions instead */
export function calculateFillSuggestions(
	day: WorkoutDayDraft,
	slots: ExerciseSlotDraft[],
	level: LifterLevel,
	muscleGroups: Map<string, string>,
	availableExercises: Exercise[]
): { suggestions: FillSuggestion[]; totalSetsToAdd: number; musclesBelowMev: number } {
	const slotsMap = new Map<string, ExerciseSlotDraft[]>();
	slotsMap.set(day.id, slots);

	const result = calculateBlockFillSuggestions([day], slotsMap, level, muscleGroups, availableExercises);
	return result;
}
