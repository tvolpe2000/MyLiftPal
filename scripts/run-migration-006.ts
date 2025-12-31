/**
 * Run Migration 006: Exercise Images
 *
 * Adds image URL columns to muscle_groups and exercises tables.
 * Run with: npx tsx scripts/run-migration-006.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('Missing environment variables');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// is_front indicates which base body SVG to use:
//   true  -> https://wger.de/static/images/muscles/muscular_system_front.svg
//   false -> https://wger.de/static/images/muscles/muscular_system_back.svg
const MUSCLE_IMAGE_UPDATES = [
	{ id: 'biceps', main: 'muscle-1.svg', secondary: 'muscle-1.svg', is_front: true },
	{ id: 'triceps', main: 'muscle-5.svg', secondary: 'muscle-5.svg', is_front: false },
	{ id: 'chest', main: 'muscle-4.svg', secondary: 'muscle-4.svg', is_front: true },
	{ id: 'back_lats', main: 'muscle-12.svg', secondary: 'muscle-12.svg', is_front: false },
	{ id: 'back_lower', main: 'muscle-12.svg', secondary: 'muscle-12.svg', is_front: false },
	{ id: 'traps', main: 'muscle-9.svg', secondary: 'muscle-9.svg', is_front: false },
	{ id: 'front_delts', main: 'muscle-2.svg', secondary: 'muscle-2.svg', is_front: true },
	{ id: 'side_delts', main: 'muscle-2.svg', secondary: 'muscle-2.svg', is_front: true },
	{ id: 'rear_delts', main: 'muscle-2.svg', secondary: 'muscle-2.svg', is_front: false },
	{ id: 'abs', main: 'muscle-6.svg', secondary: 'muscle-6.svg', is_front: true },
	{ id: 'obliques', main: 'muscle-14.svg', secondary: 'muscle-14.svg', is_front: true },
	{ id: 'quads', main: 'muscle-10.svg', secondary: 'muscle-10.svg', is_front: true },
	{ id: 'hamstrings', main: 'muscle-11.svg', secondary: 'muscle-11.svg', is_front: false },
	{ id: 'glutes', main: 'muscle-8.svg', secondary: 'muscle-8.svg', is_front: false },
	{ id: 'calves', main: 'muscle-7.svg', secondary: 'muscle-7.svg', is_front: false },
	{ id: 'forearms', main: 'muscle-13.svg', secondary: 'muscle-13.svg', is_front: true },
];

const BASE_URL = 'https://wger.de/static/images/muscles';

async function main() {
	console.log('='.repeat(60));
	console.log('Running Migration 006: Exercise Images');
	console.log('='.repeat(60));

	// Update muscle group images
	console.log('\nUpdating muscle group images...');
	let updated = 0;

	for (const muscle of MUSCLE_IMAGE_UPDATES) {
		const { error } = await supabase
			.from('muscle_groups')
			.update({
				image_url_main: `${BASE_URL}/main/${muscle.main}`,
				image_url_secondary: `${BASE_URL}/secondary/${muscle.secondary}`,
				is_front: muscle.is_front,
			})
			.eq('id', muscle.id);

		if (error) {
			// Column might not exist yet - that's OK, just means we need to run ALTER TABLE first
			if (error.message.includes('column')) {
				console.log('  Note: image columns do not exist yet. Run the SQL migration first:');
				console.log('  supabase/migrations/006_exercise_images.sql');
				return;
			}
			console.error(`  Error updating ${muscle.id}:`, error.message);
		} else {
			updated++;
		}
	}

	console.log(`  Updated ${updated} muscle groups with images`);
	console.log('\nMigration complete!');
	console.log('\nNext: Run npx tsx scripts/import-exercise-images.ts to add exercise photos');
}

main();
