/**
 * Block Modification Tool Definitions for IronAthena Voice Assistant
 *
 * Tools for modifying training block configuration (exercises, sets, rep ranges).
 * Available when user has an active training block.
 */

import { z } from 'zod';
import type { OpenAIFunctionDef } from './definitions';

// ============================================
// Zod Schemas for Parameter Validation
// ============================================

export const addSetsToExerciseSchema = z.object({
	exerciseName: z.string().min(1).describe('Name of exercise (fuzzy matched)'),
	additionalSets: z.number().int().positive().default(1).describe('Number of sets to add'),
	dayNumber: z.number().int().positive().optional().describe('Specific day number, or all days if omitted')
});

export const removeSetsFromExerciseSchema = z.object({
	exerciseName: z.string().min(1).describe('Name of exercise'),
	setsToRemove: z.number().int().positive().default(1).describe('Number of sets to remove'),
	dayNumber: z.number().int().positive().optional().describe('Specific day number, or all days if omitted')
});

export const changeRepRangeSchema = z.object({
	exerciseName: z.string().min(1).describe('Name of exercise'),
	minReps: z.number().int().positive().describe('New minimum reps'),
	maxReps: z.number().int().positive().describe('New maximum reps'),
	dayNumber: z.number().int().positive().optional().describe('Specific day number, or all days if omitted')
});

export const modifyBlockExerciseSchema = z.object({
	exerciseName: z.string().min(1).describe('Name of exercise to replace'),
	newExerciseName: z.string().min(1).describe('Name of replacement exercise'),
	dayNumber: z.number().int().positive().optional().describe('Specific day number, or all days if omitted'),
	permanent: z.boolean().default(true).describe('Whether to apply change permanently')
});

// Schema map
export const blockToolSchemas = {
	addSetsToExercise: addSetsToExerciseSchema,
	removeSetsFromExercise: removeSetsFromExerciseSchema,
	changeRepRange: changeRepRangeSchema,
	modifyBlockExercise: modifyBlockExerciseSchema
} as const;

// Type inference
export type AddSetsToExerciseParams = z.infer<typeof addSetsToExerciseSchema>;
export type RemoveSetsFromExerciseParams = z.infer<typeof removeSetsFromExerciseSchema>;
export type ChangeRepRangeParams = z.infer<typeof changeRepRangeSchema>;
export type ModifyBlockExerciseParams = z.infer<typeof modifyBlockExerciseSchema>;

// ============================================
// OpenAI Function Definitions
// ============================================

export const blockOpenAITools: OpenAIFunctionDef[] = [
	{
		name: 'addSetsToExercise',
		description: 'Add sets to an exercise in the training block',
		parameters: {
			type: 'object',
			properties: {
				exerciseName: {
					type: 'string',
					description: 'Name of exercise (fuzzy matched against exercise library)'
				},
				additionalSets: {
					type: 'integer',
					description: 'Number of sets to add',
					default: 1
				},
				dayNumber: {
					type: 'integer',
					description: 'Specific day number to modify (omit to apply to all days with this exercise)'
				}
			},
			required: ['exerciseName']
		}
	},
	{
		name: 'removeSetsFromExercise',
		description: 'Remove sets from an exercise in the training block',
		parameters: {
			type: 'object',
			properties: {
				exerciseName: {
					type: 'string',
					description: 'Name of exercise'
				},
				setsToRemove: {
					type: 'integer',
					description: 'Number of sets to remove',
					default: 1
				},
				dayNumber: {
					type: 'integer',
					description: 'Specific day number to modify (omit to apply to all days with this exercise)'
				}
			},
			required: ['exerciseName']
		}
	},
	{
		name: 'changeRepRange',
		description: 'Change the rep range for an exercise',
		parameters: {
			type: 'object',
			properties: {
				exerciseName: {
					type: 'string',
					description: 'Name of exercise'
				},
				minReps: {
					type: 'integer',
					description: 'New minimum reps (e.g., 6)'
				},
				maxReps: {
					type: 'integer',
					description: 'New maximum reps (e.g., 8)'
				},
				dayNumber: {
					type: 'integer',
					description: 'Specific day number to modify (omit to apply to all days with this exercise)'
				}
			},
			required: ['exerciseName', 'minReps', 'maxReps']
		}
	},
	{
		name: 'modifyBlockExercise',
		description: 'Replace an exercise with a different one in the training block',
		parameters: {
			type: 'object',
			properties: {
				exerciseName: {
					type: 'string',
					description: 'Name of exercise to replace'
				},
				newExerciseName: {
					type: 'string',
					description: 'Name of replacement exercise'
				},
				dayNumber: {
					type: 'integer',
					description: 'Specific day number to modify (omit to apply to all occurrences)'
				},
				permanent: {
					type: 'boolean',
					description: 'Whether to apply change permanently',
					default: true
				}
			},
			required: ['exerciseName', 'newExerciseName']
		}
	}
];
