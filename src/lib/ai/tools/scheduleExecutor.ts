/**
 * Schedule Tool Executor for IronAthena Voice Assistant
 *
 * Executes schedule management tools for swapping/skipping workout days.
 */

import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
import type { ToolExecutionResult } from '../types';
import type {
	SwapWorkoutDaysParams,
	SkipDayParams,
	RescheduleDayParams
} from './scheduleTools';

// ============================================
// Schedule Executors
// ============================================

/**
 * Swap two workout days in the schedule
 */
export async function executeSwapWorkoutDays(
	params: SwapWorkoutDaysParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	const { dayA, dayB } = params;

	// Validate day numbers
	const totalDays = block.workout_days.length;
	if (dayA < 1 || dayA > totalDays || dayB < 1 || dayB > totalDays) {
		return {
			success: false,
			message: `Invalid day numbers. Your block has ${totalDays} days (1-${totalDays}).`
		};
	}

	if (dayA === dayB) {
		return {
			success: false,
			message: "Can't swap a day with itself."
		};
	}

	// Get day names for feedback
	const dayAData = block.workout_days.find((d) => d.day_number === dayA);
	const dayBData = block.workout_days.find((d) => d.day_number === dayB);

	if (!dayAData || !dayBData) {
		return {
			success: false,
			message: 'Could not find the specified days.'
		};
	}

	const success = await trainingBlockStore.swapDays(dayA, dayB);

	if (success) {
		return {
			success: true,
			message: `Swapped Day ${dayA} (${dayAData.name}) with Day ${dayB} (${dayBData.name}).`,
			canUndo: true
		};
	} else {
		return {
			success: false,
			message: 'Failed to swap days. Please try again.'
		};
	}
}

/**
 * Skip today's workout
 */
export async function executeSkipDay(params: SkipDayParams): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	const today = trainingBlockStore.getToday();
	if (!today) {
		return {
			success: false,
			message: 'No workout scheduled for today.'
		};
	}

	const success = await trainingBlockStore.skipCurrentDay();

	if (success) {
		// Get the new current day after skip
		const newToday = trainingBlockStore.getToday();
		const nextWorkout = newToday ? newToday.name : 'Week complete';

		let message = `Skipped ${today.name}.`;
		if (params.reason) {
			message += ` Reason: ${params.reason}.`;
		}
		message += ` Next: ${nextWorkout}.`;

		return {
			success: true,
			message,
			canUndo: false // Can't undo skip easily
		};
	} else {
		return {
			success: false,
			message: 'Failed to skip day. Please try again.'
		};
	}
}

/**
 * Reschedule to a different day
 */
export async function executeRescheduleDay(
	params: RescheduleDayParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	const { targetDayNumber } = params;

	// Validate target day
	const totalDays = block.workout_days.length;
	if (targetDayNumber < 1 || targetDayNumber > totalDays) {
		return {
			success: false,
			message: `Invalid day number. Your block has ${totalDays} days (1-${totalDays}).`
		};
	}

	const currentDay = trainingBlockStore.getToday();
	const targetDay = trainingBlockStore.getDay(targetDayNumber);

	if (!targetDay) {
		return {
			success: false,
			message: 'Could not find the target day.'
		};
	}

	if (block.current_day === targetDayNumber) {
		return {
			success: true,
			message: `You're already on Day ${targetDayNumber} (${targetDay.name}).`
		};
	}

	const success = await trainingBlockStore.rescheduleToDay(targetDayNumber);

	if (success) {
		let message = `Rescheduled from ${currentDay?.name || 'current'} to ${targetDay.name} (Day ${targetDayNumber}).`;
		if (params.reason) {
			message += ` Reason: ${params.reason}`;
		}

		return {
			success: true,
			message,
			canUndo: true
		};
	} else {
		return {
			success: false,
			message: 'Failed to reschedule. Please try again.'
		};
	}
}
