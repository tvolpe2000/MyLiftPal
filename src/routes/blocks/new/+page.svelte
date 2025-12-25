<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import WizardStepper from '$lib/components/wizard/WizardStepper.svelte';
	import StepBasicInfo from '$lib/components/wizard/StepBasicInfo.svelte';
	import StepAddDays from '$lib/components/wizard/StepAddDays.svelte';
	import StepAddExercises from '$lib/components/wizard/StepAddExercises.svelte';
	import StepReview from '$lib/components/wizard/StepReview.svelte';
	import { ArrowLeft, ArrowRight, X } from 'lucide-svelte';
	import type { WizardStep } from '$lib/types/wizard';
	import { onMount } from 'svelte';

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	onMount(() => {
		// Reset wizard when entering the page
		wizard.reset();
	});

	function handleCancel() {
		if (wizard.isDirty) {
			if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
				wizard.reset();
				goto('/blocks');
			}
		} else {
			goto('/blocks');
		}
	}

	function handleStepClick(step: WizardStep) {
		wizard.setStep(step);
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-2xl mx-auto">
				<!-- Header -->
				<div class="flex items-center justify-between mb-6">
					<button
						type="button"
						onclick={handleCancel}
						class="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
					>
						<X size={20} />
						<span class="hidden sm:inline">Cancel</span>
					</button>
					<h1 class="text-lg font-semibold text-[var(--color-text-primary)]">New Training Block</h1>
					<div class="w-16"></div>
				</div>

				<!-- Stepper -->
				<WizardStepper currentStep={wizard.currentStep} onStepClick={handleStepClick} />

				<!-- Step Content -->
				<div class="mb-8">
					{#if wizard.currentStep === 1}
						<StepBasicInfo />
					{:else if wizard.currentStep === 2}
						<StepAddDays />
					{:else if wizard.currentStep === 3}
						<StepAddExercises />
					{:else if wizard.currentStep === 4}
						<StepReview />
					{/if}
				</div>

				<!-- Navigation -->
				{#if wizard.currentStep < 4}
					<div class="flex items-center justify-between">
						{#if wizard.currentStep > 1}
							<button
								type="button"
								onclick={() => wizard.prevStep()}
								class="flex items-center gap-2 px-4 py-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
							>
								<ArrowLeft size={20} />
								<span>Back</span>
							</button>
						{:else}
							<div></div>
						{/if}

						<button
							type="button"
							onclick={() => wizard.nextStep()}
							disabled={!wizard.canProceed}
							class="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-bg-primary)] font-semibold px-6 py-3 rounded-lg transition-colors"
						>
							<span>
								{#if wizard.currentStep === 3}
									Review
								{:else}
									Continue
								{/if}
							</span>
							<ArrowRight size={20} />
						</button>
					</div>
				{/if}
			</div>
		</div>
	</AppShell>
{/if}
