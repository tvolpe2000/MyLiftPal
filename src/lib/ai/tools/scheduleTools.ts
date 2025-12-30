/**
 * Schedule Tool Definitions for IronAthena Voice Assistant
 *
 * Tools for managing workout schedule (swapping days, skipping, rescheduling).
 * Available when user has an active training block.
 */

import { z } from 'zod';
import type { OpenAIFunctionDef } from './definitions';

// ============================================
// Zod Schemas for Parameter Validation
// ============================================

export const swapWorkoutDaysSchema = z.object({
	dayA: z.number().int().positive().describe('First day number to swap'),
	dayB: z.number().int().positive().describe('Second day number to swap')
});

export const skipDaySchema = z.object({
	reason: z.string().optional().describe('Reason for skipping the workout')
});

export const rescheduleDaySchema = z.object({
	targetDayNumber: z.number().int().positive().describe('Day number to move current workout to'),
	reason: z.string().optional().describe('Reason for rescheduling')
});

// Schema map
export const scheduleToolSchemas = {
	swapWorkoutDays: swapWorkoutDaysSchema,
	skipDay: skipDaySchema,
	rescheduleDay: rescheduleDaySchema
} as const;

// Type inference
export type SwapWorkoutDaysParams = z.infer<typeof swapWorkoutDaysSchema>;
export type SkipDayParams = z.infer<typeof skipDaySchema>;
export type RescheduleDayParams = z.infer<typeof rescheduleDaySchema>;

// ============================================
// OpenAI Function Definitions
// ============================================

export const scheduleOpenAITools: OpenAIFunctionDef[] = [
	{
		name: 'swapWorkoutDays',
		description: 'Swap two workout days in the training block (e.g., swap Monday\'s workout with Wednesday\'s)',
		parameters: {
			type: 'object',
			properties: {
				dayA: {
					type: 'integer',
					description: 'First day number to swap (1 = first workout day)'
				},
				dayB: {
					type: 'integer',
					description: 'Second day number to swap'
				}
			},
			required: ['dayA', 'dayB']
		}
	},
	{
		name: 'skipDay',
		description: 'Skip today\'s workout and advance to the next day in the schedule',
		parameters: {
			type: 'object',
			properties: {
				reason: {
					type: 'string',
					description: 'Reason for skipping (e.g., "rest day", "sick", "busy")'
				}
			}
		}
	},
	{
		name: 'rescheduleDay',
		description: 'Change which workout day to do today (e.g., do leg day instead of chest day)',
		parameters: {
			type: 'object',
			properties: {
				targetDayNumber: {
					type: 'integer',
					description: 'Day number to switch to (e.g., 3 for day 3 of the program)'
				},
				reason: {
					type: 'string',
					description: 'Reason for rescheduling'
				}
			},
			required: ['targetDayNumber']
		}
	}
];
