/**
 * Tool Executor for IronAthena Voice Logging
 *
 * Executes parsed tool calls by calling the appropriate workout store methods.
 */

import type { ToolCall, ToolExecutionResult, ToolName } from '../types';
import type {
	LogSetParams,
	LogMultipleSetsParams,
	SkipExerciseParams,
	SwapExerciseParams,
	CompleteWorkoutParams,
	AddExerciseParams,
	ClarifyParams
} from './definitions';
import type {
	AddSetsToExerciseParams,
	RemoveSetsFromExerciseParams,
	ChangeRepRangeParams,
	ModifyBlockExerciseParams
} from './blockTools';
import type {
	SwapWorkoutDaysParams,
	SkipDayParams,
	RescheduleDayParams
} from './scheduleTools';
import type {
	GetWeeklyVolumeParams,
	GetPersonalRecordsParams,
	GetStatsParams
} from './queryTools';
import { workout } from '$lib/stores/workoutStore.svelte';
import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
import { getCurrentExerciseAndSet, setLastAction, getLastLoggedWeight, getCurrentExercisePreviousWeight } from '../context';
import { supabase } from '$lib/db/supabase';
import { auth } from '$lib/stores/auth.svelte';

/**
 * Response templates for each tool
 */
const responseTemplates: Record<ToolName, (params: Record<string, unknown>) => string> = {
	logSet: (params) => {
		const p = params as LogSetParams;
		let msg = `Got it, ${p.weight} for ${p.reps}`;
		if (p.rir != null) {
			msg += ` at RIR ${p.rir}`;
		}
		return msg;
	},
	logMultipleSets: (params) => {
		const p = params as LogMultipleSetsParams;
		let msg = `Logged ${p.sets} sets of ${p.reps} at ${p.weight}lbs`;
		if (p.rir != null) {
			msg += ` @ RIR ${p.rir}`;
		}
		return msg;
	},
	skipExercise: (params) => {
		const current = getCurrentExerciseAndSet();
		return `Skipped ${current?.exercise.slot.exercise?.name || 'exercise'}`;
	},
	swapExercise: (params) => {
		const p = params as SwapExerciseParams;
		return `Swapped to ${p.newExercise}`;
	},
	completeWorkout: () => 'Workout complete! Great session.',
	addExercise: (params) => {
		const p = params as AddExerciseParams;
		return `Added ${p.sets || 3} sets of ${p.exercise}`;
	},
	undoLast: () => 'Undone.',
	clarify: (params) => (params as ClarifyParams).question,
	// Schedule tools
	swapWorkoutDays: (params) => {
		const p = params as SwapWorkoutDaysParams;
		return `Swapped Day ${p.dayA} with Day ${p.dayB}`;
	},
	skipDay: () => "Skipped today's workout. Advanced to next day.",
	rescheduleDay: (params) => {
		const p = params as RescheduleDayParams;
		return `Moved to Day ${p.targetDayNumber}`;
	},
	// Block tools
	addSetsToExercise: (params) => {
		const p = params as AddSetsToExerciseParams;
		return `Added ${p.additionalSets || 1} set(s) to ${p.exerciseName}`;
	},
	removeSetsFromExercise: (params) => {
		const p = params as RemoveSetsFromExerciseParams;
		return `Removed ${p.setsToRemove || 1} set(s) from ${p.exerciseName}`;
	},
	changeRepRange: (params) => {
		const p = params as ChangeRepRangeParams;
		return `Changed ${p.exerciseName} to ${p.minReps}-${p.maxReps} reps`;
	},
	modifyBlockExercise: (params) => {
		const p = params as ModifyBlockExerciseParams;
		return `Replaced ${p.exerciseName} with ${p.newExerciseName}`;
	},
	// Query tools
	getTodaysWorkout: () => '', // Dynamic response from executor
	getWeeklyVolume: () => '',
	getPersonalRecords: () => '',
	getStats: () => '',
	getBlockProgress: () => ''
};

