<script lang="ts">
	import type { MuscleVolume } from '$lib/utils/volume';
	import VolumeBar from './VolumeBar.svelte';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';

	let { volumes, title = 'Weekly Volume', showAll = false } = $props<{
		volumes: MuscleVolume[];
		title?: string;
		showAll?: boolean;
	}>();

	let expanded = $state(false);

	// Initialize expanded state from prop
	$effect(() => {
		expanded = showAll;
	});

	// Show top muscles in compact view, or all if expanded
	const displayVolumes = $derived(expanded ? volumes : volumes.slice(0, 6));
	const hasMore = $derived(volumes.length > 6);

	// Summary stats
	const lowCount = $derived(volumes.filter((v: MuscleVolume) => v.status === 'low').length);
	const highCount = $derived(volumes.filter((v: MuscleVolume) => v.status === 'high' || v.status === 'excessive').length);
	const goodCount = $derived(volumes.filter((v: MuscleVolume) => v.status === 'good').length);
</script>

<div class="bg-[var(--color-bg-secondary)] rounded-xl p-4">
	<!-- Header with summary badges -->
	<div class="flex items-center justify-between mb-3">
		<h3 class="font-semibold text-[var(--color-text-primary)]">{title}</h3>
		<div class="flex items-center gap-2 text-xs">
			{#if goodCount > 0}
				<span class="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
					{goodCount} good
				</span>
			{/if}
			{#if lowCount > 0}
				<span class="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
					{lowCount} low
				</span>
			{/if}
			{#if highCount > 0}
				<span class="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
					{highCount} high
				</span>
			{/if}
		</div>
	</div>

	{#if volumes.length === 0}
		<p class="text-[var(--color-text-muted)] text-sm">No exercises added yet</p>
	{:else}
		<!-- Volume grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
			{#each displayVolumes as volume (volume.muscleId)}
				<VolumeBar {volume} compact />
			{/each}
		</div>

		<!-- Expand/collapse button -->
		{#if hasMore && !showAll}
			<button
				type="button"
				onclick={() => (expanded = !expanded)}
				class="w-full mt-3 flex items-center justify-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
			>
				{#if expanded}
					<ChevronUp size={16} />
					Show less
				{:else}
					<ChevronDown size={16} />
					Show all ({volumes.length} muscles)
				{/if}
			</button>
		{/if}
	{/if}
</div>
