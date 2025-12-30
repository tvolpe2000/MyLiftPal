/**
 * Global AI Voice Assistant for IronAthena
 *
 * Main entry point for processing voice commands globally (not just in-workout).
 * Supports workout logging, schedule management, block modifications, and queries.
 */

import type { ToolCall, ToolExecutionResult, UnifiedContext, ToolName } from './types';
import { buildUnifiedContext, getToolCategory, WORKOUT_TOOLS, SCHEDULE_TOOLS, BLOCK_TOOLS, QUERY_TOOLS } from './context/index';
import { validateToolCall } from './tools/definitions';

// Workout executors
import { executeToolCall as executeWorkoutTool } from './tools/executor';

// Query executors
import {
	executeGetTodaysWorkout,
	executeGetWeeklyVolume,
	executeGetPersonalRecords,
	executeGetStats,
	executeGetBlockProgress
} from './tools/queryExecutor';

// Schedule executors
import {
	executeSwapWorkoutDays,
	executeSkipDay,
	executeRescheduleDay
} from './tools/scheduleExecutor';

// Block executors
import {
	executeAddSetsToExercise,
	executeRemoveSetsFromExercise,
	executeChangeRepRange,
	executeModifyBlockExercise
} from './tools/blockExecutor';

// ============================================
// Types
// ============================================

export interface GlobalCommandResult {
	success: boolean;
	toolCall: ToolCall;
	message: string;
	data?: Record<string, unknown>;
	canUndo?: boolean;
}

// ============================================
// Tool Execution Router
// ============================================

/**
 * Execute a tool call based on its category
 */
async function executeGlobalToolCall(
	toolCall: ToolCall,
	context: UnifiedContext
): Promise<ToolExecutionResult> {
	const { tool, parameters } = toolCall;
	const category = getToolCategory(tool);

	// Validate parameters
	const validation = validateToolCall(tool, parameters);
	if (!validation.valid) {
		return {
			success: false,
			message: `Invalid parameters: ${validation.error}`
		};
	}

	const validatedParams = validation.params;

	// Route to appropriate executor based on category
	switch (category) {
		case 'workout':
			// Workout tools require active workout context
			if (!context.activeWorkout) {
				return {
					success: false,
					message: "You're not in an active workout. Start a workout first."
				};
			}
			return executeWorkoutTool(toolCall);

		case 'query':
			return executeQueryTool(tool, validatedParams);

		case 'schedule':
			if (!context.trainingBlock) {
				return {
					success: false,
					message: "You don't have an active training block."
				};
			}
			return executeScheduleTool(tool, validatedParams);

		case 'block':
			if (!context.trainingBlock) {
				return {
					success: false,
					message: "You don't have an active training block."
				};
			}
			return executeBlockTool(tool, validatedParams);

		default:
			return {
				success: false,
				message: `Unknown tool: ${tool}`
			};
	}
}

/**
 * Execute a query tool
 */
async function executeQueryTool(
	tool: ToolName,
	params: unknown
): Promise<ToolExecutionResult> {
	switch (tool) {
		case 'getTodaysWorkout':
			return executeGetTodaysWorkout(params as Record<string, unknown>);
		case 'getWeeklyVolume':
			return executeGetWeeklyVolume(params as { muscleGroup?: string });
		case 'getPersonalRecords':
			return executeGetPersonalRecords(params as { exerciseName?: string; limit?: number });
		case 'getStats':
			return executeGetStats(params as { timeframe: 'week' | 'month' | 'all' });
		case 'getBlockProgress':
			return executeGetBlockProgress(params as Record<string, unknown>);
		default:
			return { success: false, message: `Unknown query tool: ${tool}` };
	}
}

/**
 * Execute a schedule tool
 */
async function executeScheduleTool(
	tool: ToolName,
	params: unknown
): Promise<ToolExecutionResult> {
	switch (tool) {
		case 'swapWorkoutDays':
			return executeSwapWorkoutDays(params as { dayA: number; dayB: number });
		case 'skipDay':
			return executeSkipDay(params as { reason?: string });
		case 'rescheduleDay':
			return executeRescheduleDay(params as { targetDayNumber: number; reason?: string });
		default:
			return { success: false, message: `Unknown schedule tool: ${tool}` };
	}
}

/**
 * Execute a block modification tool
 */
async function executeBlockTool(
	tool: ToolName,
	params: unknown
): Promise<ToolExecutionResult> {
	switch (tool) {
		case 'addSetsToExercise':
			return executeAddSetsToExercise(
				params as { exerciseName: string; additionalSets: number; dayNumber?: number }
			);
		case 'removeSetsFromExercise':
			return executeRemoveSetsFromExercise(
				params as { exerciseName: string; setsToRemove: number; dayNumber?: number }
			);
		case 'changeRepRange':
			return executeChangeRepRange(
				params as { exerciseName: string; minReps: number; maxReps: number; dayNumber?: number }
			);
		case 'modifyBlockExercise':
			return executeModifyBlockExercise(
				params as { exerciseName: string; newExerciseName: string; dayNumber?: number; permanent: boolean }
			);
		default:
			return { success: false, message: `Unknown block tool: ${tool}` };
	}
}

// ============================================
// Main Entry Point
// ============================================

/**
 * Process a global voice command
 *
 * This is the main entry point for the global AI assistant.
 * It builds context, sends to the AI provider, and executes the returned tool.
 */
export async function processGlobalCommand(transcript: string): Promise<GlobalCommandResult | null> {
	if (!transcript.trim()) {
		return null;
	}

	try {
		// Build unified context
		const context = await buildUnifiedContext();

		// Call the AI provider (via server endpoint)
		const response = await fetch('/api/ai/global', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ transcript, context })
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('AI request failed:', error);
			return {
				success: false,
				toolCall: { tool: 'clarify', parameters: {} },
				message: error.error || 'Failed to process command'
			};
		}

		const { toolCall } = await response.json();

		if (!toolCall) {
			return {
				success: false,
				toolCall: { tool: 'clarify', parameters: {} },
				message: "I didn't understand that. Could you try rephrasing?"
			};
		}

		// Execute the tool
		const result = await executeGlobalToolCall(toolCall, context);

		return {
			success: result.success,
			toolCall,
			message: result.message,
			data: result.data,
			canUndo: result.canUndo
		};
	} catch (error) {
		console.error('Error processing global command:', error);
		return {
			success: false,
			toolCall: { tool: 'clarify', parameters: {} },
			message: 'Something went wrong. Please try again.'
		};
	}
}

/**
 * Check if the global voice assistant is available
 */
export async function isGlobalAssistantAvailable(): Promise<boolean> {
	try {
		const response = await fetch('/api/ai/openai/status');
		if (!response.ok) return false;

		const { available } = await response.json();
		return available;
	} catch {
		return false;
	}
}

/**
 * Get available tool names for the current context
 */
export async function getAvailableToolsForCurrentContext(): Promise<ToolName[]> {
	const context = await buildUnifiedContext();
	const tools: ToolName[] = [];

	// Query tools are always available
	tools.push(...QUERY_TOOLS);

	// Schedule and block tools if has training block
	if (context.trainingBlock) {
		tools.push(...SCHEDULE_TOOLS);
		tools.push(...BLOCK_TOOLS);
	}

	// Workout tools if in active workout
	if (context.type === 'workout' && context.activeWorkout) {
		tools.push(...WORKOUT_TOOLS);
	}

	return tools;
}
