<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import type { Exercise } from '$lib/types';
	import { createDefaultExerciseSlot } from '$lib/types/wizard';
	import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-svelte';

	let exercises = $state<Exercise[]>([]);
	let loading = $state(true);
	let expandedDay = $state<string | null>(wizard.workoutDays[0]?.id || null);
	let showPicker = $state(false);
	let pickerDayId = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedEquipment = $state<string | null>(null);

	const equipmentTypes = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];

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
				ex.aliases?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
			return matchesSearch && matchesEquipment;
		});
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

<!-- Exercise Picker Modal -->
{#if showPicker}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
		<div
			class="bg-[var(--color-bg-primary)] w-full sm:max-w-lg sm:rounded-xl max-h-[80vh] flex flex-col"
		>
			<!-- Header -->
			<div class="p-4 border-b border-[var(--color-border)]">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Select Exercise</h3>
					<button
						type="button"
						onclick={closePicker}
						class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
					>
						&times;
					</button>
				</div>

				<!-- Search -->
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search exercises..."
					class="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
				/>

				<!-- Equipment Filter -->
				<div class="flex flex-wrap gap-2 mt-3">
					<button
						type="button"
						onclick={() => (selectedEquipment = null)}
						class="px-3 py-1 rounded-full text-xs transition-colors {selectedEquipment === null
							? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
							: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}"
					>
						All
					</button>
					{#each equipmentTypes as eq}
						<button
							type="button"
							onclick={() => (selectedEquipment = selectedEquipment === eq ? null : eq)}
							class="px-3 py-1 rounded-full text-xs capitalize transition-colors {selectedEquipment ===
							eq
								? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
								: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}"
						>
							{eq}
						</button>
					{/each}
				</div>
			</div>

			<!-- Exercise List -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="text-center py-8 text-[var(--color-text-muted)]">Loading exercises...</div>
				{:else if filteredExercises().length === 0}
					<div class="text-center py-8 text-[var(--color-text-muted)]">No exercises found</div>
				{:else}
					<div class="space-y-2">
						{#each filteredExercises() as exercise}
							<button
								type="button"
								onclick={() => selectExercise(exercise)}
								class="w-full text-left p-3 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
							>
								<div class="font-medium text-[var(--color-text-primary)]">{exercise.name}</div>
								<div class="flex items-center gap-2 mt-1">
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
				{/if}
			</div>
		</div>
	</div>
{/if}
