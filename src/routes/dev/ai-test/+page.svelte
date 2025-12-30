<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
	import { buildUnifiedContext } from '$lib/ai/context/index';
	import { processGlobalCommand } from '$lib/ai/globalAssistant';
	import { ChevronDown, ChevronRight, Play, Loader2, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { UnifiedContext } from '$lib/ai/types';

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

	let testInput = $state('');
	let isRunning = $state(false);
	let results = $state<TestResult[]>([]);
	let expandedResults = $state<Set<number>>(new Set());
	let currentContext = $state<UnifiedContext | null>(null);
	let nextId = $state(1);

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
		// Load context on mount
		await refreshContext();
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
			// Capture context
			result.context = await buildUnifiedContext();

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

			// Now run the full flow to get execution result
			const execResult = await processGlobalCommand(input.trim());
			result.executionResult = execResult;

		} catch (err) {
			result.error = err instanceof Error ? err.message : String(err);
		}

		result.duration = Date.now() - startTime;
		results = [result, ...results];
		expandedResults.add(testId);
		expandedResults = expandedResults; // Trigger reactivity
		isRunning = false;
	}

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
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">AI Command Tester</h1>
			<p class="text-sm text-[var(--color-text-muted)]">
				Internal tool for testing voice commands before deployment
			</p>
		</div>

		<!-- Current Context Summary -->
		<div class="mb-6 rounded-xl bg-[var(--color-bg-secondary)] p-4">
			<div class="flex items-center justify-between mb-2">
				<h2 class="font-semibold text-[var(--color-text-primary)]">Current Context</h2>
				<button
					onclick={refreshContext}
					class="text-xs text-[var(--color-accent)] hover:underline"
				>
					Refresh
				</button>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
				<div>
					<span class="text-[var(--color-text-muted)]">Authenticated:</span>
					<span class="ml-1 font-medium {auth.isAuthenticated ? 'text-green-400' : 'text-red-400'}">
						{auth.isAuthenticated ? 'Yes' : 'No'}
					</span>
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
			</div>
		</div>

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
