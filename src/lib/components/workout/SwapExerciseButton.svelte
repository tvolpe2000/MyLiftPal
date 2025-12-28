<script lang="ts">
	import { ArrowLeftRight } from 'lucide-svelte';
	import { workout } from '$lib/stores/workoutStore.svelte';
	import ExercisePicker from '$lib/components/shared/ExercisePicker.svelte';
	import SwapConfirmModal from './SwapConfirmModal.svelte';
	import type { ExerciseState } from '$lib/types/workout';
	import type { Exercise } from '$lib/types';

	interface Props {
		exerciseIndex: number;
		exercise: ExerciseState;
	}

	let { exerciseIndex, exercise }: Props = $props();

	let showPicker = $state(false);
	let showConfirm = $state(false);
	let selectedExercise = $state<Exercise | null>(null);
	let loading = $state(false);

	// Get current exercise IDs in the workout to exclude from picker
	const excludeExerciseIds = $derived(
		workout.exercises.map((ex) => ex.slot.exercise?.id).filter((id): id is string => !!id)
	);

	function handleButtonClick(e: MouseEvent) {
		e.stopPropagation(); // Prevent card expand/collapse
		showPicker = true;
	}

	function handleExerciseSelect(newExercise: Exercise) {
		selectedExercise = newExercise;
		showPicker = false;
		showConfirm = true;
	}

	function handlePickerClose() {
		showPicker = false;
	}

	async function handleConfirm(permanent: boolean) {
		if (!selectedExercise) return;

		loading = true;
		const success = await workout.swapExercise(exerciseIndex, selectedExercise, permanent);
		loading = false;

		if (success) {
			showConfirm = false;
			selectedExercise = null;
		}
	}

	function handleCancel() {
		showConfirm = false;
		selectedExercise = null;
	}
</script>

<button
	type="button"
	onclick={handleButtonClick}
	class="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
	title="Swap exercise"
>
	<ArrowLeftRight size={18} />
</button>

<ExercisePicker
	open={showPicker}
	onselect={handleExerciseSelect}
	onclose={handlePickerClose}
	preselectedMuscle={exercise.slot.exercise?.primary_muscle}
	{excludeExerciseIds}
/>

{#if exercise.slot.exercise && selectedExercise}
	<SwapConfirmModal
		open={showConfirm}
		oldExercise={exercise.slot.exercise}
		newExercise={selectedExercise}
		onconfirm={handleConfirm}
		oncancel={handleCancel}
		{loading}
	/>
{/if}
