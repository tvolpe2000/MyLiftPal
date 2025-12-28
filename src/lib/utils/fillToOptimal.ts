// Fill to Optimal Algorithm (Block-Level)
// Analyzes weekly volume across ALL days and suggests exercises to reach MEV for each muscle
// Uses database MEV values to match volume bar thresholds

import {
	getVolumeProgram,
	getRecommendedRestSeconds,
	type TrainingGoal,
	type LifterLevel
} from '$lib/data/volumePrograms';
import type { Exercise } from '$lib/types';
import type { ExerciseSlotDraft, WorkoutDayDraft } from '$lib/types/wizard';
import type { MuscleGroupData } from '$lib/utils/volume';

export interface MuscleVolume {
	muscleId: string;
	muscleName: string;
	directSets: number;
	indirectSets: number;
	totalEffectiveSets: number;
}

export interface SetIncrease {
	slotId: string;
	dayId: string;
	dayName: string;
	exerciseName: string;
	currentSets: number;
	newSets: number;
	setsToAdd: number;
}

export interface FillSuggestion {
	muscleId: string;
	muscleName: string;
	currentSets: number;
	targetSets: number; // MEV for this muscle
	setsToAdd: number;
	// Existing exercises to increase sets on
	setIncreases: SetIncrease[];
	// New exercises to add (only if set increases aren't enough)
	targetDayId: string; // Which day to add new exercises to
	targetDayName: string;
	suggestedExercises: Exercise[];
	newExerciseSets: number; // How many sets the new exercise should have
}

export interface BlockFillResult {
	suggestions: FillSuggestion[];
	totalSetsToAdd: number;
	musclesBelowMev: number;
}

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

			// Add indirect sets for secondary muscles (same formula as volume.ts)
			for (const secondary of exercise.secondary_muscles || []) {
				const secondaryVolume = volumeMap.get(secondary.muscle);
				if (secondaryVolume) {
					const contribution = sets * secondary.weight;
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
 * Uses database MEV values to match volume bar thresholds
 * Priority: 1) Increase sets on existing exercises, 2) Add new exercises
 */
