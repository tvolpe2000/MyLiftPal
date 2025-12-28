<script lang="ts">
	import { X, ArrowRightLeft } from 'lucide-svelte';
	import type { Exercise } from '$lib/types';

	interface Props {
		open: boolean;
		oldExercise: Exercise;
		newExercise: Exercise;
		onconfirm: (permanent: boolean) => void;
		oncancel: () => void;
		loading?: boolean;
	}

	let { open, oldExercise, newExercise, onconfirm, oncancel, loading = false }: Props = $props();

	function handleBackdropClick() {
		if (!loading) {
			oncancel();
		}
	}

	function formatMuscle(muscle: string): string {
		return muscle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" onclick={handleBackdropClick}>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/80"></div>

		<!-- Modal -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative w-full max-w-sm bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-start gap-4 p-5">
				<div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
					<ArrowRightLeft size={20} />
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="font-semibold text-[var(--color-text-primary)] text-lg">Swap Exercise</h3>
				</div>
				<button
					type="button"
					onclick={oncancel}
					disabled={loading}
					class="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Exercise Change Display -->
			<div class="px-5 pb-4">
				<div class="flex items-center gap-3">
					<!-- Old Exercise -->
					<div class="flex-1 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
						<div class="text-sm text-[var(--color-text-muted)] mb-1">From</div>
						<div class="font-medium text-[var(--color-text-primary)] truncate">{oldExercise.name}</div>
						<div class="text-xs text-[var(--color-text-muted)] mt-1">{formatMuscle(oldExercise.primary_muscle)}</div>
					</div>

					<!-- Arrow -->
					<div class="flex-shrink-0 text-[var(--color-accent)]">
						<ArrowRightLeft size={20} />
					</div>

					<!-- New Exercise -->
					<div class="flex-1 p-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30">
						<div class="text-sm text-[var(--color-accent)] mb-1">To</div>
						<div class="font-medium text-[var(--color-text-primary)] truncate">{newExercise.name}</div>
						<div class="text-xs text-[var(--color-text-muted)] mt-1">{formatMuscle(newExercise.primary_muscle)}</div>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="p-5 pt-2 space-y-3">
				<button
					type="button"
					onclick={() => onconfirm(false)}
					disabled={loading}
					class="w-full py-3.5 px-4 rounded-xl font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
				>
					{#if loading}
						<span class="flex items-center justify-center gap-2">
							<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
						</span>
					{:else}
						Just This Session
					{/if}
				</button>
				<button
					type="button"
					onclick={() => onconfirm(true)}
					disabled={loading}
					class="w-full py-3.5 px-4 rounded-xl font-medium bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
				>
					{#if loading}
						<span class="flex items-center justify-center gap-2">
							<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
						</span>
					{:else}
						All Future Workouts
					{/if}
				</button>
				<p class="text-xs text-center text-[var(--color-text-muted)] pt-1">
					Sets you already logged stay with the original exercise
				</p>
			</div>
		</div>
	</div>
{/if}