/**
 * Execute a logSet tool call
 */
async function executeLogSet(params: LogSetParams): Promise<ToolExecutionResult> {
	const current = getCurrentExerciseAndSet();
	if (!current) {
		return { success: false, message: 'No current exercise to log' };
	}

	// Handle "same weight" - use last logged weight or previous session weight
	let weight = params.weight;
	if (weight === 0 || weight == null) {
		weight = getLastLoggedWeight() ?? getCurrentExercisePreviousWeight() ?? 0;
		if (weight === 0) {
			return { success: false, message: 'No previous weight found. Please specify weight.' };
		}
	}

	const success = await workout.quickLogSet(current.exerciseIndex, current.setIndex, {
		weight,
		reps: params.reps,
		rir: params.rir ?? null
	});

	if (success) {
		setLastAction({
			type: 'logSet',
			data: { exerciseIndex: current.exerciseIndex, setIndex: current.setIndex, ...params }
		});
	}

	return {
		success,
		message: success ? responseTemplates.logSet({ ...params, weight }) : 'Failed to log set',
		canUndo: success
	};
}

/**
 * Execute a logMultipleSets tool call - logs multiple sets at once
 */
async function executeLogMultipleSets(params: LogMultipleSetsParams): Promise<ToolExecutionResult> {
	const current = getCurrentExerciseAndSet();
	if (!current) {
		return { success: false, message: 'No current exercise to log' };
	}

	// Handle "same weight" - use last logged weight or previous session weight
	let weight = params.weight;
	if (weight === 0 || weight == null) {
		weight = getLastLoggedWeight() ?? getCurrentExercisePreviousWeight() ?? 0;
		if (weight === 0) {
			return { success: false, message: 'No previous weight found. Please specify weight.' };
		}
	}

	const exercise = workout.exercises[current.exerciseIndex];
	const availableSets = exercise.sets.length - current.setIndex;
	const setsToLog = Math.min(params.sets, availableSets);

	if (setsToLog < params.sets) {
		// Not enough sets remaining, but we'll log what we can
	}

	let successCount = 0;
	for (let i = 0; i < setsToLog; i++) {
		const setIndex = current.setIndex + i;
		const success = await workout.quickLogSet(current.exerciseIndex, setIndex, {
			weight,
			reps: params.reps,
			rir: params.rir ?? null
		});
		if (success) successCount++;
	}

	const allSuccess = successCount === setsToLog;

	if (successCount > 0) {
		setLastAction({
			type: 'logMultipleSets',
			data: {
				exerciseIndex: current.exerciseIndex,
				startSetIndex: current.setIndex,
				setsLogged: successCount,
				weight,
				reps: params.reps,
				rir: params.rir
			}
		});
	}

	let message: string;
	if (successCount === 0) {
		message = 'Failed to log sets';
	} else if (successCount < params.sets) {
		message = `Logged ${successCount} of ${params.sets} sets (only ${availableSets} sets remaining)`;
	} else {
		message = responseTemplates.logMultipleSets({ ...params, weight });
	}

	return {
		success: successCount > 0,
		message,
		canUndo: successCount > 0
	};
}

/**
 * Execute a skipExercise tool call
 */
async function executeSkipExercise(params: SkipExerciseParams): Promise<ToolExecutionResult> {
	const current = getCurrentExerciseAndSet();
	if (!current) {
		return { success: false, message: 'No exercise to skip' };
	}

	// Mark all remaining sets as completed with null values (skipped)
	const exercise = workout.exercises[current.exerciseIndex];
	let skipCount = 0;

	for (let i = current.setIndex; i < exercise.sets.length; i++) {
		const set = exercise.sets[i];
		if (!set.completed) {
			// Log as skipped (0 weight, 0 reps)
			await workout.quickLogSet(current.exerciseIndex, i, {
				weight: 0,
				reps: 0,
				rir: null
			});
			skipCount++;
		}
	}

	if (skipCount > 0) {
		setLastAction({
			type: 'skipExercise',
			data: { exerciseIndex: current.exerciseIndex, reason: params.reason, skippedSets: skipCount }
		});
	}

	return {
		success: true,
		message: responseTemplates.skipExercise(params),
		canUndo: skipCount > 0
	};
}

