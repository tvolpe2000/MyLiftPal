/**
 * Block Modification Tool Executor for IronAthena Voice Assistant
 *
 * Executes tools that modify the training block (exercises, sets, rep ranges).
 */

import { supabase } from '$lib/db/supabase';
import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
import type { ToolExecutionResult } from '../types';
import type {
	AddSetsToExerciseParams,
	RemoveSetsFromExerciseParams,
	ChangeRepRangeParams,
	ModifyBlockExerciseParams
} from './blockTools';

// ============================================
// Helper Functions
// ============================================

/**
 * Find exercise slots matching an exercise name
 */
async function findExerciseSlots(
	blockId: string,
	exerciseName: string,
	dayNumber?: number
): Promise<Array<{ slotId: string; dayId: string; dayNumber: number; exerciseName: string; baseSets: number }>> {
	// Get all workout days for this block
	const { data: days, error: daysError } = await supabase
		.from('workout_days')
		.select('id, day_number')
		.eq('training_block_id', blockId);

	if (daysError || !days) {
		console.error('Error fetching days:', daysError);
		return [];
	}

	// Filter by day number if specified
	const targetDays = dayNumber ? days.filter((d) => d.day_number === dayNumber) : days;

	if (targetDays.length === 0) {
		return [];
	}

	const dayIds = targetDays.map((d) => d.id);

	// Find exercise slots with matching exercise name
	const { data: slots, error: slotsError } = await supabase
		.from('exercise_slots')
		.select(`
			id,
			workout_day_id,
			base_sets,
			exercises (
				id,
				name
			)
		`)
		.in('workout_day_id', dayIds);

	if (slotsError || !slots) {
		console.error('Error fetching slots:', slotsError);
		return [];
	}

	// Fuzzy match exercise name
	const normalizedSearch = exerciseName.toLowerCase();
	const matches = slots.filter((slot) => {
		const exercise = slot.exercises as { name: string } | null;
		if (!exercise) return false;
		return exercise.name.toLowerCase().includes(normalizedSearch);
	});

	return matches.map((slot) => {
		const day = targetDays.find((d) => d.id === slot.workout_day_id);
		return {
			slotId: slot.id,
			dayId: slot.workout_day_id,
			dayNumber: day?.day_number || 0,
			exerciseName: (slot.exercises as { name: string })?.name || 'Unknown',
			baseSets: slot.base_sets
		};
	});
}

/**
 * Find an exercise by name (fuzzy match)
 */
async function findExercise(
	exerciseName: string
): Promise<{ id: string; name: string } | null> {
	const { data, error } = await supabase
		.from('exercises')
		.select('id, name')
		.ilike('name', `%${exerciseName}%`)
		.limit(1)
		.single();

	if (error || !data) {
		return null;
	}

	return data;
}

// ============================================
// Block Modification Executors
// ============================================

/**
 * Add sets to an exercise
 */
export async function executeAddSetsToExercise(
	params: AddSetsToExerciseParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	const { exerciseName, additionalSets = 1, dayNumber } = params;

	// Find matching exercise slots
	const slots = await findExerciseSlots(block.id, exerciseName, dayNumber);

	if (slots.length === 0) {
		return {
			success: false,
			message: dayNumber
				? `No "${exerciseName}" found on Day ${dayNumber}.`
				: `No "${exerciseName}" found in your training block.`
		};
	}

	// Update each matching slot
	let successCount = 0;
	for (const slot of slots) {
		const newSets = slot.baseSets + additionalSets;
		const { error } = await supabase
			.from('exercise_slots')
			.update({ base_sets: newSets })
			.eq('id', slot.slotId);

		if (!error) {
			successCount++;
		}
	}

	if (successCount === 0) {
		return {
			success: false,
			message: 'Failed to add sets. Please try again.'
		};
	}

	const exerciseDisplay = slots[0].exerciseName;
	const locationMsg =
		slots.length === 1
			? `on Day ${slots[0].dayNumber}`
			: `across ${slots.length} days`;

	return {
		success: true,
		message: `Added ${additionalSets} set${additionalSets > 1 ? 's' : ''} to ${exerciseDisplay} ${locationMsg}.`,
		canUndo: true
	};
}

/**
 * Remove sets from an exercise
 */
