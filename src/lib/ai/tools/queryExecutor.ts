/**
 * Query Tool Executor for IronAthena Voice Assistant
 *
 * Executes read-only query tools that fetch data from the database.
 */

import { supabase } from '$lib/db/supabase';
import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
import { auth } from '$lib/stores/auth.svelte';
import type {
	ToolExecutionResult,
	TodaysWorkoutResult,
	WeeklyVolumeResult,
	PersonalRecordResult,
	StatsResult,
	BlockProgressResult
} from '../types';
import type {
	GetTodaysWorkoutParams,
	GetWeeklyVolumeParams,
	GetPersonalRecordsParams,
	GetStatsParams,
	GetBlockProgressParams
} from './queryTools';

// ============================================
// Query Executors
// ============================================

/**
 * Get today's scheduled workout
 */
export async function executeGetTodaysWorkout(
	_params: GetTodaysWorkoutParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;
	const today = trainingBlockStore.getToday();

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block. Create one to see your scheduled workouts."
		};
	}

	if (!today) {
		return {
			success: false,
			message: 'No workout scheduled for today.'
		};
	}

	// Fetch exercises for today's workout
	const { data: slots, error } = await supabase
		.from('exercise_slots')
		.select(`
			id,
			slot_order,
			exercises (
				id,
				name,
				primary_muscle
			)
		`)
		.eq('workout_day_id', today.id)
		.order('slot_order');

	if (error) {
		console.error('Error fetching exercises:', error);
		return {
			success: false,
			message: 'Failed to load workout details.'
		};
	}

	const exercises = slots?.map((s) => (s.exercises as { name: string })?.name || 'Unknown') || [];

	const result: TodaysWorkoutResult = {
		dayName: today.name,
		dayNumber: today.day_number,
		exercises,
		targetMuscles: today.target_muscles,
		estimatedDuration: undefined // Could calculate from exercise work times
	};

	const exerciseList = exercises.length > 0 ? exercises.join(', ') : 'No exercises';

	return {
		success: true,
		message: `Today is ${today.name} (Day ${today.day_number}): ${exerciseList}`,
		data: result as unknown as Record<string, unknown>
	};
}

/**
 * Get weekly volume per muscle group
 */
export async function executeGetWeeklyVolume(
	params: GetWeeklyVolumeParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block to show volume for."
		};
	}

	// Get all exercise slots with their exercises
	const { data: days, error } = await supabase
		.from('workout_days')
		.select(`
			id,
			name,
			exercise_slots (
				base_sets,
				set_progression,
				exercises (
					primary_muscle,
					secondary_muscles
				)
			)
		`)
		.eq('training_block_id', block.id);

	if (error) {
		console.error('Error fetching volume:', error);
		return {
			success: false,
			message: 'Failed to calculate volume.'
		};
	}

	// Calculate volume per muscle group
	const volumeMap = new Map<string, { direct: number; indirect: number }>();

	for (const day of days || []) {
		for (const slot of day.exercise_slots || []) {
			const exercise = slot.exercises as { primary_muscle: string; secondary_muscles?: Array<{ muscle_id: string; contribution: number }> } | null;
			if (!exercise) continue;

			const baseSets = slot.base_sets || 3;

			// Direct sets for primary muscle
			const primary = exercise.primary_muscle;
			if (!volumeMap.has(primary)) {
				volumeMap.set(primary, { direct: 0, indirect: 0 });
			}
			volumeMap.get(primary)!.direct += baseSets;

			// Indirect sets for secondary muscles
			for (const secondary of exercise.secondary_muscles || []) {
				const muscleId = secondary.muscle_id;
				const contribution = secondary.contribution || 0.5;
				if (!volumeMap.has(muscleId)) {
					volumeMap.set(muscleId, { direct: 0, indirect: 0 });
				}
				volumeMap.get(muscleId)!.indirect += baseSets * contribution;
			}
		}
	}

	// Filter by muscle group if specified
	let results: WeeklyVolumeResult[] = [];
	for (const [muscle, volume] of volumeMap) {
		if (params.muscleGroup && !muscle.toLowerCase().includes(params.muscleGroup.toLowerCase())) {
			continue;
		}
		results.push({
			muscleGroup: muscle,
			directSets: volume.direct,
			indirectSets: Math.round(volume.indirect * 10) / 10,
			totalSets: Math.round((volume.direct + volume.indirect) * 10) / 10,
			status: volume.direct >= 10 ? 'optimal' : volume.direct >= 6 ? 'below' : 'high'
		});
	}

	// Sort by total sets descending
	results.sort((a, b) => b.totalSets - a.totalSets);

	if (results.length === 0) {
		return {
			success: true,
			message: params.muscleGroup
				? `No volume data found for "${params.muscleGroup}".`
				: 'No volume data found.',
			data: { results: [] }
		};
	}

	const summary = results
		.slice(0, 5)
		.map((r) => `${r.muscleGroup}: ${r.totalSets} sets`)
		.join(', ');

	return {
		success: true,
		message: `Weekly volume: ${summary}`,
		data: { results } as unknown as Record<string, unknown>
	};
}

