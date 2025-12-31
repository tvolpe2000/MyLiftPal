/**
 * Wger Exercise Image Import Script
 *
 * Updates existing exercises with image URLs from the Wger API.
 * Run after import-wger-exercises.ts to add images.
 *
 * Run with: npx tsx scripts/import-exercise-images.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// TYPES
// ============================================

interface WgerTranslation {
	name: string;
	language: number;
}

interface WgerImage {
	image: string;
	is_main: boolean;
}

interface WgerExercise {
	id: number;
	translations: WgerTranslation[];
	images: WgerImage[];
}

interface WgerResponse {
	count: number;
	next: string | null;
	results: WgerExercise[];
}

// ============================================
// FETCH FUNCTIONS
// ============================================

async function fetchExercisesWithImages(): Promise<Map<string, string>> {
	const imageMap = new Map<string, string>(); // name -> image URL
	let url: string | null = 'https://wger.de/api/v2/exerciseinfo/?language=2&limit=100';

	console.log('Fetching exercise images from Wger API...');

	while (url) {
		console.log(`  Fetching: ${url}`);
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API error: ${response.status} ${response.statusText}`);
		}

		const data: WgerResponse = await response.json();

		for (const ex of data.results) {
			// Get English name
			const englishTrans = ex.translations.find(t => t.language === 2);
			if (!englishTrans?.name) continue;

			// Get main image (prefer is_main=true, otherwise first image)
			const mainImage = ex.images.find(img => img.is_main) || ex.images[0];
			if (mainImage?.image) {
				imageMap.set(englishTrans.name.toLowerCase(), mainImage.image);
			}
		}

		url = data.next;
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	console.log(`  Found ${imageMap.size} exercises with images`);
	return imageMap;
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

async function updateExerciseImages(imageMap: Map<string, string>): Promise<void> {
	// Get all exercises from database
	const { data: exercises, error } = await supabase
		.from('exercises')
		.select('id, name, image_url')
		.is('image_url', null); // Only exercises without images

	if (error) {
		console.error('Error fetching exercises:', error);
		return;
	}

	console.log(`\nFound ${exercises.length} exercises without images`);

	let updated = 0;
	let notFound = 0;

	for (const ex of exercises) {
		const imageUrl = imageMap.get(ex.name.toLowerCase());

		if (imageUrl) {
			const { error: updateError } = await supabase
				.from('exercises')
				.update({ image_url: imageUrl })
				.eq('id', ex.id);

			if (updateError) {
				console.error(`  Error updating ${ex.name}:`, updateError.message);
			} else {
				updated++;
			}
		} else {
			notFound++;
		}
	}

	console.log(`\nUpdate complete!`);
	console.log(`  Updated: ${updated}`);
	console.log(`  No image found: ${notFound}`);
}

// ============================================
// MAIN
// ============================================

async function main() {
	console.log('='.repeat(60));
	console.log('Wger Exercise Image Import');
	console.log('='.repeat(60));
	console.log();

	try {
		const imageMap = await fetchExercisesWithImages();
		await updateExerciseImages(imageMap);
	} catch (error) {
		console.error('Import failed:', error);
		process.exit(1);
	}
}

main();
