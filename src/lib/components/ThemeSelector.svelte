<script lang="ts">
	import { theme, themes, type ThemeId } from '$lib/stores/theme.svelte';
	import { Check } from 'lucide-svelte';

	const themeList = Object.values(themes);
</script>

<div class="grid grid-cols-3 gap-3">
	{#each themeList as t}
		<button
			onclick={() => theme.setTheme(t.id)}
			class="relative p-4 rounded-xl border-2 transition-all {theme.current === t.id
				? 'border-[var(--color-accent)]'
				: 'border-transparent hover:border-[var(--color-border)]'}"
			style="background-color: {t.colors.bgSecondary};"
		>
			{#if theme.current === t.id}
				<div
					class="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
					style="background-color: {t.colors.accent};"
				>
					<Check size={12} class="text-white" />
				</div>
			{/if}

			<div class="flex flex-col items-center gap-2">
				<div
					class="w-8 h-8 rounded-full"
					style="background-color: {t.colors.accent};"
				></div>
				<span
					class="text-sm font-medium"
					style="color: {t.colors.textPrimary};"
				>
					{t.name}
				</span>
			</div>
		</button>
	{/each}
</div>
