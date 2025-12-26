<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { Check, History } from 'lucide-svelte';
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

	// Format previous session data
	const previousDisplay = $derived(() => {
		if (!set.previous || set.previous.weight === null) return null;
		let text = `${set.previous.weight} × ${set.previous.reps}`;
		if (set.previous.rir !== null) {
			text += ` @${set.previous.rir}`;
		}
		return text;
	});
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

	<!-- Target & Previous -->
	<div class="flex-1 text-left">
		{#if set.completed}
			<div class="text-[var(--color-text-primary)] font-medium">
				{set.actualWeight} × {set.actualReps}
				{#if set.rir !== null}
					<span class="text-[var(--color-text-muted)] text-sm ml-1">@{set.rir} RIR</span>
				{/if}
			</div>
		{:else}
			<!-- Previous session data -->
			{#if previousDisplay()}
				<div class="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-0.5">
					<History size={12} />
					<span>Last: {previousDisplay()}</span>
				</div>
			{/if}
			<!-- Current target -->
			<div class="text-[var(--color-text-secondary)]">
				{#if set.targetWeight}
					<span class="text-[var(--color-text-primary)] font-medium">{set.targetWeight}</span> ×
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
