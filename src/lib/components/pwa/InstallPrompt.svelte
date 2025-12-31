<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { Download, X } from 'lucide-svelte';

	const DISMISSED_KEY = 'myliftpal_install_dismissed';
	const DISMISS_DURATION_DAYS = 7; // Show again after 7 days

	let showPrompt = $state(false);
	let deferredPrompt: BeforeInstallPromptEvent | null = $state(null);
	let isInstalled = $state(false);

	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	onMount(() => {
		if (!browser) return;

		// Check if already installed (standalone mode)
		isInstalled = window.matchMedia('(display-mode: standalone)').matches;
		if (isInstalled) return;

		// Check if user dismissed recently
		const dismissedAt = localStorage.getItem(DISMISSED_KEY);
		if (dismissedAt) {
			const dismissedDate = new Date(parseInt(dismissedAt));
			const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
			if (daysSinceDismiss < DISMISS_DURATION_DAYS) {
				return; // Don't show if dismissed recently
			}
		}

		// Listen for the beforeinstallprompt event
		const handleBeforeInstall = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
			showPrompt = true;
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstall);

		// Listen for successful install
		window.addEventListener('appinstalled', () => {
			showPrompt = false;
			isInstalled = true;
			deferredPrompt = null;
		});

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
		};
	});

	async function handleInstall() {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			showPrompt = false;
		}
		deferredPrompt = null;
	}

	function handleDismiss() {
		showPrompt = false;
		localStorage.setItem(DISMISSED_KEY, Date.now().toString());
	}
</script>

{#if showPrompt && !isInstalled}
	<!-- Position above the Voice FAB (which is at bottom-40) and BottomNav -->
	<div class="fixed bottom-56 left-4 right-4 md:bottom-8 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
		<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-lg p-4">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0 w-10 h-10 bg-[var(--color-accent)]/20 rounded-lg flex items-center justify-center">
					<Download size={20} class="text-[var(--color-accent)]" />
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="font-medium text-[var(--color-text-primary)]">Install MyLiftPal</h3>
					<p class="text-sm text-[var(--color-text-secondary)] mt-0.5">
						Add to home screen for faster access and offline support
					</p>
				</div>
				<button
					onclick={handleDismiss}
					class="flex-shrink-0 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
				>
					<X size={18} />
				</button>
			</div>
			<div class="flex gap-2 mt-3">
				<button
					onclick={handleDismiss}
					class="flex-1 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg"
				>
					Not now
				</button>
				<button
					onclick={handleInstall}
					class="flex-1 px-3 py-2 text-sm font-medium bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)]"
				>
					Install
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