/**
 * Execute a swapExercise tool call
 */
async function executeSwapExercise(params: SwapExerciseParams): Promise<ToolExecutionResult> {
	// If targetExercise is specified, find that exercise; otherwise use current exercise
	let exerciseIndex: number;
	let targetExerciseName: string;

	if (params.targetExercise) {
		// Find the exercise by name in the workout
		const foundIndex = workout.exercises.findIndex(
			(ex) => ex.slot.exercise?.name.toLowerCase().includes(params.targetExercise!.toLowerCase())
		);

		if (foundIndex === -1) {
			return {
				success: false,
				message: `Couldn't find "${params.targetExercise}" in today's workout.`
			};
		}
		exerciseIndex = foundIndex;
		targetExerciseName = workout.exercises[foundIndex].slot.exercise?.name || params.targetExercise;
	} else {
		// Use current exercise
		const current = getCurrentExerciseAndSet();
		if (!current) {
			return { success: false, message: 'No exercise to swap' };
		}
		exerciseIndex = current.exerciseIndex;
		targetExerciseName = current.exercise.slot.exercise?.name || 'current exercise';
	}

	// Fuzzy match new exercise name
	const { data: exercises } = await supabase
		.from('exercises')
		.select('*')
		.ilike('name', `%${params.newExercise}%`)
		.limit(1);

	if (!exercises || exercises.length === 0) {
		return {
			success: false,
			message: `Couldn't find exercise "${params.newExercise}". Try a different name.`
		};
	}

	const newExercise = exercises[0];
	const success = await workout.swapExercise(exerciseIndex, newExercise, false);

	if (success) {
		setLastAction({
			type: 'swapExercise',
			data: {
				exerciseIndex,
				oldExerciseId: workout.exercises[exerciseIndex]?.slot.exercise?.id,
				newExerciseId: newExercise.id
			}
		});
	}

	return {
		success,
		message: success
			? `Swapped ${targetExerciseName} to ${newExercise.name}`
			: 'Failed to swap exercise',
		canUndo: success
	};
}

/**
 * Execute a completeWorkout tool call
 */
async function executeCompleteWorkout(params: CompleteWorkoutParams): Promise<ToolExecutionResult> {
	const success = await workout.completeWorkout();

	return {
		success: success ?? false,
		message: success ? responseTemplates.completeWorkout(params) : 'Failed to complete workout',
		canUndo: false
	};
}

/**
 * Execute an addExercise tool call
 */
async function executeAddExercise(params: AddExerciseParams): Promise<ToolExecutionResult> {
	// Fuzzy match exercise name
	const { data: exercises } = await supabase
		.from('exercises')
		.select('*')
		.ilike('name', `%${params.exercise}%`)
		.limit(1);

	if (!exercises || exercises.length === 0) {
		return {
			success: false,
			message: `Couldn't find exercise "${params.exercise}". Try a different name.`
		};
	}

	const exercise = exercises[0];
	const success = await workout.addExercise(exercise, false);

	if (success) {
		setLastAction({
			type: 'addExercise',
			data: { exerciseId: exercise.id, sets: params.sets || 3 }
		});
	}

	return {
		success,
		message: success
			? responseTemplates.addExercise({ ...params, exercise: exercise.name })
			: 'Failed to add exercise',
		canUndo: success
	};
}

/**
 * Execute an undoLast tool call
 */
async function executeUndoLast(): Promise<ToolExecutionResult> {
	// TODO: Implement undo functionality
	// This would need to track the last action and reverse it
	return {
		success: false,
		message: 'Undo not yet implemented',
		canUndo: false
	};
}

