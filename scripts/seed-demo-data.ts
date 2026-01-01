/**
 * Demo Data Seeding Script
 *
 * Populates 3 demo user accounts with realistic training history:
 * 1. beginner@myliftpal.com (New user)
 * 2. intermediate@myliftpal.com (Standard user)
 * 3. advanced@myliftpal.com (Power user)
 *
 * Usage: npx tsx scripts/seed-demo-data.ts
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env if present
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
// Prefer service role key for admin actions, fallback to anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) must be set.');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

// --- Types ---

interface Persona {
	email: string;
	password: string;
	displayName: string;
	weightUnit: 'lbs' | 'kg';
	blocks: BlockConfig[];
}

interface BlockConfig {
	name: string;
	status: 'active' | 'completed';
	totalWeeks: number;
	currentWeek: number; // For active blocks
	historyWeeks?: number; // How many weeks of history to generate
	split: DayConfig[];
}

interface DayConfig {
	name: string;
	exercises: ExerciseConfig[];
}

interface ExerciseConfig {
	name: string;
	baseSets: number;
	baseReps: number;
	baseWeight: number; // For week 1
	progressionWeight: number; // Added per week
}

// --- Data Definitions ---

const EXERCISES_DB = new Map<string, string>(); // Name -> UUID

const PERSONAS: Persona[] = [
	{
		email: 'beginner@myliftpal.com',
		password: 'demo1234',
		displayName: 'Beginner Lifter',
		weightUnit: 'lbs',
		blocks: [
			{
				name: 'Starter Full Body',
				status: 'active',
				totalWeeks: 4,
				currentWeek: 1,
				historyWeeks: 0, // Just started
				split: [
					{
						name: 'Full Body A',
						exercises: [
							{ name: 'Barbell Squat', baseSets: 3, baseReps: 10, baseWeight: 95, progressionWeight: 5 },
							{ name: 'Barbell Bench Press', baseSets: 3, baseReps: 10, baseWeight: 65, progressionWeight: 5 },
							{ name: 'Lat Pulldown', baseSets: 3, baseReps: 12, baseWeight: 80, progressionWeight: 5 }
						]
					},
					{
						name: 'Full Body B',
						exercises: [
							{ name: 'Romanian Deadlift', baseSets: 3, baseReps: 10, baseWeight: 135, progressionWeight: 10 },
							{ name: 'Overhead Press', baseSets: 3, baseReps: 10, baseWeight: 45, progressionWeight: 5 },
							{ name: 'Dumbbell Row', baseSets: 3, baseReps: 12, baseWeight: 35, progressionWeight: 5 }
						]
					}
				]
			}
		]
	},
	{
		email: 'intermediate@myliftpal.com',
		password: 'demo1234',
		displayName: 'Intermediate Lifter',
		weightUnit: 'lbs',
		blocks: [
			// Past Block
			{
				name: 'Foundation Upper/Lower',
				status: 'completed',
				totalWeeks: 4,
				currentWeek: 4,
				historyWeeks: 4,
				split: [
					{
						name: 'Upper Power',
						exercises: [
							{ name: 'Barbell Bench Press', baseSets: 4, baseReps: 6, baseWeight: 185, progressionWeight: 5 },
							{ name: 'Barbell Row', baseSets: 4, baseReps: 8, baseWeight: 135, progressionWeight: 5 },
							{ name: 'Overhead Press', baseSets: 3, baseReps: 8, baseWeight: 115, progressionWeight: 5 }
						]
					},
					{
						name: 'Lower Power',
						exercises: [
							{ name: 'Barbell Squat', baseSets: 4, baseReps: 5, baseWeight: 225, progressionWeight: 10 },
							{ name: 'Romanian Deadlift', baseSets: 3, baseReps: 8, baseWeight: 225, progressionWeight: 10 },
							{ name: 'Leg Press', baseSets: 3, baseReps: 12, baseWeight: 300, progressionWeight: 10 }
						]
					}
				]
			},
			// Active Block
			{
				name: 'Hypertrophy Push/Pull',
				status: 'active',
				totalWeeks: 6,
				currentWeek: 2,
				historyWeeks: 1, // Week 1 done
				split: [
					{
						name: 'Push A',
						exercises: [
							{ name: 'Incline Dumbbell Press', baseSets: 3, baseReps: 10, baseWeight: 60, progressionWeight: 5 },
							{ name: 'Dips (Chest)', baseSets: 3, baseReps: 10, baseWeight: 0, progressionWeight: 0 },
							{ name: 'Lateral Raise', baseSets: 4, baseReps: 15, baseWeight: 20, progressionWeight: 0 }
						]
					},
					{
						name: 'Pull A',
						exercises: [
							{ name: 'Pull-Up', baseSets: 3, baseReps: 8, baseWeight: 0, progressionWeight: 0 },
							{ name: 'Seated Cable Row', baseSets: 3, baseReps: 12, baseWeight: 140, progressionWeight: 5 },
							{ name: 'Face Pull', baseSets: 4, baseReps: 15, baseWeight: 40, progressionWeight: 5 }
						]
					}
				]
			}
		]
	},
	{
		email: 'advanced@myliftpal.com',
		password: 'demo1234',
		displayName: 'Advanced Lifter',
		weightUnit: 'lbs',
		blocks: [
			// Recent Past Block (Just one for brevity, but heavy data)
			{
				name: 'Peaking Block',
				status: 'completed',
				totalWeeks: 5,
				currentWeek: 5,
				historyWeeks: 5,
				split: [
					{
						name: 'Squat Day',
						exercises: [
							{ name: 'Barbell Squat', baseSets: 5, baseReps: 3, baseWeight: 365, progressionWeight: 10 },
							{ name: 'Leg Extension', baseSets: 4, baseReps: 15, baseWeight: 180, progressionWeight: 5 }
						]
					},
					{
						name: 'Bench Day',
						exercises: [
							{ name: 'Barbell Bench Press', baseSets: 5, baseReps: 3, baseWeight: 275, progressionWeight: 5 },
							{ name: 'Close Grip Bench', baseSets: 4, baseReps: 8, baseWeight: 225, progressionWeight: 5 }
						]
					},
					{
						name: 'Deadlift Day',
						exercises: [
							{ name: 'Romanian Deadlift', baseSets: 4, baseReps: 6, baseWeight: 405, progressionWeight: 10 },
							{ name: 'Barbell Row', baseSets: 4, baseReps: 8, baseWeight: 225, progressionWeight: 5 }
						]
					}
				]
			},
			// Active Block
			{
				name: 'Hypertrophy Reset',
				status: 'active',
				totalWeeks: 8,
				currentWeek: 3,
				historyWeeks: 2,
				split: [
					{
						name: 'Legs',
						exercises: [
							{ name: 'Barbell Squat', baseSets: 3, baseReps: 10, baseWeight: 315, progressionWeight: 5 },
							{ name: 'Leg Curl', baseSets: 4, baseReps: 12, baseWeight: 140, progressionWeight: 5 }
						]
					},
					{
						name: 'Push',
						exercises: [
							{ name: 'Incline Barbell Press', baseSets: 3, baseReps: 10, baseWeight: 225, progressionWeight: 5 },
							{ name: 'Pec Deck', baseSets: 3, baseReps: 15, baseWeight: 160, progressionWeight: 5 }
						]
					}
				]
			}
		]
	}
];

// --- Helpers ---

async function loadExercises() {
	console.log('Loading exercises...');
	const { data, error } = await supabase.from('exercises').select('id, name, aliases');
	if (error) throw error;
	
	if (!data) return;

	for (const ex of data) {
		EXERCISES_DB.set(ex.name.toLowerCase(), ex.id);
		// Map aliases too
		if (ex.aliases && Array.isArray(ex.aliases)) {
			for (const alias of ex.aliases) {
				EXERCISES_DB.set(alias.toLowerCase(), ex.id);
			}
		}
	}
	console.log(`Loaded ${EXERCISES_DB.size} exercise names/aliases.`);
}

function findExerciseId(name: string): string | undefined {
	const key = name.toLowerCase();
	// Try exact match
	if (EXERCISES_DB.has(key)) return EXERCISES_DB.get(key);
	
	// Try partial match
	for (const [dbName, id] of EXERCISES_DB.entries()) {
		if (dbName.includes(key) || key.includes(dbName)) return id;
	}
	return undefined;
}

async function getOrCreateUser(persona: Persona): Promise<string> {
	console.log(`\nProcessing User: ${persona.email}`);
	
	// 1. Try to fetch user by email (Admin only)
	// Note: listUsers is an admin function. If using anon key, we skip to signUp.
	let userId: string | null = null;
	
	// Simple check: try to sign in
	const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
		email: persona.email,
		password: persona.password
	});

	if (signInData.user) {
		console.log('  - User exists, signed in.');
		userId = signInData.user.id;
	} else {
		console.log('  - User not found, creating...');
		const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
			email: persona.email,
			password: persona.password,
			options: {
				data: { display_name: persona.displayName }
			}
		});

		if (signUpError) {
			console.error('  - Error creating user:', signUpError.message);
			throw signUpError;
		}

		if (signUpData.user) {
			userId = signUpData.user.id;
			console.log('  - User created.');
		} else {
			throw new Error('User creation failed (no data returned)');
		}
	}

	// Update profile
	if (userId) {
		await supabase
			.from('profiles')
			.update({
				display_name: persona.displayName,
				weight_unit: persona.weightUnit 
			})
			.eq('id', userId);
	}

	return userId!;
}

async function clearUserData(userId: string) {
	// Cascade delete should handle children, but let's be safe
	const { error } = await supabase
		.from('training_blocks')
		.delete()
		.eq('user_id', userId);
		
	if (error) console.error('  - Error clearing data:', error.message);
	else console.log('  - Cleared old training blocks.');
}

async function seedUser(userId: string, persona: Persona) {
	await clearUserData(userId);

	for (const blockConfig of persona.blocks) {
		console.log(`  - Creating Block: ${blockConfig.name} (${blockConfig.status})`);
		
		// 1. Create Block
		const { data: block, error: blockError } = await supabase
			.from('training_blocks')
			.insert({
				user_id: userId,
				name: blockConfig.name,
				total_weeks: blockConfig.totalWeeks,
				current_week: blockConfig.currentWeek,
				status: blockConfig.status,
				started_at: blockConfig.status === 'completed' 
					? new Date(Date.now() - (blockConfig.totalWeeks + 1) * 7 * 24 * 60 * 60 * 1000).toISOString()
					: new Date().toISOString(),
				completed_at: blockConfig.status === 'completed'
					? new Date(Date.now() - 1 * 7 * 24 * 60 * 60 * 1000).toISOString()
					: null
			})
			.select()
			single();
			
		if (blockError) throw blockError;

		// 2. Create Days & Slots
		const dayIds: string[] = [];
		const dayConfigMap = new Map<string, DayConfig>(); // dayId -> config

		for (let i = 0; i < blockConfig.split.length; i++) {
			const dayConf = blockConfig.split[i];
			
			// Create Day
			const { data: day, error: dayError } = await supabase
				.from('workout_days')
				.insert({
					training_block_id: block.id,
					day_number: i + 1,
					name: dayConf.name
				})
				.select()
				single();
			
			if (dayError) throw dayError;
			dayIds.push(day.id);
			dayConfigMap.set(day.id, dayConf);

			// Create Slots
			for (let j = 0; j < dayConf.exercises.length; j++) {
				const exConf = dayConf.exercises[j];
				const exerciseId = findExerciseId(exConf.name);
				
				if (!exerciseId) {
					console.warn(`    ! Exercise not found: ${exConf.name}, skipping`);
					continue;
				}

				await supabase.from('exercise_slots').insert({
					workout_day_id: day.id,
					exercise_id: exerciseId,
					slot_order: j,
					base_sets: exConf.baseSets,
					rep_range_min: exConf.baseReps - 2,
					rep_range_max: exConf.baseReps + 2,
					set_progression: 0.5 // Default
				});
			}
		}

		// 3. Generate History (Sessions & Logs)
		if (blockConfig.historyWeeks && blockConfig.historyWeeks > 0) {
			console.log(`    - Generating ${blockConfig.historyWeeks} weeks of history...`);
			
			// Fetch slots to get IDs
			const { data: slots } = await supabase
				.from('exercise_slots')
				.select('*, workout_days(*)')
				.in('workout_day_id', dayIds);
				
			if (!slots) continue;

			for (let w = 1; w <= blockConfig.historyWeeks; w++) {
				// Calculate date (backwards from now)
				// If active, week 1 was (currentWeek - 1) weeks ago
				// If completed, week 1 was (totalWeeks + 1) weeks ago
				let weeksAgo = 0;
				if (blockConfig.status === 'completed') {
					weeksAgo = blockConfig.totalWeeks - w + 1;
				} else {
					weeksAgo = blockConfig.currentWeek - w;
				}
				
				const sessionDate = new Date();
				sessionDate.setDate(sessionDate.getDate() - (weeksAgo * 7));

				// For each day in the split
				for (let d = 0; d < dayIds.length; d++) {
					const dayId = dayIds[d];
					const dayConf = dayConfigMap.get(dayId)!;
					
					// Create Session
					// Adjust date slightly for different days
					const date = new Date(sessionDate);
					date.setDate(date.getDate() + d);

					const { data: session, error: sessError } = await supabase
						.from('workout_sessions')
						.insert({
							user_id: userId,
							training_block_id: block.id,
							workout_day_id: dayId,
							week_number: w,
							scheduled_date: date.toISOString(),
							started_at: date.toISOString(),
							completed_at: new Date(date.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
							status: 'completed',
							duration_minutes: 60,
							overall_pump: 'great',
							overall_soreness: 'moderate',
							workload_rating: 'just_right'
						})
						.select()
						single();
						
					if (sessError) throw sessError;

					// Log Sets
					const daySlots = slots.filter(s => s.workout_day_id === dayId);
					daySlots.sort((a, b) => a.slot_order - b.slot_order);

					for (const slot of daySlots) {
						// Find config for this exercise
						// We need to match exercise ID back to name to find config :(
						// Simplified: Loop through exercises in config and match index since we sorted slots
						const exIndex = slot.slot_order;
						if (exIndex >= dayConf.exercises.length) continue;
						
						const exConf = dayConf.exercises[exIndex];
						
						// Calc Weight & RIR
						// Weight increases each week
						const weight = exConf.baseWeight + ((w - 1) * exConf.progressionWeight);
						// RIR decreases each week (3 -> 2 -> 1 -> 0)
						const rir = Math.max(0, 3 - (w - 1));
						
						// Sets
						for (let s = 1; s <= exConf.baseSets; s++) {
							await supabase.from('logged_sets').insert({
								workout_session_id: session.id,
								exercise_slot_id: slot.id,
								exercise_id: slot.exercise_id,
								set_number: s,
								target_reps: exConf.baseReps,
								actual_reps: exConf.baseReps,
								target_weight: weight,
								actual_weight: weight,
								weight_unit: persona.weightUnit,
								rir: rir,
								completed: true,
								logged_at: new Date(date.getTime() + (s * 5 * 60000)).toISOString()
							});
						}
					}
				}
			}
		}
	}
}

async function main() {
	console.log('='.repeat(50));
	console.log('DEMO DATA SEEDER');
	console.log('='.repeat(50));

	try {
		await loadExercises();

		for (const persona of PERSONAS) {
			const userId = await getOrCreateUser(persona);
			await seedUser(userId, persona);
			console.log(`  > Done! Credentials: ${persona.email} / ${persona.password}`);
		}
		
		console.log('\nSuccess! All demo users seeded.');
		
	} catch (err) {
		console.error('\nFATAL ERROR:', err);
		process.exit(1);
	}
}

main();
