<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { workoutSettings } from '$lib/stores/workoutSettings.svelte';
	import { offline } from '$lib/stores/offlineStore.svelte';
	import InstallPrompt from '$lib/components/pwa/InstallPrompt.svelte';
	import ReloadPrompt from '$lib/components/pwa/ReloadPrompt.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	onMount(() => {
		auth.initialize();
		theme.initialize();
		workoutSettings.initialize();
		offline.init();

		// Set up online/offline listeners
		if (browser) {
			const handleOnline = () => {
				offline.refreshOnlineStatus();
				// Auto-sync when coming back online
				offline.syncPendingSets();
			};

			const handleOffline = () => {
				offline.refreshOnlineStatus();
			};

			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);

			return () => {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			};
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-[var(--color-bg-primary)]">
	{#if auth.initialized || auth.hasCachedSession}
		<!-- Show content immediately if we have cached data OR auth is fully initialized -->
		{@render children()}
	{:else}
		<!-- Only show loading for first-time visitors with no cached data -->
		<div class="min-h-screen flex items-center justify-center">
			<div class="text-[var(--color-accent)] text-lg">Loading...</div>
		</div>
	{/if}
</div>

<!-- PWA install prompt for better offline experience -->
<InstallPrompt />
<ReloadPrompt />
