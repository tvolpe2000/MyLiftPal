<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/db/supabase';
	import AppShell from '$lib/components/AppShell.svelte';
	import { Plus, Calendar, Dumbbell, ChevronRight, Play, Pause, CheckCircle, BarChart3, Clock } from 'lucide-svelte';
	import { calculateWeeklyVolume, getVolumeBarColor } from '$lib/utils/volume';
	import type { MuscleVolume, MuscleGroupData, ExerciseForVolume } from '$lib/utils/volume';
	import { calculateDayTime } from '$lib/utils/time';
	import type { ExerciseSlotForTime } from '$lib/utils/time';
	import type { TrainingBlockStatus, SecondaryMuscle } from '$lib/types/database';
	import { calculateSetsForWeek } from '$lib/types/wizard';

	interface ExerciseSlotData {
		base_sets: number;
		set_progression: number;
		rest_seconds: number | null;
		exercise: {
			primary_muscle: string;
			secondary_muscles: SecondaryMuscle[];
			work_seconds: number;
			default_rest_seconds: number;
		};
	}

	interface WorkoutDayData {
		id: string;
		name: string;
		exercise_slots: ExerciseSlotData[];
	}

	interface TrainingBlock {
		id: string;
		name: string;
		total_weeks: number;
		current_week: number;
		current_day: number;
		status: TrainingBlockStatus;
		started_at: string;
		workout_days: WorkoutDayData[];
	}

	let blocks = $state<TrainingBlock[]>([]);
	let muscleGroups = $state<MuscleGroupData[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	$effect(() => {
		if (auth.isAuthenticated) {
			loadBlocks();
			loadMuscleGroups();
		}
	});

	async function loadMuscleGroups() {
		const { data } = await supabase
			.from('muscle_groups')
			.select('id, display_name, mv, mev, mav, mrv, color');

		if (data) {
			muscleGroups = data as MuscleGroupData[];
		}
	}

	async function loadBlocks() {
		if (!auth.user) return;

		loading = true;
		error = '';

		const { data, error: fetchError } = await supabase
			.from('training_blocks')
			.select(`
				id,
				name,
				total_weeks,
				current_week,
				current_day,
				status,
				started_at,
				workout_days (
					id,
					name,
					exercise_slots (
						base_sets,
						set_progression,
						rest_seconds,
						exercise:exercises (
							primary_muscle,
							secondary_muscles,
							work_seconds,
							default_rest_seconds
						)
					)
				)
			`)
			.eq('user_id', auth.user.id)
			.order('created_at', { ascending: false });

		if (fetchError) {
			console.error('Error loading blocks:', fetchError);
			error = 'Failed to load training blocks';
		} else {
			blocks = (data as unknown as TrainingBlock[]) || [];
		}

		loading = false;
	}

	// Calculate volume for a block
	function getBlockVolume(block: TrainingBlock): MuscleVolume[] {
		if (!block.workout_days || muscleGroups.length === 0) return [];

		const exercises: ExerciseForVolume[] = [];

		for (const day of block.workout_days) {
			for (const slot of day.exercise_slots || []) {
				const setsPerWeek = calculateSetsForWeek(
					slot.base_sets,
					slot.set_progression,
					block.current_week
				);
				exercises.push({
					primaryMuscle: slot.exercise?.primary_muscle || '',
					secondaryMuscles: slot.exercise?.secondary_muscles || [],
					setsPerWeek
				});
			}
		}

		return calculateWeeklyVolume(exercises, muscleGroups);
	}

	// Calculate total estimated time per week for a block
	function getBlockTime(block: TrainingBlock): number {
		if (!block.workout_days) return 0;

		let totalMinutes = 0;

		for (const day of block.workout_days) {
			const slotsForTime: ExerciseSlotForTime[] = (day.exercise_slots || []).map((slot) => ({
				baseSets: slot.base_sets,
				setProgression: slot.set_progression,
				restSeconds: slot.rest_seconds,
				exercise: slot.exercise
					? {
							work_seconds: slot.exercise.work_seconds ?? 45,
							default_rest_seconds: slot.exercise.default_rest_seconds ?? 90
						}
					: undefined
			}));

			const dayTime = calculateDayTime(slotsForTime, block.current_week, null, day.id, day.name);
			totalMinutes += dayTime.totalMinutes;
		}

		return totalMinutes;
	}

	function getStatusIcon(status: TrainingBlockStatus) {
		switch (status) {
			case 'active':
				return Play;
			case 'paused':
				return Pause;
			case 'completed':
				return CheckCircle;
		}
	}

	function getStatusColor(status: TrainingBlockStatus): string {
		switch (status) {
			case 'active':
				return 'text-green-400';
			case 'paused':
				return 'text-yellow-400';
			case 'completed':
				return 'text-[var(--color-accent)]';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-4xl mx-auto">
				<div class="flex items-center justify-between mb-8">
					<div>
						<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Training Blocks</h1>
						<p class="text-[var(--color-text-secondary)]">Plan and manage your mesocycles</p>
					</div>
					<a
						href="/blocks/new"
						class="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold py-2 px-4 rounded-lg transition-colors"
					>
						<Plus size={20} />
						<span>New Block</span>
					</a>
				</div>

				{#if loading}
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
						<div class="text-[var(--color-text-muted)]">Loading training blocks...</div>
					</div>
				{:else if error}
					<div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
						{error}
					</div>
				{:else if blocks.length === 0}
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
						<div class="text-[var(--color-text-muted)] text-5xl mb-4">📋</div>
						<h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
							No Training Blocks Yet
						</h2>
						<p class="text-[var(--color-text-secondary)] mb-6">
							Create your first training block to start planning your workouts.
						</p>
						<a
							href="/blocks/new"
							class="inline-block bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold py-3 px-6 rounded-lg transition-colors"
						>
							Create Training Block
						</a>
					</div>
				{:else}
					<div class="space-y-4">
						{#each blocks as block (block.id)}
							{@const StatusIcon = getStatusIcon(block.status)}
							{@const volumes = getBlockVolume(block)}
							{@const topVolumes = volumes.slice(0, 5)}
							{@const lowCount = volumes.filter((v: MuscleVolume) => v.status === 'low').length}
							{@const goodCount = volumes.filter((v: MuscleVolume) => v.status === 'good').length}
							{@const totalTime = getBlockTime(block)}
							<a
								href="/blocks/{block.id}"
								class="block bg-[var(--color-bg-secondary)] rounded-xl p-5 hover:bg-[var(--color-bg-tertiary)] transition-colors"
							>
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
												{block.name}
											</h3>
											<span
												class="flex items-center gap-1 text-xs font-medium {getStatusColor(block.status)} capitalize"
											>
												<StatusIcon size={14} />
												{block.status}
											</span>
										</div>

										<div class="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]">
											<div class="flex items-center gap-1.5">
												<Calendar size={14} class="text-[var(--color-text-muted)]" />
												<span>Week {block.current_week} of {block.total_weeks}</span>
											</div>
											<div class="flex items-center gap-1.5">
												<Dumbbell size={14} class="text-[var(--color-text-muted)]" />
												<span>{block.workout_days?.length || 0} days/week</span>
											</div>
											{#if totalTime > 0}
												<div class="flex items-center gap-1.5">
													<Clock size={14} class="text-[var(--color-text-muted)]" />
													<span>~{totalTime} min/week</span>
												</div>
											{/if}
										</div>

										{#if block.status === 'active'}
											<div class="mt-3">
												<div class="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
													<span>Progress</span>
													<span>{Math.round((block.current_week / block.total_weeks) * 100)}%</span>
												</div>
												<div class="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
													<div
														class="h-full bg-[var(--color-accent)] rounded-full transition-all"
														style="width: {(block.current_week / block.total_weeks) * 100}%"
													></div>
												</div>
											</div>
										{/if}

										<!-- Volume Summary -->
										{#if topVolumes.length > 0}
											<div class="mt-3 pt-3 border-t border-[var(--color-border)]">
												<div class="flex items-center gap-2 mb-2">
													<BarChart3 size={14} class="text-[var(--color-text-muted)]" />
													<span class="text-xs text-[var(--color-text-muted)]">Weekly Volume</span>
													{#if goodCount > 0}
														<span class="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
															{goodCount} good
														</span>
													{/if}
													{#if lowCount > 0}
														<span class="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
															{lowCount} low
														</span>
													{/if}
												</div>
												<div class="flex flex-wrap gap-1.5">
													{#each topVolumes as vol (vol.muscleId)}
														{@const barColor = getVolumeBarColor(vol.status)}
														<span class="text-[10px] px-2 py-1 rounded {barColor} bg-opacity-20 whitespace-nowrap">
															{vol.muscleName}: {vol.totalSets}
														</span>
													{/each}
													{#if volumes.length > 5}
														<span class="text-[10px] text-[var(--color-text-muted)] px-2 py-1">
															+{volumes.length - 5} more
														</span>
													{/if}
												</div>
											</div>
										{/if}
									</div>

									<ChevronRight size={20} class="text-[var(--color-text-muted)] ml-4 flex-shrink-0" />
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</AppShell>
{/if}
