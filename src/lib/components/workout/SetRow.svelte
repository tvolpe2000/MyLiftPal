<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { Check, History, Zap } from 'lucide-svelte';
	import type { SetState } from '$lib/types/workout';
	import { getProgressionSuggestion } from '$lib/utils/progression';

	let { set, exerciseIndex, setIndex, repRange, repRangeMin, repRangeMax } = $props<{
		set: SetState;
		exerciseIndex: number;
		setIndex: number;
		repRange: string;
		repRangeMin: number;
		repRangeMax: number;
	}>();

	function handleClick() {
		workout.openSetInput(exerciseIndex, setIndex);
	}

	// Get suggestion for quick-log
	const suggestion = $derived(() => {
		if (!set.previous) return null;
		return getProgressionSuggestion(set.previous, repRangeMin, repRangeMax);
	});

	// Check for previous set in current session (for weight carry)
	const previousSetWeight = $derived(() => {
		const exercise = workout.exercises[exerciseIndex];
		if (!exercise) return null;
		for (let i = setIndex - 1; i >= 0; i--) {
			const prevSet = exercise.sets[i];
			if (prevSet.completed && prevSet.actualWeight !== null) {
				return prevSet.actualWeight;
			}
		}
		return null;
	});

	// Quick log data: use previous set this session, or suggestion
	const quickLogData = $derived(() => {
		const prev = previousSetWeight();
		const sugg = suggestion();
		if (prev !== null) {
			// Use weight from previous set this session
			const midReps = Math.round((repRangeMin + repRangeMax) / 2);
			return { weight: prev, reps: sugg?.reps ?? midReps, rir: null };
		}
		if (sugg) {
			return { weight: sugg.weight, reps: sugg.reps, rir: null };
		}
		return null;
	});

	async function handleQuickLog(e: MouseEvent) {
		e.stopPropagation();
		const data = quickLogData();
		if (data) {
			await workout.quickLogSet(exerciseIndex, setIndex, data);
		}
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

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	onclick={handleClick}
	class="w-full flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer {set.completed
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

	<!-- Quick log button or tap hint -->
	{#if !set.completed}
		{@const data = quickLogData()}
		{#if data}
			<button
				type="button"
				onclick={handleQuickLog}
				disabled={workout.isSaving}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-xs font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
			>
				<Zap size={12} />
				<span>{data.weight}×{data.reps}</span>
			</button>
		{:else}
			<span class="text-xs text-[var(--color-text-muted)]">Tap to log</span>
		{/if}
	{/if}
</div>
