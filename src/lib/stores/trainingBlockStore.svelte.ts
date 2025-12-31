/**
 * Training Block Store
 *
 * Lightweight store for global access to training block data.
 * Used by the AI assistant for schedule management and queries.
 */

import { supabase } from '$lib/db/supabase';
import { auth } from './auth.svelte';
import type { TrainingBlockStatus, TrainingGoal } from '$lib/types';

// Types for Supabase query results
interface WorkoutDayRow {
	id: string;
	day_number: number;
	name: string;
	target_muscles: string[] | null;
}

interface TrainingBlockRow {
	id: string;
	name: string;
	total_weeks: number;
	current_week: number;
	current_day: number;
	status: string;
	goal: string | null;
	started_at: string | null;
	workout_days: WorkoutDayRow[];
}

// Summary types for AI context
export interface WorkoutDaySummary {
	id: string;
	day_number: number;
	name: string;
	target_muscles: string[];
	exercise_count: number;
}

export interface TrainingBlockSummary {
	id: string;
	name: string;
	total_weeks: number;
	current_week: number;
	current_day: number;
	status: TrainingBlockStatus;
	goal: TrainingGoal | null;
	started_at: string | null;
	workout_days: WorkoutDaySummary[];
}

export interface UserStats {
	totalWorkouts: number;
	totalSetsLogged: number;
	totalWeightLifted: number;
	currentStreak: number;
}

interface TrainingBlockState {
	block: TrainingBlockSummary | null;
	stats: UserStats | null;
	loading: boolean;
	initialized: boolean;
	error: string | null;
}

