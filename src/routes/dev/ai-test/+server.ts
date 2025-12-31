/**
 * Dev-only API endpoint for AI Test Tool
 * Uses service role to bypass RLS for user impersonation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Get Supabase URL from VITE env var (available on server too)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Create service role client (bypasses RLS)
function getServiceClient() {
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey || !SUPABASE_URL) {
		return null;
	}
	return createClient(SUPABASE_URL, serviceRoleKey, {
		auth: { persistSession: false }
	});
}

export const GET: RequestHandler = async ({ url }) => {
	// Block in production
	if (!dev) {
		throw error(403, 'This endpoint is only available in development');
	}

	const action = url.searchParams.get('action');

	const supabase = getServiceClient();
	if (!supabase) {
		throw error(500, 'Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env');
	}

	try {
		if (action === 'users') {
			// Get all users from auth.users (service role can access this)
			const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();

			if (authErr) throw authErr;

			// Get profiles to merge display_name
			const { data: profiles, error: profileErr } = await supabase
				.from('profiles')
				.select('id, display_name');

			if (profileErr) throw profileErr;

			// Create a map of profiles by id
			const profileMap = new Map((profiles || []).map(p => [p.id, p]));

			// Merge auth users with profile data
			const users = (authUsers?.users || []).map(user => ({
				id: user.id,
				email: user.email || 'No email',
				display_name: profileMap.get(user.id)?.display_name || null
			})).sort((a, b) => a.email.localeCompare(b.email));

			return json({ users });
		}

		if (action === 'blocks') {
			const userId = url.searchParams.get('userId');
			if (!userId) {
				throw error(400, 'userId parameter required');
			}

			// Get all blocks for a specific user
			const { data, error: err } = await supabase
				.from('training_blocks')
				.select(`
					id,
					name,
					status,
					current_week,
					total_weeks,
					user_id,
					workout_days (
						id,
						name,
						day_number
					)
				`)
				.eq('user_id', userId)
				.order('created_at', { ascending: false });

			if (err) throw err;
			return json({ blocks: data || [] });
		}

		throw error(400, 'Invalid action. Use ?action=users or ?action=blocks&userId=xxx');
	} catch (err) {
		console.error('Dev API error:', err);
		throw error(500, err instanceof Error ? err.message : 'Unknown error');
	}
};
