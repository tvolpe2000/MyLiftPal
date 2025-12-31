<script lang="ts">
	import { WORKOUT_TEMPLATES, type WorkoutTemplate } from '$lib/data/templates';
	import { Calendar, Dumbbell, X, Check, FileText } from 'lucide-svelte';

	interface Props {
		onSelect: (template: WorkoutTemplate, includeExercises: boolean) => void;
		onClose: () => void;
	}

	let { onSelect, onClose }: Props = $props();

	let selectedTemplate = $state<WorkoutTemplate | null>(null);
	let includeExercises = $state(true);

	function getCategoryColor(category: string): string {
		switch (category) {
			case 'strength':
				return 'bg-blue-500/20 text-blue-400';
			case 'hypertrophy':
				return 'bg-green-500/20 text-green-400';
			case 'powerbuilding':
				return 'bg-purple-500/20 text-purple-400';
			default:
				return 'bg-gray-500/20 text-gray-400';
		}
	}

	function handleConfirm() {
		if (selectedTemplate) {
			onSelect(selectedTemplate, includeExercises);
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="template-picker-open fixed inset-0 z-[9999] flex flex-col" onclick={onClose}>
	<!-- Backdrop -->
	<div class="absolute inset-0 bg-black/80"></div>

	<!-- Modal Container -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="relative flex-1 flex flex-col bg-[var(--color-bg-primary)] sm:m-auto sm:flex-initial sm:w-full sm:max-w-lg sm:max-h-[85vh] sm:rounded-xl sm:shadow-2xl overflow-hidden"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="p-4 border-b border-[var(--color-border)] flex-shrink-0">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<FileText size={20} class="text-[var(--color-accent)]" />
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Choose a Template</h3>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors text-xl"
				>
					<X size={18} />
				</button>
			</div>
			<p class="text-sm text-[var(--color-text-secondary)] mt-2">
				Select a pre-built program to get started quickly
			</p>
		</div>

		<!-- Template List -->
		<div class="flex-1 overflow-y-auto p-4 min-h-0">
			<div class="space-y-3">
				{#each WORKOUT_TEMPLATES as template (template.id)}
					{@const isSelected = selectedTemplate?.id === template.id}
					<button
						type="button"
						onclick={() => (selectedTemplate = template)}
						class="w-full text-left p-4 rounded-xl transition-all {isSelected
							? 'bg-[var(--color-accent-muted)] border-2 border-[var(--color-accent)]'
							: 'bg-[var(--color-bg-secondary)] border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'}"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<span class="font-semibold text-[var(--color-text-primary)]">
										{template.name}
									</span>
									<span class="text-xs px-2 py-0.5 rounded-full capitalize {getCategoryColor(template.category)}">
										{template.category}
									</span>
								</div>
								<p class="text-sm text-[var(--color-text-secondary)] mb-2">
									{template.description}
								</p>
								<div class="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
									<span class="flex items-center gap-1">
										<Calendar size={12} />
										{template.daysPerWeek} days/week
									</span>
									<span class="flex items-center gap-1">
										<Dumbbell size={12} />
										{template.days.reduce((acc, d) => acc + (d.exercises?.length || 0), 0)} exercises
									</span>
								</div>
							</div>
							{#if isSelected}
								<div class="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
									<Check size={14} class="text-[var(--color-bg-primary)]" />
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Footer with Options -->
		{#if selectedTemplate}
			<div class="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
				<!-- Include Exercises Toggle -->
				<div class="flex items-center justify-between mb-4">
					<div>
						<span class="text-sm font-medium text-[var(--color-text-primary)]">Include exercises</span>
						<p class="text-xs text-[var(--color-text-muted)]">
							{includeExercises ? 'Pre-fill with recommended exercises' : 'Only set up days and muscles'}
						</p>
					</div>
					<button
						type="button"
						onclick={() => (includeExercises = !includeExercises)}
						aria-label="Toggle include exercises"
						aria-pressed={includeExercises}
						class="w-12 h-7 rounded-full transition-colors relative {includeExercises
							? 'bg-[var(--color-accent)]'
							: 'bg-[var(--color-bg-tertiary)]'}"
					>
						<div
							class="w-5 h-5 rounded-full bg-white absolute top-1 transition-all {includeExercises
								? 'left-6'
								: 'left-1'}"
						></div>
					</button>
				</div>

				<!-- Confirm Button -->
				<button
					type="button"
					onclick={handleConfirm}
					class="w-full py-3 rounded-lg font-semibold bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] transition-colors"
				>
					Use {selectedTemplate.name}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Prevent body scroll when modal is open */
	:global(body:has(.template-picker-open)) {
		overflow: hidden;
	}
</style>
