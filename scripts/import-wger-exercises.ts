/**
 * Wger Exercise Import Script
 *
 * One-time script to import exercises from the Wger API into MyLiftPal.
 *
 * Data source: https://wger.de/api/v2/
 * License: AGPL-3.0 (requires attribution)
 *
 * Run with: npx tsx scripts/import-wger-exercises.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Supabase connection - use service role key for direct DB access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
	console.error('Set them in your environment or .env file');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// MAPPING: Wger Muscles → MyLiftPal Muscle Groups
// ============================================
// Wger has 15 muscles, MyLiftPal has 16 muscle groups (more granular)

const MUSCLE_MAP: Record<number, string> = {
	1: 'biceps',        // Biceps brachii
	2: 'front_delts',   // Anterior deltoid → Front Delts
	3: 'chest',         // Serratus anterior → map to Chest (close enough)
	4: 'chest',         // Pectoralis major → Chest
	5: 'triceps',       // Triceps brachii
	6: 'abs',           // Rectus abdominis
	7: 'calves',        // Gastrocnemius
	8: 'glutes',        // Gluteus maximus
	9: 'traps',         // Trapezius
	10: 'quads',        // Quadriceps femoris
	11: 'hamstrings',   // Biceps femoris
	12: 'back_lats',    // Latissimus dorsi
	13: 'biceps',       // Brachialis → map to Biceps
	14: 'obliques',     // Obliquus externus abdominis
	15: 'calves',       // Soleus → map to Calves
};

// Secondary muscle weight defaults (for volume calculation)
const SECONDARY_WEIGHT = 0.3;

// ============================================
// MAPPING: Wger Equipment → MyLiftPal Equipment
// ============================================

const EQUIPMENT_MAP: Record<number, string> = {
	1: 'barbell',       // Barbell
	2: 'barbell',       // SZ-Bar (EZ Bar) → Barbell
	3: 'dumbbell',      // Dumbbell
	4: 'bodyweight',    // Gym mat → Bodyweight (floor exercises)
	5: 'machine',       // Swiss Ball → Machine
	6: 'bodyweight',    // Pull-up bar → Bodyweight
	7: 'bodyweight',    // none (bodyweight)
	8: 'machine',       // Bench → Machine
	9: 'machine',       // Incline bench → Machine
	10: 'dumbbell',     // Kettlebell → Dumbbell (fallback if kettlebell not in DB)
	11: 'cable',        // Resistance band → Cable (fallback if bands not in DB)
};

// ============================================
// MAPPING: Wger Categories → Default rep ranges
// ============================================

const CATEGORY_DEFAULTS: Record<number, { repMin: number; repMax: number; rest: number }> = {
	8: { repMin: 10, repMax: 15, rest: 60 },   // Arms
	9: { repMin: 8, repMax: 12, rest: 120 },   // Legs
	10: { repMin: 12, repMax: 20, rest: 60 },  // Abs
	11: { repMin: 8, repMax: 12, rest: 120 },  // Chest
	12: { repMin: 8, repMax: 12, rest: 120 },  // Back
	13: { repMin: 10, repMax: 15, rest: 90 },  // Shoulders
	14: { repMin: 12, repMax: 20, rest: 60 },  // Calves
	15: { repMin: 10, repMax: 20, rest: 60 },  // Cardio
};

// ============================================
// TYPES
// ============================================

interface WgerTranslation {
	id: number;
	name: string;
	description: string;
	language: number; // 2 = English
	aliases: string[];
}

interface WgerExercise {
	id: number;
	uuid: string;
	category: { id: number; name: string };
	muscles: { id: number; name: string }[];
	muscles_secondary: { id: number; name: string }[];
	equipment: { id: number; name: string }[];
	images: { image: string }[];
	videos: { video: string }[];
	translations: WgerTranslation[];
}

interface WgerResponse {
	count: number;
	next: string | null;
	results: WgerExercise[];
}

interface MyLiftPalExercise {
	name: string;
	aliases: string[];
	equipment: string;
	primary_muscle: string;
	secondary_muscles: { muscle: string; weight: number }[];
	video_url: string | null;
	cues: string[];
	default_rep_min: number;
	default_rep_max: number;
	default_rest_seconds: number;
	work_seconds: number;
	is_core: boolean;
	wger_id: number; // Track source for deduplication
}

// ============================================
// FETCH FUNCTIONS
// ============================================

/**
 * Get the English translation from a Wger exercise
 */
function getEnglishTranslation(exercise: WgerExercise): WgerTranslation | null {
	return exercise.translations.find(t => t.language === 2) || null;
}

