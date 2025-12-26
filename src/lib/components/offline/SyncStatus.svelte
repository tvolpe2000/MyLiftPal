<script lang="ts">
	import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-svelte';
	import { offline } from '$lib/stores/offlineStore.svelte';

	type SyncState = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

	let syncError = $state('');
	let showSuccess = $state(false);

	const currentState = $derived.by((): SyncState => {
		if (!offline.isOnline) return 'offline';
		if (offline.isSyncing) return 'syncing';
		if (syncError) return 'error';
		if (offline.pendingSetCount > 0) return 'pending';
		return 'synced';
	});

	async function handleSync() {
		if (!offline.isOnline || offline.isSyncing) return;

		syncError = '';
		const result = await offline.syncPendingSets();

		if (!result.success && result.errors.length > 0) {
			syncError = result.errors[0];
		} else if (result.syncedCount > 0) {
			showSuccess = true;
			setTimeout(() => {
				showSuccess = false;
			}, 2000);
		}
	}

	function formatLastSync(): string {
		if (!offline.lastSyncAt) return '';

		const now = new Date();
		const diff = now.getTime() - offline.lastSyncAt.getTime();
		const minutes = Math.floor(diff / 60000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return offline.lastSyncAt.toLocaleDateString();
	}
</script>

{#if currentState !== 'synced' || showSuccess}
	<div class="flex items-center gap-2">
		{#if currentState === 'offline'}
			<div class="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
				<CloudOff size={14} />
				<span>Offline</span>
			</div>
		{:else if currentState === 'syncing'}
			<div class="flex items-center gap-1.5 text-xs text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-1 rounded">
				<Loader2 size={14} class="animate-spin" />
				<span>Syncing...</span>
			</div>
		{:else if currentState === 'pending'}
			<button
				type="button"
				onclick={handleSync}
				class="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors"
			>
				<Cloud size={14} />
				<span>{offline.pendingSetCount} pending</span>
			</button>
		{:else if currentState === 'error'}
			<button
				type="button"
				onclick={handleSync}
				class="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
				title={syncError}
			>
				<AlertCircle size={14} />
				<span>Sync failed</span>
			</button>
		{:else if showSuccess}
			<div class="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
				<Check size={14} />
				<span>Synced</span>
			</div>
		{/if}

		{#if offline.lastSyncAt && currentState === 'synced' && !showSuccess}
			<span class="text-xs text-[var(--color-text-muted)]">
				Last sync: {formatLastSync()}
			</span>
		{/if}
	</div>
{/if}
