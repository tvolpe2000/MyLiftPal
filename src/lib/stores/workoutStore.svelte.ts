import { supabase } from '$lib/db/supabase';
import { auth } from './auth.svelte';
import { offline } from './offlineStore.svelte';
import { calculateSetsForWeek } from '$lib/types/wizard';
import type { PendingSet } from '$lib/db/indexedDB';
import type {
	WorkoutState,
	ExerciseState,
	SetState,
	SetInputData,
	TrainingBlockWithDays,
	WorkoutDayWithSlots,
	ExerciseSlotWithExercise
} from '$lib/types/workout';
import type { WorkoutSession, LoggedSet } from '$lib/types/index';

function createWorkoutStore() {
	let state = $state<WorkoutState>({
		trainingBlock: null,
		currentWorkoutDay: null,
		session: null,
		exercises: [],
		loading: true,
		error: '',
		isSaving: false,
		activeSetInput: null
	});

	// Derived values
	const totalSets = $derived(
		state.exercises.reduce((sum, ex) => sum + ex.setsThisWeek, 0)
	);

	const completedSets = $derived(
		state.exercises.reduce(
			(sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
			0
		)
	);

	const progress = $derived(totalSets > 0 ? (completedSets / totalSets) * 100 : 0);

	const canComplete = $derived(completedSets > 0);

	async function loadWorkout(blockId: string) {
		if (!auth.user) return;

		state.loading = true;
		state.error = '';

		try {
			// Step 1: Fetch training block with workout days
			const { data: blockData, error: blockError } = await supabase
				.from('training_blocks')
				.select(
					`
					id, name, total_weeks, current_week, current_day, status,
					workout_days (id, day_number, name, target_muscles, time_budget_minutes)
				`
				)
				.eq('id', blockId)
				.eq('user_id', auth.user.id)
				.single();

			if (blockError) throw blockError;
			if (!blockData) throw new Error('Training block not found');

			const block = blockData as unknown as TrainingBlockWithDays;
			state.trainingBlock = block;

			// Step 2: Find current workout day
			const currentDay = block.workout_days?.find(
				(d) => d.day_number === block.current_day
			);

			if (!currentDay) throw new Error('Current workout day not found');

			// Step 3: Fetch exercise slots with exercise details
			const { data: slotsData, error: slotsError } = await supabase
				.from('exercise_slots')
				.select(
					`
					*,
					exercise:exercises (*)
				`
				)
				.eq('workout_day_id', currentDay.id)
				.order('slot_order');

			if (slotsError) throw slotsError;

			const slots = (slotsData || []) as unknown as ExerciseSlotWithExercise[];

			state.currentWorkoutDay = {
				...currentDay,
				exercise_slots: slots
			} as WorkoutDayWithSlots;

			// Step 4: Initialize or fetch session
			await initializeSession(blockId, currentDay.id, block.current_week);

			// Step 5: Build exercise state with sets
			await buildExerciseState(slots, block.current_week);
		} catch (error) {
			console.error('Error loading workout:', error);
			state.error = error instanceof Error ? error.message : 'Failed to load workout';
		} finally {
			state.loading = false;
		}
	}

	async function initializeSession(
		blockId: string,
		workoutDayId: string,
		weekNumber: number
	) {
		if (!auth.user) return;

		// Check for existing session
		const { data: existingSessionData, error: sessionError } = await supabase
			.from('workout_sessions')
			.select('*, logged_sets (*)')
			.eq('training_block_id', blockId)
			.eq('workout_day_id', workoutDayId)
			.eq('week_number', weekNumber)
			.maybeSingle();

		if (sessionError) throw sessionError;

		if (existingSessionData) {
			const existingSession = existingSessionData as unknown as WorkoutSession & { logged_sets: LoggedSet[] };

			// Update to in_progress if it was scheduled
			if (existingSession.status === 'scheduled') {
				await supabase
					.from('workout_sessions')
					.update({
						status: 'in_progress',
						started_at: new Date().toISOString()
					} as never)
					.eq('id', existingSession.id);
				existingSession.status = 'in_progress';
				existingSession.started_at = new Date().toISOString();
			}
			state.session = existingSession;
		} else {
			// Create new session
			const { data: newSessionData, error: createError } = await supabase
				.from('workout_sessions')
				.insert({
					user_id: auth.user.id,
					training_block_id: blockId,
					workout_day_id: workoutDayId,
					week_number: weekNumber,
					status: 'in_progress',
					started_at: new Date().toISOString()
				} as never)
				.select()
				.single();

			if (createError) throw createError;
			const newSession = newSessionData as unknown as WorkoutSession;
			state.session = { ...newSession, logged_sets: [] } as WorkoutSession & {
				logged_sets: LoggedSet[];
			};
		}
	}

	async function buildExerciseState(
		slots: ExerciseSlotWithExercise[],
		weekNumber: number
	) {
		const exercises: ExerciseState[] = [];
		const sessionWithSets = state.session as (WorkoutSession & { logged_sets?: LoggedSet[] }) | null;
		const existingLoggedSets = sessionWithSets?.logged_sets || [];

		// Fetch previous session for all set data (weight, reps, RIR)
		const previousSets: Record<string, { weight: number | null; reps: number | null; rir: number | null }> = {};
		if (state.currentWorkoutDay) {
			const { data: prevSessionData } = await supabase
				.from('workout_sessions')
				.select('logged_sets (*)')
				.eq('workout_day_id', state.currentWorkoutDay.id)
				.eq('status', 'completed')
				.order('completed_at', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (prevSessionData) {
				const prevSession = prevSessionData as unknown as { logged_sets: LoggedSet[] };
				if (prevSession.logged_sets) {
					for (const set of prevSession.logged_sets) {
						const key = `${set.exercise_slot_id}-${set.set_number}`;
						previousSets[key] = {
							weight: set.actual_weight,
							reps: set.actual_reps,
							rir: set.rir
						};
					}
				}
			}
		}

		for (const slot of slots) {
			const setsThisWeek = calculateSetsForWeek(
				slot.base_sets,
				slot.set_progression,
				weekNumber
			);

			const sets: SetState[] = [];
			for (let i = 1; i <= setsThisWeek; i++) {
				// Check if this set was already logged
				const existingSet = existingLoggedSets.find(
					(ls: LoggedSet) => ls.exercise_slot_id === slot.id && ls.set_number === i
				);

				const prevKey = `${slot.id}-${i}`;
				const prevSetData = previousSets[prevKey] || null;

				sets.push({
					id: existingSet?.id || null,
					setNumber: i,
					targetWeight: prevSetData?.weight || null,
					targetReps: Math.round((slot.rep_range_min + slot.rep_range_max) / 2),
					actualWeight: existingSet?.actual_weight || null,
					actualReps: existingSet?.actual_reps || null,
					rir: existingSet?.rir ?? null,
					completed: existingSet?.completed || false,
					previous: prevSetData
				});
			}

			exercises.push({
				slot,
				setsThisWeek,
				sets,
				isExpanded: exercises.length === 0 // Expand first exercise by default
			});
		}

		state.exercises = exercises;
	}

	function openSetInput(exerciseIndex: number, setIndex: number) {
		state.activeSetInput = { exerciseIndex, setIndex };
	}

	function closeSetInput() {
		state.activeSetInput = null;
	}

	function toggleExerciseExpanded(exerciseIndex: number) {
		state.exercises[exerciseIndex].isExpanded = !state.exercises[exerciseIndex].isExpanded;
	}

	async function quickLogSet(
		exerciseIndex: number,
		setIndex: number,
		data: SetInputData
	): Promise<boolean> {
		if (!state.session || !auth.user) return false;

		const exercise = state.exercises[exerciseIndex];
		const set = exercise.sets[setIndex];

		state.isSaving = true;

		try {
			// If offline, queue the set for later sync
			if (!offline.isOnline) {
				const pendingSet: PendingSet = {
					id: crypto.randomUUID(),
					sessionId: state.session.id,
					exerciseSlotId: exercise.slot.id,
					exerciseId: exercise.slot.exercise.id,
					setNumber: set.setNumber,
					weight: data.weight,
					reps: data.reps,
					rir: data.rir,
					createdAt: Date.now()
				};

				await offline.queueSet(pendingSet);

				// Update local state optimistically
				set.actualWeight = data.weight;
				set.actualReps = data.reps;
				set.rir = data.rir;
				set.completed = true;

				return true;
			}

			// Online: save to Supabase
			const setData = {
				session_id: state.session.id,
				exercise_slot_id: exercise.slot.id,
				exercise_id: exercise.slot.exercise.id,
				set_number: set.setNumber,
				target_reps: set.targetReps,
				actual_reps: data.reps,
				target_weight: set.targetWeight,
				actual_weight: data.weight,
				weight_unit: (auth.profile?.weight_unit || 'lbs') as 'lbs' | 'kg',
				rir: data.rir,
				completed: true,
				logged_at: new Date().toISOString()
			};

			if (set.id) {
				const { error } = await supabase
					.from('logged_sets')
					.update(setData as never)
					.eq('id', set.id);
				if (error) throw error;
			} else {
				const { data: newSetData, error } = await supabase
					.from('logged_sets')
					.insert(setData as never)
					.select()
					.single();
				if (error) throw error;
				const newSet = newSetData as unknown as { id: string };
				set.id = newSet.id;
			}

			set.actualWeight = data.weight;
			set.actualReps = data.reps;
			set.rir = data.rir;
			set.completed = true;

			return true;
		} catch (error) {
			console.error('Error quick logging set:', error);
			state.error = 'Failed to save set';
			return false;
		} finally {
			state.isSaving = false;
		}
	}

	async function logSet(data: SetInputData) {
		if (!state.activeSetInput || !state.session || !auth.user) return;

		const { exerciseIndex, setIndex } = state.activeSetInput;
		const exercise = state.exercises[exerciseIndex];
		const set = exercise.sets[setIndex];

		state.isSaving = true;

		try {
			// If offline, queue the set for later sync
			if (!offline.isOnline) {
				const pendingSet: PendingSet = {
					id: crypto.randomUUID(),
					sessionId: state.session.id,
					exerciseSlotId: exercise.slot.id,
					exerciseId: exercise.slot.exercise.id,
					setNumber: set.setNumber,
					weight: data.weight,
					reps: data.reps,
					rir: data.rir,
					createdAt: Date.now()
				};

				await offline.queueSet(pendingSet);

				// Update local state optimistically
				set.actualWeight = data.weight;
				set.actualReps = data.reps;
				set.rir = data.rir;
				set.completed = true;

				closeSetInput();
				return;
			}

			// Online: save to Supabase
			const setData = {
				session_id: state.session.id,
				exercise_slot_id: exercise.slot.id,
				exercise_id: exercise.slot.exercise.id,
				set_number: set.setNumber,
				target_reps: set.targetReps,
				actual_reps: data.reps,
				target_weight: set.targetWeight,
				actual_weight: data.weight,
				weight_unit: (auth.profile?.weight_unit || 'lbs') as 'lbs' | 'kg',
				rir: data.rir,
				completed: true,
				logged_at: new Date().toISOString()
			};

			if (set.id) {
				// Update existing
				const { error } = await supabase
					.from('logged_sets')
					.update(setData as never)
					.eq('id', set.id);
				if (error) throw error;
			} else {
				// Insert new
				const { data: newSetData, error } = await supabase
					.from('logged_sets')
					.insert(setData as never)
					.select()
					.single();
				if (error) throw error;
				const newSet = newSetData as unknown as { id: string };
				set.id = newSet.id;
			}

			// Update local state
			set.actualWeight = data.weight;
			set.actualReps = data.reps;
			set.rir = data.rir;
			set.completed = true;

			closeSetInput();
		} catch (error) {
			console.error('Error logging set:', error);
			state.error = 'Failed to save set';
		} finally {
			state.isSaving = false;
		}
	}

	async function completeWorkout() {
		if (!state.session || !state.trainingBlock) return;

		state.isSaving = true;

		try {
			// 1. Update session
			const { error: sessionError } = await supabase
				.from('workout_sessions')
				.update({
					status: 'completed',
					completed_at: new Date().toISOString()
				} as never)
				.eq('id', state.session.id);

			if (sessionError) throw sessionError;

			// 2. Advance day/week
			await advanceDay();

			return true;
		} catch (error) {
			console.error('Error completing workout:', error);
			state.error = 'Failed to complete workout';
			return false;
		} finally {
			state.isSaving = false;
		}
	}

	async function advanceDay() {
		if (!state.trainingBlock) return;

		const block = state.trainingBlock;
		const totalDays = block.workout_days.length;

		let nextDay = block.current_day + 1;
		let nextWeek = block.current_week;

		if (nextDay > totalDays) {
			nextDay = 1;
			nextWeek += 1;
		}

		// Check if block is complete
		const isComplete = nextWeek > block.total_weeks;

		if (isComplete) {
			const { error } = await supabase
				.from('training_blocks')
				.update({
					current_day: nextDay,
					current_week: nextWeek,
					status: 'completed',
					completed_at: new Date().toISOString()
				} as never)
				.eq('id', block.id);
			if (error) throw error;
		} else {
			const { error } = await supabase
				.from('training_blocks')
				.update({
					current_day: nextDay,
					current_week: nextWeek
				} as never)
				.eq('id', block.id);
			if (error) throw error;
		}
	}

	function reset() {
		state.trainingBlock = null;
		state.currentWorkoutDay = null;
		state.session = null;
		state.exercises = [];
		state.loading = true;
		state.error = '';
		state.isSaving = false;
		state.activeSetInput = null;
	}

	return {
		// State getters
		get trainingBlock() {
			return state.trainingBlock;
		},
		get currentWorkoutDay() {
			return state.currentWorkoutDay;
		},
		get session() {
			return state.session;
		},
		get exercises() {
			return state.exercises;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get isSaving() {
			return state.isSaving;
		},
		get activeSetInput() {
			return state.activeSetInput;
		},

		// Derived getters
		get totalSets() {
			return totalSets;
		},
		get completedSets() {
			return completedSets;
		},
		get progress() {
			return progress;
		},
		get canComplete() {
			return canComplete;
		},

		// Methods
		loadWorkout,
		openSetInput,
		closeSetInput,
		toggleExerciseExpanded,
		quickLogSet,
		logSet,
		completeWorkout,
		reset
	};
}

export const workout = createWorkoutStore();
