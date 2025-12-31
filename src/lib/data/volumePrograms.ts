// Volume Programming Data
// Based on Training Volume Programming Guide research
// Used for goal-based training block configuration and Fill to Optimal feature

export type TrainingGoal = 'maintenance' | 'hypertrophy' | 'strength' | 'power' | 'endurance';
export type LifterLevel = 'beginner' | 'intermediate' | 'advanced';

export interface VolumeProgram {
	goal: TrainingGoal;
	level: LifterLevel;
	startVolume: number; // Week 1 sets per muscle
	weeklyIncrement: number; // Sets to add each week
	maxVolume: number; // MRV ceiling
	repRangeMin: number;
	repRangeMax: number;
	intensityMin: number; // % of 1RM
	intensityMax: number;
}

// Master Volume Calculation Table
// Formula: Weekly Volume = startVolume + (week - 1) × weeklyIncrement
// Capped at maxVolume (MRV)
export const VOLUME_PROGRAMS: VolumeProgram[] = [
	// Maintenance - Preserve current gains with minimal volume
	{
		goal: 'maintenance',
		level: 'beginner',
		startVolume: 4,
		weeklyIncrement: 0,
		maxVolume: 6,
		repRangeMin: 6,
		repRangeMax: 12,
		intensityMin: 70,
		intensityMax: 80
	},
	{
		goal: 'maintenance',
		level: 'intermediate',
		startVolume: 5,
		weeklyIncrement: 0,
		maxVolume: 6,
		repRangeMin: 6,
		repRangeMax: 12,
		intensityMin: 70,
		intensityMax: 80
	},
	{
		goal: 'maintenance',
		level: 'advanced',
		startVolume: 6,
		weeklyIncrement: 0,
		maxVolume: 8,
		repRangeMin: 6,
		repRangeMax: 12,
		intensityMin: 70,
		intensityMax: 80
	},

	// Hypertrophy - Build muscle size
	{
		goal: 'hypertrophy',
		level: 'beginner',
		startVolume: 8,
		weeklyIncrement: 2,
		maxVolume: 16,
		repRangeMin: 6,
		repRangeMax: 12,
		intensityMin: 65,
		intensityMax: 80
	},
	{
		goal: 'hypertrophy',
		level: 'intermediate',
		startVolume: 10,
		weeklyIncrement: 2,
		maxVolume: 20,
		repRangeMin: 6,
		repRangeMax: 12,
		intensityMin: 65,
		intensityMax: 80
	},
	{
		goal: 'hypertrophy',
		level: 'advanced',
		startVolume: 12,
		weeklyIncrement: 2.5,
		maxVolume: 25,
		repRangeMin: 6,
		repRangeMax: 15,
		intensityMin: 60,
		intensityMax: 80
	},

	// Strength - Increase max lifts
	{
		goal: 'strength',
		level: 'beginner',
		startVolume: 4,
		weeklyIncrement: 1,
		maxVolume: 8,
		repRangeMin: 1,
		repRangeMax: 5,
		intensityMin: 80,
		intensityMax: 90
	},
	{
		goal: 'strength',
		level: 'intermediate',
		startVolume: 6,
		weeklyIncrement: 1.5,
		maxVolume: 12,
		repRangeMin: 1,
		repRangeMax: 5,
		intensityMin: 80,
		intensityMax: 95
	},
	{
		goal: 'strength',
		level: 'advanced',
		startVolume: 8,
		weeklyIncrement: 1.5,
		maxVolume: 15,
		repRangeMin: 1,
		repRangeMax: 5,
		intensityMin: 85,
		intensityMax: 100
	},

	// Power - Explosive strength (beginners use strength programming)
	{
		goal: 'power',
		level: 'beginner',
		startVolume: 4,
		weeklyIncrement: 1,
		maxVolume: 8,
		repRangeMin: 1,
		repRangeMax: 5,
		intensityMin: 80,
		intensityMax: 90
	}, // Uses strength values
	{
		goal: 'power',
		level: 'intermediate',
		startVolume: 6,
		weeklyIncrement: 1,
		maxVolume: 12,
		repRangeMin: 1,
		repRangeMax: 5,
		intensityMin: 30,
		intensityMax: 60
	},
	{
		goal: 'power',
		level: 'advanced',
		startVolume: 9,
		weeklyIncrement: 1.5,
		maxVolume: 18,
		repRangeMin: 1,
		repRangeMax: 5,
		intensityMin: 30,
		intensityMax: 90
	},

	// Endurance - Muscular endurance
	{
		goal: 'endurance',
		level: 'beginner',
		startVolume: 6,
		weeklyIncrement: 1,
		maxVolume: 10,
		repRangeMin: 15,
		repRangeMax: 30,
		intensityMin: 40,
		intensityMax: 60
	},
	{
		goal: 'endurance',
		level: 'intermediate',
		startVolume: 9,
		weeklyIncrement: 1,
		maxVolume: 14,
		repRangeMin: 15,
		repRangeMax: 30,
		intensityMin: 40,
		intensityMax: 60
	},
	{
		goal: 'endurance',
		level: 'advanced',
		startVolume: 12,
		weeklyIncrement: 1.5,
		maxVolume: 18,
		repRangeMin: 15,
		repRangeMax: 30,
		intensityMin: 40,
		intensityMax: 60
	}
];

