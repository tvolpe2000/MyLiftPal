<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import WorkoutDayCard from './WorkoutDayCard.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		wizard.initializeWorkoutDays();
	});
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-xl font-bold text-[var(--color-text-primary)]">Configure Workout Days</h2>
		<p class="text-[var(--color-text-secondary)] mt-1">
			Name your {wizard.daysPerWeek} training day{wizard.daysPerWeek > 1 ? 's' : ''} and set target
			muscles
		</p>
	</div>

	<div class="space-y-4">
		{#each wizard.workoutDays as day (day.id)}
			<WorkoutDayCard {day} />
		{/each}
	</div>

	{#if wizard.workoutDays.length === 0}
		<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
			<p class="text-[var(--color-text-muted)]">Loading workout days...</p>
		</div>
	{/if}

	<div class="bg-[var(--color-bg-secondary)] rounded-xl p-4">
		<p class="text-sm text-[var(--color-text-muted)]">
			<strong class="text-[var(--color-text-secondary)]">Tip:</strong> Common splits include Push/Pull/Legs,
			Upper/Lower, or Full Body. Name your days based on the muscle groups you'll target.
		</p>
	</div>
</div>
