<script lang="ts">
	import { supabase } from '$lib/db/supabase';
	import type { Exercise } from '$lib/types';
	import { Filter } from 'lucide-svelte';

	interface Props {
		open: boolean;
		onselect: (exercise: Exercise) => void;
		onclose: () => void;
		preselectedMuscle?: string | null;
		excludeExerciseIds?: string[];
	}

	let { open, onselect, onclose, preselectedMuscle = null, excludeExerciseIds = [] }: Props = $props();

	let exercises = $state<Exercise[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let selectedEquipment = $state<string | null>(null);
	let selectedMuscle = $state<string | null>(null);

	const equipmentTypes = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];
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

	// Load exercises when opened
	$effect(() => {
		if (open && exercises.length === 0) {
			loadExercises();
		}
	});

	// Reset filters when opened with a new muscle
	$effect(() => {
		if (open) {
			selectedMuscle = preselectedMuscle;
			searchQuery = '';
			selectedEquipment = null;
		}
	});

	async function loadExercises() {
		loading = true;
		const { data, error } = await supabase.from('exercises').select('*').order('name');

		if (error) {
			console.error('Error loading exercises:', error);
		} else {
			exercises = data || [];
		}
		loading = false;
	}

	function formatMuscle(muscle: string): string {
		return muscle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	let filteredExercises = $derived(() => {
		return exercises.filter((ex) => {
			// Exclude specified exercise IDs
			if (excludeExerciseIds.includes(ex.id)) return false;

			const matchesSearch =
				!searchQuery ||
				ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				ex.aliases?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
			const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
			return matchesSearch && matchesEquipment && matchesMuscle;
		});
	});

	function handleSelect(exercise: Exercise) {
		onselect(exercise);
	}

	function handleClose() {
		onclose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="exercise-picker-open fixed inset-0 z-[9999] flex flex-col"
		onclick={handleClose}
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/80"></div>

		<!-- Modal Container - Full screen on mobile, centered on desktop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative flex-1 flex flex-col bg-[var(--color-bg-primary)] sm:m-auto sm:flex-initial sm:w-full sm:max-w-lg sm:max-h-[85vh] sm:rounded-xl sm:shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>

			<!-- Header -->
			<div class="p-4 border-b border-[var(--color-border)] flex-shrink-0">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Select Exercise</h3>
					<button
						type="button"
						onclick={handleClose}
						class="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors text-xl"
					>
						&times;
					</button>
				</div>

				<!-- Search -->
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search exercises..."
					class="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
				/>

				<!-- Muscle Filter -->
				<div class="mt-3">
					<div class="flex items-center gap-2 mb-2">
						<Filter size={14} class="text-[var(--color-text-muted)]" />
						<span class="text-xs text-[var(--color-text-muted)]">Filter by muscle:</span>
					</div>
					<div class="flex flex-wrap gap-1.5">
						<button
							type="button"
							onclick={() => (selectedMuscle = null)}
							class="px-2 py-1 rounded-full text-xs transition-colors {selectedMuscle === null
								? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
								: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}"
						>
							All
						</button>
						{#each muscleGroups as muscle}
							<button
								type="button"
								onclick={() => (selectedMuscle = selectedMuscle === muscle ? null : muscle)}
								class="px-2 py-1 rounded-full text-xs transition-colors {selectedMuscle === muscle
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}"
							>
								{formatMuscle(muscle)}
							</button>
						{/each}
					</div>
				</div>

				<!-- Equipment Filter -->
				<div class="mt-3">
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xs text-[var(--color-text-muted)]">Equipment:</span>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => (selectedEquipment = null)}
							class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedEquipment === null
								? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
								: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
						>
							All
						</button>
						{#each equipmentTypes as eq}
							<button
								type="button"
								onclick={() => (selectedEquipment = selectedEquipment === eq ? null : eq)}
								class="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors {selectedEquipment ===
								eq
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
							>
								{eq}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Exercise List - Scrollable -->
			<div class="flex-1 overflow-y-auto p-4 min-h-0">
				{#if loading}
					<div class="text-center py-8 text-[var(--color-text-muted)]">Loading exercises...</div>
				{:else if filteredExercises().length === 0}
					<div class="text-center py-8 text-[var(--color-text-muted)]">No exercises found</div>
				{:else}
					<div class="space-y-2 pb-4">
						{#each filteredExercises() as exercise}
							<button
								type="button"
								onclick={() => handleSelect(exercise)}
								class="w-full text-left p-4 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
							>
								<div class="font-medium text-[var(--color-text-primary)]">{exercise.name}</div>
								<div class="flex items-center gap-2 mt-2">
									<span
										class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] capitalize"
									>
										{exercise.equipment}
									</span>
									<span
										class="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
									>
										{formatMuscle(exercise.primary_muscle)}
									</span>
								</div>
							</button>
						{/each}
					</div>
					<div class="text-center text-sm text-[var(--color-text-muted)] py-2">
						{filteredExercises().length} exercise{filteredExercises().length !== 1 ? 's' : ''}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Prevent body scroll when modal is open */
	:global(body:has(.exercise-picker-open)) {
		overflow: hidden;
	}
</style>
