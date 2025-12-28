<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { workout } from '$lib/stores/workoutStore.svelte';
	import ExercisePicker from '$lib/components/shared/ExercisePicker.svelte';
	import AddExerciseConfirmModal from './AddExerciseConfirmModal.svelte';
	import type { Exercise } from '$lib/types';

	let showPicker = $state(false);
	let showConfirm = $state(false);
	let selectedExercise = $state<Exercise | null>(null);
	let exerciseSettings = $state<{
		sets: number;
		repMin: number;
		repMax: number;
		fromDay?: string;
	} | null>(null);
	let loading = $state(false);

	function handleButtonClick() {
		showPicker = true;
	}

	async function handleExerciseSelect(exercise: Exercise) {
		selectedExercise = exercise;
		showPicker = false;

		// Fetch settings for this exercise
		const existing = await workout.findExerciseSettings(exercise.id);

		if (existing) {
			exerciseSettings = {
				sets: existing.baseSets,
				repMin: existing.repRangeMin,
				repMax: existing.repRangeMax,
				fromDay: existing.fromDay
			};
		} else {
			exerciseSettings = {
				sets: 3,
				repMin: exercise.default_rep_min,
				repMax: exercise.default_rep_max
			};
		}

		showConfirm = true;
	}

	function handlePickerClose() {
		showPicker = false;
	}

	async function handleConfirm(permanent: boolean) {
		if (!selectedExercise) return;

		loading = true;
		const success = await workout.addExercise(selectedExercise, permanent);
		loading = false;

		if (success) {
			showConfirm = false;
			selectedExercise = null;
			exerciseSettings = null;
		}
	}

	function handleCancel() {
		showConfirm = false;
		selectedExercise = null;
		exerciseSettings = null;
	}
</script>

<button
	type="button"
	onclick={handleButtonClick}
	class="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
>
	<Plus size={20} />
	<span>Add Exercise</span>
</button>

<ExercisePicker
	open={showPicker}
	onselect={handleExerciseSelect}
	onclose={handlePickerClose}
/>

{#if selectedExercise && exerciseSettings}
	<AddExerciseConfirmModal
		open={showConfirm}
		exercise={selectedExercise}
		settings={exerciseSettings}
		onconfirm={handleConfirm}
		oncancel={handleCancel}
		{loading}
	/>
{/if}
