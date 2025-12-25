<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import { Plus } from 'lucide-svelte';

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
				<div class="flex items-center justify-between mb-8">
					<div>
						<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Training Blocks</h1>
						<p class="text-[var(--color-text-secondary)]">Plan and manage your mesocycles</p>
					</div>
					<a
						href="/blocks/new"
						class="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold py-2 px-4 rounded-lg transition-colors"
					>
						<Plus size={20} />
						<span>New Block</span>
					</a>
				</div>

				<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
					<div class="text-[var(--color-text-muted)] text-5xl mb-4">📋</div>
					<h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No Training Blocks Yet</h2>
					<p class="text-[var(--color-text-secondary)] mb-6">
						Create your first training block to start planning your workouts.
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
{/if}
