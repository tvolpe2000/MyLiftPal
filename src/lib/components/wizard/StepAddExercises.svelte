<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import type { Exercise } from '$lib/types';
	import { createDefaultExerciseSlot } from '$lib/types/wizard';
	import { Plus, Trash2, ChevronDown, ChevronUp, Filter } from 'lucide-svelte';

	let exercises = $state<Exercise[]>([]);
	let loading = $state(true);
	let expandedDay = $state<string | null>(wizard.workoutDays[0]?.id || null);
	let showPicker = $state(false);
	let pickerDayId = $state<string | null>(null);
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

	$effect(() => {
		loadExercises();
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

	function openPicker(dayId: string) {
		pickerDayId = dayId;
		showPicker = true;
		searchQuery = '';
		selectedEquipment = null;

		// Pre-select first target muscle from the day if available
		const day = wizard.workoutDays.find((d) => d.id === dayId);
		const muscles = day?.targetMuscles;
		if (muscles && muscles.length > 0) {
			selectedMuscle = muscles[0];
		} else {
			selectedMuscle = null;
		}
	}

	function closePicker() {
		showPicker = false;
		pickerDayId = null;
	}

	function selectExercise(exercise: Exercise) {
		if (pickerDayId) {
			const existingSlots = wizard.getExercisesForDay(pickerDayId);
			const slot = createDefaultExerciseSlot(exercise, existingSlots.length);
			wizard.addExerciseSlot(pickerDayId, slot);
		}
		closePicker();
	}

	function formatMuscle(muscle: string): string {
		return muscle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	let filteredExercises = $derived(() => {
		return exercises.filter((ex) => {
			const matchesSearch =
				!searchQuery ||
				ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				ex.aliases?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
			const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
			return matchesSearch && matchesEquipment && matchesMuscle;
		});
	});

	// Get target muscles for the current picker day
	let pickerDayMuscles = $derived(() => {
		if (!pickerDayId) return [];
		const day = wizard.workoutDays.find((d) => d.id === pickerDayId);
		return day?.targetMuscles || [];
	});
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-xl font-bold text-[var(--color-text-primary)]">Add Exercises</h2>
		<p class="text-[var(--color-text-secondary)] mt-1">
			Add exercises to each workout day
		</p>
	</div>

	<!-- Day Accordions -->
	<div class="space-y-3">
		{#each wizard.workoutDays as day (day.id)}
			{@const dayExercises = wizard.getExercisesForDay(day.id)}
			{@const isExpanded = expandedDay === day.id}

			<div class="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden">
				<!-- Day Header -->
				<button
					type="button"
					onclick={() => (expandedDay = isExpanded ? null : day.id)}
					class="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
				>
					<div class="flex items-center gap-3">
						<span
							class="w-8 h-8 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center font-semibold text-sm"
						>
							{day.dayNumber}
						</span>
						<div class="text-left">
							<span class="font-medium text-[var(--color-text-primary)]">{day.name}</span>
							<span class="text-sm text-[var(--color-text-muted)] ml-2">
								{dayExercises.length} exercise{dayExercises.length !== 1 ? 's' : ''}
							</span>
						</div>
					</div>
					{#if isExpanded}
						<ChevronUp size={20} class="text-[var(--color-text-muted)]" />
					{:else}
						<ChevronDown size={20} class="text-[var(--color-text-muted)]" />
					{/if}
				</button>

				<!-- Day Content -->
				{#if isExpanded}
					<div class="p-4 pt-0 space-y-3">
						{#if dayExercises.length === 0}
							<div class="text-center py-6 text-[var(--color-text-muted)]">
								No exercises added yet
							</div>
						{:else}
							{#each dayExercises as slot (slot.id)}
								<div
									class="bg-[var(--color-bg-tertiary)] rounded-lg p-3 flex items-center justify-between"
								>
									<div class="flex-1">
										<div class="font-medium text-[var(--color-text-primary)]">
											{slot.exercise?.name || 'Unknown Exercise'}
										</div>
										<div class="text-sm text-[var(--color-text-muted)] flex flex-wrap gap-2 mt-1">
											<span>{slot.baseSets} sets</span>
											<span>·</span>
											<span>{slot.repRangeMin}-{slot.repRangeMax} reps</span>
											{#if slot.setProgression > 0}
												<span>·</span>
												<span>+{slot.setProgression}/week</span>
											{/if}
										</div>
									</div>
									<button
										type="button"
										onclick={() => wizard.removeExerciseSlot(day.id, slot.id)}
										class="p-2 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
									>
										<Trash2 size={18} />
									</button>
								</div>
							{/each}
						{/if}

						<button
							type="button"
							onclick={() => openPicker(day.id)}
							class="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
						>
							<Plus size={20} />
							<span>Add Exercise</span>
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Exercise Picker Modal - Full screen on mobile -->
{#if showPicker}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="exercise-picker-open fixed inset-0 z-[9999] flex flex-col"
		onclick={closePicker}
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
						onclick={closePicker}
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
				{#if pickerDayMuscles().length > 0}
					<div class="mt-3">
						<div class="flex items-center gap-2 mb-2">
							<Filter size={14} class="text-[var(--color-text-muted)]" />
							<span class="text-xs text-[var(--color-text-muted)]">Target muscles for this day:</span>
						</div>
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								onclick={() => (selectedMuscle = null)}
								class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedMuscle === null
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
							>
								All Muscles
							</button>
							{#each pickerDayMuscles() as muscle}
								<button
									type="button"
									onclick={() => (selectedMuscle = selectedMuscle === muscle ? null : muscle)}
									class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedMuscle ===
									muscle
										? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
										: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
								>
									{formatMuscle(muscle)}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<!-- All muscles filter when no target muscles set -->
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
				{/if}

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
								onclick={() => selectExercise(exercise)}
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
