/**
 * Find and optionally remove duplicate exercises
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findDuplicates() {
	console.log('Fetching all exercises...');

	const { data: exercises, error } = await supabase
		.from('exercises')
		.select('id, name, equipment, primary_muscle, is_core, created_at')
		.order('name')
		.order('created_at');

	if (error) {
		console.error('Error:', error);
		return;
	}

	console.log(`Total exercises: ${exercises.length}`);

	// Group by lowercase name
	const byName = new Map<string, typeof exercises>();
	for (const ex of exercises) {
		const key = ex.name.toLowerCase().trim();
		if (!byName.has(key)) {
			byName.set(key, []);
		}
		byName.get(key)!.push(ex);
	}

	// Find duplicates
	const duplicates: { name: string; count: number; ids: string[] }[] = [];
	for (const [name, exList] of byName) {
		if (exList.length > 1) {
			duplicates.push({
				name: exList[0].name,
				count: exList.length,
				ids: exList.map(e => e.id),
			});
		}
	}

	console.log(`\nFound ${duplicates.length} duplicate names:\n`);

	let totalDupes = 0;
	for (const dup of duplicates.slice(0, 20)) {
		console.log(`  "${dup.name}" - ${dup.count} copies`);
		totalDupes += dup.count - 1; // Keep 1, remove rest
	}

	if (duplicates.length > 20) {
		console.log(`  ... and ${duplicates.length - 20} more`);
	}

	console.log(`\nTotal duplicate entries to remove: ${totalDupes}`);
	console.log(`\nTo remove duplicates, run: npx tsx scripts/find-duplicates.ts --fix`);

	// If --fix flag, remove duplicates (keep oldest)
	if (process.argv.includes('--fix')) {
		console.log('\n--- REMOVING DUPLICATES ---\n');

		let removed = 0;
		for (const dup of duplicates) {
			// Keep the first one (oldest), delete the rest
			const idsToDelete = dup.ids.slice(1);

			const { error: delError } = await supabase
				.from('exercises')
				.delete()
				.in('id', idsToDelete);

			if (delError) {
				console.error(`  Error deleting "${dup.name}":`, delError.message);
			} else {
				removed += idsToDelete.length;
				console.log(`  Removed ${idsToDelete.length} duplicates of "${dup.name}"`);
			}
		}

		console.log(`\nRemoved ${removed} duplicate exercises`);
	}
}

findDuplicates();