/**
 * Execute a clarify tool call (just returns the question)
 */
async function executeClarify(params: ClarifyParams): Promise<ToolExecutionResult> {
	return {
		success: true,
		message: params.question,
		canUndo: false
	};
}

// ============================================
// SCHEDULE TOOL EXECUTORS
// ============================================

/**
 * Execute swapWorkoutDays - swap two days in the schedule
 */
async function executeSwapWorkoutDays(params: SwapWorkoutDaysParams): Promise<ToolExecutionResult> {
	const success = await trainingBlockStore.swapDays(params.dayA, params.dayB);

	return {
		success,
		message: success
			? responseTemplates.swapWorkoutDays(params)
			: `Failed to swap days. Make sure Day ${params.dayA} and Day ${params.dayB} exist.`,
		canUndo: false
	};
}

/**
 * Execute skipDay - skip today and advance to next day
 */
async function executeSkipDay(_params: SkipDayParams): Promise<ToolExecutionResult> {
	const success = await trainingBlockStore.skipCurrentDay();

	return {
		success,
		message: success ? responseTemplates.skipDay({}) : 'Failed to skip day.',
		canUndo: false
	};
}

/**
 * Execute rescheduleDay - change current day to a different one
 */
async function executeRescheduleDay(params: RescheduleDayParams): Promise<ToolExecutionResult> {
	const success = await trainingBlockStore.rescheduleToDay(params.targetDayNumber);

	return {
		success,
		message: success
			? responseTemplates.rescheduleDay(params)
			: `Failed to reschedule. Make sure Day ${params.targetDayNumber} exists.`,
		canUndo: false
	};
}

// ============================================
// BLOCK TOOL EXECUTORS
// ============================================

/**
 * Execute addSetsToExercise - add sets to an exercise in the block
 */
async function executeAddSetsToExercise(params: AddSetsToExerciseParams): Promise<ToolExecutionResult> {
	if (!trainingBlockStore.block) {
		return { success: false, message: 'No active training block' };
	}

	// Find exercise slots matching the name
	const { data: slots, error } = await supabase
		.from('exercise_slots')
		.select(`
			id,
			sets,
			workout_day_id,
			exercises!inner (name),
			workout_days!inner (training_block_id, day_number)
		`)
		.eq('workout_days.training_block_id', trainingBlockStore.block.id)
		.ilike('exercises.name', `%${params.exerciseName}%`);

	if (error || !slots || slots.length === 0) {
		return {
			success: false,
			message: `Couldn't find "${params.exerciseName}" in your training block.`
		};
	}

	// Filter by day if specified
	const targetSlots = params.dayNumber
		? slots.filter((s: { workout_days: { day_number: number } }) => s.workout_days.day_number === params.dayNumber)
		: slots;

	if (targetSlots.length === 0) {
		return {
			success: false,
			message: `"${params.exerciseName}" not found on Day ${params.dayNumber}.`
		};
	}

	// Update each matching slot
	const additionalSets = params.additionalSets || 1;
	let successCount = 0;

	for (const slot of targetSlots) {
		const { error: updateError } = await supabase
			.from('exercise_slots')
			.update({ sets: (slot as { sets: number }).sets + additionalSets })
			.eq('id', (slot as { id: string }).id);

		if (!updateError) successCount++;
	}

	await trainingBlockStore.refresh();

	return {
		success: successCount > 0,
		message: successCount > 0
			? responseTemplates.addSetsToExercise(params)
			: 'Failed to update sets.',
		canUndo: false
	};
}

/**
 * Execute removeSetsFromExercise - remove sets from an exercise
 */
