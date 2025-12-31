// New templates to add to src/lib/data/templates.ts
// Fixes applied:
// - 'back_traps' → 'traps'
// - 'Weighted Pull-up' → 'Pull-Up'
// - 'Rear Delt Flye' → 'Reverse Pec Deck'
// - 'core' → 'abs'
// - BBB exercises use regular names (no "(BBB)" suffix)

export const NEW_TEMPLATES = [
	{
		id: 'arnold-split-6',
		name: 'Arnold Split',
		description: 'Classic 6-day split: Chest/Back, Shoulders/Arms, Legs',
		daysPerWeek: 6,
		category: 'hypertrophy',
		days: [
			{
				name: 'Chest/Back A',
				targetMuscles: ['chest', 'back_lats', 'traps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Pull-Up', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Seated Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
			{
				name: 'Shoulders/Arms A',
				targetMuscles: ['front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Overhead Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Reverse Pec Deck', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Skull Crusher', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Legs A',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Leg Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
			{
				name: 'Chest/Back B',
				targetMuscles: ['chest', 'back_lats', 'traps'],
				exercises: [
					{ exerciseName: 'Incline Barbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Pec Deck', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Lat Pulldown', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'T-Bar Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Straight Arm Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Shoulders/Arms B',
				targetMuscles: ['front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Dumbbell Shoulder Press', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Incline Dumbbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Overhead Tricep Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Preacher Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Legs B',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Front Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Bulgarian Split Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Hack Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Seated Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
	{
		id: 'phul-4',
		name: 'PHUL',
		description: 'Power Hypertrophy Upper Lower combining strength and size',
		daysPerWeek: 4,
		category: 'powerbuilding',
		days: [
			{
				name: 'Upper Power',
				targetMuscles: ['chest', 'back_lats', 'front_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 3, repRangeMax: 5 },
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 3, repRangeMax: 5 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 5, repRangeMax: 8 },
					{ exerciseName: 'Pull-Up', baseSets: 3, setProgression: 0.5, repRangeMin: 6, repRangeMax: 10 },
					{ exerciseName: 'Barbell Curl', baseSets: 2, setProgression: 0.5, repRangeMin: 6, repRangeMax: 10 },
				]
			},
			{
				name: 'Lower Power',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 3, repRangeMax: 5 },
					{ exerciseName: 'Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 3, repRangeMax: 5 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 15 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 6, repRangeMax: 10 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 10 },
				]
			},
			{
				name: 'Upper Hypertrophy',
				targetMuscles: ['chest', 'back_lats', 'side_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Seated Cable Row', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Dumbbell Shoulder Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Incline Dumbbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
			{
				name: 'Lower Hypertrophy',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Front Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Leg Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Seated Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
	{
		id: '531-bbb-4',
		name: '5/3/1 BBB',
		description: 'Wendler 5/3/1 with Boring But Big accessory work',
		daysPerWeek: 4,
		category: 'strength',
		days: [
			{
				name: 'Squat Day',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'abs'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 3, setProgression: 0, repRangeMin: 5, repRangeMax: 5 },
					{ exerciseName: 'Barbell Squat', baseSets: 5, setProgression: 0, repRangeMin: 10, repRangeMax: 10 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 15 },
					{ exerciseName: 'Ab Wheel Rollout', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 15 },
				]
			},
			{
				name: 'Bench Day',
				targetMuscles: ['chest', 'triceps', 'front_delts'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 3, setProgression: 0, repRangeMin: 5, repRangeMax: 5 },
					{ exerciseName: 'Barbell Bench Press', baseSets: 5, setProgression: 0, repRangeMin: 10, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Row', baseSets: 5, setProgression: 0.5, repRangeMin: 10, repRangeMax: 10 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
			{
				name: 'Deadlift Day',
				targetMuscles: ['hamstrings', 'glutes', 'back_lats', 'abs'],
				exercises: [
					{ exerciseName: 'Deadlift', baseSets: 3, setProgression: 0, repRangeMin: 5, repRangeMax: 5 },
					{ exerciseName: 'Deadlift', baseSets: 5, setProgression: 0, repRangeMin: 10, repRangeMax: 10 },
					{ exerciseName: 'Hanging Leg Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 15 },
					{ exerciseName: 'Back Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 15 },
				]
			},
			{
				name: 'OHP Day',
				targetMuscles: ['front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0, repRangeMin: 5, repRangeMax: 5 },
					{ exerciseName: 'Overhead Press', baseSets: 5, setProgression: 0, repRangeMin: 10, repRangeMax: 10 },
					{ exerciseName: 'Chin-up', baseSets: 5, setProgression: 0.5, repRangeMin: 10, repRangeMax: 10 },
					{ exerciseName: 'Dip', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 15 },
				]
			},
		]
	},
	{
		id: 'push-pull-4',
		name: 'Push/Pull',
		description: 'Simple 4-day split alternating push and pull movements',
		daysPerWeek: 4,
		category: 'hypertrophy',
		days: [
			{
				name: 'Push A',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Dip', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
				]
			},
			{
				name: 'Pull A',
				targetMuscles: ['back_lats', 'traps', 'rear_delts', 'biceps', 'hamstrings'],
				exercises: [
					{ exerciseName: 'Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 5, repRangeMax: 6 },
					{ exerciseName: 'Pull-Up', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Barbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
				]
			},
			{
				name: 'Push B',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Arnold Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Overhead Tricep Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
			{
				name: 'Pull B',
				targetMuscles: ['back_lats', 'traps', 'rear_delts', 'biceps', 'hamstrings'],
				exercises: [
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Lat Pulldown', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Seated Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Reverse Pec Deck', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
		]
	},
	{
		id: 'legs-push-pull-3',
		name: 'Legs/Push/Pull',
		description: '3-day rotation prioritizing leg development first',
		daysPerWeek: 3,
		category: 'hypertrophy',
		days: [
			{
				name: 'Legs',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
			{
				name: 'Push',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Pull',
				targetMuscles: ['back_lats', 'traps', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Pull-Up', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
		]
	},
	{
		id: 'glute-focus-4',
		name: 'Glute Focus',
		description: 'Glute-prioritized program with 3x weekly glute frequency',
		daysPerWeek: 4,
		category: 'hypertrophy',
		days: [
			{
				name: 'Glute/Hamstring',
				targetMuscles: ['glutes', 'hamstrings'],
				exercises: [
					{ exerciseName: 'Hip Thrust', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Pull-through', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Lying Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Kickback', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
			{
				name: 'Upper Body',
				targetMuscles: ['chest', 'back_lats', 'front_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Barbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 2, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Barbell Curl', baseSets: 2, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Glute/Quad',
				targetMuscles: ['glutes', 'quads'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Bulgarian Split Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hip Thrust', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Leg Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Hip Abduction', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
			{
				name: 'Glute Pump',
				targetMuscles: ['glutes', 'hamstrings'],
				exercises: [
					{ exerciseName: 'Sumo Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Frog Pump', baseSets: 3, setProgression: 0.5, repRangeMin: 20, repRangeMax: 25 },
					{ exerciseName: 'Single Leg Hip Thrust', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Reverse Lunge', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
	{
		id: 'leg-specialization-5',
		name: 'Leg Specialization',
		description: 'Quad and hamstring focused with 2 dedicated leg days',
		daysPerWeek: 5,
		category: 'hypertrophy',
		days: [
			{
				name: 'Quad Focus',
				targetMuscles: ['quads', 'glutes'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 5, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Front Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Leg Press', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Walking Lunge', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Upper A',
				targetMuscles: ['chest', 'back_lats', 'front_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Barbell Row', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Dip', baseSets: 2, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
			{
				name: 'Hamstring Focus',
				targetMuscles: ['hamstrings', 'glutes'],
				exercises: [
					{ exerciseName: 'Romanian Deadlift', baseSets: 5, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Lying Leg Curl', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Good Morning', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hip Thrust', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Upper B',
				targetMuscles: ['chest', 'back_lats', 'side_delts', 'biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Seated Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Barbell Curl', baseSets: 2, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Leg Volume',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Hack Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Bulgarian Split Squat', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Seated Calf Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
	{
		id: 'chest-emphasis-4',
		name: 'Chest Emphasis',
		description: 'Chest priority program hitting chest 3x per week',
		daysPerWeek: 4,
		category: 'hypertrophy',
		days: [
			{
				name: 'Chest/Triceps',
				targetMuscles: ['chest', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 5, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Dip', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Back/Biceps',
				targetMuscles: ['back_lats', 'traps', 'biceps'],
				exercises: [
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Pull-Up', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Seated Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Chest/Shoulders',
				targetMuscles: ['chest', 'front_delts', 'side_delts'],
				exercises: [
					{ exerciseName: 'Incline Barbell Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Pec Deck', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Legs',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
	{
		id: 'back-builder-4',
		name: 'Back Builder',
		description: 'Back width and thickness focus with high pulling volume',
		daysPerWeek: 4,
		category: 'hypertrophy',
		days: [
			{
				name: 'Back Width',
				targetMuscles: ['back_lats', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Pull-Up', baseSets: 5, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Lat Pulldown', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Straight Arm Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
			{
				name: 'Push',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Back Thickness',
				targetMuscles: ['back_lats', 'traps', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Barbell Row', baseSets: 5, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'T-Bar Row', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Seated Cable Row', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Barbell Shrug', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
			{
				name: 'Legs',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 4, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
	{
		id: 'arm-blaster-5',
		name: 'Arm Blaster',
		description: 'Bicep and tricep specialization with arm-specific days',
		daysPerWeek: 5,
		category: 'hypertrophy',
		days: [
			{
				name: 'Arms',
				targetMuscles: ['biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Curl', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Close Grip Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Incline Dumbbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Skull Crusher', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Push',
				targetMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Overhead Press', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Bench Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Dip', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
				]
			},
			{
				name: 'Pull',
				targetMuscles: ['back_lats', 'traps', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Pull-Up', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Lat Pulldown', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Preacher Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
				]
			},
			{
				name: 'Legs',
				targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Leg Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
			{
				name: 'Arms Volume',
				targetMuscles: ['biceps', 'triceps'],
				exercises: [
					{ exerciseName: 'Concentration Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Overhead Tricep Extension', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Spider Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Tricep Kickback', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Cable Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
					{ exerciseName: 'Diamond Push-up', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
	{
		id: 'boulder-shoulders-4',
		name: 'Boulder Shoulders',
		description: 'Delt-focused program for all three heads',
		daysPerWeek: 4,
		category: 'hypertrophy',
		days: [
			{
				name: 'Shoulder Focus',
				targetMuscles: ['front_delts', 'side_delts', 'rear_delts'],
				exercises: [
					{ exerciseName: 'Overhead Press', baseSets: 5, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Dumbbell Shoulder Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Dumbbell Lateral Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Reverse Pec Deck', baseSets: 4, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Face Pull', baseSets: 3, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
			{
				name: 'Push',
				targetMuscles: ['chest', 'front_delts', 'triceps'],
				exercises: [
					{ exerciseName: 'Barbell Bench Press', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Incline Dumbbell Press', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Cable Flye', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Dip', baseSets: 3, setProgression: 0.5, repRangeMin: 8, repRangeMax: 12 },
					{ exerciseName: 'Tricep Pushdown', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Pull',
				targetMuscles: ['back_lats', 'traps', 'rear_delts', 'biceps'],
				exercises: [
					{ exerciseName: 'Pull-Up', baseSets: 4, setProgression: 0.5, repRangeMin: 6, repRangeMax: 8 },
					{ exerciseName: 'Barbell Row', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Seated Cable Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Barbell Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Hammer Curl', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
				]
			},
			{
				name: 'Shoulders/Legs',
				targetMuscles: ['front_delts', 'side_delts', 'quads', 'hamstrings', 'glutes', 'calves'],
				exercises: [
					{ exerciseName: 'Arnold Press', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Cable Lateral Raise', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Upright Row', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Barbell Squat', baseSets: 4, setProgression: 0.5, repRangeMin: 8, repRangeMax: 10 },
					{ exerciseName: 'Romanian Deadlift', baseSets: 3, setProgression: 0.5, repRangeMin: 10, repRangeMax: 12 },
					{ exerciseName: 'Leg Press', baseSets: 3, setProgression: 0.5, repRangeMin: 12, repRangeMax: 15 },
					{ exerciseName: 'Standing Calf Raise', baseSets: 4, setProgression: 0.5, repRangeMin: 15, repRangeMax: 20 },
				]
			},
		]
	},
];