async function fetchAllExercises(): Promise<WgerExercise[]> {
	const exercises: WgerExercise[] = [];
	let url: string | null = 'https://wger.de/api/v2/exerciseinfo/?language=2&limit=100';

	console.log('Fetching exercises from Wger API...');

	while (url) {
		console.log(`  Fetching: ${url}`);
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API error: ${response.status} ${response.statusText}`);
		}

		const data: WgerResponse = await response.json();

		// Filter to only exercises with English name and primary muscle
		const valid = data.results.filter(ex => {
			const englishTrans = getEnglishTranslation(ex);
			return englishTrans &&
				englishTrans.name &&
				englishTrans.name.trim() !== '' &&
				ex.muscles.length > 0;
		});

		exercises.push(...valid);
		url = data.next;

		// Rate limiting - be nice to the API
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	console.log(`  Fetched ${exercises.length} valid exercises`);
	return exercises;
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

function transformExercise(wger: WgerExercise): MyLiftPalExercise | null {
	// Get English translation
	const translation = getEnglishTranslation(wger);
	if (!translation || !translation.name) {
		console.warn(`  Skipping exercise ${wger.id} - no English translation`);
		return null;
	}

	// Get primary muscle
	const primaryMuscleId = wger.muscles[0]?.id;
	const primaryMuscle = primaryMuscleId ? MUSCLE_MAP[primaryMuscleId] : null;

	if (!primaryMuscle) {
		console.warn(`  Skipping "${translation.name}" - no valid primary muscle mapping`);
		return null;
	}

	// Get equipment (default to bodyweight if none specified)
	let equipment = 'bodyweight';
	if (wger.equipment.length > 0) {
		const equipId = wger.equipment[0].id;
		equipment = EQUIPMENT_MAP[equipId] || 'machine';
	}

	// Get secondary muscles
	const secondaryMuscles = wger.muscles_secondary
		.map(m => MUSCLE_MAP[m.id])
		.filter((m): m is string => m !== undefined && m !== primaryMuscle)
		.map(muscle => ({ muscle, weight: SECONDARY_WEIGHT }));

	// Get category defaults
	const categoryId = wger.category?.id || 12; // Default to Back
	const defaults = CATEGORY_DEFAULTS[categoryId] || { repMin: 8, repMax: 12, rest: 90 };

	// Get video URL if available
	const videoUrl = wger.videos?.[0]?.video || null;

	// Extract cues from description (split by sentences, take first 3)
	const cues: string[] = [];
	if (translation.description) {
		const sentences = translation.description
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.split(/[.!?]+/)
			.map(s => s.trim())
			.filter(s => s.length > 10 && s.length < 200);
		cues.push(...sentences.slice(0, 3));
	}

	return {
		name: translation.name.trim(),
		aliases: translation.aliases || [],
		equipment,
		primary_muscle: primaryMuscle,
		secondary_muscles: secondaryMuscles,
		video_url: videoUrl,
		cues,
		default_rep_min: defaults.repMin,
		default_rep_max: defaults.repMax,
		default_rest_seconds: defaults.rest,
		work_seconds: 40,
		is_core: true, // All imported exercises are "core" (available to all users)
		wger_id: wger.id,
	};
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

async function getExistingExerciseNames(): Promise<Set<string>> {
	const { data, error } = await supabase
		.from('exercises')
		.select('name');

	if (error) {
		console.error('Error fetching existing exercises:', error);
		return new Set();
	}

	// Normalize: lowercase and trim for case-insensitive matching
	return new Set(data.map(e => e.name.toLowerCase().trim()));
}

async function insertExercises(exercises: MyLiftPalExercise[]): Promise<void> {
	console.log(`\nInserting ${exercises.length} exercises into database...`);

	// Get existing exercise names to avoid duplicates
	const existing = await getExistingExerciseNames();
	console.log(`  Found ${existing.size} existing exercises`);

	// Filter out duplicates (case-insensitive)
	const newExercises = exercises.filter(ex => !existing.has(ex.name.toLowerCase()));
	console.log(`  ${newExercises.length} new exercises to insert`);

	if (newExercises.length === 0) {
		console.log('  No new exercises to insert!');
		return;
	}

	// Insert one at a time to identify failures
	let inserted = 0;
	let failed = 0;
	const failures: string[] = [];

	for (const ex of newExercises) {
		// Transform to database format
		const row = {
			name: ex.name,
			aliases: ex.aliases,
			equipment: ex.equipment,
			primary_muscle: ex.primary_muscle,
			secondary_muscles: ex.secondary_muscles,
			video_url: ex.video_url,
			default_rep_min: ex.default_rep_min,
			default_rep_max: ex.default_rep_max,
			default_rest_seconds: ex.default_rest_seconds,
			is_core: ex.is_core,
		};

		const { error } = await supabase
			.from('exercises')
			.insert(row);

		if (error) {
			failed++;
			if (failures.length < 10) {
				failures.push(`${ex.name} (${ex.equipment}, ${ex.primary_muscle}): ${error.message}`);
			}
		} else {
			inserted++;
		}
	}

	if (failures.length > 0) {
		console.log('\nFirst failures:');
		failures.forEach(f => console.log(`  - ${f}`));
	}

	console.log(`\nImport complete!`);
	console.log(`  Inserted: ${inserted}`);
	console.log(`  Failed: ${failed}`);
	console.log(`  Skipped (duplicates): ${exercises.length - newExercises.length}`);
}

// ============================================
// MAIN
// ============================================

async function main() {
	console.log('='.repeat(60));
	console.log('Wger Exercise Import');
	console.log('='.repeat(60));
	console.log();

	try {
		// Fetch all exercises
		const wgerExercises = await fetchAllExercises();

		// Transform to MyLiftPal format
		console.log('\nTransforming exercises...');
		const transformed: MyLiftPalExercise[] = [];

		for (const wger of wgerExercises) {
			const exercise = transformExercise(wger);
			if (exercise) {
				transformed.push(exercise);
			}
		}

		console.log(`  Transformed ${transformed.length} exercises`);

		// Show sample
		console.log('\nSample exercises:');
		transformed.slice(0, 5).forEach(ex => {
			console.log(`  - ${ex.name} (${ex.equipment}, ${ex.primary_muscle})`);
		});

		// Insert into database
		await insertExercises(transformed);

	} catch (error) {
		console.error('Import failed:', error);
		process.exit(1);
	}
}

main();
