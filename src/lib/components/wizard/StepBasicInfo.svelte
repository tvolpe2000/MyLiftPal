<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import { Calendar, Clock, Repeat, FileText } from 'lucide-svelte';
	import TemplatePicker from './TemplatePicker.svelte';
	import type { WorkoutTemplate } from '$lib/data/templates';
	import type { Exercise } from '$lib/types';

	const weekOptions = [4, 5, 6, 7, 8];
	const dayOptions = [1, 2, 3, 4, 5, 6, 7];

	let showTemplatePicker = $state(false);
	let exercises = $state<Exercise[]>([]);
	let loadingExercises = $state(false);
	let appliedTemplate = $state<string | null>(null);

	async function openTemplatePicker() {
		// Load exercises if not already loaded
		if (exercises.length === 0) {
			loadingExercises = true;
			const { data } = await supabase.from('exercises').select('*');
			if (data) {
				exercises = data as Exercise[];
			}
			loadingExercises = false;
		}
		showTemplatePicker = true;
	}

	function handleTemplateSelect(template: WorkoutTemplate, includeExercises: boolean) {
		wizard.applyTemplate(template, includeExercises, exercises);
		appliedTemplate = template.name;
		showTemplatePicker = false;

		// Clear the message after 5 seconds
		setTimeout(() => {
			appliedTemplate = null;
		}, 5000);
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-xl font-bold text-[var(--color-text-primary)]">Create Training Block</h2>
		<p class="text-[var(--color-text-secondary)] mt-1">Set up the basics for your training block</p>
	</div>

	<!-- Template Applied Success Message -->
	{#if appliedTemplate}
		<div class="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
			<div class="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
				<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
			<div>
				<div class="font-medium text-green-400">Template Applied!</div>
				<div class="text-sm text-green-400/80">
					"{appliedTemplate}" has been loaded. Review the settings below and click Next to continue.
				</div>
			</div>
		</div>
	{:else}
		<!-- Use Template Button -->
		<button
			type="button"
			onclick={openTemplatePicker}
			disabled={loadingExercises}
			class="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-[var(--color-accent-muted)] to-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] transition-colors disabled:opacity-50"
		>
			<FileText size={20} />
			<span class="font-medium">
				{loadingExercises ? 'Loading...' : 'Use a Template'}
			</span>
		</button>

		<div class="relative flex items-center justify-center">
			<div class="border-t border-[var(--color-border)] flex-1"></div>
			<span class="px-4 text-sm text-[var(--color-text-muted)]">or customize</span>
			<div class="border-t border-[var(--color-border)] flex-1"></div>
		</div>
	{/if}

	<!-- Block Name -->
	<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
		<label for="blockName" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
			Block Name
		</label>
		<input
			type="text"
			id="blockName"
			value={wizard.blockName}
			oninput={(e) => wizard.setBlockName(e.currentTarget.value)}
			placeholder="e.g., Hypertrophy Block 1, Summer Cut..."
			class="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
		/>
	</div>

	<!-- Duration -->
	<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
		<div class="flex items-center gap-3 mb-4">
			<Calendar size={20} class="text-[var(--color-accent)]" />
			<span class="font-medium text-[var(--color-text-primary)]">Duration</span>
		</div>
		<div class="grid grid-cols-5 gap-2">
			{#each weekOptions as weeks}
				<button
					type="button"
					onclick={() => wizard.setTotalWeeks(weeks)}
					class="py-3 rounded-lg font-medium transition-colors
					{wizard.totalWeeks === weeks
						? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
						: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
				>
					{weeks} wks
				</button>
			{/each}
		</div>
	</div>

	<!-- Days Per Week -->
	<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
		<div class="flex items-center gap-3 mb-4">
			<Repeat size={20} class="text-[var(--color-accent)]" />
			<span class="font-medium text-[var(--color-text-primary)]">Training Days Per Week</span>
		</div>
		<div class="grid grid-cols-7 gap-2">
			{#each dayOptions as days}
				<button
					type="button"
					onclick={() => wizard.setDaysPerWeek(days)}
					class="py-3 rounded-lg font-medium transition-colors
					{wizard.daysPerWeek === days
						? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
						: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
				>
					{days}
				</button>
			{/each}
		</div>
	</div>

	<!-- Time Budget (Optional) -->
	<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
		<div class="flex items-center gap-3 mb-4">
			<Clock size={20} class="text-[var(--color-accent)]" />
			<span class="font-medium text-[var(--color-text-primary)]">Daily Time Budget</span>
			<span class="text-xs text-[var(--color-text-muted)]">(optional)</span>
		</div>
		<div class="flex items-center gap-4">
			<input
				type="range"
				min="30"
				max="120"
				step="15"
				value={wizard.timeBudgetMinutes ?? 60}
				oninput={(e) => wizard.setTimeBudget(parseInt(e.currentTarget.value))}
				class="flex-1 accent-[var(--color-accent)]"
			/>
			<div class="flex items-center gap-2">
				<span class="text-[var(--color-text-primary)] font-mono w-16 text-right">
					{wizard.timeBudgetMinutes ?? '--'} min
				</span>
				{#if wizard.timeBudgetMinutes}
					<button
						type="button"
						onclick={() => wizard.setTimeBudget(null)}
						class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
					>
						Clear
					</button>
				{/if}
			</div>
		</div>
		<p class="text-xs text-[var(--color-text-muted)] mt-2">
			Set a target time limit per workout. You'll see warnings if exercises exceed this.
		</p>
	</div>
</div>

<!-- Template Picker Modal -->
{#if showTemplatePicker}
	<TemplatePicker
		onSelect={handleTemplateSelect}
		onClose={() => (showTemplatePicker = false)}
	/>
{/if}
