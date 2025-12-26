<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { workoutSettings } from '$lib/stores/workoutSettings.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		auth.initialize();
		theme.initialize();
		workoutSettings.initialize();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-[var(--color-bg-primary)]">
	{#if !auth.initialized}
		<div class="min-h-screen flex items-center justify-center">
			<div class="text-[var(--color-accent)] text-lg">Loading...</div>
		</div>
	{:else}
		{@render children()}
	{/if}
</div>
