<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
	import { buildUnifiedContext } from '$lib/ai/context/index';
	import { processGlobalCommand } from '$lib/ai/globalAssistant';
	import { ChevronDown, ChevronRight, Play, Loader2, Trash2, Settings, RefreshCw, AlertTriangle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { supabase } from '$lib/db/supabase';
	import type { UnifiedContext, WorkoutContext, CurrentExerciseContext } from '$lib/ai/types';
	import type { TrainingBlockSummary, WorkoutDaySummary } from '$lib/stores/trainingBlockStore.svelte';

	interface TestResult {
		id: number;
		timestamp: string;
		input: string;
		context: UnifiedContext | null;
		apiResponse: unknown;
		executionResult: unknown;
		duration: number;
		error: string | null;
	}

	interface UserOption {
		id: string;
		email: string;
		display_name: string | null;
	}

	interface BlockOption {
		id: string;
		name: string;
		status: string;
		current_week: number;
		total_weeks: number;
		user_id: string;
		user_email: string;
		days: { id: string; name: string; day_number: number }[];
	}

	let testInput = $state('');
	let isRunning = $state(false);
	let results = $state<TestResult[]>([]);
	let expandedResults = $state<Set<number>>(new Set());
	let currentContext = $state<UnifiedContext | null>(null);
	let nextId = $state(1);

	// Context Override State
	let showContextOverride = $state(false);
	let availableUsers = $state<UserOption[]>([]);
	let availableBlocks = $state<BlockOption[]>([]);
	let selectedUserId = $state<string | null>(null);
	let selectedBlockId = $state<string | null>(null);
	let simulateWorkout = $state(false);
	let selectedDayId = $state<string | null>(null);
	let mockExerciseName = $state('Bench Press');
	let mockSetNumber = $state(1);
	let mockTotalSets = $state(4);
	let mockTargetWeight = $state(185);
	let mockTargetReps = $state(8);
	let useContextOverride = $state(false);
	let loadingUsers = $state(false);
	let loadingBlocks = $state(false);

	// Preset test commands
	const presets = [
		{ category: 'Workout', commands: [
			'185 for 8',
			'225 for 5, 2 in reserve',
			'same weight, got 6',
			'skip this exercise',
			'swap with cable flyes',
			'swap incline press with flat bench',
			'add some curls',
			"I'm done"
		]},
		{ category: 'Queries', commands: [
			"what's my workout today?",
			'how much volume for chest?',
			'show me my PRs',
			"what's my bench max?",
			'how many workouts this week?',
			'how is my block going?'
		]},
		{ category: 'Schedule', commands: [
			'swap today with tomorrow',
			'skip today',
			'do leg day instead',
			'move to day 3'
		]},
		{ category: 'Block Mods', commands: [
			'add a set to bench press',
			'remove a set from squats',
			'change squats to 6-8 reps',
			'swap lat pulldowns with pull-ups'
		]},
		{ category: 'Edge Cases', commands: [
			'create a new training block',
			'delete my account',
			'asdfghjkl',
			'',
			'help'
		]}
	];

	onMount(async () => {
		// Block access in production
		if (!dev) {
			console.warn('AI Test Tool is only available in development mode');
			goto('/');
			return;
		}

		// Load context on mount
		await refreshContext();
		// Load all users for impersonation (dev only)
		await loadAllUsers();
	});

	let apiError = $state<string | null>(null);

	async function loadAllUsers() {
		loadingUsers = true;
		apiError = null;
		try {
			// Use dev API endpoint that bypasses RLS
			const response = await fetch('/dev/ai-test?action=users');
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(errorData.message || 'Failed to load users');
			}

			const data = await response.json();
			availableUsers = (data.users || []).map((user: { id: string; email: string; display_name: string | null }) => ({
				id: user.id,
				email: user.email || 'Unknown',
				display_name: user.display_name
			}));

			// Auto-select current user if authenticated
			if (auth.user) {
				selectedUserId = auth.user.id;
				await loadBlocksForUser(auth.user.id);
			}
		} catch (err) {
			console.error('Failed to load users:', err);
			apiError = err instanceof Error ? err.message : 'Failed to load users';
			// Fallback to current user
			if (auth.user) {
				availableUsers = [{
					id: auth.user.id,
					email: auth.user.email || 'Unknown',
					display_name: null
				}];
				selectedUserId = auth.user.id;
			}
		}
		loadingUsers = false;
	}

	async function loadBlocksForUser(userId: string) {
		loadingBlocks = true;
		selectedBlockId = null;
		selectedDayId = null;

		try {
			// Use dev API endpoint that bypasses RLS
			const response = await fetch(`/dev/ai-test?action=blocks&userId=${userId}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(errorData.message || 'Failed to load blocks');
			}

			const data = await response.json();
			const selectedUser = availableUsers.find(u => u.id === userId);

			interface BlockRow {
				id: string;
				name: string;
				status: string;
				current_week: number;
				total_weeks: number;
				user_id: string;
				workout_days: { id: string; name: string; day_number: number }[] | null;
			}

			availableBlocks = ((data.blocks || []) as BlockRow[]).map(block => ({
				id: block.id,
				name: block.name,
				status: block.status,
				current_week: block.current_week,
				total_weeks: block.total_weeks,
				user_id: block.user_id,
				user_email: selectedUser?.email || 'Unknown',
				days: (block.workout_days || []).sort((a, b) => a.day_number - b.day_number)
			}));
		} catch (err) {
			console.error('Failed to load blocks:', err);
			availableBlocks = [];
		}
		loadingBlocks = false;
	}

	// Watch for user selection changes
	$effect(() => {
		if (selectedUserId && useContextOverride) {
			loadBlocksForUser(selectedUserId);
		}
	});

	async function refreshContext() {
		try {
			if (auth.isAuthenticated) {
				await trainingBlockStore.loadActiveBlock();
			}
			currentContext = await buildUnifiedContext();
		} catch (err) {
			console.error('Failed to build context:', err);
		}
	}

	// Build override context based on selections
	async function buildOverrideContext(): Promise<UnifiedContext> {
		const selectedBlock = availableBlocks.find(b => b.id === selectedBlockId);
		const selectedDay = selectedBlock?.days.find(d => d.id === selectedDayId);

		// Build training block summary
		let trainingBlock: TrainingBlockSummary | null = null;
		if (selectedBlock) {
			trainingBlock = {
				id: selectedBlock.id,
				name: selectedBlock.name,
				total_weeks: selectedBlock.total_weeks,
				current_week: selectedBlock.current_week,
				current_day: selectedDay?.day_number || 1,
				status: selectedBlock.status as 'active' | 'completed' | 'paused',
				goal: null,
				started_at: null,
				workout_days: selectedBlock.days.map(d => ({
					id: d.id,
					day_number: d.day_number,
					name: d.name,
					target_muscles: [],
					exercise_count: 0
				}))
			};
		}

		// Build workout day summary
		let todayWorkout: WorkoutDaySummary | null = null;
		if (selectedDay) {
			todayWorkout = {
				id: selectedDay.id,
				day_number: selectedDay.day_number,
				name: selectedDay.name,
				target_muscles: [],
				exercise_count: 0
			};
		}

		// Build active workout context if simulating
		let activeWorkout: WorkoutContext | null = null;
		if (simulateWorkout && selectedDay) {
			const currentExercise: CurrentExerciseContext = {
				name: mockExerciseName,
				setNumber: mockSetNumber,
				totalSets: mockTotalSets,
				targetWeight: mockTargetWeight,
				targetReps: mockTargetReps
			};

			activeWorkout = {
				currentExercise,
				completedToday: [],
				remainingExercises: ['Exercise 2', 'Exercise 3', 'Exercise 4']
			};
		}

		return {
			type: simulateWorkout ? 'workout' : 'global',
			activeWorkout,
			trainingBlock,
			todayWorkout,
			userStats: {
				totalWorkouts: 25,
				totalSetsLogged: 500,
				totalWeightLifted: 150000,
				currentStreak: 3
			}
		};
	}

	// Get the context to use for the test
	async function getTestContext(): Promise<UnifiedContext | null> {
		if (useContextOverride) {
			return await buildOverrideContext();
		}
		return await buildUnifiedContext();
	}

	async function runTest(input: string) {
		if (!input.trim()) return;

		isRunning = true;
		const startTime = Date.now();
		const testId = nextId++;

		const result: TestResult = {
			id: testId,
			timestamp: new Date().toISOString(),
			input: input.trim(),
			context: null,
			apiResponse: null,
			executionResult: null,
			duration: 0,
			error: null
		};

		try {
			// Capture context (use override if enabled)
			result.context = await getTestContext();

			// Call the API directly to capture raw response
			const apiStartTime = Date.now();
			const response = await fetch('/api/ai/global', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transcript: input.trim(), context: result.context })
			});

			const apiData = await response.json();
			result.apiResponse = {
				status: response.status,
				ok: response.ok,
				data: apiData,
				duration: Date.now() - apiStartTime
			};

			// Skip execution if using override (we can't actually execute against mock data)
			if (useContextOverride) {
				result.executionResult = {
					success: true,
					message: '(Execution skipped - using context override)',
					toolCall: apiData.toolCall
				};
			} else {
				// Run the full flow to get execution result
				const execResult = await processGlobalCommand(input.trim());
				result.executionResult = execResult;
			}

		} catch (err) {
			result.error = err instanceof Error ? err.message : String(err);
		}

		result.duration = Date.now() - startTime;
		results = [result, ...results];
		expandedResults.add(testId);
		expandedResults = expandedResults; // Trigger reactivity
		isRunning = false;
	}

	// Update current context display when override settings change
	$effect(() => {
		if (useContextOverride) {
			buildOverrideContext().then(ctx => {
				currentContext = ctx;
			});
		}
	});

	function toggleExpanded(id: number) {
		if (expandedResults.has(id)) {
			expandedResults.delete(id);
		} else {
			expandedResults.add(id);
		}
		expandedResults = expandedResults;
	}

	function clearResults() {
		results = [];
		expandedResults = new Set();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			runTest(testInput);
			testInput = '';
		}
	}

	function formatJson(obj: unknown): string {
		try {
			return JSON.stringify(obj, null, 2);
		} catch {
			return String(obj);
		}
	}
</script>

<svelte:head>
	<title>AI Test Tool | Dev</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg-primary)] p-4 pb-24 md:pb-8">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">AI Command Tester</h1>
				<span class="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">DEV ONLY</span>
			</div>
			<p class="text-sm text-[var(--color-text-muted)]">
				Internal tool for testing voice commands before deployment
			</p>
		</div>

		<!-- API Error Banner -->
		{#if apiError}
			<div class="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
				<AlertTriangle size={20} class="text-red-400 shrink-0 mt-0.5" />
				<div>
					<h3 class="font-medium text-red-400">API Error</h3>
					<p class="text-sm text-red-300">{apiError}</p>
					<p class="text-xs text-red-400/70 mt-1">
						Make sure SUPABASE_SERVICE_ROLE_KEY is set in your .env file
					</p>
				</div>
			</div>
		{/if}

		<!-- Current Context Summary -->
		<div class="mb-6 rounded-xl bg-[var(--color-bg-secondary)] p-4">
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center gap-2">
					<h2 class="font-semibold text-[var(--color-text-primary)]">Current Context</h2>
					{#if useContextOverride}
						<span class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Override Active</span>
					{/if}
				</div>
				<div class="flex items-center gap-3">
					<button
						onclick={() => showContextOverride = !showContextOverride}
						class="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
					>
						<Settings size={14} />
						{showContextOverride ? 'Hide' : 'Override'}
					</button>
					<button
						onclick={refreshContext}
						disabled={useContextOverride}
						class="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<RefreshCw size={14} />
						Refresh
					</button>
				</div>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
				<div>
					<span class="text-[var(--color-text-muted)]">User:</span>
					{#if useContextOverride && selectedUserId}
						{@const impersonatedUser = availableUsers.find(u => u.id === selectedUserId)}
						<span class="ml-1 font-medium {selectedUserId !== auth.user?.id ? 'text-yellow-400' : 'text-green-400'}">
							{impersonatedUser?.email?.split('@')[0] || 'Unknown'}
							{selectedUserId !== auth.user?.id ? ' (Impersonating)' : ''}
						</span>
					{:else}
						<span class="ml-1 font-medium {auth.isAuthenticated ? 'text-green-400' : 'text-red-400'}">
							{auth.isAuthenticated ? auth.user?.email?.split('@')[0] : 'Not logged in'}
						</span>
					{/if}
				</div>
				<div>
					<span class="text-[var(--color-text-muted)]">Context Type:</span>
					<span class="ml-1 font-medium text-[var(--color-text-primary)]">
						{currentContext?.type || 'N/A'}
					</span>
				</div>
				<div>
					<span class="text-[var(--color-text-muted)]">Active Block:</span>
					<span class="ml-1 font-medium {currentContext?.trainingBlock ? 'text-green-400' : 'text-yellow-400'}">
						{currentContext?.trainingBlock?.name || 'None'}
					</span>
				</div>
				<div>
					<span class="text-[var(--color-text-muted)]">In Workout:</span>
					<span class="ml-1 font-medium {currentContext?.activeWorkout ? 'text-green-400' : 'text-[var(--color-text-muted)]'}">
						{currentContext?.activeWorkout ? 'Yes' : 'No'}
					</span>
				</div>
				<div>
					<span class="text-[var(--color-text-muted)]">Execution:</span>
					<span class="ml-1 font-medium {useContextOverride ? 'text-yellow-400' : 'text-green-400'}">
						{useContextOverride ? 'Parse Only' : 'Full'}
					</span>
				</div>
			</div>
		</div>

		<!-- Context Override Panel -->
		{#if showContextOverride}
			<div class="mb-6 rounded-xl bg-[var(--color-bg-secondary)] border-2 border-yellow-500/30 p-4">
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-semibold text-[var(--color-text-primary)]">Context Override</h2>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={useContextOverride}
							class="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
						/>
						<span class="text-sm text-[var(--color-text-secondary)]">Enable Override</span>
					</label>
				</div>

				<div class="space-y-4">
					<!-- User Selection (Impersonation) -->
					<div>
						<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
							Impersonate User
						</label>
						<select
							bind:value={selectedUserId}
							disabled={!useContextOverride || loadingUsers}
							onchange={() => selectedUserId && loadBlocksForUser(selectedUserId)}
							class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-[var(--color-text-primary)] disabled:opacity-50"
						>
							{#if loadingUsers}
								<option value={null}>Loading users...</option>
							{:else}
								<option value={null}>Select a user...</option>
								{#each availableUsers as user}
									<option value={user.id}>
										{user.email} {user.display_name ? `(${user.display_name})` : ''} {user.id === auth.user?.id ? '← You' : ''}
									</option>
								{/each}
							{/if}
						</select>
						{#if selectedUserId && selectedUserId !== auth.user?.id}
							<p class="text-xs text-yellow-400 mt-1">
								⚠️ Impersonating another user - responses will reflect their data
							</p>
						{/if}
					</div>

					<!-- Block Selection -->
					<div>
						<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
							Training Block
						</label>
						<select
							bind:value={selectedBlockId}
							disabled={!useContextOverride || !selectedUserId || loadingBlocks}
							class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-[var(--color-text-primary)] disabled:opacity-50"
						>
							{#if loadingBlocks}
								<option value={null}>Loading blocks...</option>
							{:else if !selectedUserId}
								<option value={null}>Select a user first</option>
							{:else if availableBlocks.length === 0}
								<option value={null}>No blocks for this user</option>
							{:else}
								<option value={null}>None (No block)</option>
								{#each availableBlocks as block}
									<option value={block.id}>
										{block.name} ({block.status}) - Week {block.current_week}/{block.total_weeks}
									</option>
								{/each}
							{/if}
						</select>
					</div>

					<!-- Day Selection (only if block selected) -->
					{#if selectedBlockId}
						{@const selectedBlock = availableBlocks.find(b => b.id === selectedBlockId)}
						<div>
							<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
								Workout Day
							</label>
							<select
								bind:value={selectedDayId}
								disabled={!useContextOverride}
								class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-[var(--color-text-primary)] disabled:opacity-50"
							>
								<option value={null}>None (No day selected)</option>
								{#each selectedBlock?.days || [] as day}
									<option value={day.id}>
										Day {day.day_number}: {day.name}
									</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Simulate Active Workout -->
					<div class="pt-2 border-t border-[var(--color-border)]">
						<label class="flex items-center gap-2 cursor-pointer mb-3">
							<input
								type="checkbox"
								bind:checked={simulateWorkout}
								disabled={!useContextOverride || !selectedDayId}
								class="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] disabled:opacity-50"
							/>
							<span class="text-sm font-medium text-[var(--color-text-secondary)]">Simulate Active Workout</span>
						</label>

						{#if simulateWorkout && selectedDayId}
							<div class="grid grid-cols-2 md:grid-cols-3 gap-3 pl-6">
								<div>
									<label class="block text-xs text-[var(--color-text-muted)] mb-1">Exercise Name</label>
									<input
										type="text"
										bind:value={mockExerciseName}
										class="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
									/>
								</div>
								<div>
									<label class="block text-xs text-[var(--color-text-muted)] mb-1">Set # / Total</label>
									<div class="flex gap-1">
										<input
											type="number"
											bind:value={mockSetNumber}
											min="1"
											class="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
										/>
										<span class="text-[var(--color-text-muted)] self-center">/</span>
										<input
											type="number"
											bind:value={mockTotalSets}
											min="1"
											class="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
										/>
									</div>
								</div>
								<div>
									<label class="block text-xs text-[var(--color-text-muted)] mb-1">Target Weight</label>
									<input
										type="number"
										bind:value={mockTargetWeight}
										class="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
									/>
								</div>
								<div>
									<label class="block text-xs text-[var(--color-text-muted)] mb-1">Target Reps</label>
									<input
										type="number"
										bind:value={mockTargetReps}
										class="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
									/>
								</div>
							</div>
						{/if}
					</div>
				</div>

				{#if useContextOverride}
					<div class="mt-4 p-3 rounded bg-yellow-500/10 text-xs text-yellow-400 space-y-1">
						<p><strong>Parse-Only Mode Active:</strong></p>
						<ul class="list-disc list-inside space-y-0.5 ml-2">
							<li>Tool calls will be parsed but NOT executed</li>
							<li>No data will be written to the database</li>
							<li>Use this to test AI tool selection with any user's context</li>
							{#if selectedUserId && selectedUserId !== auth.user?.id}
								<li class="text-yellow-300">Impersonating another user's data</li>
							{/if}
						</ul>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Test Input -->
		<div class="mb-6 rounded-xl bg-[var(--color-bg-secondary)] p-4">
			<h2 class="font-semibold text-[var(--color-text-primary)] mb-3">Test Command</h2>
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={testInput}
					onkeydown={handleKeydown}
					placeholder="Type a command (e.g., '185 for 8' or 'what's my workout today?')"
					class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
					disabled={isRunning}
				/>
				<button
					onclick={() => { runTest(testInput); testInput = ''; }}
					disabled={isRunning || !testInput.trim()}
					class="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-3 font-medium text-[var(--color-bg-primary)] disabled:opacity-50"
				>
					{#if isRunning}
						<Loader2 size={18} class="animate-spin" />
					{:else}
						<Play size={18} />
					{/if}
					Run
				</button>
			</div>
		</div>

		<!-- Preset Commands -->
		<div class="mb-6 rounded-xl bg-[var(--color-bg-secondary)] p-4">
			<h2 class="font-semibold text-[var(--color-text-primary)] mb-3">Quick Presets</h2>
			<div class="space-y-3">
				{#each presets as preset}
					<div>
						<h3 class="text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">{preset.category}</h3>
						<div class="flex flex-wrap gap-2">
							{#each preset.commands as cmd}
								<button
									onclick={() => runTest(cmd)}
									disabled={isRunning}
									class="rounded-lg bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] disabled:opacity-50 transition-colors"
								>
									{cmd || '(empty)'}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Results -->
		<div class="rounded-xl bg-[var(--color-bg-secondary)] p-4">
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-semibold text-[var(--color-text-primary)]">Results ({results.length})</h2>
				{#if results.length > 0}
					<button
						onclick={clearResults}
						class="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
					>
						<Trash2 size={14} />
						Clear
					</button>
				{/if}
			</div>

			{#if results.length === 0}
				<p class="text-sm text-[var(--color-text-muted)] text-center py-8">
					No tests run yet. Enter a command above or click a preset.
				</p>
			{:else}
				<div class="space-y-3">
					{#each results as result (result.id)}
						{@const isExpanded = expandedResults.has(result.id)}
						{@const hasError = result.error || (result.executionResult && !(result.executionResult as {success?: boolean}).success)}
						<div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
							<!-- Summary Row -->
							<button
								onclick={() => toggleExpanded(result.id)}
								class="w-full flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-primary)] transition-colors text-left"
							>
								{#if isExpanded}
									<ChevronDown size={16} class="text-[var(--color-text-muted)] shrink-0" />
								{:else}
									<ChevronRight size={16} class="text-[var(--color-text-muted)] shrink-0" />
								{/if}
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-medium text-[var(--color-text-primary)] truncate">
											"{result.input}"
										</span>
										<span class="shrink-0 text-xs px-2 py-0.5 rounded-full {hasError ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}">
											{hasError ? 'Error' : 'OK'}
										</span>
									</div>
									<div class="text-xs text-[var(--color-text-muted)]">
										{(result.executionResult as {toolCall?: {tool?: string}})?.toolCall?.tool || 'N/A'} · {result.duration}ms
									</div>
								</div>
							</button>

							<!-- Expanded Details -->
							{#if isExpanded}
								<div class="p-3 border-t border-[var(--color-border)] space-y-4 text-sm">
									<!-- Tool Call -->
									<div>
										<h4 class="font-medium text-[var(--color-text-primary)] mb-1">Tool Called</h4>
										<pre class="bg-[var(--color-bg-primary)] p-2 rounded overflow-x-auto text-xs text-[var(--color-text-secondary)]">{formatJson((result.apiResponse as {data?: {toolCall?: unknown}})?.data?.toolCall || 'None')}</pre>
									</div>

									<!-- Execution Result -->
									<div>
										<h4 class="font-medium text-[var(--color-text-primary)] mb-1">Execution Result</h4>
										<pre class="bg-[var(--color-bg-primary)] p-2 rounded overflow-x-auto text-xs {hasError ? 'text-red-400' : 'text-[var(--color-text-secondary)]'}">{formatJson(result.executionResult)}</pre>
									</div>

									<!-- Context at Time of Test -->
									<details class="group">
										<summary class="cursor-pointer font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)]">
											Context Snapshot
										</summary>
										<pre class="mt-1 bg-[var(--color-bg-primary)] p-2 rounded overflow-x-auto text-xs text-[var(--color-text-secondary)] max-h-60 overflow-y-auto">{formatJson(result.context)}</pre>
									</details>

									<!-- Raw API Response -->
									<details class="group">
										<summary class="cursor-pointer font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)]">
											Raw API Response
										</summary>
										<pre class="mt-1 bg-[var(--color-bg-primary)] p-2 rounded overflow-x-auto text-xs text-[var(--color-text-secondary)] max-h-60 overflow-y-auto">{formatJson(result.apiResponse)}</pre>
									</details>

									{#if result.error}
										<div>
											<h4 class="font-medium text-red-400 mb-1">Error</h4>
											<pre class="bg-red-500/10 p-2 rounded text-xs text-red-400">{result.error}</pre>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
