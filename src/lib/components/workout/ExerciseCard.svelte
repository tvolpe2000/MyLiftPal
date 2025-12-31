<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { ChevronDown, ChevronUp, Info } from 'lucide-svelte';
	import SetRow from './SetRow.svelte';
	import SwapExerciseButton from './SwapExerciseButton.svelte';
	import ExerciseDetailModal from '$lib/components/shared/ExerciseDetailModal.svelte';
	import type { ExerciseState } from '$lib/types/workout';

	let { exercise, exerciseIndex } = $props<{
		exercise: ExerciseState;
		exerciseIndex: number;
	}>();

	const completedCount = $derived(exercise.sets.filter((s: { completed: boolean }) => s.completed).length);
	const repRange = $derived(`${exercise.slot.rep_range_min}-${exercise.slot.rep_range_max}`);

	// Exercise detail modal state
	let showDetailModal = $state(false);

	function openExerciseDetail(e: Event) {
		e.stopPropagation(); // Prevent card expansion
		showDetailModal = true;
	}

	function closeExerciseDetail() {
		showDetailModal = false;
	}

	// Format muscle name: "front_delts" → "Front Delts"
	function formatMuscle(name: string): string {
		return name
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Get muscle display info
	const primaryMuscle = $derived(exercise.slot.exercise?.primary_muscle || '');
	const secondaryMuscles = $derived(exercise.slot.exercise?.secondary_muscles || []);
	const displayedSecondary = $derived(secondaryMuscles.slice(0, 3));
	const hasMoreSecondary = $derived(secondaryMuscles.length > 3);

	function toggleExpand() {
		workout.toggleExerciseExpanded(exerciseIndex);
	}
</script>

<div class="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden">
	<!-- Exercise Header -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={toggleExpand}
		class="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
	>
		<div class="flex-1 text-left">
			<div class="flex items-center gap-2 flex-wrap">
				<h3 class="font-semibold text-[var(--color-text-primary)]">
					{exercise.slot.exercise?.name || 'Exercise'}
				</h3>
				<!-- Muscle tags -->
				<div class="flex items-center gap-1 flex-wrap">
					{#if primaryMuscle}
						<span class="px-2 py-0.5 rounded text-xs bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold">
							{formatMuscle(primaryMuscle)}
						</span>
					{/if}
					{#each displayedSecondary as sec}
						<span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
							{formatMuscle(sec.muscle)}
						</span>
					{/each}
					{#if hasMoreSecondary}
						<span class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
							+{secondaryMuscles.length - 3}
						</span>
					{/if}
				</div>
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

		<div class="flex items-center gap-1">
			<!-- Info Button -->
			<button
				type="button"
				onclick={openExerciseDetail}
				class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors"
				aria-label="View exercise details"
			>
				<Info size={18} class="text-[var(--color-text-muted)]" />
			</button>
			<SwapExerciseButton {exerciseIndex} {exercise} />
			{#if exercise.isExpanded}
				<ChevronUp size={20} class="text-[var(--color-text-muted)]" />
			{:else}
				<ChevronDown size={20} class="text-[var(--color-text-muted)]" />
			{/if}
		</div>
	</div>

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

<!-- Exercise Detail Modal -->
<ExerciseDetailModal
	open={showDetailModal}
	exercise={exercise.slot.exercise}
	onclose={closeExerciseDetail}
/>
