/**
 * Fix remaining duplicates by deleting the unreferenced copy
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DUPLICATES = [
	'Barbell Shrug',
	'Diamond Push-up',
	'Incline Dumbbell Curl',
	'Upright Row',
];

async function fixDuplicates() {
	console.log('Fixing remaining duplicates...\n');

	for (const name of DUPLICATES) {
		// Get all exercises with this name
		const { data: exercises } = await supabase
			.from('exercises')
			.select('id, name, created_at')
			.ilike('name', name)
			.order('created_at');

		if (!exercises || exercises.length < 2) {
			console.log(`"${name}" - not a duplicate, skipping`);
			continue;
		}

		console.log(`"${name}" - found ${exercises.length} copies`);

		// Check which ones are referenced in exercise_slots
		for (const ex of exercises) {
			const { count } = await supabase
				.from('exercise_slots')
				.select('id', { count: 'exact', head: true })
				.eq('exercise_id', ex.id);

			const isReferenced = (count || 0) > 0;
			console.log(`  ${ex.id} - ${isReferenced ? 'USED in workouts' : 'not used'}`);

			// Delete if not referenced and there are other copies
			if (!isReferenced) {
				const { error } = await supabase
					.from('exercises')
					.delete()
					.eq('id', ex.id);

				if (error) {
					console.log(`    Error deleting: ${error.message}`);
				} else {
					console.log(`    DELETED`);
				}
			}
		}
		console.log();
	}

	// Final count
	const { count } = await supabase
		.from('exercises')
		.select('id', { count: 'exact', head: true });

	console.log(`Final exercise count: ${count}`);
}

fixDuplicates();
