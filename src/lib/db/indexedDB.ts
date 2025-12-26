// IndexedDB wrapper for offline data storage
import { openDB, type IDBPDatabase } from 'idb';
import type { Exercise, ExerciseSlot } from '$lib/types';
import type { PreviousSetData } from '$lib/types/workout';

const DB_NAME = 'myliftpal-offline';
const DB_VERSION = 1;

// Offline workout day data structure
export interface OfflineExerciseSlot extends ExerciseSlot {
	exercise: Exercise;
}

export interface OfflineWorkoutDay {
	dayId: string;
	blockId: string;
	dayName: string;
	weekNumber: number;
	exercises: OfflineExerciseSlot[];
	previousSets: Record<string, PreviousSetData>; // key: `${exercise_slot_id}-${set_number}`
	downloadedAt: number;
}

// Pending set to be synced
export interface PendingSet {
	id: string;
	sessionId: string;
	exerciseSlotId: string;
	exerciseId: string;
	setNumber: number;
	weight: number;
	reps: number;
	rir: number | null;
	createdAt: number;
}

// Offline session data
export interface OfflineSession {
	id: string;
	blockId: string;
	dayId: string;
	weekNumber: number;
	startedAt: number;
}

// Database schema interface
interface MyLiftPalDB {
	workoutDays: {
		key: string;
		value: OfflineWorkoutDay;
	};
	pendingSets: {
		key: string;
		value: PendingSet;
		indexes: { bySession: string };
	};
	sessions: {
		key: string;
		value: OfflineSession;
	};
}

let dbPromise: Promise<IDBPDatabase<MyLiftPalDB>> | null = null;

/**
 * Initialize and get the IndexedDB database
 */
export async function getDB(): Promise<IDBPDatabase<MyLiftPalDB>> {
	if (!dbPromise) {
		dbPromise = openDB<MyLiftPalDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				// Workout days store
				if (!db.objectStoreNames.contains('workoutDays')) {
					db.createObjectStore('workoutDays', { keyPath: 'dayId' });
				}

				// Pending sets store
				if (!db.objectStoreNames.contains('pendingSets')) {
					const pendingStore = db.createObjectStore('pendingSets', { keyPath: 'id' });
					pendingStore.createIndex('bySession', 'sessionId');
				}

				// Sessions store
				if (!db.objectStoreNames.contains('sessions')) {
					db.createObjectStore('sessions', { keyPath: 'id' });
				}
			}
		});
	}
	return dbPromise;
}

// ============ Workout Days ============

/**
 * Save a workout day for offline use
 */
export async function saveWorkoutDay(data: OfflineWorkoutDay): Promise<void> {
	const db = await getDB();
	await db.put('workoutDays', data);
}

/**
 * Get a workout day by ID
 */
export async function getWorkoutDay(dayId: string): Promise<OfflineWorkoutDay | undefined> {
	const db = await getDB();
	return db.get('workoutDays', dayId);
}

/**
 * Get all downloaded day IDs
 */
export async function getDownloadedDayIds(): Promise<string[]> {
	const db = await getDB();
	const keys = await db.getAllKeys('workoutDays');
	return keys as string[];
}

/**
 * Delete a workout day from offline storage
 */
export async function deleteWorkoutDay(dayId: string): Promise<void> {
	const db = await getDB();
	await db.delete('workoutDays', dayId);
}

/**
 * Clear all workout days
 */
export async function clearWorkoutDays(): Promise<void> {
	const db = await getDB();
	await db.clear('workoutDays');
}

// ============ Pending Sets ============

/**
 * Save a pending set to be synced later
 */
export async function savePendingSet(set: PendingSet): Promise<void> {
	const db = await getDB();
	await db.put('pendingSets', set);
}

/**
 * Get all pending sets
 */
export async function getPendingSets(): Promise<PendingSet[]> {
	const db = await getDB();
	return db.getAll('pendingSets');
}

/**
 * Get pending sets for a specific session
 */
export async function getPendingSetsBySession(sessionId: string): Promise<PendingSet[]> {
	const db = await getDB();
	return db.getAllFromIndex('pendingSets', 'bySession', sessionId);
}

/**
 * Delete a pending set (after successful sync)
 */
export async function deletePendingSet(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('pendingSets', id);
}

/**
 * Get count of pending sets
 */
export async function getPendingSetCount(): Promise<number> {
	const db = await getDB();
	return db.count('pendingSets');
}

/**
 * Clear all pending sets
 */
export async function clearPendingSets(): Promise<void> {
	const db = await getDB();
	await db.clear('pendingSets');
}

// ============ Sessions ============

/**
 * Save an offline session
 */
export async function saveOfflineSession(session: OfflineSession): Promise<void> {
	const db = await getDB();
	await db.put('sessions', session);
}

/**
 * Get an offline session by ID
 */
export async function getOfflineSession(sessionId: string): Promise<OfflineSession | undefined> {
	const db = await getDB();
	return db.get('sessions', sessionId);
}

/**
 * Delete an offline session
 */
export async function deleteOfflineSession(sessionId: string): Promise<void> {
	const db = await getDB();
	await db.delete('sessions', sessionId);
}

/**
 * Clear all offline sessions
 */
export async function clearOfflineSessions(): Promise<void> {
	const db = await getDB();
	await db.clear('sessions');
}

// ============ Utilities ============

/**
 * Check if a workout day is downloaded
 */
export async function isWorkoutDayDownloaded(dayId: string): Promise<boolean> {
	const day = await getWorkoutDay(dayId);
	return !!day;
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
	await clearWorkoutDays();
	await clearPendingSets();
	await clearOfflineSessions();
}
