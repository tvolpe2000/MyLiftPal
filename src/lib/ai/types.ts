/**
 * AI Provider Types for IronAthena Voice Assistant
 *
 * Provider-agnostic interfaces that allow switching between
 * Claude, OpenAI, Gemini, or self-hosted models.
 *
 * Supports both in-workout commands and global commands
 * (schedule management, block modifications, queries).
 */

import type { TrainingBlockSummary, WorkoutDaySummary, UserStats } from '$lib/stores/trainingBlockStore.svelte';

// ============================================================================
// TOOL CATEGORIES
// ============================================================================

// Workout tools (only available during active workout)
export type WorkoutToolName =
	| 'logSet'
	| 'logMultipleSets'
	| 'skipExercise'
	| 'swapExercise'
	| 'completeWorkout'
	| 'addExercise'
	| 'undoLast'
	| 'clarify';

// Schedule tools (available when user has training block)
export type ScheduleToolName =
	| 'swapWorkoutDays'
	| 'skipDay'
	| 'rescheduleDay';

// Block modification tools (available when user has training block)
export type BlockToolName =
	| 'addSetsToExercise'
	| 'removeSetsFromExercise'
	| 'changeRepRange'
	| 'modifyBlockExercise';

// Query tools (always available when authenticated)
export type QueryToolName =
	| 'getTodaysWorkout'
	| 'getWeeklyVolume'
	| 'getPersonalRecords'
	| 'getStats'
	| 'getBlockProgress';

// All tool names
export type ToolName =
	| WorkoutToolName
	| ScheduleToolName
	| BlockToolName
	| QueryToolName;

// Provider identifiers
export type ProviderId = 'claude' | 'openai' | 'gemini' | 'local';

// Completed set data for context
export interface CompletedSet {
	exercise: string;
	set: number;
	weight: number;
	reps: number;
	rir?: number;
}

// Previous session data for an exercise
export interface PreviousSessionData {
	weight: number;
	reps: number;
	rir?: number;
}

// Current exercise context sent to AI
export interface CurrentExerciseContext {
	name: string;
	setNumber: number;
	totalSets: number;
	targetWeight: number;
	targetReps: number;
	previousSession?: PreviousSessionData;
}

// Last action for undo context
export interface LastAction {
	type: ToolName;
	data: Record<string, unknown>;
	timestamp: string;
}

// Full workout context sent with each AI request
export interface WorkoutContext {
	currentExercise: CurrentExerciseContext;
	completedToday: CompletedSet[];
	remainingExercises: string[];
	lastAction?: LastAction;
}

// Tool call returned by AI provider
export interface ToolCall {
	tool: ToolName;
	parameters: Record<string, unknown>;
	confidence?: number;
}

// Tool-specific parameter types
export interface LogSetParams {
	weight: number;
	reps: number;
	rir?: number;
}

export interface SkipExerciseParams {
	reason?: string;
}

export interface SwapExerciseParams {
	newExercise: string;
	reason?: string;
}

export interface CompleteWorkoutParams {
	notes?: string;
}

export interface AddExerciseParams {
	exercise: string;
	sets?: number;
}

export interface UndoLastParams {
	correction?: string;
}

export interface ClarifyParams {
	question: string;
}

// ============================================================================
// SCHEDULE TOOL PARAMETERS
// ============================================================================

export interface SwapWorkoutDaysParams {
	dayA: number;
	dayB: number;
}

export interface SkipDayParams {
	reason?: string;
}

export interface RescheduleDayParams {
	targetDayNumber: number;
	reason?: string;
}

// ============================================================================
// BLOCK TOOL PARAMETERS
// ============================================================================

export interface AddSetsToExerciseParams {
	exerciseName: string;
	additionalSets: number;
	dayNumber?: number; // If omitted, applies to all days with this exercise
}

export interface RemoveSetsFromExerciseParams {
	exerciseName: string;
	setsToRemove: number;
	dayNumber?: number;
}

