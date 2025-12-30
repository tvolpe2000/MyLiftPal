/**
 * AI Tool Definitions for IronAthena Voice Assistant
 *
 * Zod schemas for validating AI tool calls and
 * OpenAI-compatible function definitions.
 *
 * Includes workout, schedule, block, and query tools.
 */

import { z } from 'zod';
import type { ToolName, UnifiedContext } from '../types';
import { queryToolSchemas, queryOpenAITools } from './queryTools';
import { scheduleToolSchemas, scheduleOpenAITools } from './scheduleTools';
import { blockToolSchemas, blockOpenAITools } from './blockTools';
import { WORKOUT_TOOLS, SCHEDULE_TOOLS, BLOCK_TOOLS, QUERY_TOOLS } from '../context/index';

// ============================================
// Zod Schemas for Parameter Validation
// ============================================

export const logSetSchema = z.object({
	weight: z.number().positive().describe('Weight in pounds'),
	reps: z.number().int().positive().describe('Number of reps completed'),
	rir: z.number().int().min(0).max(5).optional().describe('Reps in Reserve (0-5)')
});

export const skipExerciseSchema = z.object({
	reason: z.string().optional().describe('Reason for skipping')
});

export const swapExerciseSchema = z.object({
	targetExercise: z.string().optional().describe('Name of exercise to swap (defaults to current exercise if not specified)'),
	newExercise: z.string().min(1).describe('Name of replacement exercise'),
	reason: z.string().optional().describe('Reason for swapping')
});

export const completeWorkoutSchema = z.object({
	notes: z.string().optional().describe('Optional workout notes')
});

export const addExerciseSchema = z.object({
	exercise: z.string().min(1).describe('Name of exercise to add'),
	sets: z.number().int().positive().default(3).describe('Number of sets')
});

export const undoLastSchema = z.object({
	correction: z.string().optional().describe('What the correct value should be')
});

export const clarifySchema = z.object({
	question: z.string().min(1).describe('Clarifying question to ask')
});

// Workout tools schema map
export const workoutToolSchemas = {
	logSet: logSetSchema,
	skipExercise: skipExerciseSchema,
	swapExercise: swapExerciseSchema,
	completeWorkout: completeWorkoutSchema,
	addExercise: addExerciseSchema,
	undoLast: undoLastSchema,
	clarify: clarifySchema
} as const;

// Combined schema map for all tools
export const toolSchemas: Record<ToolName, z.ZodType> = {
	// Workout tools
	...workoutToolSchemas,
	// Query tools
	...queryToolSchemas,
	// Schedule tools
	...scheduleToolSchemas,
	// Block tools
	...blockToolSchemas
};

// Type inference from schemas
export type LogSetParams = z.infer<typeof logSetSchema>;
export type SkipExerciseParams = z.infer<typeof skipExerciseSchema>;
export type SwapExerciseParams = z.infer<typeof swapExerciseSchema>;
export type CompleteWorkoutParams = z.infer<typeof completeWorkoutSchema>;
export type AddExerciseParams = z.infer<typeof addExerciseSchema>;
export type UndoLastParams = z.infer<typeof undoLastSchema>;
export type ClarifyParams = z.infer<typeof clarifySchema>;

// ============================================
// OpenAI Function Definitions
// ============================================

export interface OpenAIFunctionDef {
	name: string;
	description: string;
	parameters: {
		type: 'object';
		properties: Record<string, unknown>;
		required?: string[];
	};
}