// Muscle-specific MEV (Minimum Effective Volume) values
// These are intermediate baseline values
// Beginners: multiply by 0.75
// Advanced: multiply by 1.15
export const MUSCLE_MEV_INTERMEDIATE: Record<string, number> = {
	chest: 8,
	back: 8,
	quads: 8,
	hamstrings: 6,
	glutes: 4,
	side_delts: 8,
	rear_delts: 8,
	front_delts: 0, // Often hit indirectly from pressing
	biceps: 6,
	triceps: 6,
	traps: 4,
	abs: 0, // Often hit indirectly
	calves: 8
};

// Level multipliers for MEV calculation
const MEV_LEVEL_MULTIPLIERS: Record<LifterLevel, number> = {
	beginner: 0.75,
	intermediate: 1.0,
	advanced: 1.15
};

/**
 * Get the volume program for a specific goal and level
 */
export function getVolumeProgram(goal: TrainingGoal, level: LifterLevel): VolumeProgram {
	const program = VOLUME_PROGRAMS.find((p) => p.goal === goal && p.level === level);
	if (!program) {
		// Fallback to intermediate hypertrophy
		return VOLUME_PROGRAMS.find((p) => p.goal === 'hypertrophy' && p.level === 'intermediate')!;
	}
	return program;
}

/**
 * Get the effective goal for programming
 * Beginners selecting Power get Strength programming instead
 */
export function getEffectiveGoal(goal: TrainingGoal, level: LifterLevel): TrainingGoal {
	if (goal === 'power' && level === 'beginner') {
		return 'strength';
	}
	return goal;
}

/**
 * Get MEV for a specific muscle adjusted by lifter level
 */
export function getMevForMuscle(muscleId: string, level: LifterLevel): number {
	const baseMev = MUSCLE_MEV_INTERMEDIATE[muscleId] ?? 6; // Default to 6 if not found
	const multiplier = MEV_LEVEL_MULTIPLIERS[level];
	return Math.round(baseMev * multiplier);
}

/**
 * Calculate target weekly volume for a given week
 */
export function calculateWeeklyTargetVolume(program: VolumeProgram, weekNumber: number): number {
	const calculated = program.startVolume + (weekNumber - 1) * program.weeklyIncrement;
	return Math.min(calculated, program.maxVolume);
}

/**
 * Get recommended rest time based on goal
 */
export function getRecommendedRestSeconds(goal: TrainingGoal): number {
	switch (goal) {
		case 'strength':
		case 'power':
			return 180; // 3 minutes for heavy compound work
		case 'hypertrophy':
			return 90; // 1.5 minutes for muscle building
		case 'endurance':
			return 60; // 1 minute for endurance work
		case 'maintenance':
		default:
			return 90;
	}
}

/**
 * Get goal display info for UI
 */
export interface GoalInfo {
	value: TrainingGoal;
	label: string;
	description: string;
	emoji: string;
}

export const TRAINING_GOALS: GoalInfo[] = [
	{
		value: 'hypertrophy',
		label: 'Hypertrophy',
		description: 'Build muscle size',
		emoji: '💪'
	},
	{
		value: 'strength',
		label: 'Strength',
		description: 'Increase max lifts',
		emoji: '🏋️'
	},
	{
		value: 'maintenance',
		label: 'Maintenance',
		description: 'Preserve current gains',
		emoji: '⚖️'
	},
	{
		value: 'power',
		label: 'Power',
		description: 'Explosive strength',
		emoji: '⚡'
	},
	{
		value: 'endurance',
		label: 'Endurance',
		description: 'Muscular endurance',
		emoji: '🔄'
	}
];

/**
 * Get lifter level display info for UI
 */
export interface LevelInfo {
	value: LifterLevel;
	label: string;
	description: string;
	emoji: string;
}

export const LIFTER_LEVELS: LevelInfo[] = [
	{
		value: 'beginner',
		label: 'Beginner',
		description: '0-2 years of consistent training',
		emoji: '🌱'
	},
	{
		value: 'intermediate',
		label: 'Intermediate',
		description: '2-5 years of consistent training',
		emoji: '💪'
	},
	{
		value: 'advanced',
		label: 'Advanced',
		description: '5+ years of consistent training',
		emoji: '🏆'
	}
];
