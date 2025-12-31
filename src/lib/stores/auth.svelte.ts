import { supabase } from '$lib/db/supabase';
import { browser } from '$app/environment';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '$lib/types';

const PROFILE_CACHE_KEY = 'myliftpal_cached_profile';
const AUTH_INIT_TIMEOUT_MS = 5000; // 5 second timeout for auth initialization

interface AuthState {
	user: User | null;
	session: Session | null;
	profile: Profile | null;
	loading: boolean;
	initialized: boolean;
	hasCachedSession: boolean; // True if we have cached data (can show UI immediately)
}

/**
 * Check if Supabase has a cached session in localStorage
 */
function hasSupabaseSession(): boolean {
	if (!browser) return false;
	try {
		// Supabase stores session with key pattern: sb-<ref>-auth-token
		const keys = Object.keys(localStorage);
		return keys.some(key => key.includes('supabase') && key.includes('auth'));
	} catch {
		return false;
	}
}

function createAuthStore() {
	// Check for cached data immediately (synchronous, before any async)
	const cachedProfile = browser ? (() => {
		try {
			const cached = localStorage.getItem(PROFILE_CACHE_KEY);
			return cached ? JSON.parse(cached) as Profile : null;
		} catch { return null; }
	})() : null;

	const hasCached = !!(cachedProfile || hasSupabaseSession());

	let state = $state<AuthState>({
		user: null,
		session: null,
		profile: cachedProfile, // Load cached profile immediately
		loading: true,
		initialized: false,
		hasCachedSession: hasCached
	});

	/**
	 * Load cached profile from localStorage (for offline support)
	 */
	function loadCachedProfile(): Profile | null {
		if (!browser) return null;
		try {
			const cached = localStorage.getItem(PROFILE_CACHE_KEY);
			if (cached) {
				return JSON.parse(cached) as Profile;
			}
		} catch (error) {
			console.error('Error loading cached profile:', error);
		}
		return null;
	}

	/**
	 * Save profile to localStorage (for offline support)
	 */
	function cacheProfile(profile: Profile | null) {
		if (!browser) return;
		try {
			if (profile) {
				localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
			} else {
				localStorage.removeItem(PROFILE_CACHE_KEY);
			}
		} catch (error) {
			console.error('Error caching profile:', error);
		}
	}

	async function initialize() {
		// Profile already loaded from cache at store creation time
		if (state.profile) {
			console.log('[MyLiftPal Auth] Using cached profile for instant display');
		}

		// Set up a timeout to ensure we don't hang forever on spotty connections
		const timeoutId = setTimeout(() => {
			if (!state.initialized) {
				console.log('[MyLiftPal Auth] Auth initialization timed out - using cached state');
				state.loading = false;
				state.initialized = true;
			}
		}, AUTH_INIT_TIMEOUT_MS);

		try {
			const { data: { session } } = await supabase.auth.getSession();

			if (session?.user) {
				state.user = session.user;
				state.session = session;
				await fetchProfile(session.user.id);
			} else if (!navigator.onLine && state.hasCachedSession) {
				// Offline and have cached data - user stays "logged in" with cached profile
				console.log('[MyLiftPal Auth] Offline with cached session - using cached auth state');
			}
		} catch (error) {
			console.error('Auth initialization error:', error);
			// Keep using cached profile as fallback
			if (state.hasCachedSession) {
				console.log('[MyLiftPal Auth] Using cached state after initialization error');
			}
		} finally {
			clearTimeout(timeoutId);
			state.loading = false;
			state.initialized = true;
		}

		// Listen for auth changes
		supabase.auth.onAuthStateChange(async (event, session) => {
			console.log('[MyLiftPal Auth] Auth state changed:', event, session ? 'has session' : 'no session');

			try {
				// Handle token refresh - don't clear state if refresh fails
				if (event === 'TOKEN_REFRESHED') {
					console.log('[MyLiftPal Auth] Token refreshed successfully');
					if (session) {
						state.session = session;
						state.user = session.user;
					}
					// Don't refetch profile on token refresh - it's expensive and unnecessary
					return;
				}

				// Handle sign out
				if (event === 'SIGNED_OUT') {
					console.log('[MyLiftPal Auth] User signed out');
					state.session = null;
					state.user = null;
					state.profile = null;
					cacheProfile(null);
					return;
				}

				// Handle sign in or initial session
				state.session = session;
				state.user = session?.user ?? null;

				if (session?.user) {
					await fetchProfile(session.user.id);
				} else {
					state.profile = null;
				}
			} catch (error) {
				console.error('[MyLiftPal Auth] Error in auth state change handler:', error);
				// Don't clear state on error - keep user logged in
			}
		});
	}

	async function fetchProfile(userId: string) {
		try {
			const { data, error } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', userId)
				.single();

			if (error) {
				console.error('Error fetching profile:', error);
				// Keep using cached profile if available
				return;
			}

			if (data) {
				state.profile = data;
				// Cache for offline access
				cacheProfile(data);
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
			// Keep using cached profile if available
		}
	}

	async function signUp(email: string, password: string, displayName?: string) {
		state.loading = true;

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					display_name: displayName
				},
				emailRedirectTo: `${window.location.origin}/auth/login`
			}
		});

		state.loading = false;

		if (error) throw error;
		return data;
	}

	async function signIn(email: string, password: string) {
		state.loading = true;

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		state.loading = false;

		if (error) throw error;
		return data;
	}

	async function signOut() {
		state.loading = true;

		const { error } = await supabase.auth.signOut();

		state.loading = false;
		state.user = null;
		state.session = null;
		state.profile = null;
		// Clear cached profile on sign out
		cacheProfile(null);

		if (error) throw error;
	}

	async function resetPassword(email: string) {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/reset-password`
		});

		if (error) throw error;
	}

	async function updatePassword(newPassword: string) {
		const { error } = await supabase.auth.updateUser({
			password: newPassword
		});

		if (error) throw error;
	}

	return {
		get user() { return state.user; },
		get session() { return state.session; },
		get profile() { return state.profile; },
		get loading() { return state.loading; },
		get initialized() { return state.initialized; },
		// Consider authenticated if we have a user OR if we have cached session (for offline)
		get isAuthenticated() { return !!state.user || (state.hasCachedSession && !!state.profile); },
		// True if we have cached data and can show UI immediately (even before network confirms auth)
		get hasCachedSession() { return state.hasCachedSession; },
		initialize,
		signUp,
		signIn,
		signOut,
		resetPassword,
		updatePassword,
		fetchProfile
	};
}

export const auth = createAuthStore();
