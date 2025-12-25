<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { Minus, Plus, X } from 'lucide-svelte';

	// Get current set data
	const currentExercise = $derived(
		workout.activeSetInput ? workout.exercises[workout.activeSetInput.exerciseIndex] : null
	);
	const currentSet = $derived(
		currentExercise && workout.activeSetInput
			? currentExercise.sets[workout.activeSetInput.setIndex]
			: null
	);

	// Input state
	let weight = $state(0);
	let reps = $state(0);
	let rir = $state<number | null>(null);

	// Initialize values when modal opens
	$effect(() => {
		if (currentSet) {
			weight = currentSet.actualWeight ?? currentSet.targetWeight ?? 0;
			reps = currentSet.actualReps ?? currentSet.targetReps ?? 8;
			rir = currentSet.rir;
		}
	});

	const repOptions = [6, 8, 10, 12, 15];
	const rirOptions = [0, 1, 2, 3, 4];

	function adjustWeight(delta: number) {
		weight = Math.max(0, weight + delta);
	}

	function handleSave() {
		workout.logSet({ weight, reps, rir });
	}

	function handleClose() {
		workout.closeSetInput();
	}
</script>

{#if workout.activeSetInput && currentExercise && currentSet}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[9999] flex flex-col" onclick={handleClose}>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/80"></div>

		<!-- Modal Container -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative flex-1 flex flex-col bg-[var(--color-bg-primary)] sm:m-auto sm:flex-initial sm:w-full sm:max-w-md sm:max-h-[90vh] sm:rounded-xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
				<div>
					<h3 class="font-semibold text-[var(--color-text-primary)]">
						{currentExercise.slot.exercise?.name}
					</h3>
					<p class="text-sm text-[var(--color-text-secondary)]">Set {currentSet.setNumber}</p>
				</div>
				<button
					type="button"
					onclick={handleClose}
					class="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Form -->
			<div class="flex-1 overflow-y-auto p-6 space-y-8">
				<!-- Weight Input -->
				<div>
					<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
						Weight (lbs)
					</label>
					<div class="flex items-center justify-center gap-4">
						<button
							type="button"
							onclick={() => adjustWeight(-5)}
							class="w-14 h-14 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
						>
							<Minus size={24} />
						</button>
						<input
							type="number"
							bind:value={weight}
							class="w-32 text-center text-4xl font-bold bg-transparent text-[var(--color-text-primary)] focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => adjustWeight(5)}
							class="w-14 h-14 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
						>
							<Plus size={24} />
						</button>
					</div>
				</div>

				<!-- Reps Input -->
				<div>
					<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
						Reps
					</label>
					<div class="flex items-center justify-center gap-2">
						{#each repOptions as option}
							<button
								type="button"
								onclick={() => (reps = option)}
								class="w-12 h-12 rounded-full font-semibold transition-colors {reps === option
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}"
							>
								{option}
							</button>
						{/each}
					</div>
					<div class="flex items-center justify-center gap-4 mt-3">
						<button
							type="button"
							onclick={() => (reps = Math.max(1, reps - 1))}
							class="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
						>
							<Minus size={18} />
						</button>
						<span class="text-2xl font-bold text-[var(--color-text-primary)] w-12 text-center">
							{reps}
						</span>
						<button
							type="button"
							onclick={() => (reps = reps + 1)}
							class="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
						>
							<Plus size={18} />
						</button>
					</div>
				</div>

				<!-- RIR Input -->
				<div>
					<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
						RIR (Reps in Reserve)
					</label>
					<div class="flex items-center justify-center gap-2">
						{#each rirOptions as option}
							<button
								type="button"
								onclick={() => (rir = rir === option ? null : option)}
								class="w-12 h-12 rounded-full font-semibold transition-colors {rir === option
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}"
							>
								{option}
							</button>
						{/each}
					</div>
					<p class="text-center text-xs text-[var(--color-text-muted)] mt-2">
						How many more reps could you have done?
					</p>
				</div>
			</div>

			<!-- Save Button -->
			<div class="p-4 border-t border-[var(--color-border)]">
				<button
					type="button"
					onclick={handleSave}
					disabled={workout.isSaving}
					class="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-[var(--color-bg-primary)] font-semibold py-4 rounded-xl transition-colors text-lg"
				>
					{#if workout.isSaving}
						Saving...
					{:else}
						Log Set
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
