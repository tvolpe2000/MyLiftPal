// Time estimation utilities for calculating workout duration

export type TimeStatus = 'under' | 'on_target' | 'over' | 'way_over';

export interface ExerciseSlotForTime {
	baseSets: number;
	setProgression: number;
	restSeconds: number | null;
	exercise?: {
		work_seconds: number;
		default_rest_seconds: number;
	};
}

export interface DayTimeEstimate {
	dayId: string;
	dayName: string;
	exerciseCount: number;
	workMinutes: number;
	restMinutes: number;
	transitionMinutes: number;
	totalMinutes: number;
	budgetMinutes: number | null;
	status: TimeStatus;
	statusLabel: string;
}

// Constants for time estimation
const DEFAULT_WORK_SECONDS = 45; // Time per set if no exercise data
const DEFAULT_REST_SECONDS = 90; // Rest between sets if not specified
const TRANSITION_SECONDS = 30; // Time between exercises

/**
 * Get time status and label based on total vs budget
 */
export function getTimeStatus(
	totalMinutes: number,
	budgetMinutes: number | null
): { status: TimeStatus; label: string } {
	if (budgetMinutes === null) {
		return { status: 'on_target', label: 'No budget' };
	}

	const diff = totalMinutes - budgetMinutes;
	const threshold = budgetMinutes * 0.1; // 10% tolerance

	if (diff <= -threshold) {
		return { status: 'under', label: 'Under budget' };
	}
	if (diff <= threshold) {
		return { status: 'on_target', label: 'On target' };
	}
	if (diff <= budgetMinutes * 0.25) {
		return { status: 'over', label: 'Over budget' };
	}
	return { status: 'way_over', label: 'Way over' };
}

/**
 * Get CSS color class for time status badge
 */
export function getTimeColorClass(status: TimeStatus): string {
	switch (status) {
		case 'under':
			return 'bg-blue-500/20 text-blue-400';
		case 'on_target':
			return 'bg-green-500/20 text-green-400';
		case 'over':
			return 'bg-yellow-500/20 text-yellow-400';
		case 'way_over':
			return 'bg-red-500/20 text-red-400';
	}
}

/**
 * Get CSS color class for time progress bar
 */
export function getTimeBarColor(status: TimeStatus): string {
	switch (status) {
		case 'under':
			return 'bg-blue-500';
		case 'on_target':
			return 'bg-green-500';
		case 'over':
			return 'bg-yellow-500';
		case 'way_over':
			return 'bg-red-500';
	}
}

/**
 * Calculate time estimate for a single day at a specific week
 */
export function calculateDayTime(
	slots: ExerciseSlotForTime[],
	weekNumber: number,
	budgetMinutes: number | null = null,
	dayId: string = '',
	dayName: string = ''
): DayTimeEstimate {
	let workMinutes = 0;
	let restMinutes = 0;

	for (const slot of slots) {
		// Calculate sets for this week with progression
		const sets = Math.ceil(slot.baseSets + slot.setProgression * (weekNumber - 1));

		// Get work time per set (from exercise or default)
		const workSeconds = slot.exercise?.work_seconds ?? DEFAULT_WORK_SECONDS;

		// Get rest time (slot override > exercise default > global default)
		const restSeconds =
			slot.restSeconds ?? slot.exercise?.default_rest_seconds ?? DEFAULT_REST_SECONDS;

		// Work time = sets * work_seconds
		workMinutes += (sets * workSeconds) / 60;

		// Rest time = (sets - 1) * rest_seconds (no rest after last set)
		if (sets > 1) {
			restMinutes += ((sets - 1) * restSeconds) / 60;
		}
	}

	// Transition time between exercises
	const transitionMinutes = (slots.length * TRANSITION_SECONDS) / 60;

	const totalMinutes = Math.round(workMinutes + restMinutes + transitionMinutes);
	const { status, label } = getTimeStatus(totalMinutes, budgetMinutes);

	return {
		dayId,
		dayName,
		exerciseCount: slots.length,
		workMinutes: Math.round(workMinutes),
		restMinutes: Math.round(restMinutes),
		transitionMinutes: Math.round(transitionMinutes),
		totalMinutes,
		budgetMinutes,
		status,
		statusLabel: label
	};
}

/**
 * Format minutes as readable string
 */
export function formatDuration(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} min`;
	}
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get time range string for week 1 to final week
 */
export function getTimeRange(week1Minutes: number, finalWeekMinutes: number): string {
	if (week1Minutes === finalWeekMinutes) {
		return `${week1Minutes} min`;
	}
	return `${week1Minutes}-${finalWeekMinutes} min`;
}

/**
 * Calculate progress percentage for time bar
 * Shows progress toward budget, capped at 100%
 */
export function getTimeProgress(totalMinutes: number, budgetMinutes: number | null): number {
	if (!budgetMinutes || budgetMinutes === 0) return 75; // Default to 75% if no budget
	return Math.min((totalMinutes / budgetMinutes) * 100, 100);
}
