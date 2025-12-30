/**
 * Tool Executor for IronAthena Voice Logging
 *
 * Executes parsed tool calls by calling the appropriate workout store methods.
 */

import type { ToolCall, ToolExecutionResult, ToolName } from '../types';
import type {
	LogSetParams,
	SkipExerciseParams,
	SwapExerciseParams,
	CompleteWorkoutParams,
	AddExerciseParams,
	ClarifyParams
} from './definitions';
import { workout } from '$lib/stores/workoutStore.svelte';
import { getCurrentExerciseAndSet, setLastAction, getLastLoggedWeight, getCurrentExercisePreviousWeight } from '../context';
import { supabase } from '$lib/db/supabase';

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
	clarify: (params) => (params as ClarifyParams).question
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

/**
 * Execute a tool call
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolExecutionResult> {
	const { tool, parameters } = toolCall;

	switch (tool) {
		case 'logSet':
			return executeLogSet(parameters as LogSetParams);
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