async function executeRemoveSetsFromExercise(params: RemoveSetsFromExerciseParams): Promise<ToolExecutionResult> {
	if (!trainingBlockStore.block) {
		return { success: false, message: 'No active training block' };
	}

	const { data: slots, error } = await supabase
		.from('exercise_slots')
		.select(`
			id,
			sets,
			workout_day_id,
			exercises!inner (name),
			workout_days!inner (training_block_id, day_number)
		`)
		.eq('workout_days.training_block_id', trainingBlockStore.block.id)
		.ilike('exercises.name', `%${params.exerciseName}%`);

	if (error || !slots || slots.length === 0) {
		return {
			success: false,
			message: `Couldn't find "${params.exerciseName}" in your training block.`
		};
	}

	const targetSlots = params.dayNumber
		? slots.filter((s: { workout_days: { day_number: number } }) => s.workout_days.day_number === params.dayNumber)
		: slots;

	if (targetSlots.length === 0) {
		return {
			success: false,
			message: `"${params.exerciseName}" not found on Day ${params.dayNumber}.`
		};
	}

	const setsToRemove = params.setsToRemove || 1;
	let successCount = 0;

	for (const slot of targetSlots) {
		const typedSlot = slot as { id: string; sets: number };
		const newSets = Math.max(1, typedSlot.sets - setsToRemove); // Minimum 1 set
		const { error: updateError } = await supabase
			.from('exercise_slots')
			.update({ sets: newSets })
			.eq('id', typedSlot.id);

		if (!updateError) successCount++;
	}

	await trainingBlockStore.refresh();

	return {
		success: successCount > 0,
		message: successCount > 0
			? responseTemplates.removeSetsFromExercise(params)
			: 'Failed to update sets.',
		canUndo: false
	};
}

/**
 * Execute changeRepRange - change rep range for an exercise
 */
async function executeChangeRepRange(params: ChangeRepRangeParams): Promise<ToolExecutionResult> {
	if (!trainingBlockStore.block) {
		return { success: false, message: 'No active training block' };
	}

	const { data: slots, error } = await supabase
		.from('exercise_slots')
		.select(`
			id,
			exercises!inner (name),
			workout_days!inner (training_block_id, day_number)
		`)
		.eq('workout_days.training_block_id', trainingBlockStore.block.id)
		.ilike('exercises.name', `%${params.exerciseName}%`);

	if (error || !slots || slots.length === 0) {
		return {
			success: false,
			message: `Couldn't find "${params.exerciseName}" in your training block.`
		};
	}

	const targetSlots = params.dayNumber
		? slots.filter((s: { workout_days: { day_number: number } }) => s.workout_days.day_number === params.dayNumber)
		: slots;

	if (targetSlots.length === 0) {
		return {
			success: false,
			message: `"${params.exerciseName}" not found on Day ${params.dayNumber}.`
		};
	}

	let successCount = 0;

	for (const slot of targetSlots) {
		const { error: updateError } = await supabase
			.from('exercise_slots')
			.update({ min_reps: params.minReps, max_reps: params.maxReps })
			.eq('id', (slot as { id: string }).id);

		if (!updateError) successCount++;
	}

	await trainingBlockStore.refresh();

	return {
		success: successCount > 0,
		message: successCount > 0
			? responseTemplates.changeRepRange(params)
			: 'Failed to update rep range.',
		canUndo: false
	};
}

/**
 * Execute modifyBlockExercise - replace an exercise with another
 */
