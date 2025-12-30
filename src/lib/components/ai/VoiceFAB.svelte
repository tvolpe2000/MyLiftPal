<script lang="ts">
	import { Mic } from 'lucide-svelte';

	interface Props {
		onclick: () => void;
		disabled?: boolean;
	}

	let { onclick, disabled = false }: Props = $props();
</script>

<button
	type="button"
	{onclick}
	{disabled}
	class="fixed bottom-40 right-4 md:bottom-8 md:right-8 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-lg transition-all hover:bg-[var(--color-accent-hover)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
	aria-label="Voice input"
>
	<Mic size={24} />
</button>
