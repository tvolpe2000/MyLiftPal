// Supabase Database Types
// These types match the database schema defined in specs/architecture.md

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					display_name: string | null;
					weight_unit: 'lbs' | 'kg';
					default_rest_seconds: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					display_name?: string | null;
					weight_unit?: 'lbs' | 'kg';
					default_rest_seconds?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					display_name?: string | null;
					weight_unit?: 'lbs' | 'kg';
					default_rest_seconds?: number;
					created_at?: string;
					updated_at?: string;
				};
			};
			muscle_groups: {
				Row: {
					id: string;
					display_name: string;
					category: 'upper' | 'lower' | 'core';
					color: string;
					default_mv: number;
					default_mev: number;
					default_mav: number;
					default_mrv: number;
					sort_order: number;
				};
				Insert: {
					id: string;
					display_name: string;
					category: 'upper' | 'lower' | 'core';
					color: string;
					default_mv?: number;
					default_mev?: number;
					default_mav?: number;
					default_mrv?: number;
					sort_order?: number;
				};
				Update: {
					id?: string;
					display_name?: string;
					category?: 'upper' | 'lower' | 'core';
					color?: string;
					default_mv?: number;
					default_mev?: number;
					default_mav?: number;
					default_mrv?: number;
					sort_order?: number;
				};
			};
			exercises: {
				Row: {
					id: string;
					name: string;
					aliases: string[];
					equipment: EquipmentType;
					primary_muscle: string;
					secondary_muscles: SecondaryMuscle[];
					video_url: string | null;
					cues: string[];
					default_rep_min: number;
					default_rep_max: number;
					default_rest_seconds: number;
					work_seconds: number;
					is_core: boolean;
					created_by: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					aliases?: string[];
					equipment: EquipmentType;
					primary_muscle: string;
					secondary_muscles?: SecondaryMuscle[];
					video_url?: string | null;
					cues?: string[];
					default_rep_min?: number;
					default_rep_max?: number;
					default_rest_seconds?: number;
					work_seconds?: number;
					is_core?: boolean;
					created_by?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					aliases?: string[];
					equipment?: EquipmentType;
					primary_muscle?: string;
					secondary_muscles?: SecondaryMuscle[];
					video_url?: string | null;
					cues?: string[];
					default_rep_min?: number;
					default_rep_max?: number;
					default_rest_seconds?: number;
					work_seconds?: number;
					is_core?: boolean;
					created_by?: string | null;
					created_at?: string;
				};
			};
			training_blocks: {
				Row: {
					id: string;
					user_id: string;
					name: string;
					total_weeks: number;
					current_week: number;
					current_day: number;
					status: TrainingBlockStatus;
					time_budget_minutes: number | null;
					started_at: string;
					completed_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					name: string;
					total_weeks?: number;
					current_week?: number;
					current_day?: number;
					status?: TrainingBlockStatus;
					time_budget_minutes?: number | null;
					started_at?: string;
					completed_at?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					name?: string;
					total_weeks?: number;
					current_week?: number;
					current_day?: number;
					status?: TrainingBlockStatus;
					time_budget_minutes?: number | null;
					started_at?: string;
					completed_at?: string | null;
					created_at?: string;
				};
			};
			workout_days: {
				Row: {
					id: string;
					training_block_id: string;
					day_number: number;
					name: string;
					target_muscles: string[];
					time_budget_minutes: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					training_block_id: string;
					day_number: number;
					name: string;
					target_muscles?: string[];
					time_budget_minutes?: number | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					training_block_id?: string;
					day_number?: number;
					name?: string;
					target_muscles?: string[];
					time_budget_minutes?: number | null;
					created_at?: string;
				};
			};
			exercise_slots: {
				Row: {
					id: string;
					workout_day_id: string;
					exercise_id: string;
					slot_order: number;
					base_sets: number;
					set_progression: number;
					rep_range_min: number;
					rep_range_max: number;
					rest_seconds: number | null;
					superset_group: string | null;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					workout_day_id: string;
					exercise_id: string;
					slot_order: number;
					base_sets?: number;
					set_progression?: number;
					rep_range_min?: number;
					rep_range_max?: number;
					rest_seconds?: number | null;
					superset_group?: string | null;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					workout_day_id?: string;
					exercise_id?: string;
					slot_order?: number;
					base_sets?: number;
					set_progression?: number;
					rep_range_min?: number;
					rep_range_max?: number;
					rest_seconds?: number | null;
					superset_group?: string | null;
					notes?: string | null;
					created_at?: string;
				};
			};
			workout_sessions: {
				Row: {
					id: string;
					user_id: string;
					workout_day_id: string;
					training_block_id: string;
					week_number: number;
					scheduled_date: string | null;
					started_at: string | null;
					completed_at: string | null;
					status: SessionStatus;
					duration_minutes: number | null;
					notes: string | null;
					overall_pump: PumpRating | null;
					overall_soreness: SorenessRating | null;
					workload_rating: WorkloadRating | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					workout_day_id: string;
					training_block_id: string;
					week_number: number;
					scheduled_date?: string | null;
					started_at?: string | null;
					completed_at?: string | null;
					status?: SessionStatus;
					duration_minutes?: number | null;
					notes?: string | null;
					overall_pump?: PumpRating | null;
					overall_soreness?: SorenessRating | null;
					workload_rating?: WorkloadRating | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					workout_day_id?: string;
					training_block_id?: string;
					week_number?: number;
					scheduled_date?: string | null;
					started_at?: string | null;
					completed_at?: string | null;
					status?: SessionStatus;
					duration_minutes?: number | null;
					notes?: string | null;
					overall_pump?: PumpRating | null;
					overall_soreness?: SorenessRating | null;
					workload_rating?: WorkloadRating | null;
					created_at?: string;
				};
			};
			logged_sets: {
				Row: {
					id: string;
					session_id: string;
					exercise_slot_id: string;
					exercise_id: string;
					set_number: number;
					target_reps: number | null;
					actual_reps: number | null;
					target_weight: number | null;
					actual_weight: number | null;
					weight_unit: 'lbs' | 'kg';
					rir: number | null;
					completed: boolean;
					pump_rating: string | null;
					logged_at: string | null;
					notes: string | null;
				};
				Insert: {
					id?: string;
					session_id: string;
					exercise_slot_id: string;
					exercise_id: string;
					set_number: number;
					target_reps?: number | null;
					actual_reps?: number | null;
					target_weight?: number | null;
					actual_weight?: number | null;
					weight_unit?: 'lbs' | 'kg';
					rir?: number | null;
					completed?: boolean;
					pump_rating?: string | null;
					logged_at?: string | null;
					notes?: string | null;
				};
				Update: {
					id?: string;
					session_id?: string;
					exercise_slot_id?: string;
					exercise_id?: string;
					set_number?: number;
					target_reps?: number | null;
					actual_reps?: number | null;
					target_weight?: number | null;
					actual_weight?: number | null;
					weight_unit?: 'lbs' | 'kg';
					rir?: number | null;
					completed?: boolean;
					pump_rating?: string | null;
					logged_at?: string | null;
					notes?: string | null;
				};
			};
			user_volume_targets: {
				Row: {
					id: string;
					user_id: string;
					muscle_group_id: string;
					mv: number | null;
					mev: number | null;
					mav: number | null;
					mrv: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					muscle_group_id: string;
					mv?: number | null;
					mev?: number | null;
					mav?: number | null;
					mrv?: number | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					muscle_group_id?: string;
					mv?: number | null;
					mev?: number | null;
					mav?: number | null;
					mrv?: number | null;
					created_at?: string;
				};
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: {
			equipment_type: EquipmentType;
			training_block_status: TrainingBlockStatus;
			session_status: SessionStatus;
			pump_rating: PumpRating;
			soreness_rating: SorenessRating;
			workload_rating: WorkloadRating;
		};
	};
}

// Shared enum types
export type EquipmentType =
	| 'barbell'
	| 'dumbbell'
	| 'cable'
	| 'machine'
	| 'bodyweight'
	| 'smith_machine'
	| 'kettlebell'
	| 'bands';

export type TrainingBlockStatus = 'active' | 'completed' | 'paused';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped';
export type PumpRating = 'none' | 'mild' | 'moderate' | 'great' | 'excessive';
export type SorenessRating = 'none' | 'mild' | 'moderate' | 'severe';
export type WorkloadRating = 'too_easy' | 'easy' | 'just_right' | 'hard' | 'too_hard';

export interface SecondaryMuscle {
	muscle: string;
	weight: number;
}
