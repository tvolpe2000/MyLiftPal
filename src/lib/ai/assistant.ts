/**
 * Voice Assistant for IronAthena
 *
 * Main entry point for the AI voice logging feature.
 * Ties together speech recognition, AI parsing, and tool execution.
 */

import { aiManager } from './providerManager';
import { OpenAIProvider } from './providers/openai';
import { buildWorkoutContext } from './context';
import { executeToolCall } from './tools/executor';
import type { ToolCall } from './types';

// Register the OpenAI provider
aiManager.register(new OpenAIProvider());
aiManager.setActive('openai');

export interface VoiceCommandResult {
	toolCall: ToolCall;
	message: string;
	success: boolean;
}

/**
 * Process a voice transcript and execute the resulting command
 */
export async function processVoiceCommand(transcript: string): Promise<VoiceCommandResult | null> {
	// Build workout context
	const context = buildWorkoutContext();
	if (!context) {
		return {
			toolCall: { tool: 'clarify', parameters: { question: 'No active workout to log to.' } },
			message: 'No active workout to log to.',
			success: false
		};
	}

	try {
		// Parse transcript with AI
		const toolCall = await aiManager.parse(transcript, context);

		// Execute the tool call
		const result = await executeToolCall(toolCall);

		return {
			toolCall,
			message: result.message,
			success: result.success
		};
	} catch (error) {
		console.error('Voice command processing error:', error);
		return {
			toolCall: { tool: 'clarify', parameters: { question: 'Something went wrong. Try again.' } },
			message: error instanceof Error ? error.message : 'Failed to process command',
			success: false
		};
	}
}

/**
 * Check if voice assistant is available
 */
export async function isVoiceAssistantAvailable(): Promise<boolean> {
	try {
		return await aiManager.isProviderAvailable(aiManager.getActiveProviderId());
	} catch {
		return false;
	}
}

/**
 * Get the current AI provider
 */
export function getActiveProvider(): string {
	return aiManager.getActiveProviderId();
}

// Re-export for convenience
export { aiManager } from './providerManager';
export { buildWorkoutContext } from './context';
export { executeToolCall } from './tools/executor';
