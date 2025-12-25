<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import { supabase } from '$lib/db/supabase';
	import { Search, Plus, Filter } from 'lucide-svelte';
	import type { Exercise } from '$lib/types';

	let exercises = $state<Exercise[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let selectedEquipment = $state<string | null>(null);
	let selectedMuscle = $state<string | null>(null);

	const equipmentTypes = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];
	const muscleGroups = ['chest', 'back_lats', 'back_upper', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	$effect(() => {
		if (auth.isAuthenticated) {
			loadExercises();
		}
	});

	async function loadExercises() {
		loading = true;
		const { data, error } = await supabase
			.from('exercises')
			.select('*')
			.order('name');

		if (error) {
			console.error('Error loading exercises:', error);
		} else {
			exercises = data || [];
		}
		loading = false;
	}

	let filteredExercises = $derived(() => {
		return exercises.filter((ex) => {
			const matchesSearch = !searchQuery ||
				ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				ex.aliases?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
			const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
			return matchesSearch && matchesEquipment && matchesMuscle;
		});
	});

	function formatMuscle(muscle: string): string {
		return muscle.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-4xl mx-auto">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Exercises</h1>
						<p class="text-[var(--color-text-secondary)]">Browse and manage your exercise library</p>
					</div>
					<button
						class="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold py-2 px-4 rounded-lg transition-colors"
					>
						<Plus size={20} />
						<span class="hidden sm:inline">Add Exercise</span>
					</button>
				</div>

				<!-- Search and Filters -->
				<div class="mb-6 space-y-4">
					<div class="relative">
						<Search size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search exercises..."
							class="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg pl-12 pr-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
						/>
					</div>

					<div class="flex flex-wrap gap-2">
						<button
							onclick={() => selectedEquipment = null}
							class="px-3 py-1.5 rounded-full text-sm transition-colors {selectedEquipment === null ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
						>
							All Equipment
						</button>
						{#each equipmentTypes as eq}
							<button
								onclick={() => selectedEquipment = selectedEquipment === eq ? null : eq}
								class="px-3 py-1.5 rounded-full text-sm capitalize transition-colors {selectedEquipment === eq ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
							>
								{eq}
							</button>
						{/each}
					</div>
				</div>

				<!-- Exercise List -->
				{#if loading}
					<div class="text-center py-12">
						<div class="text-[var(--color-text-secondary)]">Loading exercises...</div>
					</div>
				{:else if filteredExercises().length === 0}
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
						<div class="text-[var(--color-text-muted)] text-5xl mb-4">🔍</div>
						<h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No Exercises Found</h2>
						<p class="text-[var(--color-text-secondary)]">
							{searchQuery ? 'Try a different search term' : 'Add some exercises to get started'}
						</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each filteredExercises() as exercise}
							<div class="bg-[var(--color-bg-secondary)] rounded-xl p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer">
								<div class="flex items-start justify-between">
									<div>
										<h3 class="font-semibold text-[var(--color-text-primary)]">{exercise.name}</h3>
										<div class="flex flex-wrap items-center gap-2 mt-2">
											<span class="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] capitalize">
												{exercise.equipment}
											</span>
											<span class="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
												{formatMuscle(exercise.primary_muscle)}
											</span>
										</div>
									</div>
									<div class="text-xs text-[var(--color-text-muted)]">
										{exercise.default_rep_min}-{exercise.default_rep_max} reps
									</div>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-4 text-center text-sm text-[var(--color-text-muted)]">
						{filteredExercises().length} exercise{filteredExercises().length !== 1 ? 's' : ''}
					</div>
				{/if}
			</div>
		</div>
	</AppShell>
{/if}
