<script lang="ts">
	import BottomNav from './BottomNav.svelte';
	import SideNav from './SideNav.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen">
	<SideNav />

	<main class="md:ml-64 pb-20 md:pb-0">
		{@render children()}
	</main>

	<BottomNav />
</div>
