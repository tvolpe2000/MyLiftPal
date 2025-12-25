<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import { calculateWeeklyVolume, getVolumeBarColor } from '$lib/utils/volume';
	import type { MuscleVolume, MuscleGroupData, ExerciseForVolume } from '$lib/utils/volume';
	import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-svelte';

	let muscleGroups = $state<MuscleGroupData[]>([]);
	let showVolume = $state(false);

	// Fetch muscle groups on mount
	$effect(() => {
		loadMuscleGroups();
	});

	async function loadMuscleGroups() {
		const { data } = await supabase
			.from('muscle_groups')
			.select('id, display_name, mv, mev, mav, mrv, color');

		if (data) {
			muscleGroups = data as MuscleGroupData[];
		}
	}

	// Calculate volume from current exercises
	const volumes = $derived.by(() => {
		if (!workout.exercises || workout.exercises.length === 0 || muscleGroups.length === 0) {
			return [];
		}

		const exercisesForVolume: ExerciseForVolume[] = workout.exercises.map((ex) => ({
			primaryMuscle: ex.slot.exercise?.primary_muscle || '',
			secondaryMuscles: ex.slot.exercise?.secondary_muscles || [],
			setsPerWeek: ex.setsThisWeek
		}));

		return calculateWeeklyVolume(exercisesForVolume, muscleGroups);
	});

	// Get top 4 muscles by sets for compact display
	const topMuscles = $derived(volumes.slice(0, 4));

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

	<!-- Volume Summary (collapsible) -->
	{#if topMuscles.length > 0}
		<button
			type="button"
			onclick={() => (showVolume = !showVolume)}
			class="w-full mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
		>
			<span class="font-medium">Today's Volume</span>
			<div class="flex items-center gap-2">
				<!-- Compact volume pills -->
				{#if !showVolume}
					<div class="flex items-center gap-1">
						{#each topMuscles as vol}
							{@const barColor = getVolumeBarColor(vol.status)}
							<span class="px-1.5 py-0.5 rounded text-[10px] {barColor} bg-opacity-20">
								{vol.muscleName.substring(0, 3)}: {vol.totalSets}
							</span>
						{/each}
					</div>
				{/if}
				{#if showVolume}
					<ChevronUp size={14} />
				{:else}
					<ChevronDown size={14} />
				{/if}
			</div>
		</button>

		{#if showVolume}
			<div class="mt-2 grid grid-cols-2 gap-2">
				{#each volumes as vol (vol.muscleId)}
					{@const barColor = getVolumeBarColor(vol.status)}
					<div class="flex items-center gap-2 text-xs">
						<span class="text-[var(--color-text-secondary)] min-w-[70px] truncate">
							{vol.muscleName}
						</span>
						<div class="flex-1 h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
							<div
								class="h-full rounded-full {barColor}"
								style="width: {Math.min((vol.totalSets / vol.mrv) * 100, 100)}%"
							></div>
						</div>
						<span class="font-medium min-w-[20px] text-right {
							vol.status === 'low' ? 'text-red-400' :
							vol.status === 'good' ? 'text-green-400' :
							vol.status === 'high' ? 'text-yellow-400' :
							vol.status === 'excessive' ? 'text-orange-400' :
							'text-[var(--color-text-muted)]'
						}">
							{vol.totalSets}
						</span>
					</div>
				{/each}
			</div>

			<!-- Legend -->
			<div class="mt-2 flex items-center justify-center gap-3 text-[10px] text-[var(--color-text-muted)]">
				<span class="flex items-center gap-1">
					<span class="w-2 h-2 rounded-full bg-red-500"></span> Low
				</span>
				<span class="flex items-center gap-1">
					<span class="w-2 h-2 rounded-full bg-green-500"></span> Good
				</span>
				<span class="flex items-center gap-1">
					<span class="w-2 h-2 rounded-full bg-yellow-500"></span> High
				</span>
			</div>
		{/if}
	{/if}
</div>
