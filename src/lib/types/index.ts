// Re-export database types
export type {
	Database,
	EquipmentType,
	TrainingBlockStatus,
	SessionStatus,
	PumpRating,
	SorenessRating,
	WorkloadRating,
	SecondaryMuscle
} from './database';

// Re-export changelog types
export type {
	RoadmapStatus,
	AppRelease,
	RoadmapItem,
	ChangelogState
} from './changelog';

// Re-export feedback types
export type {
	FeedbackType,
	FeedbackStatus,
	UserFeedback
} from './feedback';

// Convenience type aliases for database rows
import type { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MuscleGroup = Database['public']['Tables']['muscle_groups']['Row'];
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type TrainingBlock = Database['public']['Tables']['training_blocks']['Row'];
export type WorkoutDay = Database['public']['Tables']['workout_days']['Row'];
export type ExerciseSlot = Database['public']['Tables']['exercise_slots']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type LoggedSet = Database['public']['Tables']['logged_sets']['Row'];
export type UserVolumeTarget = Database['public']['Tables']['user_volume_targets']['Row'];

// Volume tracking types
export type VolumeStatus = 'below_mv' | 'at_mev' | 'in_mav' | 'approaching_mrv' | 'exceeds_mrv';

export interface VolumeTarget {
	mv: number;
	mev: number;
	mav: number;
	mrv: number;
}

export interface MuscleVolumeData {
	muscle_id: string;
	display_name: string;
	color: string;
	direct_sets: number;
	indirect_sets: number;
	total_effective_sets: number;
	target: VolumeTarget;
	status: VolumeStatus;
}

// Time estimation types
export interface TimeEstimate {
	week_number: number;
	total_sets: number;
	work_time_minutes: number;
	rest_time_minutes: number;
	total_minutes: number;
}

export interface WorkoutTimeProjection {
	day_name: string;
	day_id: string;
	estimates: TimeEstimate[];
	exceeds_budget: boolean;
	budget_minutes: number | null;
}

// Progression types
export interface ProgressionRecommendation {
	exercise_id: string;
	previous_weight: number;
	previous_reps: number[];
	recommended_weight: number;
	recommended_reps: number;
	recommended_sets: number;
	reasoning: string;
	target_rir: number;
}

// Joined/extended types for UI
export interface ExerciseSlotWithExercise extends ExerciseSlot {
	exercise: Exercise;
}

export interface WorkoutSessionWithDetails extends WorkoutSession {
	workout_day: WorkoutDay;
	logged_sets: LoggedSet[];
}
