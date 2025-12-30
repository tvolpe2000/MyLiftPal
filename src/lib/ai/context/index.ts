/**
 * Unified Context Builder for AI Voice Assistant
 *
 * Provides context for both in-workout commands and global commands
 * (schedule management, block modifications, queries).
 */

import type {
	UnifiedContext,
	WorkoutContext,
	ToolName,
	WorkoutToolName,
	ScheduleToolName,
	BlockToolName,
	QueryToolName
} from '../types';
import { buildWorkoutContext, setLastAction, clearLastAction, getLastAction } from '../context';
import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
import { workout } from '$lib/stores/workoutStore.svelte';

// Re-export workout context helpers
export { setLastAction, clearLastAction, getLastAction, buildWorkoutContext };

// ============================================================================
// TOOL CATEGORIES
// ============================================================================

export const WORKOUT_TOOLS: WorkoutToolName[] = [
	'logSet',
	'skipExercise',
	'swapExercise',
	'completeWorkout',
	'addExercise',
	'undoLast',
	'clarify'
];

export const SCHEDULE_TOOLS: ScheduleToolName[] = ['swapWorkoutDays', 'skipDay', 'rescheduleDay'];

export const BLOCK_TOOLS: BlockToolName[] = [
	'addSetsToExercise',
	'removeSetsFromExercise',
	'changeRepRange',
	'modifyBlockExercise'
];

export const QUERY_TOOLS: QueryToolName[] = [
	'getTodaysWorkout',
	'getWeeklyVolume',
	'getPersonalRecords',
	'getStats',
	'getBlockProgress'
];

// ============================================================================
// CONTEXT DETECTION
// ============================================================================

/**
 * Detect if we're in an active workout context
 */
export function isInWorkout(): boolean {
	return workout.session !== null && workout.session.status === 'in_progress';
}

/**
 * Check if user has an active training block
 */
export function hasActiveBlock(): boolean {
	return trainingBlockStore.hasActiveBlock;
}

// ============================================================================
// UNIFIED CONTEXT BUILDER
// ============================================================================

/**
 * Build unified context for global AI assistant
 */
export async function buildUnifiedContext(): Promise<UnifiedContext> {
	// Ensure training block store is initialized
	if (!trainingBlockStore.initialized) {
		await trainingBlockStore.loadActiveBlock();
	}

	// Build workout context if in active workout
	const workoutContext = isInWorkout() ? buildWorkoutContext() : null;

	return {
		type: workoutContext ? 'workout' : 'global',
		activeWorkout: workoutContext,
		trainingBlock: trainingBlockStore.block,
		todayWorkout: trainingBlockStore.getToday(),
		userStats: trainingBlockStore.stats
	};
}

/**
 * Build context synchronously (if stores are already initialized)
 */
export function buildUnifiedContextSync(): UnifiedContext {
	const workoutContext = isInWorkout() ? buildWorkoutContext() : null;

	return {
		type: workoutContext ? 'workout' : 'global',
		activeWorkout: workoutContext,
		trainingBlock: trainingBlockStore.block,
		todayWorkout: trainingBlockStore.getToday(),
		userStats: trainingBlockStore.stats
	};
}

// ============================================================================
// AVAILABLE TOOLS
// ============================================================================

/**
 * Get available tools based on current context
 */
export function getAvailableTools(context: UnifiedContext): ToolName[] {
	const tools: ToolName[] = [];

	// Query tools are always available
	tools.push(...QUERY_TOOLS);

	// If user has a training block, schedule and block tools are available
	if (context.trainingBlock) {
		tools.push(...SCHEDULE_TOOLS);
		tools.push(...BLOCK_TOOLS);
	}

	// If in active workout, workout tools are available
	if (context.type === 'workout' && context.activeWorkout) {
		tools.push(...WORKOUT_TOOLS);
	}

	return tools;
}

/**
 * Check if a specific tool is available in the current context
 */
export function isToolAvailable(tool: ToolName, context: UnifiedContext): boolean {
	return getAvailableTools(context).includes(tool);
}

/**
 * Get tool category
 */
export function getToolCategory(
	tool: ToolName
): 'workout' | 'schedule' | 'block' | 'query' | null {
	if ((WORKOUT_TOOLS as string[]).includes(tool)) return 'workout';
	if ((SCHEDULE_TOOLS as string[]).includes(tool)) return 'schedule';
	if ((BLOCK_TOOLS as string[]).includes(tool)) return 'block';
	if ((QUERY_TOOLS as string[]).includes(tool)) return 'query';
	return null;
}

// ============================================================================
// CONTEXT SUMMARY (for AI system prompt)
// ============================================================================

/**
 * Build a human-readable context summary for AI system prompt
 */
export function buildContextSummary(context: UnifiedContext): string {
	const parts: string[] = [];

	if (context.trainingBlock) {
		const block = context.trainingBlock;
		parts.push(`Training Block: "${block.name}"`);
		parts.push(`Week ${block.current_week} of ${block.total_weeks}`);

		if (context.todayWorkout) {
			parts.push(`Today's Workout: ${context.todayWorkout.name} (Day ${context.todayWorkout.day_number})`);
			if (context.todayWorkout.exercise_count > 0) {
				parts.push(`Exercises: ${context.todayWorkout.exercise_count}`);
			}
		}
	} else {
		parts.push('No active training block');
	}

	if (context.type === 'workout' && context.activeWorkout) {
		parts.push('');
		parts.push('--- ACTIVE WORKOUT ---');
		const current = context.activeWorkout.currentExercise;
		parts.push(`Current Exercise: ${current.name}`);
		parts.push(`Set ${current.setNumber} of ${current.totalSets}`);
		if (current.previousSession) {
			parts.push(
				`Previous: ${current.previousSession.weight}lbs × ${current.previousSession.reps}` +
					(current.previousSession.rir !== undefined ? ` @ RIR ${current.previousSession.rir}` : '')
			);
		}
		parts.push(`Remaining: ${context.activeWorkout.remainingExercises.join(', ')}`);
	}

	if (context.userStats) {
		parts.push('');
		parts.push('--- STATS ---');
		parts.push(`Workouts: ${context.userStats.totalWorkouts}`);
		parts.push(`Sets Logged: ${context.userStats.totalSetsLogged}`);
	}

	return parts.join('\n');
}
