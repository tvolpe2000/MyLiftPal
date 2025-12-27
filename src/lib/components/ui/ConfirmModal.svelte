<script lang="ts">
	import { X, AlertTriangle } from 'lucide-svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'warning' | 'default';
		loading?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open,
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'default',
		loading = false,
		onconfirm,
		oncancel
	}: Props = $props();

	function handleBackdropClick() {
		if (!loading) {
			oncancel();
		}
	}

	function handleConfirm() {
		if (!loading) {
			onconfirm();
		}
	}

	const confirmButtonClass = $derived(() => {
		switch (variant) {
			case 'danger':
				return 'bg-red-500 hover:bg-red-600 text-white';
			case 'warning':
				return 'bg-amber-500 hover:bg-amber-600 text-white';
			default:
				return 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)]';
		}
	});

	const iconClass = $derived(() => {
		switch (variant) {
			case 'danger':
				return 'text-red-400 bg-red-500/10';
			case 'warning':
				return 'text-amber-400 bg-amber-500/10';
			default:
				return 'text-[var(--color-accent)] bg-[var(--color-accent)]/10';
		}
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" onclick={handleBackdropClick}>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/80"></div>

		<!-- Modal -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative w-full max-w-sm bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-start gap-4 p-5">
				<div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 {iconClass()}">
					<AlertTriangle size={20} />
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="font-semibold text-[var(--color-text-primary)] text-lg">{title}</h3>
					<p class="mt-1 text-sm text-[var(--color-text-secondary)]">{message}</p>
				</div>
				<button
					type="button"
					onclick={oncancel}
					disabled={loading}
					class="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 p-5 pt-0">
				<button
					type="button"
					onclick={oncancel}
					disabled={loading}
					class="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
				>
					{cancelText}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					disabled={loading}
					class="flex-1 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 {confirmButtonClass()}"
				>
					{#if loading}
						<span class="flex items-center justify-center gap-2">
							<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
							Deleting...
						</span>
					{:else}
						{confirmText}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
