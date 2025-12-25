<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			await auth.resetPassword(email);
			success = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="bg-[#0f1a16] rounded-xl p-6 shadow-lg">
	{#if success}
		<div class="text-center">
			<div class="text-[#10b981] text-5xl mb-4">✉</div>
			<h2 class="text-xl font-semibold text-white mb-2">Check your email</h2>
			<p class="text-[#a1a1aa] mb-6">
				We've sent a password reset link to <span class="text-white">{email}</span>
			</p>
			<a
				href="/auth/login"
				class="text-[#10b981] hover:text-[#34d399] transition-colors"
			>
				Back to sign in
			</a>
		</div>
	{:else}
		<h2 class="text-xl font-semibold text-white mb-2">Reset your password</h2>
		<p class="text-[#a1a1aa] mb-6">
			Enter your email and we'll send you a link to reset your password.
		</p>

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if error}
				<div class="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
					{error}
				</div>
			{/if}

			<div>
				<label for="email" class="block text-sm font-medium text-[#a1a1aa] mb-2">
					Email
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					placeholder="you@example.com"
					class="w-full bg-[#162420] border border-[#1f2f29] rounded-lg px-4 py-3 text-white placeholder-[#71717a] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-[#10b981] hover:bg-[#34d399] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a120f] font-semibold py-3 px-4 rounded-lg transition-colors"
			>
				{#if loading}
					Sending...
				{:else}
					Send Reset Link
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-[#a1a1aa]">
			Remember your password?
			<a href="/auth/login" class="text-[#10b981] hover:text-[#34d399] transition-colors">
				Sign in
			</a>
		</p>
	{/if}
</div>