async function executeModifyBlockExercise(params: ModifyBlockExerciseParams): Promise<ToolExecutionResult> {
	if (!trainingBlockStore.block) {
		return { success: false, message: 'No active training block' };
	}

	// Find the new exercise
	const { data: newExercises } = await supabase
		.from('exercises')
		.select('id, name')
		.ilike('name', `%${params.newExerciseName}%`)
		.limit(1);

	if (!newExercises || newExercises.length === 0) {
		return {
			success: false,
			message: `Couldn't find exercise "${params.newExerciseName}".`
		};
	}

	const newExercise = newExercises[0];

	// Find slots with the old exercise
	const { data: slots, error } = await supabase
		.from('exercise_slots')
		.select(`
			id,
			exercises!inner (name),
			workout_days!inner (training_block_id, day_number)
		`)
		.eq('workout_days.training_block_id', trainingBlockStore.block.id)
		.ilike('exercises.name', `%${params.exerciseName}%`);

	if (error || !slots || slots.length === 0) {
		return {
			success: false,
			message: `Couldn't find "${params.exerciseName}" in your training block.`
		};
	}

	const targetSlots = params.dayNumber
		? slots.filter((s: { workout_days: { day_number: number } }) => s.workout_days.day_number === params.dayNumber)
		: slots;

	if (targetSlots.length === 0) {
		return {
			success: false,
			message: `"${params.exerciseName}" not found on Day ${params.dayNumber}.`
		};
	}

	let successCount = 0;

	for (const slot of targetSlots) {
		const { error: updateError } = await supabase
			.from('exercise_slots')
			.update({ exercise_id: newExercise.id })
			.eq('id', (slot as { id: string }).id);

		if (!updateError) successCount++;
	}

	await trainingBlockStore.refresh();

	return {
		success: successCount > 0,
		message: successCount > 0
			? `Replaced ${params.exerciseName} with ${newExercise.name}`
			: 'Failed to replace exercise.',
		canUndo: false
	};
}

// ============================================
// QUERY TOOL EXECUTORS
// ============================================

/**
 * Execute getTodaysWorkout - get info about today's workout
 */
async function executeGetTodaysWorkout(): Promise<ToolExecutionResult> {
	const today = trainingBlockStore.getToday();

	if (!today) {
		return {
			success: true,
			message: "You don't have a workout scheduled for today.",
			data: { hasWorkout: false }
		};
	}

	// Get exercise details
	const { data: slots } = await supabase
		.from('exercise_slots')
		.select(`
			sets,
			min_reps,
			max_reps,
			exercises (name)
		`)
		.eq('workout_day_id', today.id)
		.order('order_index');

	const exercises = slots?.map((s: { exercises: { name: string }; sets: number; min_reps: number; max_reps: number }) =>
		`${s.exercises.name} (${s.sets}×${s.min_reps}-${s.max_reps})`
	) || [];

	const message = `Today: ${today.name}\n` +
		`${today.exercise_count} exercises: ${exercises.join(', ')}`;

	return {
		success: true,
		message,
		data: {
			hasWorkout: true,
			dayName: today.name,
			exercises
		}
	};
}

/**
 * Execute getWeeklyVolume - get volume per muscle group
 */
async function executeGetWeeklyVolume(params: GetWeeklyVolumeParams): Promise<ToolExecutionResult> {
	if (!trainingBlockStore.block) {
		return { success: false, message: 'No active training block' };
	}

	// Get all exercise slots with their muscle groups
	const { data: slots } = await supabase
		.from('exercise_slots')
		.select(`
			sets,
			exercises (
				primary_muscle_id,
				muscle_groups!exercises_primary_muscle_id_fkey (name)
			),
			workout_days!inner (training_block_id)
		`)
		.eq('workout_days.training_block_id', trainingBlockStore.block.id);

	if (!slots) {
		return { success: false, message: 'Failed to load volume data' };
	}

	// Calculate volume per muscle
	const volumeByMuscle: Record<string, number> = {};
	for (const slot of slots) {
		const typedSlot = slot as {
			sets: number;
			exercises: { muscle_groups: { name: string } | null };
		};
		const muscleName = typedSlot.exercises?.muscle_groups?.name;
		if (muscleName) {
			volumeByMuscle[muscleName] = (volumeByMuscle[muscleName] || 0) + typedSlot.sets;
		}
	}

	// Filter by muscle if specified
	if (params.muscleGroup) {
		const lowerMuscle = params.muscleGroup.toLowerCase();
		const filtered: Record<string, number> = {};
		for (const [muscle, sets] of Object.entries(volumeByMuscle)) {
			if (muscle.toLowerCase().includes(lowerMuscle)) {
				filtered[muscle] = sets;
			}
		}
		if (Object.keys(filtered).length === 0) {
			return {
				success: true,
				message: `No volume found for "${params.muscleGroup}".`,
				data: { volume: {} }
			};
		}
		const parts = Object.entries(filtered).map(([m, s]) => `${m}: ${s} sets`);
		return {
			success: true,
			message: `Weekly volume: ${parts.join(', ')}`,
			data: { volume: filtered }
		};
	}

	// Return all muscles sorted by volume
	const sorted = Object.entries(volumeByMuscle).sort((a, b) => b[1] - a[1]);
	const parts = sorted.slice(0, 6).map(([m, s]) => `${m}: ${s}`);

	return {
		success: true,
		message: `Weekly sets: ${parts.join(', ')}`,
		data: { volume: volumeByMuscle }
	};
}

