<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import AppShell from '$lib/components/AppShell.svelte';

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-4xl mx-auto">
				<div class="mb-8">
					<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">
						Welcome{auth.profile?.display_name ? `, ${auth.profile.display_name}` : ''}!
					</h1>
					<p class="text-[var(--color-text-secondary)]">Ready to crush your workout?</p>
				</div>

				<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
					<h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">No Active Training Block</h2>
					<p class="text-[var(--color-text-secondary)] mb-6">
						Create a training block to start tracking your workouts and monitoring your volume.
					</p>
					<a
						href="/blocks/new"
						class="inline-block bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold py-3 px-6 rounded-lg transition-colors"
					>
						Create Training Block
					</a>
				</div>
			</div>
		</div>
	</AppShell>
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-[var(--color-text-secondary)]">Redirecting...</div>
	</div>
{/if}
