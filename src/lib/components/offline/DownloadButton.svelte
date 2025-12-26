<script lang="ts">
	import { CloudDownload, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-svelte';
	import { offline } from '$lib/stores/offlineStore.svelte';

	interface Props {
		dayId: string;
		blockId: string;
		dayName?: string;
		compact?: boolean;
	}

	let { dayId, blockId, dayName = 'workout', compact = false }: Props = $props();

	type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'error';

	let downloadState = $state<DownloadState>('idle');
	let errorMessage = $state('');

	// Check initial state and update when downloaded days change
	$effect(() => {
		if (offline.isDownloaded(dayId) && downloadState !== 'downloading') {
			downloadState = 'downloaded';
		} else if (!offline.isDownloaded(dayId) && downloadState === 'downloaded') {
			downloadState = 'idle';
		}
	});

	// Track if this specific day is being downloaded
	$effect(() => {
		if (offline.downloadingDayId === dayId) {
			downloadState = 'downloading';
		}
	});

	async function handleClick() {
		if (downloadState === 'downloading') return;

		downloadState = 'downloading';
		errorMessage = '';

		const success = await offline.downloadWorkoutDay(dayId, blockId);

		if (success) {
			downloadState = 'downloaded';
		} else {
			downloadState = 'error';
			errorMessage = 'Download failed';
		}
	}

	const baseClass = $derived(
		compact
			? 'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors'
			: 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
	);

	const stateClass = $derived(() => {
		switch (downloadState) {
			case 'idle':
				return 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/20 hover:text-[var(--color-accent)]';
			case 'downloading':
				return 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] cursor-wait';
			case 'downloaded':
				return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
			case 'error':
				return 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
			default:
				return '';
		}
	});

	const iconSize = $derived(compact ? 14 : 16);
</script>

<button
	type="button"
	class="{baseClass} {stateClass()}"
	onclick={handleClick}
	disabled={downloadState === 'downloading'}
	title={downloadState === 'downloaded' ? `${dayName} downloaded - click to refresh` : `Download ${dayName} for offline`}
>
	{#if downloadState === 'idle'}
		<CloudDownload size={iconSize} />
		{#if !compact}
			<span>Download</span>
		{/if}
	{:else if downloadState === 'downloading'}
		<Loader2 size={iconSize} class="animate-spin" />
		{#if !compact}
			<span>Downloading...</span>
		{/if}
	{:else if downloadState === 'downloaded'}
		<Check size={iconSize} />
		{#if !compact}
			<span>Ready offline</span>
		{:else}
			<RefreshCw size={iconSize - 2} class="opacity-50" />
		{/if}
	{:else if downloadState === 'error'}
		<AlertCircle size={iconSize} />
		{#if !compact}
			<span>Retry</span>
		{/if}
	{/if}
</button>

{#if downloadState === 'error' && errorMessage && !compact}
	<p class="text-xs text-red-400 mt-1">{errorMessage}</p>
{/if}
