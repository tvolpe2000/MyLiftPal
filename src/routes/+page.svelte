<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { changelog } from '$lib/stores/changelogStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import AppShell from '$lib/components/AppShell.svelte';
	import DownloadButton from '$lib/components/offline/DownloadButton.svelte';
	import UpdateBanner from '$lib/components/ui/UpdateBanner.svelte';
	import { Play, Plus, Dumbbell, Clock, TrendingUp, Calendar, ChevronRight } from 'lucide-svelte';
	import type { TrainingBlockStatus } from '$lib/types/index';

	interface ActiveBlock {
		id: string;
		name: string;
		total_weeks: number;
		current_week: number;
		current_day: number;
		status: TrainingBlockStatus;
		workout_days: { id: string; name: string; day_number: number }[];
	}

	interface RecentSession {
		id: string;
		completed_at: string;
		duration_minutes: number | null;
		workout_day: { name: string };
		training_block: { id: string; name: string };
	}

	let activeBlock = $state<ActiveBlock | null>(null);
	let recentSessions = $state<RecentSession[]>([]);
	let loading = $state(true);

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	$effect(() => {
		if (auth.isAuthenticated && auth.user) {
			loadHomeData();
			changelog.initialize();
		}
	});

	async function loadHomeData() {
		if (!auth.user) return;

		loading = true;

		try {
			// Fetch active training block
			const { data: blockData } = await supabase
				.from('training_blocks')
				.select(`
					id, name, total_weeks, current_week, current_day, status,
					workout_days (id, name, day_number)
				`)
				.eq('user_id', auth.user.id)
				.eq('status', 'active')
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (blockData) {
				activeBlock = blockData as unknown as ActiveBlock;
			}

			// Fetch recent completed sessions
			const { data: sessionData } = await supabase
				.from('workout_sessions')
				.select(`
					id, completed_at, duration_minutes,
					workout_day:workout_days (name),
					training_block:training_blocks (id, name)
				`)
				.eq('user_id', auth.user.id)
				.eq('status', 'completed')
				.order('completed_at', { ascending: false })
				.limit(5);

			if (sessionData) {
				recentSessions = sessionData as unknown as RecentSession[];
			}
		} catch (error) {
			console.error('Error loading home data:', error);
		} finally {
			loading = false;
		}
	}

	const currentDay = $derived(
		activeBlock?.workout_days?.find((d) => d.day_number === activeBlock?.current_day)
	);

	const currentDayName = $derived(currentDay?.name || 'Workout');
	const currentDayId = $derived(currentDay?.id || '');

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString();
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-4xl mx-auto space-y-6">
				<!-- Welcome Header -->
				<div class="mb-2">
					<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">
						Welcome{auth.profile?.display_name ? `, ${auth.profile.display_name}` : ''}!
					</h1>
					<p class="text-[var(--color-text-secondary)]">Ready to crush your workout?</p>
				</div>

				<!-- What's New Banner -->
				<UpdateBanner />

				{#if loading}
					<!-- Loading State -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 animate-pulse">
						<div class="h-6 bg-[var(--color-bg-tertiary)] rounded w-1/3 mb-4"></div>
						<div class="h-4 bg-[var(--color-bg-tertiary)] rounded w-2/3 mb-6"></div>
						<div class="h-12 bg-[var(--color-bg-tertiary)] rounded w-40"></div>
					</div>
				{:else if activeBlock}
					<!-- Today's Workout Card -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<div class="flex items-start justify-between mb-4">
							<div>
								<div class="flex items-center gap-2 text-[var(--color-text-muted)] text-sm mb-1">
									<Calendar size={14} />
									<span>Week {activeBlock.current_week} of {activeBlock.total_weeks}</span>
								</div>
								<h2 class="text-xl font-bold text-[var(--color-text-primary)]">
									{currentDayName}
								</h2>
								<p class="text-[var(--color-text-secondary)] text-sm mt-1">
									{activeBlock.name}
								</p>
							</div>
							<div class="bg-[var(--color-accent)]/10 text-[var(--color-accent)] px-3 py-1 rounded-full text-sm font-medium">
								Day {activeBlock.current_day}
							</div>
						</div>

						<!-- Download for offline -->
						{#if currentDayId}
							<div class="mb-4">
								<DownloadButton
									dayId={currentDayId}
									blockId={activeBlock.id}
									dayName={currentDayName}
								/>
							</div>
						{/if}

						<a
							href="/blocks/{activeBlock.id}"
							class="flex items-center justify-center gap-2 w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold py-4 rounded-xl transition-colors text-lg"
						>
							<Play size={22} />
							Start Workout
						</a>
					</div>

					<!-- Quick Actions -->
					<div class="grid grid-cols-2 gap-4">
						<a
							href="/blocks"
							class="bg-[var(--color-bg-secondary)] rounded-xl p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
									<TrendingUp size={20} class="text-[var(--color-accent)]" />
								</div>
								<div>
									<div class="font-medium text-[var(--color-text-primary)]">View Block</div>
									<div class="text-sm text-[var(--color-text-muted)]">Progress & Days</div>
								</div>
							</div>
						</a>
						<a
							href="/exercises"
							class="bg-[var(--color-bg-secondary)] rounded-xl p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
									<Dumbbell size={20} class="text-[var(--color-accent)]" />
								</div>
								<div>
									<div class="font-medium text-[var(--color-text-primary)]">Exercises</div>
									<div class="text-sm text-[var(--color-text-muted)]">Browse Library</div>
								</div>
							</div>
						</a>
					</div>
				{:else}
					<!-- No Active Block -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6 text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
							<Dumbbell size={32} class="text-[var(--color-text-muted)]" />
						</div>
						<h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No Active Training Block</h2>
						<p class="text-[var(--color-text-secondary)] mb-6">
							Create a training block to start tracking your workouts and monitoring your volume.
						</p>
						<a
							href="/blocks/new"
							class="inline-flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold py-3 px-6 rounded-lg transition-colors"
						>
							<Plus size={20} />
							Create Training Block
						</a>
					</div>
				{/if}

				<!-- Recent Activity -->
				{#if recentSessions.length > 0}
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<h3 class="font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h3>
						<div class="space-y-1">
							{#each recentSessions as session}
								<a
									href="/blocks/{session.training_block?.id}?session={session.id}"
									class="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer group"
								>
									<div>
										<div class="font-medium text-[var(--color-text-primary)]">
											{session.workout_day?.name || 'Workout'}
										</div>
										<div class="text-sm text-[var(--color-text-muted)]">
											{session.training_block?.name}
										</div>
									</div>
									<div class="flex items-center gap-3">
										<div class="text-right">
											<div class="text-sm text-[var(--color-text-secondary)]">
												{formatDate(session.completed_at)}
											</div>
											{#if session.duration_minutes}
												<div class="flex items-center justify-end gap-1 text-xs text-[var(--color-text-muted)]">
													<Clock size={12} />
													{session.duration_minutes} min
												</div>
											{/if}
										</div>
										<ChevronRight size={18} class="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</AppShell>
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-[var(--color-text-secondary)]">Redirecting...</div>
	</div>
{/if}
