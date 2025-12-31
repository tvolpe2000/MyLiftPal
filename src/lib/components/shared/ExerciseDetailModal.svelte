<script lang="ts">
	import { X, Dumbbell, Play, ExternalLink } from 'lucide-svelte';
	import MuscleDisplay from '$lib/components/ui/MuscleDisplay.svelte';
	import type { Exercise } from '$lib/types';

	interface Props {
		open: boolean;
		exercise: Exercise | null;
		onclose: () => void;
	}

	let { open, exercise, onclose }: Props = $props();

	function handleBackdropClick() {
		onclose();
	}

	// Format equipment for display
	function formatEquipment(equipment: string): string {
		return equipment
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Get display name for muscle
	function formatMuscle(muscle: string): string {
		const muscleNames: Record<string, string> = {
			chest: 'Chest',
			back_lats: 'Lats',
			back_lower: 'Lower Back',
			biceps: 'Biceps',
			triceps: 'Triceps',
			front_delts: 'Front Delts',
			side_delts: 'Side Delts',
			rear_delts: 'Rear Delts',
			traps: 'Traps',
			forearms: 'Forearms',
			abs: 'Abs',
			obliques: 'Obliques',
			quads: 'Quads',
			hamstrings: 'Hamstrings',
			glutes: 'Glutes',
			calves: 'Calves'
		};
		return muscleNames[muscle] || muscle;
	}
</script>

{#if open && exercise}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[9999] flex flex-col" onclick={handleBackdropClick}>
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
				<h3 class="font-semibold text-lg text-[var(--color-text-primary)] pr-4">
					{exercise.name}
				</h3>
				<button
					type="button"
					onclick={onclose}
					class="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex-shrink-0"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Scrollable Content -->
			<div class="flex-1 overflow-y-auto">
				<!-- Image/Animation Section -->
				<div class="p-4">
					{#if exercise.image_url}
						<img
							src={exercise.image_url}
							alt={exercise.name}
							class="w-full h-48 object-cover rounded-lg bg-[var(--color-bg-tertiary)]"
							loading="lazy"
						/>
					{:else}
						<!-- Placeholder when no image -->
						<div
							class="w-full h-48 bg-[var(--color-bg-tertiary)] rounded-lg flex flex-col items-center justify-center"
						>
							<Dumbbell size={48} class="text-[var(--color-text-muted)]" />
							<p class="text-sm text-[var(--color-text-muted)] mt-2">No image available</p>
						</div>
					{/if}

					<!-- Watch Video Button -->
					{#if exercise.video_url}
						<a
							href={exercise.video_url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 mt-3 px-4 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors border border-[var(--color-border)]"
						>
							<Play size={18} class="text-[var(--color-accent)]" />
							<span class="text-[var(--color-text-primary)] font-medium">Watch Video</span>
							<ExternalLink size={14} class="text-[var(--color-text-muted)]" />
						</a>
					{/if}
				</div>

				<!-- Muscle Diagram & Info Section -->
				<div class="px-4 pb-4">
					<div
						class="flex gap-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]"
					>
						<!-- Muscle Diagram -->
						<MuscleDisplay
							primaryMuscle={exercise.primary_muscle}
							secondaryMuscles={exercise.secondary_muscles}
							size="md"
						/>

						<!-- Exercise Info -->
						<div class="flex-1 space-y-3">
							<!-- Primary Muscle -->
							<div>
								<p class="text-xs text-[var(--color-text-muted)] mb-1">Primary</p>
								<span
									class="inline-block px-2.5 py-1 text-sm font-medium rounded-full bg-[var(--color-accent)] text-[var(--color-bg-primary)]"
								>
									{formatMuscle(exercise.primary_muscle)}
								</span>
							</div>

							<!-- Secondary Muscles -->
							{#if exercise.secondary_muscles && exercise.secondary_muscles.length > 0}
								<div>
									<p class="text-xs text-[var(--color-text-muted)] mb-1">Secondary</p>
									<div class="flex flex-wrap gap-1.5">
										{#each exercise.secondary_muscles as secondary}
											<span
												class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
											>
												{formatMuscle(secondary.muscle)}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Equipment -->
							<div>
								<p class="text-xs text-[var(--color-text-muted)] mb-1">Equipment</p>
								<p class="text-sm text-[var(--color-text-primary)]">
									{formatEquipment(exercise.equipment)}
								</p>
							</div>

							<!-- Rep Range -->
							<div>
								<p class="text-xs text-[var(--color-text-muted)] mb-1">Recommended Reps</p>
								<p class="text-sm text-[var(--color-text-primary)]">
									{exercise.default_rep_min}-{exercise.default_rep_max} reps
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Form Tips Section -->
				{#if exercise.cues && exercise.cues.length > 0}
					<div class="px-4 pb-6">
						<h4 class="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Form Tips</h4>
						<ul class="space-y-2">
							{#each exercise.cues as cue}
								<li class="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
									<span class="text-[var(--color-accent)] mt-0.5 flex-shrink-0">•</span>
									<span>{cue}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
