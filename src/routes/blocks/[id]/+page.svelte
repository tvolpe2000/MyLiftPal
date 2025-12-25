<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { workout } from '$lib/stores/workoutStore.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import WorkoutHeader from '$lib/components/workout/WorkoutHeader.svelte';
	import ExerciseCard from '$lib/components/workout/ExerciseCard.svelte';
	import SetInputModal from '$lib/components/workout/SetInputModal.svelte';
	import { CheckCircle } from 'lucide-svelte';

	const blockId = $derived($page.params.id);

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	$effect(() => {
		if (auth.isAuthenticated && blockId) {
			workout.loadWorkout(blockId);
		}

		return () => {
			workout.reset();
		};
	});

	async function handleComplete() {
		const success = await workout.completeWorkout();
		if (success) {
			goto('/blocks');
		}
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		{#if workout.loading}
			<div class="flex items-center justify-center min-h-[50vh]">
				<div class="text-[var(--color-text-muted)]">Loading workout...</div>
			</div>
		{:else if workout.error}
			<div class="p-6">
				<div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
					{workout.error}
				</div>
			</div>
		{:else}
			<!-- Header -->
			<WorkoutHeader />

			<!-- Exercise List -->
			<div class="p-4 pb-32 space-y-4">
				{#each workout.exercises as exercise, i (exercise.slot.id)}
					<ExerciseCard {exercise} exerciseIndex={i} />
				{/each}

				{#if workout.exercises.length === 0}
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
						<div class="text-[var(--color-text-muted)] mb-2">No exercises found</div>
						<p class="text-sm text-[var(--color-text-secondary)]">
							This workout day doesn't have any exercises configured.
						</p>
					</div>
				{/if}
			</div>

			<!-- Complete Button - Fixed at bottom -->
			<div
				class="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 md:ml-64 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)] to-transparent pt-8"
			>
				<button
					type="button"
					onclick={handleComplete}
					disabled={!workout.canComplete || workout.isSaving}
					class="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-bg-primary)] font-semibold py-4 rounded-xl transition-colors text-lg shadow-lg"
				>
					<CheckCircle size={22} />
					{#if workout.isSaving}
						Completing...
					{:else}
						Complete Workout
					{/if}
				</button>
			</div>

			<!-- Set Input Modal -->
			<SetInputModal />
		{/if}
	</AppShell>
{/if}
