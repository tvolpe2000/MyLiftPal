<script lang="ts">
	import { changelog } from '$lib/stores/changelogStore.svelte';
	import { Sparkles, ChevronRight } from 'lucide-svelte';
</script>

{#if changelog.hasNewUpdates && changelog.currentVersion}
	<a
		href="/changelog"
		class="flex items-center justify-between gap-3 p-4 mb-4 rounded-xl bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 hover:border-[var(--color-accent)]/50 transition-colors group"
	>
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
				<Sparkles size={20} class="text-[var(--color-accent)]" />
			</div>
			<div>
				<p class="font-medium text-[var(--color-text-primary)]">
					What's New in v{changelog.currentVersion}
				</p>
				<p class="text-sm text-[var(--color-text-secondary)]">
					Tap to see the latest updates
				</p>
			</div>
		</div>
		<ChevronRight size={20} class="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
	</a>
{/if}
