<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';

	// useRegisterSW returns stores for handling SW lifecycle
	const { needRefresh, updateServiceWorker, offlineReady } = useRegisterSW({
		onRegistered(swr) {
			console.log('SW Registered');
		},
		onRegisterError(error) {
			console.log('SW Registration Error', error);
		}
	});

	function close() {
		needRefresh.set(false);
		offlineReady.set(false);
	}
</script>

{#if $needRefresh}
	<div
		class="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 z-50 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-accent)] shadow-lg flex flex-col gap-2 max-w-md mx-auto md:mx-0 animate-in slide-in-from-bottom-2"
	>
		<div class="flex items-start justify-between">
			<div>
				<div class="font-medium text-[var(--color-text-primary)]">Update available</div>
				<div class="text-sm text-[var(--color-text-secondary)] mt-1">
					A new version of MyLiftPal is available. Reload to update.
				</div>
			</div>
		</div>
		<div class="flex gap-3 mt-2">
			<button
				onclick={() => updateServiceWorker(true)}
				class="flex-1 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] rounded-lg text-sm font-semibold transition-colors"
			>
				Reload
			</button>
			<button
				onclick={close}
				class="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-sm font-medium transition-colors"
			>
				Dismiss
			</button>
		</div>
	</div>
{/if}
