<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	function goBack() {
		history.back();
	}
</script>

<div class="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] p-4">
	<div class="flex items-center gap-4 mb-3">
		<button
			type="button"
			onclick={goBack}
			class="p-2 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
		>
			<ArrowLeft size={24} />
		</button>
		<div class="flex-1">
			<h1 class="text-lg font-semibold text-[var(--color-text-primary)]">
				{workout.currentWorkoutDay?.name || 'Workout'}
			</h1>
			<p class="text-sm text-[var(--color-text-secondary)]">
				{workout.trainingBlock?.name} - Week {workout.trainingBlock?.current_week}
			</p>
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="space-y-1">
		<div class="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
			<span>{workout.completedSets} / {workout.totalSets} sets</span>
			<span>{Math.round(workout.progress)}%</span>
		</div>
		<div class="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
			<div
				class="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
				style="width: {workout.progress}%"
			></div>
		</div>
	</div>
</div>
