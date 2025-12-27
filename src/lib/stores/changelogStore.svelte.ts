import { supabase } from '$lib/db/supabase';
import { auth } from './auth.svelte';
import type { AppRelease, RoadmapItem, ChangelogState } from '$lib/types';

function createChangelogStore() {
	let state = $state<ChangelogState>({
		releases: [],
		roadmap: [],
		currentVersion: null,
		lastSeenVersion: null,
		hasNewUpdates: false,
		loading: false,
		initialized: false
	});

	// Compare versions (simple semver comparison)
	function isNewerVersion(current: string, lastSeen: string | null): boolean {
		if (!lastSeen) return true;

		const currentParts = current.split('.').map(Number);
		const lastSeenParts = lastSeen.split('.').map(Number);

		for (let i = 0; i < 3; i++) {
			const curr = currentParts[i] || 0;
			const last = lastSeenParts[i] || 0;
			if (curr > last) return true;
			if (curr < last) return false;
		}
		return false;
	}

	async function initialize() {
		if (state.initialized) return;

		state.loading = true;

		try {
			// Fetch latest release to get current version
			// Note: Using type assertion since app_releases table is added via migration
			const { data: latestRelease } = await supabase
				.from('app_releases' as 'profiles')
				.select('version')
				.eq('is_published', true)
				.order('released_at', { ascending: false })
				.limit(1)
				.single() as { data: { version: string } | null };

			if (latestRelease) {
				state.currentVersion = latestRelease.version;
			}

			// Get user's last seen version from profile
			if (auth.profile) {
				state.lastSeenVersion = (auth.profile as { last_seen_version?: string }).last_seen_version ?? null;
			}

			// Determine if there are new updates
			if (state.currentVersion) {
				state.hasNewUpdates = isNewerVersion(state.currentVersion, state.lastSeenVersion);
			}
		} catch (error) {
			console.error('Error initializing changelog:', error);
		} finally {
			state.loading = false;
			state.initialized = true;
		}
	}

	async function fetchReleases() {
		// Note: Using type assertion since app_releases table is added via migration
		const { data, error } = await supabase
			.from('app_releases' as 'profiles')
			.select('*')
			.eq('is_published', true)
			.order('released_at', { ascending: false }) as { data: AppRelease[] | null; error: unknown };

		if (error) {
			console.error('Error fetching releases:', error);
			return;
		}

		state.releases = data ?? [];
	}

	async function fetchRoadmap() {
		// Note: Using type assertion since app_roadmap table is added via migration
		const { data, error } = await supabase
			.from('app_roadmap' as 'profiles')
			.select('*')
			.eq('is_visible', true)
			.order('sort_order', { ascending: true }) as { data: RoadmapItem[] | null; error: unknown };

		if (error) {
			console.error('Error fetching roadmap:', error);
			return;
		}

		state.roadmap = data ?? [];
	}

	async function markAsSeen() {
		if (!state.currentVersion || !auth.user) return;

		// Update profile with current version
		// Note: last_seen_version column is added via migration
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { error } = await (supabase as any)
			.from('profiles')
			.update({ last_seen_version: state.currentVersion })
			.eq('id', auth.user.id);

		if (error) {
			console.error('Error updating last seen version:', error);
			return;
		}

		state.lastSeenVersion = state.currentVersion;
		state.hasNewUpdates = false;
	}

	async function loadAll() {
		state.loading = true;
		await Promise.all([fetchReleases(), fetchRoadmap()]);
		await markAsSeen();
		state.loading = false;
	}

	return {
		get releases() { return state.releases; },
		get roadmap() { return state.roadmap; },
		get currentVersion() { return state.currentVersion; },
		get lastSeenVersion() { return state.lastSeenVersion; },
		get hasNewUpdates() { return state.hasNewUpdates; },
		get loading() { return state.loading; },
		get initialized() { return state.initialized; },

		initialize,
		fetchReleases,
		fetchRoadmap,
		markAsSeen,
		loadAll
	};
}

export const changelog = createChangelogStore();
