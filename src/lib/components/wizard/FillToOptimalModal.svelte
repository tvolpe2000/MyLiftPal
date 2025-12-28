<script lang="ts">
	import { X, Zap, Plus, AlertCircle, Calendar } from 'lucide-svelte';
	import type { FillSuggestion } from '$lib/utils/fillToOptimal';
	import type { ExerciseSlotDraft } from '$lib/types/wizard';

	interface Props {
		suggestions: FillSuggestion[];
		totalSetsToAdd: number;
		onConfirm: (slotsByDay: Map<string, ExerciseSlotDraft[]>) => void;
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

	// Group suggestions by day for display
	const suggestionsByDay = $derived.by(() => {
		const groups = new Map<string, { dayName: string; suggestions: FillSuggestion[] }>();
		for (const s of selectedSuggestions) {
			if (!groups.has(s.targetDayId)) {
				groups.set(s.targetDayId, { dayName: s.targetDayName, suggestions: [] });
			}
			groups.get(s.targetDayId)!.suggestions.push(s);
		}
		return groups;
	});

	function handleConfirm() {
		// Create slots grouped by day
		const slotsByDay = new Map<string, ExerciseSlotDraft[]>();

		for (const suggestion of selectedSuggestions) {
			if (suggestion.suggestedExercises.length === 0) continue;

			const dayId = suggestion.targetDayId;
			if (!slotsByDay.has(dayId)) {
				slotsByDay.set(dayId, []);
			}

			const daySlots = slotsByDay.get(dayId)!;
			const exercise = suggestion.suggestedExercises[0];

			daySlots.push({
				id: crypto.randomUUID(),
				exerciseId: exercise.id,
				exercise: exercise,
				slotOrder: 0, // Will be set by parent
				baseSets: Math.min(suggestion.setsToAdd, 4),
				setProgression: 0.5,
				repRangeMin: exercise.default_rep_min,
				repRangeMax: exercise.default_rep_max,
				restSeconds: null,
				supersetGroup: null,
				notes: ''
			});
		}

		onConfirm(slotsByDay);
	}
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
					Weekly volume gaps detected. Select which muscles to add exercises for:
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

							<div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
								<span>{suggestion.currentSets} / {suggestion.targetSets} weekly sets</span>
								<span class="text-[var(--color-text-muted)]">•</span>
								<span class="flex items-center gap-1 text-[var(--color-text-secondary)]">
									<Calendar size={12} />
									{suggestion.targetDayName}
								</span>
							</div>

							{#if suggestion.suggestedExercises.length > 0}
								<div class="mt-2 text-xs text-[var(--color-accent)]">
									→ {suggestion.suggestedExercises[0]?.name}
								</div>
							{/if}
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

				<!-- Summary by Day -->
				{#if suggestionsByDay.size > 1}
					<div class="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-xl">
						<p class="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Will add to:</p>
						<div class="space-y-1">
							{#each [...suggestionsByDay.entries()] as [dayId, group] (dayId)}
								<div class="flex items-center justify-between text-sm">
									<span class="text-[var(--color-text-muted)]">{group.dayName}</span>
									<span class="text-[var(--color-text-primary)]">
										{group.suggestions.length} exercise{group.suggestions.length !== 1 ? 's' : ''}
									</span>
								</div>
							{/each}
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
						disabled={selectedMuscles.size === 0 || selectedSuggestions.every(s => s.suggestedExercises.length === 0)}
						class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-colors"
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
