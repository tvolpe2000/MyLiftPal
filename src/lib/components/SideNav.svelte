<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Home, ClipboardList, Dumbbell, Settings, LogOut } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';

	const navItems = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/blocks', label: 'Training Blocks', icon: ClipboardList },
		{ href: '/exercises', label: 'Exercises', icon: Dumbbell },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	async function handleSignOut() {
		await auth.signOut();
		goto('/auth/login');
	}
</script>

<aside class="hidden md:flex flex-col w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] h-screen fixed left-0 top-0">
	<div class="p-6 border-b border-[var(--color-border)]">
		<h1 class="text-xl font-bold text-[var(--color-text-primary)]">MyLiftPal</h1>
	</div>

	<nav class="flex-1 p-4">
		<ul class="space-y-2">
			{#each navItems as item}
				{@const active = isActive(item.href, $page.url.pathname)}
				<li>
					<a
						href={item.href}
						class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {active
							? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
							: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'}"
					>
						<item.icon size={20} strokeWidth={active ? 2.5 : 2} />
						<span class="font-medium">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="p-4 border-t border-[var(--color-border)]">
		{#if auth.profile}
			<div class="flex items-center gap-3 px-4 py-2 mb-2">
				<div class="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-bg-primary)] font-semibold text-sm">
					{auth.profile.display_name?.[0]?.toUpperCase() || auth.user?.email?.[0]?.toUpperCase() || '?'}
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-[var(--color-text-primary)] truncate">
						{auth.profile.display_name || 'User'}
					</p>
					<p class="text-xs text-[var(--color-text-muted)] truncate">
						{auth.user?.email}
					</p>
				</div>
			</div>
		{/if}
		<button
			onclick={handleSignOut}
			class="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
		>
			<LogOut size={20} />
			<span class="font-medium">Sign Out</span>
		</button>
	</div>
</aside>
