// Volume calculation utilities for tracking weekly sets per muscle group

import type { SecondaryMuscle } from '$lib/types/database';

export interface MuscleVolume {
	muscleId: string;
	muscleName: string;
	directSets: number;
	indirectSets: number;
	totalSets: number;
	// Volume landmarks from database
	mv: number;  // Maintenance Volume
	mev: number; // Minimum Effective Volume
	mav: number; // Maximum Adaptive Volume
	mrv: number; // Maximum Recoverable Volume
	// Computed status
	status: VolumeStatus;
	statusLabel: string;
	color: string;
}

export type VolumeStatus = 'none' | 'low' | 'good' | 'high' | 'excessive';

export interface ExerciseForVolume {
	primaryMuscle: string;
	secondaryMuscles: SecondaryMuscle[];
	setsPerWeek: number;
}

export interface MuscleGroupData {
	id: string;
	display_name: string;
	mv: number;
	mev: number;
	mav: number;
	mrv: number;
	color: string;
}

/**
 * Calculate volume status and label based on total sets vs landmarks
 */
export function getVolumeStatus(
	totalSets: number,
	mev: number,
	mav: number,
	mrv: number
): { status: VolumeStatus; label: string; color: string } {
	if (totalSets === 0) {
		return { status: 'none', label: 'None', color: 'gray' };
	}
	if (totalSets < mev) {
		return { status: 'low', label: 'Low', color: 'red' };
	}
	if (totalSets <= mav) {
		return { status: 'good', label: 'Good', color: 'green' };
	}
	if (totalSets <= mrv) {
		return { status: 'high', label: 'High', color: 'yellow' };
	}
	return { status: 'excessive', label: 'Too High', color: 'orange' };
}

/**
 * Calculate weekly volume for all muscle groups from a list of exercises
 */
export function calculateWeeklyVolume(
	exercises: ExerciseForVolume[],
	muscleGroups: MuscleGroupData[]
): MuscleVolume[] {
	// Initialize volume map
	const volumeMap = new Map<string, { direct: number; indirect: number }>();

	for (const mg of muscleGroups) {
		volumeMap.set(mg.id, { direct: 0, indirect: 0 });
	}

	// Calculate direct and indirect sets
	for (const exercise of exercises) {
		// Direct sets for primary muscle
		const primary = volumeMap.get(exercise.primaryMuscle);
		if (primary) {
			primary.direct += exercise.setsPerWeek;
		}

		// Indirect sets for secondary muscles
		for (const secondary of exercise.secondaryMuscles || []) {
			const secondaryVolume = volumeMap.get(secondary.muscle);
			if (secondaryVolume) {
				secondaryVolume.indirect += exercise.setsPerWeek * secondary.weight;
			}
		}
	}

	// Build result with status
	const results: MuscleVolume[] = [];

	for (const mg of muscleGroups) {
		const volume = volumeMap.get(mg.id);
		if (!volume) continue;

		const totalSets = Math.round(volume.direct + volume.indirect);
		const { status, label, color } = getVolumeStatus(
			totalSets,
			mg.mev,
			mg.mav,
			mg.mrv
		);

		// Only include muscles that have volume or are commonly tracked
		if (totalSets > 0 || mg.mev > 0) {
			results.push({
				muscleId: mg.id,
				muscleName: mg.display_name,
				directSets: volume.direct,
				indirectSets: Math.round(volume.indirect * 10) / 10,
				totalSets,
				mv: mg.mv,
				mev: mg.mev,
				mav: mg.mav,
				mrv: mg.mrv,
				status,
				statusLabel: label,
				color
			});
		}
	}

	// Sort by total sets (highest first), then by name
	return results.sort((a, b) => b.totalSets - a.totalSets || a.muscleName.localeCompare(b.muscleName));
}

/**
 * Get CSS color class based on volume status
 */
export function getVolumeColorClass(status: VolumeStatus): string {
	switch (status) {
		case 'none':
			return 'bg-gray-500/20 text-gray-400';
		case 'low':
			return 'bg-red-500/20 text-red-400';
		case 'good':
			return 'bg-green-500/20 text-green-400';
		case 'high':
			return 'bg-yellow-500/20 text-yellow-400';
		case 'excessive':
			return 'bg-orange-500/20 text-orange-400';
	}
}

/**
 * Get progress bar color based on volume status
 */
export function getVolumeBarColor(status: VolumeStatus): string {
	switch (status) {
		case 'none':
			return 'bg-gray-500';
		case 'low':
			return 'bg-red-500';
		case 'good':
			return 'bg-green-500';
		case 'high':
			return 'bg-yellow-500';
		case 'excessive':
			return 'bg-orange-500';
	}
}

/**
 * Calculate progress percentage for volume bar
 * Shows progress toward MAV (optimal), capped at 100% at MRV
 */
export function getVolumeProgress(totalSets: number, mav: number, mrv: number): number {
	if (mav === 0) return 0;
	// Progress to MAV is 0-75%, MAV to MRV is 75-100%
	if (totalSets <= mav) {
		return (totalSets / mav) * 75;
	}
	const overMAV = totalSets - mav;
	const mrvRange = mrv - mav;
	if (mrvRange === 0) return 100;
	return 75 + (overMAV / mrvRange) * 25;
}
