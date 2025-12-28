<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AlertTriangle, RefreshCw, Home } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-6">
	<div class="max-w-md w-full text-center">
		<div class="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
			<AlertTriangle size={32} class="text-red-400" />
		</div>

		<h1 class="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
			Something went wrong
		</h1>

		<p class="text-[var(--color-text-secondary)] mb-2">
			{$page.error?.message || 'An unexpected error occurred'}
		</p>

		{#if $page.status}
			<p class="text-sm text-[var(--color-text-muted)] mb-6">
				Error code: {$page.status}
			</p>
		{/if}

		<div class="flex gap-3 justify-center">
			<button
				onclick={() => window.location.reload()}
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
			>
				<RefreshCw size={18} />
				Refresh
			</button>

			<button
				onclick={() => goto('/')}
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-tertiary)] transition-colors"
			>
				<Home size={18} />
				Home
			</button>
		</div>

		<p class="mt-8 text-xs text-[var(--color-text-muted)]">
			If this keeps happening, try clearing your browser cache or contact support.
		</p>
	</div>
</div>