export function calculateBlockFillSuggestions(
	days: WorkoutDayDraft[],
	allSlots: Map<string, ExerciseSlotDraft[]>,
	muscleGroupsData: MuscleGroupData[],
	availableExercises: Exercise[]
): BlockFillResult {
	// Build muscle groups map for volume calculation
	const muscleGroupsMap = new Map<string, string>();
	const mevMap = new Map<string, number>();
	for (const mg of muscleGroupsData) {
		muscleGroupsMap.set(mg.id, mg.display_name);
		mevMap.set(mg.id, mg.mev); // Use database MEV values!
	}

	const currentVolume = calculateBlockMuscleVolume(allSlots, muscleGroupsMap);
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

	// Build day name map
	const dayNameMap = new Map<string, string>();
	for (const day of days) {
		dayNameMap.set(day.id, day.name);
	}

	// Check each target muscle for the entire block
	for (const muscleId of allTargetMuscles) {
		const current = volumeMap.get(muscleId);
		const currentSets = current?.totalEffectiveSets ?? 0;
		const targetSets = mevMap.get(muscleId) ?? 8; // Use database MEV!

		if (currentSets < targetSets) {
			let setsNeeded = Math.ceil(targetSets - currentSets);
			const muscleName = muscleGroupsMap.get(muscleId) || muscleId;

			// STEP 1: Find existing exercises that target this muscle (primary) and suggest set increases
			const setIncreases: SetIncrease[] = [];
			const MAX_SETS_PER_EXERCISE = 5; // Don't go above 5 sets per exercise
			const MAX_INCREASE_PER_EXERCISE = 2; // Add up to 2 sets per existing exercise

			for (const [dayId, slots] of allSlots) {
				for (const slot of slots) {
					if (setsNeeded <= 0) break;
					if (slot.exercise?.primary_muscle === muscleId) {
						const canAdd = Math.min(
							MAX_INCREASE_PER_EXERCISE,
							MAX_SETS_PER_EXERCISE - slot.baseSets,
							setsNeeded
						);
						if (canAdd > 0) {
							setIncreases.push({
								slotId: slot.id,
								dayId,
								dayName: dayNameMap.get(dayId) || dayId,
								exerciseName: slot.exercise.name,
								currentSets: slot.baseSets,
								newSets: slot.baseSets + canAdd,
								setsToAdd: canAdd
							});
							setsNeeded -= canAdd;
						}
					}
				}
				if (setsNeeded <= 0) break;
			}

			// STEP 2: If we still need more sets, suggest new exercises
			let newExerciseSets = 0;
			let candidateExercises: Exercise[] = [];
			let bestDay = { dayId: '', dayName: '' };

			if (setsNeeded > 0) {
				// Find best day to add this exercise
				const foundDay = findBestDayForMuscle(muscleId, days, allSlots);
				if (foundDay) {
					bestDay = foundDay;

					// Find exercises for this muscle that aren't already in the block
					candidateExercises = availableExercises.filter(
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

					newExerciseSets = setsNeeded;
				}
			}

			// Only add suggestion if we have something to suggest
			if (setIncreases.length > 0 || candidateExercises.length > 0) {
				suggestions.push({
					muscleId,
					muscleName,
					currentSets: Math.round(currentSets * 10) / 10, // Round to 1 decimal
					targetSets,
					setsToAdd: Math.ceil(targetSets - currentSets),
					setIncreases,
					targetDayId: bestDay.dayId,
					targetDayName: bestDay.dayName,
					suggestedExercises: candidateExercises.slice(0, 3),
					newExerciseSets
				});
			}
		}
	}

	// Sort by sets needed (most needed first)
	suggestions.sort((a, b) => b.setsToAdd - a.setsToAdd);

	return {
		suggestions,
		totalSetsToAdd: suggestions.reduce((sum, s) => s.setsToAdd, 0),
		musclesBelowMev: suggestions.length
	};
}

/**
 * Result of generating fill exercises - includes both set increases and new exercises
 */
export interface GeneratedFillResult {
	// New exercise slots to add, grouped by day
	newSlots: Map<string, ExerciseSlotDraft[]>;
	// Set increases to apply to existing slots (slotId -> newSetCount)
	setIncreases: Map<string, number>;
}

/**
 * Generate exercise slots from fill suggestions, grouped by day
 * Also returns set increases for existing exercises
 */
export function generateBlockFillExercises(
	suggestions: FillSuggestion[],
	goal: TrainingGoal,
	level: LifterLevel,
	currentSlotCounts: Map<string, number> // dayId -> current slot count
): GeneratedFillResult {
	const program = getVolumeProgram(goal, level);
	const newSlots = new Map<string, ExerciseSlotDraft[]>();
	const setIncreases = new Map<string, number>();

	for (const suggestion of suggestions) {
		// Apply set increases to existing exercises
		for (const increase of suggestion.setIncreases) {
			setIncreases.set(increase.slotId, increase.newSets);
		}

		// Add new exercises if needed
		if (suggestion.newExerciseSets > 0 && suggestion.suggestedExercises.length > 0) {
			const dayId = suggestion.targetDayId;
			if (!dayId) continue;

			if (!newSlots.has(dayId)) {
				newSlots.set(dayId, []);
			}

			const daySlots = newSlots.get(dayId)!;
			const startOrder = (currentSlotCounts.get(dayId) || 0) + daySlots.length;

			// Use the first suggested exercise
			const exercise = suggestion.suggestedExercises[0];
			const setsPerExercise = Math.min(suggestion.newExerciseSets, 4); // Max 4 sets per exercise

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
			if (suggestion.newExerciseSets > 4 && suggestion.suggestedExercises.length > 1) {
				const secondExercise = suggestion.suggestedExercises[1];
				const remainingSets = Math.min(suggestion.newExerciseSets - 4, 4);

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
	}

	return { newSlots, setIncreases };
}

/**
 * Check if the entire block is at or above MEV for all target muscles
 * @deprecated This function has limited utility - use calculateBlockFillSuggestions directly
 */
export function isBlockAtMev(
	days: WorkoutDayDraft[],
	allSlots: Map<string, ExerciseSlotDraft[]>,
	muscleGroupsData: MuscleGroupData[],
	availableExercises: Exercise[]
): boolean {
	const result = calculateBlockFillSuggestions(days, allSlots, muscleGroupsData, availableExercises);
	return result.musclesBelowMev === 0;
}

/**
 * Get volume summary for the entire block
 * @deprecated This function has limited utility - use calculateBlockFillSuggestions directly
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
	muscleGroupsData: MuscleGroupData[],
	availableExercises: Exercise[]
): BlockVolumeSummary {
	const result = calculateBlockFillSuggestions(days, allSlots, muscleGroupsData, availableExercises);

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
