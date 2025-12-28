<script lang="ts">
	import { X, Wand2, Plus, AlertCircle } from 'lucide-svelte';
	import type { FillSuggestion } from '$lib/utils/fillToOptimal';
	import type { ExerciseSlotDraft } from '$lib/types/wizard';

	interface Props {
		suggestions: FillSuggestion[];
		totalSetsToAdd: number;
		onConfirm: (slots: ExerciseSlotDraft[]) => void;
		onClose: () => void;
	}

	let { suggestions, totalSetsToAdd, onConfirm, onClose }: Props = $props();

	// Track which suggestions are selected (default all)
	// Initialize with all suggestions selected
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
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
	<div class="w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
					<Wand2 size={20} class="text-[var(--color-accent)]" />
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
						All target muscles are at or above MEV.
					</p>
				</div>
			{:else}
				<p class="text-sm text-[var(--color-text-secondary)] mb-4">
					Select which muscles to add exercises for:
				</p>

				<div class="space-y-3">
					{#each suggestions as suggestion (suggestion.muscleId)}
						<button
							onclick={() => toggleMuscle(suggestion.muscleId)}
							class="w-full text-left p-4 rounded-xl transition-colors {selectedMuscles.has(suggestion.muscleId)
								? 'bg-[var(--color-accent)]/10 border-2 border-[var(--color-accent)]'
								: 'bg-[var(--color-bg-tertiary)] border-2 border-transparent hover:border-[var(--color-border)]'}"
						>
							<div class="flex items-center justify-between mb-2">
								<span class="font-medium text-[var(--color-text-primary)]">
									{suggestion.muscleName}
								</span>
								<span class="text-sm px-2 py-0.5 rounded-full {selectedMuscles.has(suggestion.muscleId) ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'}">
									+{suggestion.setsToAdd} sets
								</span>
							</div>

							<div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
								<span>{suggestion.currentSets} / {suggestion.targetSets} sets</span>
								<span class="text-[var(--color-text-muted)]">•</span>
								<span class="text-[var(--color-text-secondary)]">
									{suggestion.suggestedExercises[0]?.name || 'No exercise available'}
								</span>
							</div>
						</button>
					{/each}
				</div>

				{#if selectedSuggestions.some(s => s.suggestedExercises.length === 0)}
					<div class="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-3">
						<AlertCircle size={18} class="text-orange-400 flex-shrink-0 mt-0.5" />
						<p class="text-sm text-orange-400">
							Some muscles have no available exercises. Consider adding exercises manually.
						</p>
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
						+{selectedSetsToAdd} total sets
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
						onclick={() => onConfirm(selectedSuggestions.flatMap(s => s.suggestedExercises.slice(0, 1).map(ex => ({
							id: crypto.randomUUID(),
							exerciseId: ex.id,
							exercise: ex,
							slotOrder: 0,
							baseSets: Math.min(s.setsToAdd, 4),
							setProgression: 0.5,
							repRangeMin: ex.default_rep_min,
							repRangeMax: ex.default_rep_max,
							restSeconds: null,
							supersetGroup: null,
							notes: ''
						}))))}
						disabled={selectedMuscles.size === 0 || selectedSuggestions.every(s => s.suggestedExercises.length === 0)}
						class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-bg-primary)] transition-colors"
					>
						<Plus size={18} />
						Add Exercises
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
