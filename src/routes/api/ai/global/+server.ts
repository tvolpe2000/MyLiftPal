/**
 * Global AI API Endpoint for Voice Command Parsing
 *
 * Server-side endpoint that calls OpenAI's function calling API
 * to parse voice transcripts into tool calls.
 *
 * Supports both workout-specific and global commands.
 */

import { json, error } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';
import type { UnifiedContext, ToolCall, ToolName, AIInteractionLog } from '$lib/ai/types';
import {
	getToolsForContext,
	getSystemPromptForContext,
	validateToolCall,
	parseOpenAIFunctionCall
} from '$lib/ai/tools/definitions';
import { buildContextSummary } from '$lib/ai/context/index';
import { env } from '$env/dynamic/private';

// Model to use (GPT-4o-mini is cheapest with function calling)
const MODEL = 'gpt-4o-mini';

// Initialize OpenAI client lazily
function getOpenAIClient(): OpenAI {
	if (!env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY not configured');
	}
	return new OpenAI({
		apiKey: env.OPENAI_API_KEY
	});
}

/**
 * Build the user message with unified context
 */
function buildUserMessage(transcript: string, context: UnifiedContext): string {
	const parts: string[] = [];

	// Add context summary
	parts.push('=== CONTEXT ===');
	parts.push(buildContextSummary(context));

	// Add the transcript
	parts.push('');
	parts.push('=== USER COMMAND ===');
	parts.push(`"${transcript}"`);

	return parts.join('\n');
}

export const POST: RequestHandler = async ({ request }) => {
	const startTime = Date.now();

	try {
		// Get OpenAI client (throws if not configured)
		const openai = getOpenAIClient();
		const { transcript, context } = (await request.json()) as {
			transcript: string;
			context: UnifiedContext;
		};

		// Validate input
		if (!transcript || typeof transcript !== 'string') {
			throw error(400, 'Missing or invalid transcript');
		}

		if (!context || typeof context !== 'object') {
			throw error(400, 'Missing or invalid context');
		}

		// Get tools available for this context
		const availableTools = getToolsForContext(context);

		if (availableTools.length === 0) {
			return json({
				success: false,
				error: 'No tools available for current context'
			});
		}

		// Get appropriate system prompt
		const systemPrompt = getSystemPromptForContext(context);

		// Call OpenAI with function calling
		const response = await openai.chat.completions.create({
			model: MODEL,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: buildUserMessage(transcript, context) }
			],
			tools: availableTools.map((tool) => ({
				type: 'function' as const,
				function: tool
			})),
			tool_choice: 'required', // Force a tool call
			temperature: 0.1, // Low temperature for consistent parsing
			max_tokens: 200
		});

		const message = response.choices[0]?.message;
		const toolCalls = message?.tool_calls;

		if (!toolCalls || toolCalls.length === 0) {
			// Fallback to clarify if no tool called
			return json({
				success: true,
				toolCall: {
					tool: 'clarify' as ToolName,
					parameters: { question: "I didn't understand that. Could you try again?" }
				} as ToolCall
			});
		}

		// Parse the first tool call
		const functionCall = toolCalls[0].function;
		const parsed = parseOpenAIFunctionCall(functionCall);

		if (!parsed) {
			throw error(500, 'Failed to parse OpenAI response');
		}

		// Validate parameters
		const validation = validateToolCall(parsed.toolName, parsed.params);
		if (!validation.valid) {
			console.error('Tool validation failed:', validation.error);
			return json({
				success: true,
				toolCall: {
					tool: 'clarify' as ToolName,
					parameters: { question: "I didn't catch that clearly. Could you say it again?" }
				} as ToolCall
			});
		}

		const toolCall: ToolCall = {
			tool: parsed.toolName,
			parameters: validation.params as Record<string, unknown>,
			confidence: 1.0
		};

		// Log for debugging/fine-tuning
		const latencyMs = Date.now() - startTime;
		const log: Partial<AIInteractionLog> = {
			timestamp: new Date().toISOString(),
			transcript,
			toolCall,
			wasCorrect: true,
			provider: 'openai',
			latencyMs
		};
		console.log('AI Global Parse Log:', JSON.stringify(log));

		return json({
			success: true,
			toolCall
		});
	} catch (err) {
		console.error('OpenAI API error:', err);

		// Handle OpenAI-specific errors with better messages
		if (err && typeof err === 'object' && 'status' in err) {
			const status = (err as { status: number }).status;
			const message = (err as { message?: string }).message || 'Unknown error';

			// Provide user-friendly error messages
			if (status === 429) {
				console.error('OpenAI 429 Error - Rate limit or quota exceeded');
				return json({
					success: false,
					error: 'OpenAI rate limit exceeded. Please wait a moment and try again, or check your OpenAI account billing.',
					message: 'Rate limit exceeded. Please try again in a few seconds.'
				}, { status: 429 });
			}

			if (status === 401) {
				return json({
					success: false,
					error: 'Invalid OpenAI API key. Please check your configuration.',
					message: 'API key invalid'
				}, { status: 401 });
			}

			return json({ success: false, error: message, message }, { status });
		}

		throw error(500, 'Failed to process voice command');
	}
};