function createTrainingBlockStore() {
	let state = $state<TrainingBlockState>({
		block: null,
		stats: null,
		loading: false,
		initialized: false,
		error: null
	});

	// Track in-flight loading promise to prevent race conditions
	let loadingPromise: Promise<void> | null = null;

	/**
	 * Load the user's active training block
	 * Returns existing promise if load is already in progress
	 */
	async function loadActiveBlock(): Promise<void> {
		// If already loading, return the existing promise
		if (loadingPromise) {
			return loadingPromise;
		}

		if (!auth.user) {
			state.block = null;
			state.initialized = true;
			return;
		}

		state.loading = true;
		state.error = null;

		// Create and store the loading promise
		loadingPromise = (async () => {

		try {
			const { data: rawData, error } = await supabase
				.from('training_blocks')
				.select(`
					id,
					name,
					total_weeks,
					current_week,
					current_day,
					status,
					goal,
					started_at,
					workout_days (
						id,
						day_number,
						name,
						target_muscles
					)
				`)
				.eq('user_id', auth.user.id)
				.eq('status', 'active')
				.maybeSingle();

			if (error) {
				throw error;
			}

			const data = rawData as TrainingBlockRow | null;

			if (!data) {
				// No active block found
				state.block = null;
			} else {
				// Get exercise counts per day
				const dayIds = data.workout_days.map((d) => d.id);
				const { data: slotCounts } = await supabase
					.from('exercise_slots')
					.select('workout_day_id')
					.in('workout_day_id', dayIds);

				const countsByDay = new Map<string, number>();
				slotCounts?.forEach((slot: { workout_day_id: string }) => {
					const count = countsByDay.get(slot.workout_day_id) || 0;
					countsByDay.set(slot.workout_day_id, count + 1);
				});

				state.block = {
					id: data.id,
					name: data.name,
					total_weeks: data.total_weeks,
					current_week: data.current_week,
					current_day: data.current_day,
					status: data.status as TrainingBlockStatus,
					goal: data.goal as TrainingGoal | null,
					started_at: data.started_at,
					workout_days: data.workout_days
						.map((day) => ({
							id: day.id,
							day_number: day.day_number,
							name: day.name,
							target_muscles: day.target_muscles || [],
							exercise_count: countsByDay.get(day.id) || 0
						}))
						.sort((a, b) => a.day_number - b.day_number)
				};
			}
		} catch (err) {
			console.error('Error loading training block:', err);
			state.error = err instanceof Error ? err.message : 'Failed to load training block';
		} finally {
			state.loading = false;
			state.initialized = true;
			loadingPromise = null; // Clear the promise so next call starts fresh
		}
		})();

		return loadingPromise;
	}

	/**
	 * Wait for store to be initialized
	 * Safe to call multiple times - returns immediately if already initialized
	 */
	async function waitForInitialization(): Promise<void> {
		if (state.initialized && !loadingPromise) {
			return;
		}
		if (loadingPromise) {
			return loadingPromise;
		}
		return loadActiveBlock();
	}

	/**
	 * Load user stats for AI context
	 */
	async function loadStats(): Promise<void> {
		if (!auth.user) {
			state.stats = null;
			return;
		}

		try {
			// Get total workouts completed
			const { count: workoutCount } = await supabase
				.from('workout_sessions')
				.select('*', { count: 'exact', head: true })
				.eq('status', 'completed');

			// Get total sets logged
			const { count: setCount } = await supabase
				.from('logged_sets')
				.select('*', { count: 'exact', head: true });

			// Get total weight lifted (sum of weight * reps for all sets)
			const { data: weightData } = await supabase
				.from('logged_sets')
				.select('actual_weight, actual_reps');

			let totalWeight = 0;
			weightData?.forEach((set: { actual_weight: number | null; actual_reps: number | null }) => {
				if (set.actual_weight && set.actual_reps) {
					totalWeight += set.actual_weight * set.actual_reps;
				}
			});

			state.stats = {
				totalWorkouts: workoutCount || 0,
				totalSetsLogged: setCount || 0,
				totalWeightLifted: Math.round(totalWeight),
				currentStreak: 0 // TODO: Calculate streak
			};
		} catch (err) {
			console.error('Error loading stats:', err);
		}
	}

	/**
	 * Get today's workout day
	 */
	function getToday(): WorkoutDaySummary | null {
		if (!state.block) return null;
		return state.block.workout_days.find(d => d.day_number === state.block!.current_day) || null;
	}

	/**
	 * Get workout day by number
	 */
	function getDay(dayNumber: number): WorkoutDaySummary | null {
		if (!state.block) return null;
		return state.block.workout_days.find(d => d.day_number === dayNumber) || null;
	}

	/**
	 * Swap two workout days
	 */
	async function swapDays(dayA: number, dayB: number): Promise<boolean> {
		if (!state.block) return false;

		const dayAData = state.block.workout_days.find(d => d.day_number === dayA);
		const dayBData = state.block.workout_days.find(d => d.day_number === dayB);

		if (!dayAData || !dayBData) return false;

		try {
			// Swap day_number values in database
			// Use a temporary value to avoid unique constraint violation
			const tempDayNumber = 999;

			// Move dayA to temp
			await supabase
				.from('workout_days')
				.update({ day_number: tempDayNumber })
				.eq('id', dayAData.id);

			// Move dayB to dayA's position
			await supabase
				.from('workout_days')
				.update({ day_number: dayA })
				.eq('id', dayBData.id);

			// Move temp (dayA) to dayB's position
			await supabase
				.from('workout_days')
				.update({ day_number: dayB })
				.eq('id', dayAData.id);

			// Reload to get fresh data
			await loadActiveBlock();
			return true;
		} catch (err) {
			console.error('Error swapping days:', err);
			return false;
		}
	}

	/**
	 * Skip current day (advance without completing workout)
	 */
	async function skipCurrentDay(): Promise<boolean> {
		if (!state.block) return false;

		try {
			const totalDays = state.block.workout_days.length;
			let nextDay = state.block.current_day + 1;
			let nextWeek = state.block.current_week;

			if (nextDay > totalDays) {
				nextDay = 1;
				nextWeek += 1;
			}

			// Check if block is complete
			if (nextWeek > state.block.total_weeks) {
				// Mark block as complete
				await supabase
					.from('training_blocks')
					.update({
						status: 'completed',
						completed_at: new Date().toISOString()
					})
					.eq('id', state.block.id);
			} else {
				// Advance to next day
				await supabase
					.from('training_blocks')
					.update({
						current_day: nextDay,
						current_week: nextWeek
					})
					.eq('id', state.block.id);
			}

			await loadActiveBlock();
			return true;
		} catch (err) {
			console.error('Error skipping day:', err);
			return false;
		}
	}

	/**
	 * Reschedule current day to a different day number
	 */
	async function rescheduleToDay(targetDayNumber: number): Promise<boolean> {
		if (!state.block) return false;
		if (targetDayNumber < 1 || targetDayNumber > state.block.workout_days.length) return false;

		try {
			await supabase
				.from('training_blocks')
				.update({ current_day: targetDayNumber })
				.eq('id', state.block.id);

			await loadActiveBlock();
			return true;
		} catch (err) {
			console.error('Error rescheduling day:', err);
			return false;
		}
	}

	/**
	 * Refresh the store data
	 */
	async function refresh(): Promise<void> {
		await Promise.all([loadActiveBlock(), loadStats()]);
	}

	/**
	 * Clear store state (on logout)
	 */
	function clear(): void {
		state.block = null;
		state.stats = null;
		state.initialized = false;
		state.error = null;
	}

	return {
		// State getters
		get block() {
			return state.block;
		},
		get stats() {
			return state.stats;
		},
		get loading() {
			return state.loading;
		},
		get initialized() {
			return state.initialized;
		},
		get error() {
			return state.error;
		},
		get hasActiveBlock() {
			return !!state.block;
		},

		// Methods
		loadActiveBlock,
		loadStats,
		waitForInitialization,
		getToday,
		getDay,
		swapDays,
		skipCurrentDay,
		rescheduleToDay,
		refresh,
		clear
	};
}

export const trainingBlockStore = createTrainingBlockStore();