export const openAITools: OpenAIFunctionDef[] = [
	{
		name: 'logSet',
		description: 'Log a completed set with weight, reps, and optional RIR (Reps in Reserve)',
		parameters: {
			type: 'object',
			properties: {
				weight: {
					type: 'number',
					description: 'Weight in pounds (convert from kg if mentioned)'
				},
				reps: {
					type: 'integer',
					description: 'Number of reps completed'
				},
				rir: {
					type: 'integer',
					description: "Reps in Reserve (0-5). Infer from phrases like 'felt easy' (2-3), 'hard' (1), 'to failure' (0)",
					minimum: 0,
					maximum: 5
				}
			},
			required: ['weight', 'reps']
		}
	},
	{
		name: 'skipExercise',
		description: 'Skip the current exercise and move to the next one',
		parameters: {
			type: 'object',
			properties: {
				reason: {
					type: 'string',
					description: 'Optional reason for skipping (injury, equipment unavailable, etc.)'
				}
			}
		}
	},
	{
		name: 'swapExercise',
		description: 'Swap an exercise for a different one. If targetExercise is not specified, swaps the current exercise.',
		parameters: {
			type: 'object',
			properties: {
				targetExercise: {
					type: 'string',
					description: 'Name of exercise to swap (if omitted, swaps the current exercise the user is on)'
				},
				newExercise: {
					type: 'string',
					description: 'Name of the replacement exercise (will be fuzzy matched against exercise library)'
				},
				reason: {
					type: 'string',
					description: 'Optional reason for swapping'
				}
			},
			required: ['newExercise']
		}
	},
	{
		name: 'completeWorkout',
		description: 'Complete and save the current workout session',
		parameters: {
			type: 'object',
			properties: {
				notes: {
					type: 'string',
					description: 'Optional notes about the workout'
				}
			}
		}
	},
	{
		name: 'addExercise',
		description: "Add an additional exercise to today's workout",
		parameters: {
			type: 'object',
			properties: {
				exercise: {
					type: 'string',
					description: 'Name of the exercise to add (will be fuzzy matched)'
				},
				sets: {
					type: 'integer',
					description: 'Number of sets to add',
					default: 3
				}
			},
			required: ['exercise']
		}
	},
	{
		name: 'undoLast',
		description: 'Undo the most recent action (logged set, skip, swap)',
		parameters: {
			type: 'object',
			properties: {
				correction: {
					type: 'string',
					description: 'If user is correcting, what the correct value should be'
				}
			}
		}
	},
	{
		name: 'clarify',
		description: "Ask a clarifying question when the user's intent is unclear",
		parameters: {
			type: 'object',
			properties: {
				question: {
					type: 'string',
					description: 'Brief clarifying question to ask'
				}
			},
			required: ['question']
		}
	}
];

// ============================================
// System Prompt for AI
// ============================================

// ============================================
// Workout-only System Prompt (for in-workout context)
// ============================================

export const WORKOUT_SYSTEM_PROMPT = `You are a workout logging assistant for IronAthena. The user is currently doing their workout and will give you voice commands to log sets, swap exercises, or control their session.

Current workout context will be provided with each request. Respond ONLY with a tool call - no conversational text.

Guidelines:
- For logging sets: Extract weight, reps, and RIR from natural speech
- Weight can be in lbs or kg (convert kg to lbs by multiplying by 2.2)
- RIR (Reps in Reserve) can be inferred from phrases:
  - "felt easy", "could do more" → RIR 3-4
  - "moderate", "good effort" → RIR 2
  - "hard", "tough" → RIR 1
  - "to failure", "couldn't do another" → RIR 0
- "Same weight" means use the weight from the previous set or context
- If the user's intent is unclear, use the "clarify" tool to ask a brief question

Common patterns:
- "185 for 8" → logSet with weight=185, reps=8
- "Same weight, got 7" → logSet with weight from context, reps=7
- "Skip this one, elbow hurts" → skipExercise with reason
- "Do cable flyes instead" → swapExercise with newExercise="cable flyes" (swaps current)
- "Swap incline press with flat bench" → swapExercise with targetExercise="incline press", newExercise="flat bench"
- "Replace lat pulldown with pull-ups" → swapExercise with targetExercise="lat pulldown", newExercise="pull-ups"
- "Add some curls" → addExercise with exercise="curls"
- "I'm done" → completeWorkout`;

// Alias for backward compatibility
export const SYSTEM_PROMPT = WORKOUT_SYSTEM_PROMPT;

// ============================================
// Global System Prompt (for non-workout context)
// ============================================

