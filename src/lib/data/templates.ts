// Pre-built workout program templates
// Users can choose between basic (days + muscles) or full (with exercises)

export interface TemplateExercise {
	exerciseName: string;
	baseSets: number;
	setProgression: number;
	repRangeMin: number;
	repRangeMax: number;
}

export interface TemplateDayConfig {
	name: string;
	targetMuscles: string[];
	exercises?: TemplateExercise[]; // Optional for basic templates
}

export interface WorkoutTemplate {
	id: string;
	name: string;
	description: string;
	daysPerWeek: number;
	category: 'strength' | 'hypertrophy' | 'powerbuilding';
	days: TemplateDayConfig[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
	{
		id: 'ppl-3',
		name: 'Push/Pull/Legs',
		description: 'Classic 3-day split hitting each movement pattern once per week',
		daysPerWeek: 3,
		category: 'hypertrophy',
		days: [
			{
				name: 'Push',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Pull',
				targetMuscles: ['back_lats', 'back_upper', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Dumbbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 }
				]
			},
			{
				name: 'Legs',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 }
				]
			}
		]
	},
	{
		id: 'ppl-6',
		name: 'Push/Pull/Legs x2',
		description: 'High frequency 6-day PPL for advanced lifters',
		daysPerWeek: 6,
		category: 'hypertrophy',
		days: [
			{
				name: 'Push A',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Seated Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Pull A',
				targetMuscles: ['back_lats', 'back_upper', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 2, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Legs A',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 }
				]
			},
			{
				name: 'Push B',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Incline Barbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Overhead Tricep Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Pull B',
				targetMuscles: ['back_lats', 'back_upper', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Pull Up', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 10 },
					{ exerciseName: 'Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Reverse Flye', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Incline Dumbbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Legs B',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Leg Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Barbell Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Seated Calf Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 }
				]
			}
		]
	},
	{
		id: 'upper-lower-4',
		name: 'Upper/Lower',
		description: 'Balanced 4-day split with 2 upper and 2 lower days',
		daysPerWeek: 4,
		category: 'hypertrophy',
		days: [
			{
				name: 'Upper A',
				targetMuscles: ['chest', 'back_lats', 'back_upper', 'front_delts', 'side_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Seated Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Barbell Curl', baseSets: 2, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Cable Tricep Pushdown', baseSets: 2, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Lower A',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 }
				]
			},
			{
				name: 'Upper B',
				targetMuscles: ['chest', 'back_lats', 'back_upper', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Pull Up', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Hammer Curl', baseSets: 2, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Overhead Tricep Extension', baseSets: 2, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Lower B',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
				exercises: [
					{ exerciseName: 'Leg Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Barbell Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Seated Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 }
				]
			}
		]
	},
	{
		id: 'full-body-3',
		name: 'Full Body',
		description: 'Hit every muscle group 3x per week with compound movements',
		daysPerWeek: 3,
		category: 'strength',
		days: [
			{
				name: 'Full Body A',
				targetMuscles: ['chest', 'back_lats', 'quads', 'hamstrings', 'front_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Barbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Barbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Seated Dumbbell Press', baseSets: 2, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Barbell Curl', baseSets: 2, setProgression: 0, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Tricep Pushdown', baseSets: 2, setProgression: 0, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Full Body B',
				targetMuscles: ['chest', 'back_lats', 'quads', 'hamstrings', 'glutes', 'side_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 2, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Hammer Curl', baseSets: 2, setProgression: 0, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Full Body C',
				targetMuscles: ['chest', 'back_upper', 'quads', 'hamstrings', 'front_delts', 'rear_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Face Pull', baseSets: 2, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Incline Dumbbell Curl', baseSets: 2, setProgression: 0, repRangeMin: 10, repRangeMax: 12 }
				]
			}
		]
	},
	{
		id: 'bro-split-5',
		name: 'Bro Split',
		description: 'Classic 5-day bodybuilding split focusing on one muscle group per day',
		daysPerWeek: 5,
		category: 'hypertrophy',
		days: [
			{
				name: 'Chest',
				targetMuscles: ['chest', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Back',
				targetMuscles: ['back_lats', 'back_upper', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Lat Pulldown', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 }
				]
			},
			{
				name: 'Shoulders',
				targetMuscles: ['front_delts', 'side_delts', 'rear_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Seated Dumbbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Reverse Flye', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Overhead Tricep Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Legs',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 }
				]
			},
			{
				name: 'Arms',
				targetMuscles: ['biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Skull Crusher', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Incline Dumbbell Curl', baseSets: 2, setProgression: 0, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Overhead Tricep Extension', baseSets: 2, setProgression: 0, repRangeMin: 12, repRangeMax: 15 }
				]
			}
		]
	},
	{
		id: 'upper-lower-push-pull-4',
		name: 'Upper/Lower + Push/Pull',
		description: 'Hybrid 4-day split alternating between upper/lower and push/pull',
		daysPerWeek: 4,
		category: 'powerbuilding',
		days: [
			{
				name: 'Upper',
				targetMuscles: ['chest', 'back_lats', 'back_upper', 'front_delts', 'side_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 }
				]
			},
			{
				name: 'Lower',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 5, repRangeMax: 7 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 }
				]
			},
			{
				name: 'Push',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Incline Barbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Seated Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			},
			{
				name: 'Pull',
				targetMuscles: ['back_lats', 'back_upper', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Pull Up', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 2, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 }
				]
			}
		]
	}
];