export async function executeRemoveSetsFromExercise(
	params: RemoveSetsFromExerciseParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	const { exerciseName, setsToRemove = 1, dayNumber } = params;

	// Find matching exercise slots
	const slots = await findExerciseSlots(block.id, exerciseName, dayNumber);

	if (slots.length === 0) {
		return {
			success: false,
			message: dayNumber
				? `No "${exerciseName}" found on Day ${dayNumber}.`
				: `No "${exerciseName}" found in your training block.`
		};
	}

	// Check if we'd remove too many sets
	for (const slot of slots) {
		if (slot.baseSets - setsToRemove < 1) {
			return {
				success: false,
				message: `Can't remove ${setsToRemove} sets from ${slot.exerciseName} (only has ${slot.baseSets} sets). Use at least 1 set.`
			};
		}
	}

	// Update each matching slot
	let successCount = 0;
	for (const slot of slots) {
		const newSets = slot.baseSets - setsToRemove;
		const { error } = await supabase
			.from('exercise_slots')
			.update({ base_sets: newSets })
			.eq('id', slot.slotId);

		if (!error) {
			successCount++;
		}
	}

	if (successCount === 0) {
		return {
			success: false,
			message: 'Failed to remove sets. Please try again.'
		};
	}

	const exerciseDisplay = slots[0].exerciseName;
	const locationMsg =
		slots.length === 1
			? `on Day ${slots[0].dayNumber}`
			: `across ${slots.length} days`;

	return {
		success: true,
		message: `Removed ${setsToRemove} set${setsToRemove > 1 ? 's' : ''} from ${exerciseDisplay} ${locationMsg}.`,
		canUndo: true
	};
}

/**
 * Change rep range for an exercise
 */
export async function executeChangeRepRange(
	params: ChangeRepRangeParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	const { exerciseName, minReps, maxReps, dayNumber } = params;

	// Validate rep range
	if (minReps > maxReps) {
		return {
			success: false,
			message: `Min reps (${minReps}) can't be greater than max reps (${maxReps}).`
		};
	}

	if (minReps < 1 || maxReps > 50) {
		return {
			success: false,
			message: 'Rep range should be between 1 and 50.'
		};
	}

	// Find matching exercise slots
	const slots = await findExerciseSlots(block.id, exerciseName, dayNumber);

	if (slots.length === 0) {
		return {
			success: false,
			message: dayNumber
				? `No "${exerciseName}" found on Day ${dayNumber}.`
				: `No "${exerciseName}" found in your training block.`
		};
	}

	// Update each matching slot
	let successCount = 0;
	for (const slot of slots) {
		const { error } = await supabase
			.from('exercise_slots')
			.update({
				rep_range_min: minReps,
				rep_range_max: maxReps
			})
			.eq('id', slot.slotId);

		if (!error) {
			successCount++;
		}
	}

	if (successCount === 0) {
		return {
			success: false,
			message: 'Failed to change rep range. Please try again.'
		};
	}

	const exerciseDisplay = slots[0].exerciseName;
	const locationMsg =
		slots.length === 1
			? `on Day ${slots[0].dayNumber}`
			: `across ${slots.length} days`;

	return {
		success: true,
		message: `Changed ${exerciseDisplay} rep range to ${minReps}-${maxReps} ${locationMsg}.`,
		canUndo: true
	};
}

/**
 * Replace an exercise in the block
 */
export async function executeModifyBlockExercise(
	params: ModifyBlockExerciseParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	const { exerciseName, newExerciseName, dayNumber } = params;

	// Find the new exercise
	const newExercise = await findExercise(newExerciseName);
	if (!newExercise) {
		return {
			success: false,
			message: `Couldn't find exercise "${newExerciseName}" in the library. Try a different name.`
		};
	}

	// Find matching exercise slots to replace
	const slots = await findExerciseSlots(block.id, exerciseName, dayNumber);

	if (slots.length === 0) {
		return {
			success: false,
			message: dayNumber
				? `No "${exerciseName}" found on Day ${dayNumber}.`
				: `No "${exerciseName}" found in your training block.`
		};
	}

	// Update each matching slot
	let successCount = 0;
	for (const slot of slots) {
		const { error } = await supabase
			.from('exercise_slots')
			.update({ exercise_id: newExercise.id })
			.eq('id', slot.slotId);

		if (!error) {
			successCount++;
		}
	}

	if (successCount === 0) {
		return {
			success: false,
			message: 'Failed to replace exercise. Please try again.'
		};
	}

	const oldExerciseDisplay = slots[0].exerciseName;
	const locationMsg =
		slots.length === 1
			? `on Day ${slots[0].dayNumber}`
			: `across ${slots.length} days`;

	// Refresh training block store
	await trainingBlockStore.loadActiveBlock();

	return {
		success: true,
		message: `Replaced ${oldExerciseDisplay} with ${newExercise.name} ${locationMsg}.`,
		canUndo: true
	};
}
