import { supabase } from '$lib/db/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '$lib/types';

interface AuthState {
	user: User | null;
	session: Session | null;
	profile: Profile | null;
	loading: boolean;
	initialized: boolean;
}

function createAuthStore() {
	let state = $state<AuthState>({
		user: null,
		session: null,
		profile: null,
		loading: true,
		initialized: false
	});

	async function initialize() {
		try {
			const { data: { session } } = await supabase.auth.getSession();

			if (session?.user) {
				state.user = session.user;
				state.session = session;
				await fetchProfile(session.user.id);
			}
		} catch (error) {
			console.error('Auth initialization error:', error);
		} finally {
			state.loading = false;
			state.initialized = true;
		}

		// Listen for auth changes
		supabase.auth.onAuthStateChange(async (event, session) => {
			state.session = session;
			state.user = session?.user ?? null;

			if (session?.user) {
				await fetchProfile(session.user.id);
			} else {
				state.profile = null;
			}
		});
	}

	async function fetchProfile(userId: string) {
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', userId)
			.single();

		if (error) {
			console.error('Error fetching profile:', error);
			return;
		}

		state.profile = data;
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
		get isAuthenticated() { return !!state.user; },
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