/**
 * Execute getPersonalRecords - get PRs for exercises
 */
async function executeGetPersonalRecords(params: GetPersonalRecordsParams): Promise<ToolExecutionResult> {
	if (!auth.user) {
		return { success: false, message: 'Not logged in' };
	}

	let query = supabase
		.from('logged_sets')
		.select(`
			actual_weight,
			actual_reps,
			exercises (name),
			workout_sessions!inner (user_id)
		`)
		.eq('workout_sessions.user_id', auth.user.id)
		.not('actual_weight', 'is', null)
		.order('actual_weight', { ascending: false });

	if (params.exerciseName) {
		query = query.ilike('exercises.name', `%${params.exerciseName}%`);
	}

	const { data: sets } = await query.limit(params.limit || 5);

	if (!sets || sets.length === 0) {
		return {
			success: true,
			message: params.exerciseName
				? `No records found for "${params.exerciseName}".`
				: 'No personal records yet. Start logging!',
			data: { records: [] }
		};
	}

	const records = sets.map((s: { exercises: { name: string }; actual_weight: number; actual_reps: number }) =>
		`${s.exercises.name}: ${s.actual_weight}lbs × ${s.actual_reps}`
	);

	return {
		success: true,
		message: `PRs: ${records.join(', ')}`,
		data: { records: sets }
	};
}

/**
 * Execute getStats - get workout statistics
 */
async function executeGetStats(params: GetStatsParams): Promise<ToolExecutionResult> {
	if (!auth.user) {
		return { success: false, message: 'Not logged in' };
	}

	const timeframe = params.timeframe || 'week';
	let startDate: Date;

	if (timeframe === 'week') {
		startDate = new Date();
		startDate.setDate(startDate.getDate() - 7);
	} else if (timeframe === 'month') {
		startDate = new Date();
		startDate.setMonth(startDate.getMonth() - 1);
	} else {
		startDate = new Date(0); // All time
	}

	// Get workout count
	const { count: workoutCount } = await supabase
		.from('workout_sessions')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', auth.user.id)
		.eq('status', 'completed')
		.gte('completed_at', startDate.toISOString());

	// Get sets and weight
	const { data: sessions } = await supabase
		.from('workout_sessions')
		.select('id')
		.eq('user_id', auth.user.id)
		.eq('status', 'completed')
		.gte('completed_at', startDate.toISOString());

	let totalSets = 0;
	let totalWeight = 0;

	if (sessions && sessions.length > 0) {
		const sessionIds = sessions.map(s => s.id);
		const { data: sets } = await supabase
			.from('logged_sets')
			.select('actual_weight, actual_reps')
			.in('workout_session_id', sessionIds);

		if (sets) {
			totalSets = sets.length;
			for (const set of sets) {
				if (set.actual_weight && set.actual_reps) {
					totalWeight += set.actual_weight * set.actual_reps;
				}
			}
		}
	}

	const timeLabel = timeframe === 'all' ? 'all time' : `this ${timeframe}`;
	const message = `Stats (${timeLabel}): ${workoutCount || 0} workouts, ${totalSets} sets, ${Math.round(totalWeight).toLocaleString()} lbs moved`;

	return {
		success: true,
		message,
		data: {
			timeframe,
			workouts: workoutCount || 0,
			sets: totalSets,
			weightLifted: totalWeight
		}
	};
}

