<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	// Redirect authenticated users away from auth pages
	$effect(() => {
		if (auth.initialized && auth.isAuthenticated) {
			goto('/');
		}
	});
</script>

{#if !auth.isAuthenticated}
	<div class="min-h-screen flex items-center justify-center p-4">
		<div class="w-full max-w-md">
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-white">MyLiftPal</h1>
				<p class="text-[#a1a1aa] mt-2">Track your gains, optimize your training</p>
			</div>
			{@render children()}
		</div>
	</div>
{/if}