export interface ChangeRepRangeParams {
	exerciseName: string;
	minReps: number;
	maxReps: number;
	dayNumber?: number;
}

export interface ModifyBlockExerciseParams {
	exerciseName: string;
	newExerciseName: string;
	dayNumber?: number;
	permanent: boolean;
}

// ============================================================================
// QUERY TOOL PARAMETERS
// ============================================================================

export interface GetTodaysWorkoutParams {
	// No parameters needed
}

export interface GetWeeklyVolumeParams {
	muscleGroup?: string;
}

export interface GetPersonalRecordsParams {
	exerciseName?: string;
	limit?: number;
}

export interface GetStatsParams {
	timeframe: 'week' | 'month' | 'all';
}

export interface GetBlockProgressParams {
	// No parameters needed
}

// ============================================================================
// UNIFIED CONTEXT (Global AI Assistant)
// ============================================================================

// Context type for routing
export type ContextType = 'workout' | 'global';

// Unified context for global AI assistant
export interface UnifiedContext {
	type: ContextType;
	activeWorkout: WorkoutContext | null;
	trainingBlock: TrainingBlockSummary | null;
	todayWorkout: WorkoutDaySummary | null;
	userStats: UserStats | null;
}

// Re-export for convenience
export type { TrainingBlockSummary, WorkoutDaySummary, UserStats };

// ============================================================================
// AI PROVIDER INTERFACE
// ============================================================================

// AI Provider interface - all providers must implement this
export interface AIProvider {
	name: ProviderId;
	parseWorkoutCommand(transcript: string, context: WorkoutContext): Promise<ToolCall>;
	parseGlobalCommand(transcript: string, context: UnifiedContext): Promise<ToolCall>;
	isAvailable(): Promise<boolean>;
}

// Configuration for AI provider
export interface AIConfig {
	provider: ProviderId;
	apiKey?: string;
	modelId?: string;
	baseUrl?: string; // For self-hosted models
}

// Response from tool execution
export interface ToolExecutionResult {
	success: boolean;
	message: string;
	data?: Record<string, unknown>;
	canUndo?: boolean;
}

// Speech recognition result
export interface SpeechResult {
	transcript: string;
	confidence: number;
	isFinal: boolean;
}

// AI request for server-side processing (workout-specific)
export interface AIParseRequest {
	transcript: string;
	context: WorkoutContext;
	provider?: ProviderId;
}

// AI request for global commands
export interface AIGlobalParseRequest {
	transcript: string;
	context: UnifiedContext;
	provider?: ProviderId;
}

// AI response from server
export interface AIParseResponse {
	success: boolean;
	toolCall?: ToolCall;
	error?: string;
}

// ============================================================================
// QUERY RESULTS
// ============================================================================

export interface TodaysWorkoutResult {
	dayName: string;
	dayNumber: number;
	exercises: string[];
	targetMuscles: string[];
	estimatedDuration?: number;
}

export interface WeeklyVolumeResult {
	muscleGroup: string;
	directSets: number;
	indirectSets: number;
	totalSets: number;
	status: 'below' | 'optimal' | 'high';
}

export interface PersonalRecordResult {
	exerciseName: string;
	weight: number;
	reps: number;
	date: string;
}

export interface StatsResult {
	timeframe: 'week' | 'month' | 'all';
	workoutsCompleted: number;
	totalSets: number;
	totalWeight: number;
	avgWorkoutsPerWeek?: number;
}

export interface BlockProgressResult {
	blockName: string;
	currentWeek: number;
	totalWeeks: number;
	percentComplete: number;
	workoutsCompleted: number;
	workoutsRemaining: number;
}

// Data logging for fine-tuning (future)
export interface AIInteractionLog {
	id: string;
	userId: string;
	timestamp: string;
	transcript: string;
	context: WorkoutContext;
	toolCall: ToolCall;
	wasCorrect: boolean;
	correction?: ToolCall;
	provider: ProviderId;
	latencyMs: number;
}
