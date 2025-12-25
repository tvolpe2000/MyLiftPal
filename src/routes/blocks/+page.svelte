<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/db/supabase';
	import AppShell from '$lib/components/AppShell.svelte';
	import { Plus, Calendar, Dumbbell, ChevronRight, Play, Pause, CheckCircle } from 'lucide-svelte';
	import type { TrainingBlockStatus } from '$lib/types/database';

	interface TrainingBlock {
		id: string;
		name: string;
		total_weeks: number;
		current_week: number;
		current_day: number;
		status: TrainingBlockStatus;
		started_at: string;
		workout_days: { id: string; name: string }[];
	}

	let blocks = $state<TrainingBlock[]>([]);
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
		}
	});

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
				workout_days (id, name)
			`)
			.eq('user_id', auth.user.id)
			.order('created_at', { ascending: false });

		if (fetchError) {
			console.error('Error loading blocks:', fetchError);
			error = 'Failed to load training blocks';
		} else {
			blocks = (data as TrainingBlock[]) || [];
		}

		loading = false;
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
									</div>

									<ChevronRight size={20} class="text-[var(--color-text-muted)] ml-4" />
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</AppShell>
{/if}
