<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import SetRow from './SetRow.svelte';
	import type { ExerciseState } from '$lib/types/workout';

	let { exercise, exerciseIndex } = $props<{
		exercise: ExerciseState;
		exerciseIndex: number;
	}>();

	const completedCount = $derived(exercise.sets.filter((s: { completed: boolean }) => s.completed).length);
	const repRange = $derived(`${exercise.slot.rep_range_min}-${exercise.slot.rep_range_max}`);

	function toggleExpand() {
		workout.toggleExerciseExpanded(exerciseIndex);
	}
</script>

<div class="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden">
	<!-- Exercise Header -->
	<button
		type="button"
		onclick={toggleExpand}
		class="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
	>
		<div class="flex-1 text-left">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-[var(--color-text-primary)]">
					{exercise.slot.exercise?.name || 'Exercise'}
				</h3>
				<span
					class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] capitalize"
				>
					{exercise.slot.exercise?.equipment}
				</span>
			</div>
			<div class="flex items-center gap-2 mt-1 text-sm">
				<span
					class={completedCount === exercise.setsThisWeek
						? 'text-[var(--color-accent)]'
						: 'text-[var(--color-text-secondary)]'}
				>
					{completedCount}/{exercise.setsThisWeek} sets
				</span>
				<span class="text-[var(--color-text-muted)]">|</span>
				<span class="text-[var(--color-text-muted)]">{repRange} reps</span>
			</div>
		</div>

		{#if exercise.isExpanded}
			<ChevronUp size={20} class="text-[var(--color-text-muted)]" />
		{:else}
			<ChevronDown size={20} class="text-[var(--color-text-muted)]" />
		{/if}
	</button>

	<!-- Sets List -->
	{#if exercise.isExpanded}
		<div class="px-4 pb-4 space-y-2">
			{#each exercise.sets as set, setIndex (set.setNumber)}
				<SetRow
					{set}
					{exerciseIndex}
					{setIndex}
					{repRange}
					repRangeMin={exercise.slot.rep_range_min}
					repRangeMax={exercise.slot.rep_range_max}
				/>
			{/each}
		</div>
	{/if}
</div>
