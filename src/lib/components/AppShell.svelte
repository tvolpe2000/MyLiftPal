<script lang="ts">
	import BottomNav from './BottomNav.svelte';
	import SideNav from './SideNav.svelte';
	import OfflineIndicator from './offline/OfflineIndicator.svelte';
	import VoiceFAB from './ai/VoiceFAB.svelte';
	import VoiceModal from './ai/VoiceModal.svelte';
	import { processGlobalCommand, isGlobalAssistantAvailable } from '$lib/ai/globalAssistant';
	import { auth } from '$lib/stores/auth.svelte';
	import { trainingBlockStore } from '$lib/stores/trainingBlockStore.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Voice assistant state
	let showVoiceModal = $state(false);
	let aiAvailable = $state(false);

	// Check if AI is available on mount (non-blocking)
	onMount(() => {
		// Run these checks asynchronously without blocking the UI
		isGlobalAssistantAvailable()
			.then((available) => {
				aiAvailable = available;
			})
			.catch(() => {
				aiAvailable = false;
			});

		// Load training block store for AI context
		if (auth.isAuthenticated) {
			trainingBlockStore.loadActiveBlock().catch((err) => {
				console.error('Failed to load training block:', err);
			});
		}
	});

	// Handle voice command from modal
	async function handleVoiceCommand(transcript: string) {
		const result = await processGlobalCommand(transcript);
		if (!result) {
			return null;
		}

		return {
			success: result.success,
			toolCall: result.toolCall,
			message: result.message
		};
	}
</script>

<div class="min-h-screen">
	<OfflineIndicator />
	<SideNav />

	<main class="md:ml-64 pb-20 md:pb-0">
		{@render children()}
	</main>

	<BottomNav />

	<!-- Global Voice Assistant FAB -->
	{#if auth.isAuthenticated && aiAvailable}
		<VoiceFAB onclick={() => (showVoiceModal = true)} />
	{/if}

	<!-- Voice Input Modal -->
	{#if showVoiceModal}
		<VoiceModal onClose={() => (showVoiceModal = false)} onCommand={handleVoiceCommand} />
	{/if}
</div>
