import { supabase } from '$lib/db/supabase';
import { auth } from './auth.svelte';
import { offline } from './offlineStore.svelte';
import { calculateSetsForWeek } from '$lib/types/wizard';
import type { PendingSet, WorkoutStateSnapshot } from '$lib/db/indexedDB';
import {
	saveWorkoutSnapshot,
	getWorkoutSnapshot,
	deleteWorkoutSnapshot,
	getSnapshotId
} from '$lib/db/indexedDB';
import type {
	WorkoutState,
	ExerciseState,
	SetState,
	SetInputData,
	TrainingBlockWithDays,
	WorkoutDayWithSlots,
	ExerciseSlotWithExercise
} from '$lib/types/workout';
import type { WorkoutSession, LoggedSet, Exercise } from '$lib/types/index';

function createWorkoutStore() {
	let state = $state<WorkoutState>({
		trainingBlock: null,
		currentWorkoutDay: null,
		session: null,
		exercises: [],
		loading: true,
		error: '',
		isSaving: false,
		activeSetInput: null,
		isEditMode: false,
		originalSession: null
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

	async function loadPastSession(sessionId: string) {
		if (!auth.user) return;

		state.loading = true;
		state.error = '';
		state.isEditMode = true;

		try {
			// Fetch session with related data
			const { data: sessionData, error: sessionError } = await supabase
				.from('workout_sessions')
				.select(`
					*,
					logged_sets (*)
				`)
				.eq('id', sessionId)
				.eq('user_id', auth.user.id)
				.single();

			if (sessionError) throw sessionError;
			if (!sessionData) throw new Error('Session not found');

			const session = sessionData as unknown as WorkoutSession & { logged_sets: LoggedSet[] };
			state.session = session;
			state.originalSession = { ...session } as WorkoutSession;

			// Fetch training block
			const { data: blockData, error: blockError } = await supabase
				.from('training_blocks')
				.select(`
					id, name, total_weeks, current_week, current_day, status,
					workout_days (id, day_number, name, target_muscles, time_budget_minutes)
				`)
				.eq('id', session.training_block_id)
				.single();

			if (blockError) throw blockError;
			if (!blockData) throw new Error('Training block not found');

			const block = blockData as unknown as TrainingBlockWithDays;
			state.trainingBlock = block;

			// Find the workout day for this session
			const workoutDay = block.workout_days?.find(d => d.id === session.workout_day_id);
			if (!workoutDay) throw new Error('Workout day not found');

			// Fetch exercise slots
			const { data: slotsData, error: slotsError } = await supabase
				.from('exercise_slots')
				.select(`*, exercise:exercises (*)`)
				.eq('workout_day_id', session.workout_day_id)
				.order('slot_order');

			if (slotsError) throw slotsError;

			const slots = (slotsData || []) as unknown as ExerciseSlotWithExercise[];

			state.currentWorkoutDay = {
				...workoutDay,
				exercise_slots: slots
			} as WorkoutDayWithSlots;

			// Build exercise state using the SESSION's week_number (not block's current_week)
			await buildExerciseState(slots, session.week_number);

		} catch (error) {
			console.error('Error loading past session:', error);
			state.error = error instanceof Error ? error.message : 'Failed to load session';
			state.isEditMode = false;
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

			// 2. Clear the saved snapshot since workout is complete
			await clearStateSnapshot();

			// 3. Advance day/week
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

	async function uncompleteWorkout() {
		if (!state.session) return false;

		state.isSaving = true;

		try {
			const { error } = await supabase
				.from('workout_sessions')
				.update({
					status: 'in_progress',
					completed_at: null
				} as never)
				.eq('id', state.session.id);

			if (error) throw error;

			// Update local state
			state.session = { ...state.session, status: 'in_progress', completed_at: null } as WorkoutSession;
			state.isEditMode = false;

			return true;
		} catch (error) {
			console.error('Error uncompleting workout:', error);
			state.error = 'Failed to resume workout';
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

	async function swapExercise(
		exerciseIndex: number,
		newExercise: Exercise,
		permanent: boolean
	): Promise<boolean> {
		const exerciseState = state.exercises[exerciseIndex];
		if (!exerciseState) return false;

		const oldSlot = exerciseState.slot;

		try {
			// If permanent, update the database
			if (permanent) {
				const { error } = await supabase
					.from('exercise_slots')
					.update({ exercise_id: newExercise.id })
					.eq('id', oldSlot.id);

				if (error) {
					console.error('Error updating exercise slot:', error);
					state.error = 'Failed to swap exercise permanently';
					return false;
				}
			}

			// Update local state with new exercise
			const updatedSlot: ExerciseSlotWithExercise = {
				...oldSlot,
				exercise_id: newExercise.id,
				exercise: newExercise
			};

			state.exercises[exerciseIndex] = {
				...exerciseState,
				slot: updatedSlot
			};

			return true;
		} catch (error) {
			console.error('Error swapping exercise:', error);
			state.error = 'Failed to swap exercise';
			return false;
		}
	}

	async function findExerciseSettings(exerciseId: string): Promise<{
		baseSets: number;
		repRangeMin: number;
		repRangeMax: number;
		fromDay?: string;
	} | null> {
		if (!state.trainingBlock) return null;

		// Query exercise_slots in this training block for this exercise
		const { data } = await supabase
			.from('exercise_slots')
			.select('base_sets, rep_range_min, rep_range_max, workout_days!inner(name, training_block_id)')
			.eq('exercise_id', exerciseId)
			.eq('workout_days.training_block_id', state.trainingBlock.id)
			.limit(1)
			.maybeSingle();

		if (data) {
			const workoutDay = data.workout_days as unknown as { name: string };
			return {
				baseSets: data.base_sets,
				repRangeMin: data.rep_range_min,
				repRangeMax: data.rep_range_max,
				fromDay: workoutDay?.name
			};
		}
		return null;
	}

	async function addExercise(
		newExercise: Exercise,
		permanent: boolean
	): Promise<boolean> {
		if (!state.currentWorkoutDay || !state.trainingBlock) return false;

		try {
			// Get settings: from existing slot in block, or exercise defaults
			const existing = await findExerciseSettings(newExercise.id);
			const sets = existing?.baseSets ?? 3;
			const repMin = existing?.repRangeMin ?? newExercise.default_rep_min;
			const repMax = existing?.repRangeMax ?? newExercise.default_rep_max;

			const nextSlotOrder = state.exercises.length + 1;
			let slotData: ExerciseSlotWithExercise;

			if (permanent) {
				const { data, error } = await supabase
					.from('exercise_slots')
					.insert({
						workout_day_id: state.currentWorkoutDay.id,
						exercise_id: newExercise.id,
						slot_order: nextSlotOrder,
						base_sets: sets,
						set_progression: 0,
						rep_range_min: repMin,
						rep_range_max: repMax
					})
					.select()
					.single();

				if (error) {
					console.error('Error adding exercise slot:', error);
					state.error = 'Failed to add exercise permanently';
					return false;
				}
				slotData = { ...data, exercise: newExercise } as ExerciseSlotWithExercise;
			} else {
				slotData = {
					id: `temp-${crypto.randomUUID()}`,
					workout_day_id: state.currentWorkoutDay.id,
					exercise_id: newExercise.id,
					slot_order: nextSlotOrder,
					base_sets: sets,
					set_progression: 0,
					rep_range_min: repMin,
					rep_range_max: repMax,
					rest_seconds: null,
					superset_group: null,
					notes: null,
					created_at: new Date().toISOString(),
					exercise: newExercise
				} as ExerciseSlotWithExercise;
			}

			// Build SetState array
			const newSets: SetState[] = [];
			for (let i = 1; i <= sets; i++) {
				newSets.push({
					id: null,
					setNumber: i,
					targetWeight: null,
					targetReps: Math.round((repMin + repMax) / 2),
					actualWeight: null,
					actualReps: null,
					rir: null,
					completed: false,
					previous: null
				});
			}

			state.exercises.push({
				slot: slotData,
				setsThisWeek: sets,
				sets: newSets,
				isExpanded: true
			});

			return true;
		} catch (error) {
			console.error('Error adding exercise:', error);
			state.error = 'Failed to add exercise';
			return false;
		}
	}

	/**
	 * Save current workout state to IndexedDB for screen lock recovery
	 */
	async function saveStateSnapshot(): Promise<void> {
		if (!state.trainingBlock || !state.currentWorkoutDay || !state.session) {
			return;
		}

		// Don't save snapshots for completed sessions or edit mode
		if (state.session.status === 'completed' || state.isEditMode) {
			return;
		}

		try {
			const snapshotId = getSnapshotId(
				state.trainingBlock.id,
				state.currentWorkoutDay.id,
				state.trainingBlock.current_week
			);

			const snapshot: WorkoutStateSnapshot = {
				id: snapshotId,
				blockId: state.trainingBlock.id,
				dayId: state.currentWorkoutDay.id,
				weekNumber: state.trainingBlock.current_week,
				sessionId: state.session.id,
				exercises: JSON.parse(JSON.stringify(state.exercises)), // Deep clone
				savedAt: Date.now()
			};

			await saveWorkoutSnapshot(snapshot);
			console.log('[WorkoutStore] State snapshot saved');
		} catch (error) {
			console.error('[WorkoutStore] Failed to save state snapshot:', error);
		}
	}

	/**
	 * Try to restore workout state from a saved snapshot
	 * Returns true if snapshot was restored, false otherwise
	 */
	async function restoreFromSnapshot(blockId: string): Promise<boolean> {
		if (!auth.user) return false;

		state.loading = true;
		state.error = '';

		try {
			// First, get the block to know current day/week
			const { data: blockData, error: blockError } = await supabase
				.from('training_blocks')
				.select(`
					id, name, total_weeks, current_week, current_day, status,
					workout_days (id, day_number, name, target_muscles, time_budget_minutes)
				`)
				.eq('id', blockId)
				.eq('user_id', auth.user.id)
				.single();

			if (blockError || !blockData) {
				state.loading = false;
				return false;
			}

			const block = blockData as unknown as TrainingBlockWithDays;
			const currentDay = block.workout_days?.find(d => d.day_number === block.current_day);
			if (!currentDay) {
				state.loading = false;
				return false;
			}

			const snapshotId = getSnapshotId(blockId, currentDay.id, block.current_week);
			const snapshot = await getWorkoutSnapshot(snapshotId);

			if (!snapshot) {
				state.loading = false;
				return false;
			}

			// Check if snapshot is recent (within last 4 hours)
			const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
			if (snapshot.savedAt < fourHoursAgo) {
				// Snapshot is too old, delete it
				await deleteWorkoutSnapshot(snapshotId);
				state.loading = false;
				return false;
			}

			// Verify the session still exists and is in_progress
			if (snapshot.sessionId) {
				const { data: sessionData } = await supabase
					.from('workout_sessions')
					.select('id, status')
					.eq('id', snapshot.sessionId)
					.single();

				const session = sessionData as { id: string; status: string } | null;
				if (!session || session.status === 'completed') {
					// Session was completed elsewhere, delete snapshot
					await deleteWorkoutSnapshot(snapshotId);
					state.loading = false;
					return false;
				}
			}

			// Fetch exercise slots for the current day
			const { data: slotsData, error: slotsError } = await supabase
				.from('exercise_slots')
				.select(`*, exercise:exercises (*)`)
				.eq('workout_day_id', currentDay.id)
				.order('slot_order');

			if (slotsError) {
				state.loading = false;
				return false;
			}

			const slots = (slotsData || []) as unknown as ExerciseSlotWithExercise[];

			// Restore the state
			state.trainingBlock = block;
			state.currentWorkoutDay = {
				...currentDay,
				exercise_slots: slots
			} as WorkoutDayWithSlots;

			// Fetch the session
			if (snapshot.sessionId) {
				const { data: sessionData } = await supabase
					.from('workout_sessions')
					.select('*, logged_sets (*)')
					.eq('id', snapshot.sessionId)
					.single();

				if (sessionData) {
					state.session = sessionData as unknown as WorkoutSession & { logged_sets: LoggedSet[] };
				}
			}

			// Restore exercises from snapshot
			state.exercises = snapshot.exercises as ExerciseState[];
			state.loading = false;

			console.log('[WorkoutStore] State restored from snapshot');
			return true;
		} catch (error) {
			console.error('[WorkoutStore] Failed to restore from snapshot:', error);
			state.loading = false;
			return false;
		}
	}

	/**
	 * Clear the saved snapshot (call after workout completion)
	 */
	async function clearStateSnapshot(): Promise<void> {
		if (!state.trainingBlock || !state.currentWorkoutDay) return;

		try {
			const snapshotId = getSnapshotId(
				state.trainingBlock.id,
				state.currentWorkoutDay.id,
				state.trainingBlock.current_week
			);
			await deleteWorkoutSnapshot(snapshotId);
			console.log('[WorkoutStore] State snapshot cleared');
		} catch (error) {
			console.error('[WorkoutStore] Failed to clear state snapshot:', error);
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
		state.isEditMode = false;
		state.originalSession = null;
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
		get isEditMode() {
			return state.isEditMode;
		},
		get originalSession() {
			return state.originalSession;
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
		loadPastSession,
		openSetInput,
		closeSetInput,
		toggleExerciseExpanded,
		quickLogSet,
		logSet,
		completeWorkout,
		uncompleteWorkout,
		swapExercise,
		findExerciseSettings,
		addExercise,
		reset,
		// Screen lock recovery
		saveStateSnapshot,
		restoreFromSnapshot,
		clearStateSnapshot
	};
}

export const workout = createWorkoutStore();