export const GLOBAL_SYSTEM_PROMPT = `You are IronAthena, a workout planning assistant. The user is NOT currently in a workout.

Available actions:
- Answer questions about their training schedule, volume, and personal records
- Help reschedule or swap workout days
- Modify their training block (add/remove sets, change exercises)

Respond ONLY with a tool call - no conversational text.

Common patterns:
- "What's my workout today?" → getTodaysWorkout
- "How much did I bench last week?" → getPersonalRecords with exerciseName
- "Show me my stats" → getStats
- "What's my volume for chest?" → getWeeklyVolume with muscleGroup="chest"
- "Swap today with tomorrow" → swapWorkoutDays with dayA (current) and dayB (next)
- "Skip today" → skipDay
- "Add a set to bench press" → addSetsToExercise
- "Change squats to 6-8 reps" → changeRepRange

If the user's intent is unclear, use the "clarify" tool to ask a brief question.`;

// ============================================
// Combined System Prompt (for mixed context)
// ============================================

export const UNIFIED_SYSTEM_PROMPT = `You are IronAthena, a workout assistant. You can help with:
- Logging sets during workouts
- Managing the workout schedule
- Modifying training blocks
- Answering questions about progress

Respond ONLY with a tool call - no conversational text.

The context will indicate whether the user is in an active workout or not.`;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate tool call parameters against schema
 */
export function validateToolCall(
	toolName: ToolName,
	params: unknown
): { valid: true; params: unknown } | { valid: false; error: string } {
	const schema = toolSchemas[toolName];
	if (!schema) {
		return { valid: false, error: `Unknown tool: ${toolName}` };
	}

	const result = schema.safeParse(params);
	if (result.success) {
		return { valid: true, params: result.data };
	}

	return {
		valid: false,
		error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
	};
}

/**
 * Convert OpenAI function call response to our ToolCall format
 */
export function parseOpenAIFunctionCall(functionCall: {
	name: string;
	arguments: string;
}): { toolName: ToolName; params: unknown } | null {
	try {
		const params = JSON.parse(functionCall.arguments);
		const toolName = functionCall.name as ToolName;

		if (!toolSchemas[toolName]) {
			console.warn(`Unknown tool name from OpenAI: ${functionCall.name}`);
			return null;
		}

		return { toolName, params };
	} catch (e) {
		console.error('Failed to parse OpenAI function call:', e);
		return null;
	}
}

// ============================================
// Combined OpenAI Tools
// ============================================

// All workout tools
export const workoutOpenAITools = openAITools;

// Combined tools from all categories
export const allOpenAITools: OpenAIFunctionDef[] = [
	...openAITools,
	...queryOpenAITools,
	...scheduleOpenAITools,
	...blockOpenAITools
];

// ============================================
// Context-Aware Tool Selection
// ============================================

/**
 * Get OpenAI tools available for a given context
 */
export function getToolsForContext(context: UnifiedContext): OpenAIFunctionDef[] {
	const tools: OpenAIFunctionDef[] = [];

	// Query tools are always available
	tools.push(...queryOpenAITools);

	// If user has a training block, schedule and block tools are available
	if (context.trainingBlock) {
		tools.push(...scheduleOpenAITools);
		tools.push(...blockOpenAITools);
	}

	// If in active workout, workout tools are available
	if (context.type === 'workout' && context.activeWorkout) {
		tools.push(...openAITools);
	}

	return tools;
}

/**
 * Get appropriate system prompt for context
 */
export function getSystemPromptForContext(context: UnifiedContext): string {
	if (context.type === 'workout' && context.activeWorkout) {
		return WORKOUT_SYSTEM_PROMPT;
	}
	return GLOBAL_SYSTEM_PROMPT;
}

// Re-export sub-module tools
export { queryOpenAITools, queryToolSchemas } from './queryTools';
export { scheduleOpenAITools, scheduleToolSchemas } from './scheduleTools';
export { blockOpenAITools, blockToolSchemas } from './blockTools';
