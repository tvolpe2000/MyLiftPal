<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { Check } from 'lucide-svelte';
	import type { SetState } from '$lib/types/workout';

	let { set, exerciseIndex, setIndex, repRange } = $props<{
		set: SetState;
		exerciseIndex: number;
		setIndex: number;
		repRange: string;
	}>();

	function handleClick() {
		workout.openSetInput(exerciseIndex, setIndex);
	}
</script>

<button
	type="button"
	onclick={handleClick}
	class="w-full flex items-center gap-3 p-3 rounded-lg transition-colors {set.completed
		? 'bg-[var(--color-bg-tertiary)]'
		: 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'}"
>
	<!-- Set Number -->
	<div
		class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold {set.completed
			? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
			: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'}"
	>
		{#if set.completed}
			<Check size={16} />
		{:else}
			{set.setNumber}
		{/if}
	</div>

	<!-- Target -->
	<div class="flex-1 text-left">
		{#if set.completed}
			<div class="text-[var(--color-text-primary)] font-medium">
				{set.actualWeight} x {set.actualReps}
				{#if set.rir !== null}
					<span class="text-[var(--color-text-muted)] text-sm ml-1">@{set.rir} RIR</span>
				{/if}
			</div>
		{:else}
			<div class="text-[var(--color-text-secondary)]">
				{#if set.targetWeight}
					<span class="text-[var(--color-text-primary)]">{set.targetWeight}</span> x
				{/if}
				<span class="text-[var(--color-text-muted)]">{repRange} reps</span>
			</div>
		{/if}
	</div>

	<!-- Tap hint -->
	{#if !set.completed}
		<span class="text-xs text-[var(--color-text-muted)]">Tap to log</span>
	{/if}
</button>
