<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { changelog } from '$lib/stores/changelogStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import AppShell from '$lib/components/AppShell.svelte';
	import DownloadButton from '$lib/components/offline/DownloadButton.svelte';
	import UpdateBanner from '$lib/components/ui/UpdateBanner.svelte';
	import { Play, Plus, Dumbbell, Clock, Calendar, ChevronRight, Trophy, Activity } from 'lucide-svelte';
	import type { TrainingBlockStatus } from '$lib/types/index';
	import LifterLevelModal from '$lib/components/onboarding/LifterLevelModal.svelte';

	interface ActiveBlock {
		id: string;
		name: string;
		total_weeks: number;
		current_week: number;
		current_day: number;
		status: TrainingBlockStatus;
		workout_days: { id: string; name: string; day_number: number; target_muscles: string[] }[];
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
	let hasLoadedOnce = $state(false);

	// Quick stats
	let workoutsThisWeek = $state(0);
	let workoutsThisMonth = $state(0);
	let weightMovedThisWeek = $state(0);
	let totalWorkouts = $state(0);

	// Weekly volume
	let weeklyVolume = $state<{ muscle: string; sets: number }[]>([]);

	// Personal records
	let personalRecords = $state<{ name: string; weight: number; reps: number }[]>([]);

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

	// Re-check changelog when profile loads (handles race condition)
	$effect(() => {
		if (auth.profile && changelog.initialized) {
			changelog.checkProfileVersion();
		}
	});

	async function loadHomeData() {
		if (!auth.user) return;

		// Stale-while-revalidate: Only show skeleton on initial load
		// If we've already loaded data once, keep it visible while refetching in background
		if (!hasLoadedOnce) {
			loading = true;
		}

		try {
			// Fetch active training block with target_muscles
			const { data: blockData } = await supabase
				.from('training_blocks')
				.select(`
					id, name, total_weeks, current_week, current_day, status,
					workout_days (id, name, day_number, target_muscles)
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

			// Load additional stats in parallel
			await Promise.all([loadQuickStats(), loadWeeklyVolume(), loadPersonalRecords()]);
		} catch (error) {
			console.error('Error loading home data:', error);
		} finally {
			loading = false;
			hasLoadedOnce = true;
		}
	}

	async function loadQuickStats() {
		if (!auth.user) return;

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		// Start of current month
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		// Get sessions from past 7 days for this week stats
		const { count: weekCount } = await supabase
			.from('workout_sessions')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', auth.user.id)
			.eq('status', 'completed')
			.gte('completed_at', sevenDaysAgo.toISOString());

		workoutsThisWeek = weekCount ?? 0;

		// Get total weight moved this week (weight × reps for each completed set)
		const { data: setsData } = await supabase
			.from('logged_sets')
			.select('actual_weight, actual_reps')
			.eq('completed', true)
			.gte('logged_at', sevenDaysAgo.toISOString());

		weightMovedThisWeek = (setsData || []).reduce((sum, set) => {
			const weight = set.actual_weight || 0;
			const reps = set.actual_reps || 0;
			return sum + weight * reps;
		}, 0);

		// Get workouts this month
		const { count: monthCount } = await supabase
			.from('workout_sessions')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', auth.user.id)
			.eq('status', 'completed')
			.gte('completed_at', startOfMonth.toISOString());

		workoutsThisMonth = monthCount ?? 0;

		// Get total workouts (all time)
		const { count: allTimeCount } = await supabase
			.from('workout_sessions')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', auth.user.id)
			.eq('status', 'completed');

		totalWorkouts = allTimeCount ?? 0;
	}

	async function loadWeeklyVolume() {
		if (!auth.user) return;

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		// Get logged sets from past 7 days with exercise info
		const { data } = await supabase
			.from('logged_sets')
			.select(
				`
				id, completed,
				exercise:exercises (primary_muscle)
			`
			)
			.eq('completed', true)
			.gte('logged_at', sevenDaysAgo.toISOString());

		// Group by muscle
		const volumeByMuscle = new Map<string, number>();
		for (const set of data || []) {
			const exercise = set.exercise as { primary_muscle: string } | null;
			const muscle = exercise?.primary_muscle;
			if (muscle) {
				volumeByMuscle.set(muscle, (volumeByMuscle.get(muscle) || 0) + 1);
			}
		}

		weeklyVolume = Array.from(volumeByMuscle.entries())
			.map(([muscle, sets]) => ({ muscle, sets }))
			.sort((a, b) => b.sets - a.sets)
			.slice(0, 6);
	}

	async function loadPersonalRecords() {
		if (!auth.user) return;

		const { data } = await supabase
			.from('logged_sets')
			.select(
				`
				actual_weight, actual_reps,
				exercise:exercises (name)
			`
			)
			.eq('completed', true)
			.not('actual_weight', 'is', null)
			.order('actual_weight', { ascending: false })
			.limit(100);

		// Group by exercise, keep max weight
		const prByExercise = new Map<string, { weight: number; reps: number }>();
		for (const set of data || []) {
			const exercise = set.exercise as { name: string } | null;
			const name = exercise?.name;
			if (name && set.actual_weight) {
				const existing = prByExercise.get(name);
				if (!existing || set.actual_weight > existing.weight) {
					prByExercise.set(name, { weight: set.actual_weight, reps: set.actual_reps || 0 });
				}
			}
		}

		personalRecords = Array.from(prByExercise.entries())
			.map(([name, { weight, reps }]) => ({ name, weight, reps }))
			.sort((a, b) => b.weight - a.weight)
			.slice(0, 3);
	}

	const currentDay = $derived(
		activeBlock?.workout_days?.find((d) => d.day_number === activeBlock?.current_day)
	);

	const currentDayName = $derived(currentDay?.name || 'Workout');
	const currentDayId = $derived(currentDay?.id || '');

	// Show onboarding modal if user hasn't set their lifter level
	const showOnboarding = $derived(auth.profile && !auth.profile.lifter_level);

	function formatMuscle(muscle: string): string {
		return muscle
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	function formatWeight(lbs: number): string {
		if (lbs === 0) return '-';
		if (lbs >= 1000000) return `${(lbs / 1000000).toFixed(1)}M`;
		if (lbs >= 1000) return `${(lbs / 1000).toFixed(1)}k`;
		return lbs.toLocaleString();
	}

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
						Welcome{auth.profile?.display_name ? `, ${auth.profile.display_name}` : ''} !
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
								<!-- Target muscle groups -->
								{#if currentDay?.target_muscles?.length}
									<div class="flex flex-wrap gap-1.5 mt-2">
										{#each currentDay.target_muscles as muscle}
											<span class="px-2 py-0.5 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
												{formatMuscle(muscle)}
											</span>
										{/each}
									</div>
								{/if}
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

					<!-- Quick Stats Strip -->
					<div class="grid grid-cols-4 gap-2">
						<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-[var(--color-accent)]">{workoutsThisWeek}</div>
							<div class="text-xs text-[var(--color-text-muted)]">This Week</div>
						</div>
						<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-[var(--color-text-primary)]">{workoutsThisMonth}</div>
							<div class="text-xs text-[var(--color-text-muted)]">This Month</div>
						</div>
						<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-[var(--color-text-primary)]">{formatWeight(weightMovedThisWeek)}</div>
							<div class="text-xs text-[var(--color-text-muted)]">Lbs Moved</div>
						</div>
						<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-[var(--color-text-primary)]">{totalWorkouts}</div>
							<div class="text-xs text-[var(--color-text-muted)]">Total</div>
						</div>
					</div>

					<!-- Weekly Volume Summary -->
					{#if weeklyVolume.length > 0}
						<div class="bg-[var(--color-bg-secondary)] rounded-xl p-4">
							<div class="flex items-center gap-2 mb-3">
								<Activity size={18} class="text-[var(--color-accent)]" />
								<h3 class="font-semibold text-[var(--color-text-primary)]">This Week's Volume</h3>
							</div>
							<div class="grid grid-cols-2 gap-x-4 gap-y-1">
								{#each weeklyVolume as { muscle, sets }}
									<div class="flex justify-between items-center py-1">
										<span class="text-sm text-[var(--color-text-secondary)]">{formatMuscle(muscle)}</span>
										<span class="text-sm font-medium text-[var(--color-text-primary)]">{sets} sets</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Personal Records -->
					{#if personalRecords.length > 0}
						<div class="bg-[var(--color-bg-secondary)] rounded-xl p-4">
							<div class="flex items-center gap-2 mb-3">
								<Trophy size={18} class="text-yellow-500" />
								<h3 class="font-semibold text-[var(--color-text-primary)]">Personal Records</h3>
							</div>
							<div class="space-y-2">
								{#each personalRecords as pr, i}
									<div class="flex items-center gap-3">
										<div
											class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
											{i === 0
												? 'bg-yellow-500/20 text-yellow-400'
												: i === 1
													? 'bg-gray-400/20 text-gray-400'
													: 'bg-orange-600/20 text-orange-500'}"
										>
											{i + 1}
										</div>
										<div class="flex-1 min-w-0">
											<div class="font-medium text-[var(--color-text-primary)] truncate">{pr.name}</div>
											<div class="text-sm text-[var(--color-text-muted)]">{pr.weight} lbs × {pr.reps}</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
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

					<!-- Feature Preview for New Users -->
					<div class="space-y-3">
						<p class="text-sm text-[var(--color-text-muted)] text-center">What you'll track:</p>
						<div class="grid grid-cols-4 gap-2">
							<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
								<div class="text-2xl font-bold text-[var(--color-text-muted)]">-</div>
								<div class="text-xs text-[var(--color-text-muted)]">This Week</div>
							</div>
							<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
								<div class="text-2xl font-bold text-[var(--color-text-muted)]">-</div>
								<div class="text-xs text-[var(--color-text-muted)]">This Month</div>
							</div>
							<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
								<div class="text-2xl font-bold text-[var(--color-text-muted)]">-</div>
								<div class="text-xs text-[var(--color-text-muted)]">Lbs Moved</div>
							</div>
							<div class="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
								<div class="text-2xl font-bold text-[var(--color-text-muted)]">-</div>
								<div class="text-xs text-[var(--color-text-muted)]">Total</div>
							</div>
						</div>
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

	<!-- Lifter Level Onboarding Modal -->
	{#if showOnboarding}
		<LifterLevelModal />
	{/if}
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-[var(--color-text-secondary)]">Redirecting...</div>
	</div>
{/if}
