<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			await auth.signIn(email, password);
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Invalid email or password';
		} finally {
			loading = false;
		}
	}
</script>

<div class="bg-[#0f1a16] rounded-xl p-6 shadow-lg">
	<h2 class="text-xl font-semibold text-white mb-6">Welcome back</h2>

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

		<div>
			<label for="password" class="block text-sm font-medium text-[#a1a1aa] mb-2">
				Password
			</label>
			<input
				type="password"
				id="password"
				bind:value={password}
				required
				placeholder="••••••••"
				class="w-full bg-[#162420] border border-[#1f2f29] rounded-lg px-4 py-3 text-white placeholder-[#71717a] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
			/>
		</div>

		<div class="flex justify-end">
			<a
				href="/auth/forgot-password"
				class="text-sm text-[#10b981] hover:text-[#34d399] transition-colors"
			>
				Forgot password?
			</a>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full bg-[#10b981] hover:bg-[#34d399] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a120f] font-semibold py-3 px-4 rounded-lg transition-colors"
		>
			{#if loading}
				Signing in...
			{:else}
				Sign In
			{/if}
		</button>
	</form>

	<p class="mt-6 text-center text-[#a1a1aa]">
		Don't have an account?
		<a href="/auth/signup" class="text-[#10b981] hover:text-[#34d399] transition-colors">
			Sign up
		</a>
	</p>
</div>
