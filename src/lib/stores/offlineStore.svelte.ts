// Offline store for managing PWA offline functionality
import { browser } from '$app/environment';
import { supabase } from '$lib/db/supabase';
import { auth } from './auth.svelte';
import {
	saveWorkoutDay,
	getWorkoutDay,
	getDownloadedDayIds,
	deleteWorkoutDay,
	savePendingSet,
	getPendingSets,
	deletePendingSet,
	getPendingSetCount,
	type OfflineWorkoutDay,
	type OfflineExerciseSlot,
	type PendingSet
} from '$lib/db/indexedDB';
import type { LoggedSet } from '$lib/types';

export interface SyncResult {
	success: boolean;
	syncedCount: number;
	failedCount: number;
	errors: string[];
}

function createOfflineStore() {
	let isOnline = $state(browser ? navigator.onLine : true);
	let downloadedDays = $state<Set<string>>(new Set());
	let pendingSetCount = $state(0);
	let isSyncing = $state(false);
	let downloadingDayId = $state<string | null>(null);
	let lastSyncAt = $state<Date | null>(null);
	let initialized = $state(false);

	/**
	 * Initialize the offline store
	 */
	async function init() {
		if (!browser || initialized) return;

		// Set initial online status
		isOnline = navigator.onLine;

		// Load downloaded day IDs from IndexedDB
		try {
			const dayIds = await getDownloadedDayIds();
			downloadedDays = new Set(dayIds);
			pendingSetCount = await getPendingSetCount();
		} catch (error) {
			console.error('Error initializing offline store:', error);
		}

		initialized = true;
	}

	/**
	 * Update online status (call from window event listeners)
	 */
	function refreshOnlineStatus() {
		if (!browser) return;
		isOnline = navigator.onLine;
	}

	/**
	 * Download a workout day for offline use
	 */
	async function downloadWorkoutDay(dayId: string, blockId: string): Promise<boolean> {
		if (!auth.user) return false;

		downloadingDayId = dayId;

		try {
			// Fetch workout day with exercises
			const { data: dayData, error: dayError } = await supabase
				.from('workout_days')
				.select('*')
				.eq('id', dayId)
				.single();

			if (dayError) throw dayError;

			// Fetch exercise slots with exercise details
			const { data: slotsData, error: slotsError } = await supabase
				.from('exercise_slots')
				.select(`
					*,
					exercise:exercises (*)
				`)
				.eq('workout_day_id', dayId)
				.order('slot_order');

			if (slotsError) throw slotsError;

			// Fetch training block for week number
			const { data: blockData, error: blockError } = await supabase
				.from('training_blocks')
				.select('current_week')
				.eq('id', blockId)
				.single();

			if (blockError) throw blockError;

			// Fetch previous session data for progression suggestions
			const previousSets: Record<string, { weight: number | null; reps: number | null; rir: number | null }> = {};

			const { data: prevSessionData } = await supabase
				.from('workout_sessions')
				.select('logged_sets (*)')
				.eq('workout_day_id', dayId)
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

			// Build offline workout day
			const day = dayData as { name: string };
			const block = blockData as { current_week: number };
			const offlineDay: OfflineWorkoutDay = {
				dayId,
				blockId,
				dayName: day.name,
				weekNumber: block.current_week,
				exercises: slotsData as unknown as OfflineExerciseSlot[],
				previousSets,
				downloadedAt: Date.now()
			};

			// Save to IndexedDB
			await saveWorkoutDay(offlineDay);

			// Update local state
			downloadedDays = new Set([...downloadedDays, dayId]);

			return true;
		} catch (error) {
			console.error('Error downloading workout day:', error);
			return false;
		} finally {
			downloadingDayId = null;
		}
	}

	/**
	 * Check if a day is downloaded
	 */
	function isDownloaded(dayId: string): boolean {
		return downloadedDays.has(dayId);
	}

	/**
	 * Get offline workout day data
	 */
	async function getOfflineDay(dayId: string): Promise<OfflineWorkoutDay | null> {
		try {
			const day = await getWorkoutDay(dayId);
			return day || null;
		} catch (error) {
			console.error('Error getting offline day:', error);
			return null;
		}
	}

	/**
	 * Queue a set for later sync (when offline)
	 */
	async function queueSet(set: PendingSet): Promise<void> {
		try {
			await savePendingSet(set);
			pendingSetCount = await getPendingSetCount();
		} catch (error) {
			console.error('Error queuing set:', error);
			throw error;
		}
	}

	/**
	 * Sync all pending sets to Supabase
	 */
	async function syncPendingSets(): Promise<SyncResult> {
		if (!isOnline || !auth.user || isSyncing) {
			return { success: false, syncedCount: 0, failedCount: 0, errors: ['Cannot sync right now'] };
		}

		isSyncing = true;
		const result: SyncResult = {
			success: true,
			syncedCount: 0,
			failedCount: 0,
			errors: []
		};

		try {
			const pendingSets = await getPendingSets();

			for (const set of pendingSets) {
				try {
					// Check if this set already exists (avoid duplicates)
					const { data: existingData } = await supabase
						.from('logged_sets')
						.select('id')
						.eq('session_id', set.sessionId)
						.eq('exercise_slot_id', set.exerciseSlotId)
						.eq('set_number', set.setNumber)
						.maybeSingle();

					if (existingData) {
						// Set already exists, update it
						const existing = existingData as { id: string };
						const { error } = await supabase
							.from('logged_sets')
							.update({
								actual_weight: set.weight,
								actual_reps: set.reps,
								rir: set.rir,
								completed: true,
								logged_at: new Date(set.createdAt).toISOString()
							} as never)
							.eq('id', existing.id);

						if (error) throw error;
					} else {
						// Insert new set
						const { error } = await supabase
							.from('logged_sets')
							.insert({
								session_id: set.sessionId,
								exercise_slot_id: set.exerciseSlotId,
								exercise_id: set.exerciseId,
								set_number: set.setNumber,
								actual_weight: set.weight,
								actual_reps: set.reps,
								weight_unit: auth.profile?.weight_unit || 'lbs',
								rir: set.rir,
								completed: true,
								logged_at: new Date(set.createdAt).toISOString()
							} as never);

						if (error) throw error;
					}

					// Delete from pending queue
					await deletePendingSet(set.id);
					result.syncedCount++;
				} catch (error) {
					console.error('Error syncing set:', error);
					result.failedCount++;
					result.errors.push(`Failed to sync set ${set.setNumber}`);
				}
			}

			pendingSetCount = await getPendingSetCount();
			lastSyncAt = new Date();
			result.success = result.failedCount === 0;
		} catch (error) {
			console.error('Error during sync:', error);
			result.success = false;
			result.errors.push('Sync failed');
		} finally {
			isSyncing = false;
		}

		return result;
	}

	/**
	 * Clear a downloaded day
	 */
	async function clearDownload(dayId: string): Promise<void> {
		try {
			await deleteWorkoutDay(dayId);
			downloadedDays = new Set([...downloadedDays].filter((id) => id !== dayId));
		} catch (error) {
			console.error('Error clearing download:', error);
		}
	}

	/**
	 * Refresh pending set count
	 */
	async function refreshPendingCount(): Promise<void> {
		try {
			pendingSetCount = await getPendingSetCount();
		} catch (error) {
			console.error('Error refreshing pending count:', error);
		}
	}

	return {
		// State getters
		get isOnline() {
			return isOnline;
		},
		get downloadedDays() {
			return downloadedDays;
		},
		get pendingSetCount() {
			return pendingSetCount;
		},
		get isSyncing() {
			return isSyncing;
		},
		get downloadingDayId() {
			return downloadingDayId;
		},
		get lastSyncAt() {
			return lastSyncAt;
		},
		get initialized() {
			return initialized;
		},

		// Methods
		init,
		refreshOnlineStatus,
		downloadWorkoutDay,
		isDownloaded,
		getOfflineDay,
		queueSet,
		syncPendingSets,
		clearDownload,
		refreshPendingCount
	};
}

export const offline = createOfflineStore();
