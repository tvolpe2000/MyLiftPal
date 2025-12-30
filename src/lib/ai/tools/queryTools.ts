/**
 * Query Tool Definitions for IronAthena Voice Assistant
 *
 * Read-only tools for querying workout info, stats, and progress.
 * These tools are always available when authenticated.
 */

import { z } from 'zod';
import type { OpenAIFunctionDef } from './definitions';

// ============================================
// Zod Schemas for Parameter Validation
// ============================================

export const getTodaysWorkoutSchema = z.object({
	// No parameters needed
});

export const getWeeklyVolumeSchema = z.object({
	muscleGroup: z.string().optional().describe('Filter to specific muscle group (e.g., "chest", "back", "legs")')
});

export const getPersonalRecordsSchema = z.object({
	exerciseName: z.string().optional().describe('Filter to specific exercise'),
	limit: z.number().int().positive().default(5).describe('Number of PRs to return')
});

export const getStatsSchema = z.object({
	timeframe: z.enum(['week', 'month', 'all']).default('week').describe('Time period for stats')
});

export const getBlockProgressSchema = z.object({
	// No parameters needed
});

// Schema map
export const queryToolSchemas = {
	getTodaysWorkout: getTodaysWorkoutSchema,
	getWeeklyVolume: getWeeklyVolumeSchema,
	getPersonalRecords: getPersonalRecordsSchema,
	getStats: getStatsSchema,
	getBlockProgress: getBlockProgressSchema
} as const;

// Type inference
export type GetTodaysWorkoutParams = z.infer<typeof getTodaysWorkoutSchema>;
export type GetWeeklyVolumeParams = z.infer<typeof getWeeklyVolumeSchema>;
export type GetPersonalRecordsParams = z.infer<typeof getPersonalRecordsSchema>;
export type GetStatsParams = z.infer<typeof getStatsSchema>;
export type GetBlockProgressParams = z.infer<typeof getBlockProgressSchema>;

// ============================================
// OpenAI Function Definitions
// ============================================

export const queryOpenAITools: OpenAIFunctionDef[] = [
	{
		name: 'getTodaysWorkout',
		description: "Get today's scheduled workout including exercises and target muscles",
		parameters: {
			type: 'object',
			properties: {}
		}
	},
	{
		name: 'getWeeklyVolume',
		description: 'Get weekly training volume per muscle group',
		parameters: {
			type: 'object',
			properties: {
				muscleGroup: {
					type: 'string',
					description: 'Filter to specific muscle group (e.g., "chest", "back", "legs")'
				}
			}
		}
	},
	{
		name: 'getPersonalRecords',
		description: 'Get personal records (heaviest lifts) for exercises',
		parameters: {
			type: 'object',
			properties: {
				exerciseName: {
					type: 'string',
					description: 'Filter to specific exercise (fuzzy matched)'
				},
				limit: {
					type: 'integer',
					description: 'Number of PRs to return',
					default: 5
				}
			}
		}
	},
	{
		name: 'getStats',
		description: 'Get workout statistics for a time period',
		parameters: {
			type: 'object',
			properties: {
				timeframe: {
					type: 'string',
					enum: ['week', 'month', 'all'],
					description: 'Time period for stats',
					default: 'week'
				}
			}
		}
	},
	{
		name: 'getBlockProgress',
		description: 'Get progress on the current training block',
		parameters: {
			type: 'object',
			properties: {}
		}
	}
];
