<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import { Calendar, Clock, Repeat } from 'lucide-svelte';

	const weekOptions = [4, 5, 6, 7, 8];
	const dayOptions = [1, 2, 3, 4, 5, 6, 7];
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-xl font-bold text-[var(--color-text-primary)]">Create Training Block</h2>
		<p class="text-[var(--color-text-secondary)] mt-1">Set up the basics for your training block</p>
	</div>

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
