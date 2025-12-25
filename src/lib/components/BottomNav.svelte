<script lang="ts">
	import { page } from '$app/stores';
	import { Home, ClipboardList, Dumbbell, Settings } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/blocks', label: 'Blocks', icon: ClipboardList },
		{ href: '/exercises', label: 'Exercises', icon: Dumbbell },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] safe-area-bottom md:hidden">
	<div class="flex justify-around items-center h-16">
		{#each navItems as item}
			{@const active = isActive(item.href, $page.url.pathname)}
			<a
				href={item.href}
				class="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors {active
					? 'text-[var(--color-accent)]'
					: 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}"
			>
				<item.icon size={24} strokeWidth={active ? 2.5 : 2} />
				<span class="text-xs font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	.safe-area-bottom {
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
	}
</style>