/**
 * Execute getBlockProgress - get progress on current block
 */
async function executeGetBlockProgress(): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: true,
			message: "You don't have an active training block.",
			data: { hasBlock: false }
		};
	}

	const totalDays = block.workout_days.length;
	const totalWorkouts = block.total_weeks * totalDays;
	const completedWorkouts = ((block.current_week - 1) * totalDays) + (block.current_day - 1);
	const percentComplete = Math.round((completedWorkouts / totalWorkouts) * 100);

	const message = `"${block.name}": Week ${block.current_week}/${block.total_weeks}, ` +
		`Day ${block.current_day}/${totalDays} (${percentComplete}% complete)`;

	return {
		success: true,
		message,
		data: {
			hasBlock: true,
			blockName: block.name,
			currentWeek: block.current_week,
			totalWeeks: block.total_weeks,
			currentDay: block.current_day,
			totalDays,
			percentComplete
		}
	};
}

/**
 * Execute a tool call
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolExecutionResult> {
	const { tool, parameters } = toolCall;

	switch (tool) {
		// Workout tools
		case 'logSet':
			return executeLogSet(parameters as LogSetParams);
		case 'logMultipleSets':
			return executeLogMultipleSets(parameters as LogMultipleSetsParams);
		case 'skipExercise':
			return executeSkipExercise(parameters as SkipExerciseParams);
		case 'swapExercise':
			return executeSwapExercise(parameters as SwapExerciseParams);
		case 'completeWorkout':
			return executeCompleteWorkout(parameters as CompleteWorkoutParams);
		case 'addExercise':
			return executeAddExercise(parameters as AddExerciseParams);
		case 'undoLast':
			return executeUndoLast();
		case 'clarify':
			return executeClarify(parameters as ClarifyParams);

		// Schedule tools
		case 'swapWorkoutDays':
			return executeSwapWorkoutDays(parameters as SwapWorkoutDaysParams);
		case 'skipDay':
			return executeSkipDay(parameters as SkipDayParams);
		case 'rescheduleDay':
			return executeRescheduleDay(parameters as RescheduleDayParams);

		// Block tools
		case 'addSetsToExercise':
			return executeAddSetsToExercise(parameters as AddSetsToExerciseParams);
		case 'removeSetsFromExercise':
			return executeRemoveSetsFromExercise(parameters as RemoveSetsFromExerciseParams);
		case 'changeRepRange':
			return executeChangeRepRange(parameters as ChangeRepRangeParams);
		case 'modifyBlockExercise':
			return executeModifyBlockExercise(parameters as ModifyBlockExerciseParams);

		// Query tools
		case 'getTodaysWorkout':
			return executeGetTodaysWorkout();
		case 'getWeeklyVolume':
			return executeGetWeeklyVolume(parameters as GetWeeklyVolumeParams);
		case 'getPersonalRecords':
			return executeGetPersonalRecords(parameters as GetPersonalRecordsParams);
		case 'getStats':
			return executeGetStats(parameters as GetStatsParams);
		case 'getBlockProgress':
			return executeGetBlockProgress();

		default:
			return {
				success: false,
				message: `Unknown tool: ${tool}`,
				canUndo: false
			};
	}
}

/**
 * Get the response message for a tool call
 */
export function getToolResponseMessage(tool: ToolName, params: Record<string, unknown>): string {
	return responseTemplates[tool]?.(params) ?? 'Command executed';
}
