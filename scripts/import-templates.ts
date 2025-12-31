/**
 * Template & Exercise Import Script
 *
 * Reads a CSV file with template/exercise data and:
 * 1. Checks which exercises already exist in the database
 * 2. Generates SQL INSERT statements for new exercises
 * 3. Updates src/lib/data/templates.ts with new templates
 *
 * CSV Format Expected:
 * template_id,template_name,template_description,days_per_week,category,day_name,target_muscles,exercise_name,base_sets,set_progression,rep_min,rep_max,equipment,primary_muscle,secondary_muscles
 *
 * Usage: npx tsx scripts/import-templates.ts data/templates.csv
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

interface CSVRow {
	template_id: string;
	template_name: string;
	template_description: string;
	days_per_week: string;
	category: string;
	day_name: string;
	target_muscles: string; // comma-separated
	exercise_name: string;
	base_sets: string;
	set_progression: string;
	rep_min: string;
	rep_max: string;
	// Optional fields for new exercises
	equipment?: string;
	primary_muscle?: string;
	secondary_muscles?: string; // JSON string
}

interface Exercise {
	name: string;
	equipment?: string;
	primary_muscle?: string;
	secondary_muscles?: string;
}

interface TemplateExercise {
	exerciseName: string;
	baseSets: number;
	setProgression: number;
	repRangeMin: number;
	repRangeMax: number;
}

interface TemplateDay {
	name: string;
	targetMuscles: string[];
	exercises: TemplateExercise[];
}

interface Template {
	id: string;
	name: string;
	description: string;
	daysPerWeek: number;
	category: string;
	days: TemplateDay[];
}

function parseCSV(content: string): CSVRow[] {
	const lines = content.trim().split('\n');
	const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

	return lines.slice(1).map(line => {
		// Handle quoted values with commas inside
		const values: string[] = [];
		let current = '';
		let inQuotes = false;

		for (const char of line) {
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				values.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		values.push(current.trim());

		const row: Record<string, string> = {};
		headers.forEach((header, i) => {
			row[header] = values[i] || '';
		});
		return row as unknown as CSVRow;
	});
}

async function getExistingExercises(supabase: ReturnType<typeof createClient>): Promise<Set<string>> {
	const { data, error } = await supabase
		.from('exercises')
		.select('name');

	if (error) {
		console.error('Error fetching exercises:', error);
		return new Set();
	}

	// Normalize names for comparison (lowercase, trimmed)
	return new Set((data || []).map(e => (e as { name: string }).name.toLowerCase().trim()));
}

function generateExerciseSQL(exercises: Exercise[]): string {
	if (exercises.length === 0) return '-- No new exercises to add\n';

	let sql = '-- New exercises to add\n';
	sql += '-- Run this in Supabase SQL Editor\n\n';
	sql += 'INSERT INTO exercises (name, equipment, primary_muscle, secondary_muscles, default_rep_min, default_rep_max, default_rest_seconds, work_seconds, is_core) VALUES\n';

	const values = exercises.map(e => {
		const equipment = e.equipment || 'barbell';
		const primaryMuscle = e.primary_muscle || 'chest';
		const secondaryMuscles = e.secondary_muscles || '[]';
		return `  ('${e.name.replace(/'/g, "''")}', '${equipment}', '${primaryMuscle}', '${secondaryMuscles}', 8, 12, 90, 40, FALSE)`;
	});

	sql += values.join(',\n') + ';\n';
	return sql;
}

function generateTemplatesTS(templates: Template[]): string {
	let ts = `// Auto-generated from CSV import
// Add these to src/lib/data/templates.ts

`;

	for (const template of templates) {
		ts += `	{
		id: '${template.id}',
		name: '${template.name}',
		description: '${template.description.replace(/'/g, "\\'")}',
		daysPerWeek: ${template.daysPerWeek},
		category: '${template.category}',
		days: [
`;

		for (const day of template.days) {
			ts += `			{
				name: '${day.name}',
				targetMuscles: [${day.targetMuscles.map(m => `'${m}'`).join(', ')}],
				exercises: [
`;
			for (const ex of day.exercises) {
				ts += `					{ exerciseName: '${ex.exerciseName}', baseSets: ${ex.baseSets}, setProgression: ${ex.setProgression}, repRangeMin: ${ex.repRangeMin}, repRangeMax: ${ex.repRangeMax} },
`;
			}
			ts += `				]
			},
`;
		}

		ts += `		]
	},
`;
	}

	return ts;
}

async function main() {
	const csvPath = process.argv[2];

	if (!csvPath) {
		console.log('Usage: npx tsx scripts/import-templates.ts <csv-file>');
		console.log('');
		console.log('CSV Format:');
		console.log('template_id,template_name,template_description,days_per_week,category,day_name,target_muscles,exercise_name,base_sets,set_progression,rep_min,rep_max,equipment,primary_muscle,secondary_muscles');
		console.log('');
		console.log('Example row:');
		console.log('upper-lower-4,Upper/Lower,4-day split,4,hypertrophy,Upper A,"chest,back_lats,biceps,triceps",Barbell Bench Press,4,0.5,6,8,barbell,chest,"[{""muscle"": ""triceps"", ""weight"": 0.5}]"');
		process.exit(1);
	}

	// Read CSV
	const fullPath = path.resolve(csvPath);
	if (!fs.existsSync(fullPath)) {
		console.error(`File not found: ${fullPath}`);
		process.exit(1);
	}

	console.log(`Reading CSV from: ${fullPath}`);
	const csvContent = fs.readFileSync(fullPath, 'utf-8');
	const rows = parseCSV(csvContent);
	console.log(`Parsed ${rows.length} rows`);

	// Connect to Supabase
	if (!SUPABASE_URL || !SUPABASE_KEY) {
		console.warn('Warning: SUPABASE_URL or key not set. Skipping exercise existence check.');
		console.warn('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
	}

	let existingExercises = new Set<string>();
	if (SUPABASE_URL && SUPABASE_KEY) {
		const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
		existingExercises = await getExistingExercises(supabase);
		console.log(`Found ${existingExercises.size} existing exercises in database`);
	}

	// Process rows into templates and find new exercises
	const templates = new Map<string, Template>();
	const newExercises: Exercise[] = [];
	const seenExercises = new Set<string>();

	for (const row of rows) {
		// Get or create template
		if (!templates.has(row.template_id)) {
			templates.set(row.template_id, {
				id: row.template_id,
				name: row.template_name,
				description: row.template_description,
				daysPerWeek: parseInt(row.days_per_week) || 3,
				category: row.category || 'hypertrophy',
				days: []
			});
		}
		const template = templates.get(row.template_id)!;

		// Get or create day
		let day = template.days.find(d => d.name === row.day_name);
		if (!day) {
			day = {
				name: row.day_name,
				targetMuscles: row.target_muscles.split(',').map(m => m.trim()).filter(Boolean),
				exercises: []
			};
			template.days.push(day);
		}

		// Add exercise to day
		if (row.exercise_name) {
			day.exercises.push({
				exerciseName: row.exercise_name,
				baseSets: parseInt(row.base_sets) || 3,
				setProgression: parseFloat(row.set_progression) || 0.5,
				repRangeMin: parseInt(row.rep_min) || 8,
				repRangeMax: parseInt(row.rep_max) || 12
			});

			// Check if exercise is new
			const exerciseKey = row.exercise_name.toLowerCase().trim();
			if (!existingExercises.has(exerciseKey) && !seenExercises.has(exerciseKey)) {
				seenExercises.add(exerciseKey);
				newExercises.push({
					name: row.exercise_name,
					equipment: row.equipment,
					primary_muscle: row.primary_muscle,
					secondary_muscles: row.secondary_muscles
				});
			}
		}
	}

	// Output results
	console.log('\n' + '='.repeat(60));
	console.log('IMPORT RESULTS');
	console.log('='.repeat(60));

	console.log(`\nTemplates found: ${templates.size}`);
	for (const [id, template] of templates) {
		console.log(`  - ${template.name} (${template.daysPerWeek} days, ${template.days.reduce((sum, d) => sum + d.exercises.length, 0)} exercises)`);
	}

	console.log(`\nNew exercises to add: ${newExercises.length}`);
	for (const ex of newExercises) {
		console.log(`  - ${ex.name} (${ex.equipment || 'unknown equipment'}, ${ex.primary_muscle || 'unknown muscle'})`);
	}

	// Write SQL file for new exercises to supabase/scripts/
	if (newExercises.length > 0) {
		const sqlPath = path.join(process.cwd(), 'supabase', 'scripts', 'new_exercises.sql');
		const sql = generateExerciseSQL(newExercises);
		fs.writeFileSync(sqlPath, sql);
		console.log(`\n✅ SQL for new exercises written to: ${sqlPath}`);
		console.log('   Run this SQL in Supabase Dashboard before using the templates!');
	}

	// Write TypeScript for templates to data/ (reference only)
	const tsPath = path.join(path.dirname(fullPath), 'new_templates.ts');
	const ts = generateTemplatesTS(Array.from(templates.values()));
	fs.writeFileSync(tsPath, ts);
	console.log(`\n✅ TypeScript templates written to: ${tsPath}`);
	console.log('   Copy these into src/lib/data/templates.ts');

	console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
