<script lang="ts">
	import { workout } from '$lib/stores/workoutStore.svelte';
	import { workoutSettings, type WeightIncrement } from '$lib/stores/workoutSettings.svelte';
	import { Minus, Plus, X, TrendingUp, Zap } from 'lucide-svelte';
	import { getProgressionSuggestion, formatWeightDelta } from '$lib/utils/progression';
	import ScrollWheelPicker from '$lib/components/ui/ScrollWheelPicker.svelte';

	// Local increment state (can be changed per-session)
	let currentIncrement = $state<WeightIncrement>(workoutSettings.defaultWeightIncrement);

	// Get current set data
	const currentExercise = $derived(
		workout.activeSetInput ? workout.exercises[workout.activeSetInput.exerciseIndex] : null
	);
	const currentSet = $derived(
		currentExercise && workout.activeSetInput
			? currentExercise.sets[workout.activeSetInput.setIndex]
			: null
	);

	// Get progression suggestion based on previous session
	const suggestion = $derived(() => {
		if (!currentSet?.previous || !currentExercise) return null;
		return getProgressionSuggestion(
			currentSet.previous,
			currentExercise.slot.rep_range_min,
			currentExercise.slot.rep_range_max
		);
	});

	// Input state
	let weight = $state(0);
	let reps = $state(0);
	let rir = $state<number | null>(null);

	// Get weight from previous set in THIS session (for auto-carry)
	const previousSetWeight = $derived(() => {
		if (!currentExercise || !workout.activeSetInput) return null;
		const setIndex = workout.activeSetInput.setIndex;
		// Look at previous sets in this exercise that are completed
		for (let i = setIndex - 1; i >= 0; i--) {
			const prevSet = currentExercise.sets[i];
			if (prevSet.completed && prevSet.actualWeight !== null) {
				return prevSet.actualWeight;
			}
		}
		return null;
	});

	// Get reps from previous set in THIS session (for repeat functionality)
	const previousSetInSession = $derived(() => {
		if (!currentExercise || !workout.activeSetInput) return null;
		const setIndex = workout.activeSetInput.setIndex;
		for (let i = setIndex - 1; i >= 0; i--) {
			const prevSet = currentExercise.sets[i];
			if (prevSet.completed) {
				return { weight: prevSet.actualWeight, reps: prevSet.actualReps, rir: prevSet.rir };
			}
		}
		return null;
	});

	// Initialize values when modal opens
	$effect(() => {
		if (currentSet) {
			const sugg = suggestion();
			const prevWeight = previousSetWeight();

			// Priority: 1) Already logged value, 2) Previous set this session, 3) Suggestion, 4) Target/default
			if (currentSet.actualWeight !== null) {
				// Editing an already logged set
				weight = currentSet.actualWeight;
				reps = currentSet.actualReps ?? 8;
			} else if (prevWeight !== null) {
				// Auto-carry weight from previous set this session
				weight = prevWeight;
				reps = sugg?.reps ?? currentSet.targetReps ?? 8;
			} else if (sugg) {
				// Use progression suggestion
				weight = sugg.weight;
				reps = sugg.reps;
			} else {
				// Fall back to target/default
				weight = currentSet.targetWeight ?? 0;
				reps = currentSet.targetReps ?? 8;
			}
			rir = currentSet.rir;
		}
	});

	function applySuggestion() {
		const sugg = suggestion();
		if (sugg) {
			weight = sugg.weight;
			reps = sugg.reps;
		}
	}

	function repeatLastSet() {
		const prev = previousSetInSession();
		if (prev) {
			weight = prev.weight ?? weight;
			reps = prev.reps ?? reps;
			rir = prev.rir;
		}
	}

	const repOptions = $derived(workoutSettings.repQuickSelectValues);
	const rirOptions = [0, 1, 2, 3, 4];
	const incrementOptions: WeightIncrement[] = [2.5, 5, 10];

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

			<!-- Quick Actions -->
			{#if suggestion() || previousSetInSession()}
				<div class="mx-4 mt-4 space-y-2">
					<!-- Progression Suggestion -->
					{#if suggestion()}
						{@const sugg = suggestion()}
						<div class="p-3 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30">
							<div class="flex items-center justify-between gap-3">
								<div class="flex items-center gap-2">
									<TrendingUp size={18} class="text-[var(--color-accent)]" />
									<div>
										<p class="text-sm font-medium text-[var(--color-text-primary)]">
											{sugg.weight} lbs × {sugg.reps} reps
											{#if sugg.weightDelta !== 0}
												<span class="text-[var(--color-accent)] font-semibold">
													({formatWeightDelta(sugg.weightDelta)})
												</span>
											{/if}
										</p>
										<p class="text-xs text-[var(--color-text-muted)]">{sugg.reason}</p>
									</div>
								</div>
								<button
									type="button"
									onclick={applySuggestion}
									class="px-3 py-1.5 text-xs font-medium bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-accent-hover)]"
								>
									Apply
								</button>
							</div>
						</div>
					{/if}

					<!-- Repeat Last Set -->
					{#if previousSetInSession()}
						{@const prev = previousSetInSession()}
						<button
							type="button"
							onclick={repeatLastSet}
							class="w-full p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-between gap-3 transition-colors"
						>
							<div class="flex items-center gap-2">
								<Zap size={18} class="text-[var(--color-text-muted)]" />
								<div class="text-left">
									<p class="text-sm font-medium text-[var(--color-text-primary)]">
										Repeat: {prev.weight} × {prev.reps}
										{#if prev.rir !== null}
											<span class="text-[var(--color-text-muted)]">@{prev.rir}</span>
										{/if}
									</p>
									<p class="text-xs text-[var(--color-text-muted)]">Same as previous set</p>
								</div>
							</div>
							<span class="text-xs text-[var(--color-text-muted)]">Tap to apply</span>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Form -->
			<div class="flex-1 overflow-y-auto p-6 space-y-8">
				<!-- Weight Input -->
				<div>
					<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
						Weight (lbs)
					</label>

					{#if workoutSettings.weightInputStyle === 'scroll'}
						<!-- Scroll Wheel Picker -->
						<ScrollWheelPicker
							bind:value={weight}
							min={0}
							max={500}
							step={currentIncrement}
						/>
						<!-- Increment Toggle -->
						<div class="flex justify-center gap-2 mt-3">
							{#each incrementOptions as inc}
								<button
									type="button"
									onclick={() => currentIncrement = inc}
									class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {currentIncrement === inc
										? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
										: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'}"
								>
									{inc}
								</button>
							{/each}
							<span class="text-sm text-[var(--color-text-muted)] self-center ml-1">lbs</span>
						</div>
					{:else}
						<!-- Button-based Input -->
						<div class="flex items-center justify-center gap-4">
							<button
								type="button"
								onclick={() => adjustWeight(-currentIncrement)}
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
								onclick={() => adjustWeight(currentIncrement)}
								class="w-14 h-14 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
							>
								<Plus size={24} />
							</button>
						</div>
						<!-- Increment Toggle for buttons too -->
						<div class="flex justify-center gap-2 mt-3">
							{#each incrementOptions as inc}
								<button
									type="button"
									onclick={() => currentIncrement = inc}
									class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {currentIncrement === inc
										? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
										: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'}"
								>
									{inc}
								</button>
							{/each}
							<span class="text-sm text-[var(--color-text-muted)] self-center ml-1">lbs</span>
						</div>
					{/if}
				</div>

				<!-- Reps Input -->
				<div>
					<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
						Reps
					</label>

					{#if workoutSettings.repInputStyle === 'scroll'}
						<!-- Scroll Wheel for Reps -->
						<ScrollWheelPicker
							bind:value={reps}
							min={1}
							max={30}
							step={1}
						/>
					{:else}
						<!-- Quick-Select Buttons -->
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
					{/if}
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
