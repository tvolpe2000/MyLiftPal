<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import type { WorkoutDayDraft } from '$lib/types/wizard';
	import { GripVertical, Clock } from 'lucide-svelte';

	let { day } = $props<{ day: WorkoutDayDraft }>();

	const muscleGroups = [
		'chest',
		'back_lats',
		'back_upper',
		'front_delts',
		'side_delts',
		'rear_delts',
		'biceps',
		'triceps',
		'quads',
		'hamstrings',
		'glutes',
		'calves',
		'abs'
	];

	function formatMuscle(muscle: string): string {
		return muscle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function toggleMuscle(muscle: string) {
		const current = day.targetMuscles || [];
		const updated = current.includes(muscle)
			? current.filter((m: string) => m !== muscle)
			: [...current, muscle];
		wizard.updateWorkoutDay(day.id, { targetMuscles: updated });
	}
</script>

<div class="bg-[var(--color-bg-secondary)] rounded-xl p-4">
	<div class="flex items-start gap-3">
		<div class="text-[var(--color-text-muted)] cursor-grab mt-3">
			<GripVertical size={20} />
		</div>

		<div class="flex-1 space-y-4">
			<!-- Day Number & Name -->
			<div class="flex items-center gap-3">
				<span
					class="w-8 h-8 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center font-semibold text-sm"
				>
					{day.dayNumber}
				</span>
				<input
					type="text"
					value={day.name}
					oninput={(e) => wizard.updateWorkoutDay(day.id, { name: e.currentTarget.value })}
					placeholder="Day name..."
					class="flex-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
				/>
			</div>

			<!-- Target Muscles -->
			<div>
				<span class="text-xs font-medium text-[var(--color-text-muted)] mb-2 block">
					Target Muscles (optional)
				</span>
				<div class="flex flex-wrap gap-1.5">
					{#each muscleGroups as muscle}
						<button
							type="button"
							onclick={() => toggleMuscle(muscle)}
							class="px-2 py-1 rounded text-xs font-medium transition-colors
							{day.targetMuscles?.includes(muscle)
								? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
								: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'}"
						>
							{formatMuscle(muscle)}
						</button>
					{/each}
				</div>
			</div>

			<!-- Time Override -->
			{#if wizard.timeBudgetMinutes}
				<div class="flex items-center gap-2 text-sm">
					<Clock size={14} class="text-[var(--color-text-muted)]" />
					<span class="text-[var(--color-text-muted)]">Time override:</span>
					<input
						type="number"
						min="15"
						max="180"
						step="15"
						value={day.timeBudgetMinutes ?? ''}
						oninput={(e) =>
							wizard.updateWorkoutDay(day.id, {
								timeBudgetMinutes: e.currentTarget.value ? parseInt(e.currentTarget.value) : null
							})}
						placeholder={`${wizard.timeBudgetMinutes}`}
						class="w-16 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] text-center focus:outline-none focus:border-[var(--color-accent)]"
					/>
					<span class="text-[var(--color-text-muted)]">min</span>
				</div>
			{/if}
		</div>
	</div>
</div>
