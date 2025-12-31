/**
 * OpenAI Provider for IronAthena Voice Logging
 *
 * Client-side adapter that calls the server-side OpenAI endpoint.
 */

import type { AIProvider, ToolCall, WorkoutContext, UnifiedContext } from '../types';

export class OpenAIProvider implements AIProvider {
	name = 'openai' as const;

	async parseWorkoutCommand(transcript: string, context: WorkoutContext): Promise<ToolCall> {
		const response = await fetch('/api/ai/openai', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ transcript, context })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `OpenAI API error: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to parse command');
		}

		return data.toolCall;
	}

	async parseGlobalCommand(transcript: string, context: UnifiedContext): Promise<ToolCall> {
		const response = await fetch('/api/ai/openai/global', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ transcript, context })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `OpenAI API error: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to parse command');
		}

		return data.toolCall;
	}

	async isAvailable(): Promise<boolean> {
		try {
			const response = await fetch('/api/ai/openai/status');
			const data = await response.json();
			return data.available === true;
		} catch {
			return false;
		}
	}
}
