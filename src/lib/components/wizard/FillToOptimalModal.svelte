<script lang="ts">
	import { X, Zap, Plus, AlertCircle, Calendar, TrendingUp } from 'lucide-svelte';
	import type { FillSuggestion, SetIncrease } from '$lib/utils/fillToOptimal';
	import type { ExerciseSlotDraft } from '$lib/types/wizard';

	interface Props {
		suggestions: FillSuggestion[];
		totalSetsToAdd: number;
		onConfirm: (newSlots: Map<string, ExerciseSlotDraft[]>, setIncreases: Map<string, number>) => void;
		onClose: () => void;
	}

	let { suggestions, totalSetsToAdd, onConfirm, onClose }: Props = $props();

	// Track which suggestions are selected (default all)
	let selectedMuscles = $state<Set<string>>(new Set());

	$effect(() => {
		// Update selectedMuscles when suggestions change
		selectedMuscles = new Set(suggestions.map((s) => s.muscleId));
	});

	function toggleMuscle(muscleId: string) {
		if (selectedMuscles.has(muscleId)) {
			selectedMuscles.delete(muscleId);
		} else {
			selectedMuscles.add(muscleId);
		}
		selectedMuscles = new Set(selectedMuscles);
	}

	const selectedSuggestions = $derived(suggestions.filter((s) => selectedMuscles.has(s.muscleId)));
	const selectedSetsToAdd = $derived(
		selectedSuggestions.reduce((sum, s) => sum + s.setsToAdd, 0)
	);

	// Count set increases vs new exercises
	const totalSetIncreases = $derived(
		selectedSuggestions.reduce((sum, s) => sum + s.setIncreases.length, 0)
	);
	const totalNewExercises = $derived(
		selectedSuggestions.reduce((sum, s) => {
			if (s.newExerciseSets <= 0 || s.suggestedExercises.length === 0) return sum;
			// Count 1 for first exercise, plus 1 more if second exercise needed
			return sum + 1 + (s.newExerciseSets > 4 && s.suggestedExercises.length > 1 ? 1 : 0);
		}, 0)
	);

	// Group suggestions by day for display
	const suggestionsByDay = $derived.by(() => {
		const groups = new Map<string, { dayName: string; suggestions: FillSuggestion[] }>();
		for (const s of selectedSuggestions) {
			// For set increases
			for (const inc of s.setIncreases) {
				if (!groups.has(inc.dayId)) {
					groups.set(inc.dayId, { dayName: inc.dayName, suggestions: [] });
				}
			}
			// For new exercises
			if (s.targetDayId && s.newExerciseSets > 0) {
				if (!groups.has(s.targetDayId)) {
					groups.set(s.targetDayId, { dayName: s.targetDayName, suggestions: [] });
				}
				groups.get(s.targetDayId)!.suggestions.push(s);
			}
		}
		return groups;
	});

	function handleConfirm() {
		// Create slots grouped by day for new exercises
		const newSlots = new Map<string, ExerciseSlotDraft[]>();
		// Create set increases map (slotId -> newSetCount)
		const setIncreases = new Map<string, number>();

		for (const suggestion of selectedSuggestions) {
			// Apply set increases
			for (const increase of suggestion.setIncreases) {
				setIncreases.set(increase.slotId, increase.newSets);
			}

			// Add new exercises
			if (suggestion.newExerciseSets > 0 && suggestion.suggestedExercises.length > 0) {
				const dayId = suggestion.targetDayId;
				if (!dayId) continue;

				if (!newSlots.has(dayId)) {
					newSlots.set(dayId, []);
				}

				const daySlots = newSlots.get(dayId)!;
				const exercise = suggestion.suggestedExercises[0];
				const setsForFirst = Math.min(suggestion.newExerciseSets, 4);

				daySlots.push({
					id: crypto.randomUUID(),
					exerciseId: exercise.id,
					exercise: exercise,
					slotOrder: 0, // Will be set by parent
					baseSets: setsForFirst,
					setProgression: 0.5,
					repRangeMin: exercise.default_rep_min,
					repRangeMax: exercise.default_rep_max,
					restSeconds: null,
					supersetGroup: null,
					notes: ''
				});

				// If we need more than 4 sets, add a second exercise
				if (suggestion.newExerciseSets > 4 && suggestion.suggestedExercises.length > 1) {
					const secondExercise = suggestion.suggestedExercises[1];
					const remainingSets = Math.min(suggestion.newExerciseSets - 4, 4);

					daySlots.push({
						id: crypto.randomUUID(),
						exerciseId: secondExercise.id,
						exercise: secondExercise,
						slotOrder: 0, // Will be set by parent
						baseSets: remainingSets,
						setProgression: 0.5,
						repRangeMin: secondExercise.default_rep_min,
						repRangeMax: secondExercise.default_rep_max,
						restSeconds: null,
						supersetGroup: null,
						notes: ''
					});
				}
			}
		}

		onConfirm(newSlots, setIncreases);
	}

	// Check if any suggestion has something actionable
	const hasActionableItems = $derived(
		selectedSuggestions.some(s => s.setIncreases.length > 0 || (s.newExerciseSets > 0 && s.suggestedExercises.length > 0))
	);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
	<div class="w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
					<Zap size={20} class="text-amber-400" />
				</div>
				<div>
					<h2 class="font-semibold text-[var(--color-text-primary)]">Fill to Optimal</h2>
					<p class="text-sm text-[var(--color-text-muted)]">
						{suggestions.length} muscle{suggestions.length !== 1 ? 's' : ''} below MEV
					</p>
				</div>
			</div>
			<button
				onclick={onClose}
				class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors"
			>
				<X size={20} />
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if suggestions.length === 0}
				<div class="text-center py-8">
					<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
						<Plus size={32} class="text-green-400" />
					</div>
					<h3 class="font-medium text-[var(--color-text-primary)] mb-2">You're at optimal volume!</h3>
					<p class="text-sm text-[var(--color-text-muted)]">
						All target muscles are at or above MEV for the week.
					</p>
				</div>
			{:else}
				<p class="text-sm text-[var(--color-text-secondary)] mb-4">
					Select which muscles to optimize:
				</p>

				<div class="space-y-3">
					{#each suggestions as suggestion (suggestion.muscleId)}
						<button
							onclick={() => toggleMuscle(suggestion.muscleId)}
							class="w-full text-left p-4 rounded-xl transition-colors {selectedMuscles.has(suggestion.muscleId)
								? 'bg-amber-500/10 border-2 border-amber-500'
								: 'bg-[var(--color-bg-tertiary)] border-2 border-transparent hover:border-[var(--color-border)]'}"
						>
							<div class="flex items-center justify-between mb-2">
								<span class="font-medium text-[var(--color-text-primary)]">
									{suggestion.muscleName}
								</span>
								<span class="text-sm px-2 py-0.5 rounded-full {selectedMuscles.has(suggestion.muscleId) ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'}">
									+{suggestion.setsToAdd} sets
								</span>
							</div>

							<div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-2">
								<span>{suggestion.currentSets} / {suggestion.targetSets} weekly sets</span>
							</div>

							<!-- Set Increases -->
							{#if suggestion.setIncreases.length > 0}
								<div class="space-y-1 mt-2">
									{#each suggestion.setIncreases as inc}
										<div class="flex items-center gap-2 text-xs">
											<TrendingUp size={12} class="text-green-400" />
											<span class="text-green-400">
												{inc.exerciseName}: {inc.currentSets} → {inc.newSets} sets
											</span>
											<span class="text-[var(--color-text-muted)]">({inc.dayName})</span>
										</div>
									{/each}
								</div>
							{/if}

							<!-- New Exercises -->
							{#if suggestion.newExerciseSets > 0 && suggestion.suggestedExercises.length > 0}
								<div class="flex items-center gap-2 text-xs mt-1">
									<Plus size={12} class="text-[var(--color-accent)]" />
									<span class="text-[var(--color-accent)]">
										Add {suggestion.suggestedExercises[0]?.name}: {Math.min(suggestion.newExerciseSets, 4)} sets
									</span>
									<span class="text-[var(--color-text-muted)]">({suggestion.targetDayName})</span>
								</div>
								{#if suggestion.newExerciseSets > 4 && suggestion.suggestedExercises.length > 1}
									<div class="flex items-center gap-2 text-xs mt-1">
										<Plus size={12} class="text-[var(--color-accent)]" />
										<span class="text-[var(--color-accent)]">
											Add {suggestion.suggestedExercises[1]?.name}: {Math.min(suggestion.newExerciseSets - 4, 4)} sets
										</span>
										<span class="text-[var(--color-text-muted)]">({suggestion.targetDayName})</span>
									</div>
								{/if}
							{:else if suggestion.setIncreases.length === 0}
								<div class="flex items-center gap-2 text-xs mt-1 text-orange-400">
									<AlertCircle size={12} />
									<span>No exercises available</span>
								</div>
							{/if}
						</button>
					{/each}
				</div>

				{#if selectedSuggestions.some(s => s.setIncreases.length === 0 && s.suggestedExercises.length === 0)}
					<div class="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-3">
						<AlertCircle size={18} class="text-orange-400 flex-shrink-0 mt-0.5" />
						<p class="text-sm text-orange-400">
							Some muscles have no available exercises. Consider adding exercises manually.
						</p>
					</div>
				{/if}

				<!-- Summary -->
				{#if totalSetIncreases > 0 || totalNewExercises > 0}
					<div class="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-xl">
						<p class="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Summary:</p>
						<div class="space-y-1 text-sm">
							{#if totalSetIncreases > 0}
								<div class="flex items-center gap-2">
									<TrendingUp size={14} class="text-green-400" />
									<span class="text-[var(--color-text-muted)]">
										Increase sets on {totalSetIncreases} existing exercise{totalSetIncreases !== 1 ? 's' : ''}
									</span>
								</div>
							{/if}
							{#if totalNewExercises > 0}
								<div class="flex items-center gap-2">
									<Plus size={14} class="text-[var(--color-accent)]" />
									<span class="text-[var(--color-text-muted)]">
										Add {totalNewExercises} new exercise{totalNewExercises !== 1 ? 's' : ''}
									</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Footer -->
		{#if suggestions.length > 0}
			<div class="p-4 border-t border-[var(--color-border)]">
				<div class="flex items-center justify-between mb-3 text-sm">
					<span class="text-[var(--color-text-muted)]">
						{selectedMuscles.size} muscle{selectedMuscles.size !== 1 ? 's' : ''} selected
					</span>
					<span class="font-medium text-[var(--color-text-primary)]">
						+{selectedSetsToAdd} total sets/week
					</span>
				</div>

				<div class="flex gap-3">
					<button
						onclick={onClose}
						class="flex-1 py-3 rounded-xl font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] transition-colors"
					>
						Cancel
					</button>
					<button
						onclick={handleConfirm}
						disabled={selectedMuscles.size === 0 || !hasActionableItems}
						class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-colors"
					>
						<Zap size={18} />
						Apply
					</button>
				</div>
			</div>
		{:else}
			<div class="p-4 border-t border-[var(--color-border)]">
				<button
					onclick={onClose}
					class="w-full py-3 rounded-xl font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] transition-colors"
				>
					Done
				</button>
			</div>
		{/if}
	</div>
</div>
