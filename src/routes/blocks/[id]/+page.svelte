<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { workout } from '$lib/stores/workoutStore.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import WorkoutHeader from '$lib/components/workout/WorkoutHeader.svelte';
	import ExerciseCard from '$lib/components/workout/ExerciseCard.svelte';
	import SetInputModal from '$lib/components/workout/SetInputModal.svelte';
	import SyncStatus from '$lib/components/offline/SyncStatus.svelte';
	import AddExerciseButton from '$lib/components/workout/AddExerciseButton.svelte';
	import { CheckCircle, Edit3, RotateCcw } from 'lucide-svelte';

	const blockId = $derived($page.params.id);
	const sessionId = $derived($page.url.searchParams.get('session'));

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	$effect(() => {
		if (auth.isAuthenticated && blockId) {
			if (sessionId) {
				// Loading a specific past session for editing
				workout.loadPastSession(sessionId);
			} else {
				// Normal flow: load current day/week
				workout.loadWorkout(blockId);
			}
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

	async function handleUncomplete() {
		const success = await workout.uncompleteWorkout();
		if (success) {
			// Stay on page, now in live mode
		}
	}

	function handleDoneEditing() {
		goto('/');
	}

	function formatEditDate(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
			<!-- Edit Mode Banner -->
			{#if workout.isEditMode}
				<div class="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Edit3 size={18} class="text-amber-400" />
							<span class="text-amber-400 font-medium">Editing Past Workout</span>
						</div>
						<span class="text-sm text-[var(--color-text-muted)]">
							{formatEditDate(workout.session?.completed_at ?? null)}
						</span>
					</div>
				</div>
			{/if}

			<!-- Header -->
			<WorkoutHeader />

			<!-- Sync Status -->
			<div class="px-4 py-2">
				<SyncStatus />
			</div>

			<!-- Exercise List -->
			<div class="p-4 pb-32 space-y-4">
				{#each workout.exercises as exercise, i (exercise.slot.id)}
					<ExerciseCard {exercise} exerciseIndex={i} />
				{/each}

				<!-- Add Exercise Button -->
				<AddExerciseButton />

				{#if workout.exercises.length === 0}
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
						<div class="text-[var(--color-text-muted)] mb-2">No exercises found</div>
						<p class="text-sm text-[var(--color-text-secondary)]">
							This workout day doesn't have any exercises configured.
						</p>
					</div>
				{/if}
			</div>

			<!-- Complete/Done Button - Fixed at bottom -->
			<div
				class="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 md:ml-64 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)] to-transparent pt-8"
			>
				{#if workout.isEditMode && workout.session?.status === 'completed'}
					<!-- Edit mode: Show Done Editing + Resume option -->
					<div class="flex gap-3">
						<button
							type="button"
							onclick={handleDoneEditing}
							class="flex-1 flex items-center justify-center gap-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-semibold py-4 rounded-xl transition-colors text-lg shadow-lg border border-[var(--color-border)]"
						>
							<CheckCircle size={22} />
							Done Editing
						</button>
						<button
							type="button"
							onclick={handleUncomplete}
							disabled={workout.isSaving}
							class="flex items-center justify-center gap-2 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold py-4 rounded-xl transition-colors shadow-lg border border-amber-500/30 disabled:opacity-50"
							title="Resume this workout as in-progress"
						>
							<RotateCcw size={20} />
						</button>
					</div>
				{:else}
					<!-- Normal mode: Complete Workout button -->
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
				{/if}
			</div>

			<!-- Set Input Modal -->
			<SetInputModal />
		{/if}
	</AppShell>
{/if}