/**
 * Get personal records
 */
export async function executeGetPersonalRecords(
	params: GetPersonalRecordsParams
): Promise<ToolExecutionResult> {
	if (!auth.user) {
		return {
			success: false,
			message: 'You need to be logged in to see personal records.'
		};
	}

	let query = supabase
		.from('logged_sets')
		.select(`
			actual_weight,
			actual_reps,
			logged_at,
			exercise_slots (
				exercises (
					name
				)
			)
		`)
		.not('actual_weight', 'is', null)
		.order('actual_weight', { ascending: false })
		.limit(params.limit || 5);

	// Filter by exercise if specified
	if (params.exerciseName) {
		// First find matching exercise IDs
		const { data: exercises } = await supabase
			.from('exercises')
			.select('id')
			.ilike('name', `%${params.exerciseName}%`);

		if (exercises && exercises.length > 0) {
			const exerciseIds = exercises.map((e) => e.id);
			// Get slots for these exercises
			const { data: slots } = await supabase
				.from('exercise_slots')
				.select('id')
				.in('exercise_id', exerciseIds);

			if (slots && slots.length > 0) {
				const slotIds = slots.map((s) => s.id);
				query = query.in('exercise_slot_id', slotIds);
			}
		}
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error fetching PRs:', error);
		return {
			success: false,
			message: 'Failed to fetch personal records.'
		};
	}

	if (!data || data.length === 0) {
		return {
			success: true,
			message: params.exerciseName
				? `No records found for "${params.exerciseName}".`
				: 'No personal records yet. Start logging workouts!',
			data: { records: [] }
		};
	}

	const records: PersonalRecordResult[] = data.map((set) => ({
		exerciseName: ((set.exercise_slots as { exercises: { name: string } })?.exercises?.name) || 'Unknown',
		weight: set.actual_weight!,
		reps: set.actual_reps || 0,
		date: set.logged_at ? new Date(set.logged_at).toLocaleDateString() : 'Unknown'
	}));

	const topRecords = records.slice(0, 3);
	const summary = topRecords
		.map((r) => `${r.exerciseName}: ${r.weight}lbs × ${r.reps}`)
		.join(', ');

	return {
		success: true,
		message: `Personal Records: ${summary}`,
		data: { records } as unknown as Record<string, unknown>
	};
}

/**
 * Get workout statistics
 */
export async function executeGetStats(params: GetStatsParams): Promise<ToolExecutionResult> {
	if (!auth.user) {
		return {
			success: false,
			message: 'You need to be logged in to see stats.'
		};
	}

	// Calculate date range
	const now = new Date();
	let startDate: Date;
	switch (params.timeframe) {
		case 'week':
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case 'month':
			startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		default:
			startDate = new Date(0); // All time
	}

	// Get completed workouts in range
	const { count: workoutCount } = await supabase
		.from('workout_sessions')
		.select('*', { count: 'exact', head: true })
		.eq('status', 'completed')
		.gte('completed_at', startDate.toISOString());

	// Get logged sets in range
	const { data: sets, count: setCount } = await supabase
		.from('logged_sets')
		.select('actual_weight, actual_reps', { count: 'exact' })
		.gte('logged_at', startDate.toISOString());

	let totalWeight = 0;
	sets?.forEach((set) => {
		if (set.actual_weight && set.actual_reps) {
			totalWeight += set.actual_weight * set.actual_reps;
		}
	});

	const result: StatsResult = {
		timeframe: params.timeframe,
		workoutsCompleted: workoutCount || 0,
		totalSets: setCount || 0,
		totalWeight: Math.round(totalWeight)
	};

	const timeframeLabel =
		params.timeframe === 'week' ? 'This week' : params.timeframe === 'month' ? 'This month' : 'All time';

	return {
		success: true,
		message: `${timeframeLabel}: ${result.workoutsCompleted} workouts, ${result.totalSets} sets, ${result.totalWeight.toLocaleString()} lbs moved`,
		data: result as unknown as Record<string, unknown>
	};
}

/**
 * Get training block progress
 */
export async function executeGetBlockProgress(
	_params: GetBlockProgressParams
): Promise<ToolExecutionResult> {
	const block = trainingBlockStore.block;

	if (!block) {
		return {
			success: false,
			message: "You don't have an active training block."
		};
	}

	// Calculate progress
	const totalWorkouts = block.total_weeks * block.workout_days.length;
	const completedWorkouts = (block.current_week - 1) * block.workout_days.length + (block.current_day - 1);
	const remainingWorkouts = totalWorkouts - completedWorkouts;
	const percentComplete = Math.round((completedWorkouts / totalWorkouts) * 100);

	const result: BlockProgressResult = {
		blockName: block.name,
		currentWeek: block.current_week,
		totalWeeks: block.total_weeks,
		percentComplete,
		workoutsCompleted: completedWorkouts,
		workoutsRemaining: remainingWorkouts
	};

	return {
		success: true,
		message: `${block.name}: Week ${block.current_week}/${block.total_weeks} (${percentComplete}% complete, ${remainingWorkouts} workouts left)`,
		data: result as unknown as Record<string, unknown>
	};
}
