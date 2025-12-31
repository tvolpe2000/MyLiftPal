/**
 * OpenAI API Endpoint for Global Voice Command Parsing
 *
 * Server-side endpoint that calls OpenAI's function calling API
 * to parse voice transcripts into tool calls for non-workout contexts.
 */

import { json, error } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';
import type { UnifiedContext, ToolCall, ToolName } from '$lib/ai/types';
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
	const contextSummary = buildContextSummary(context);

	return `
${contextSummary}

User said: "${transcript}"
`.trim();
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

		if (!context) {
			throw error(400, 'Missing context');
		}

		// Get available tools and system prompt for this context
		const tools = getToolsForContext(context);
		const systemPrompt = getSystemPromptForContext(context);

		// Call OpenAI with function calling
		const response = await openai.chat.completions.create({
			model: MODEL,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: buildUserMessage(transcript, context) }
			],
			tools: tools.map((tool) => ({
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
					parameters: { question: "I didn't understand that. Could you repeat?" }
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

		// Log for debugging
		const latencyMs = Date.now() - startTime;
		console.log('AI Global Parse:', {
			timestamp: new Date().toISOString(),
			transcript,
			contextType: context.type,
			toolCall,
			latencyMs
		});

		return json({
			success: true,
			toolCall
		});
	} catch (err) {
		console.error('OpenAI API error:', err);

		if (err instanceof Error && 'status' in err) {
			throw error((err as { status: number }).status, err.message);
		}

		throw error(500, 'Failed to process voice command');
	}
};
