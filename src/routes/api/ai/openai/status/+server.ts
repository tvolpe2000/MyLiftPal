/**
 * OpenAI Status Endpoint
 *
 * Checks if the OpenAI API is configured and available.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	const available = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 0);

	return json({
		available,
		provider: 'openai',
		model: 'gpt-4o-mini'
	});
};
