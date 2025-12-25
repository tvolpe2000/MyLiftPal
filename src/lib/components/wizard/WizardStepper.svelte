<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { WizardStep } from '$lib/types/wizard';

	let { currentStep, onStepClick } = $props<{
		currentStep: WizardStep;
		onStepClick?: (step: WizardStep) => void;
	}>();

	const steps = [
		{ number: 1, label: 'Basic Info' },
		{ number: 2, label: 'Add Days' },
		{ number: 3, label: 'Exercises' },
		{ number: 4, label: 'Review' }
	] as const;

	function getStepStatus(stepNumber: number): 'completed' | 'current' | 'upcoming' {
		if (stepNumber < currentStep) return 'completed';
		if (stepNumber === currentStep) return 'current';
		return 'upcoming';
	}

	function handleClick(step: WizardStep) {
		if (onStepClick && step < currentStep) {
			onStepClick(step);
		}
	}
</script>

<div class="flex items-center justify-between mb-8">
	{#each steps as step, index}
		{@const status = getStepStatus(step.number)}
		<div class="flex items-center {index < steps.length - 1 ? 'flex-1' : ''}">
			<button
				type="button"
				onclick={() => handleClick(step.number as WizardStep)}
				disabled={status === 'upcoming'}
				class="flex flex-col items-center gap-2 {status === 'completed' ? 'cursor-pointer' : status === 'upcoming' ? 'cursor-not-allowed' : 'cursor-default'}"
			>
				<div
					class="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
					{status === 'completed'
						? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
						: status === 'current'
							? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
							: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}"
				>
					{#if status === 'completed'}
						<Check size={20} />
					{:else}
						{step.number}
					{/if}
				</div>
				<span
					class="text-xs font-medium hidden sm:block
					{status === 'current' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}"
				>
					{step.label}
				</span>
			</button>

			{#if index < steps.length - 1}
				<div
					class="flex-1 h-0.5 mx-2 sm:mx-4 transition-colors
					{step.number < currentStep
						? 'bg-[var(--color-accent)]'
						: 'bg-[var(--color-bg-tertiary)]'}"
				></div>
			{/if}
		</div>
	{/each}
</div>
