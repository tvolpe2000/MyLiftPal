<script lang="ts">
	import { WifiOff } from 'lucide-svelte';
	import { offline } from '$lib/stores/offlineStore.svelte';
</script>

{#if !offline.isOnline}
	<div class="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
		<div class="max-w-4xl mx-auto flex items-center justify-center gap-2 text-yellow-400 text-sm">
			<WifiOff size={16} />
			<span>You're offline - changes will sync when connected</span>
			{#if offline.pendingSetCount > 0}
				<span class="bg-yellow-500/20 px-2 py-0.5 rounded text-xs">
					{offline.pendingSetCount} pending
				</span>
			{/if}
		</div>
	</div>
{/if}
