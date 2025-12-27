<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { changelog } from '$lib/stores/changelogStore.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import { ArrowLeft, Sparkles, Calendar, Circle } from 'lucide-svelte';
	import type { RoadmapStatus } from '$lib/types';

	let activeTab = $state<'releases' | 'roadmap'>('releases');

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	$effect(() => {
		if (auth.isAuthenticated) {
			changelog.loadAll();
		}
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getStatusBadge(status: RoadmapStatus): { bg: string; text: string; label: string } {
		switch (status) {
			case 'in_progress':
				return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'In Progress' };
			case 'planned':
				return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Planned' };
			case 'tracked':
			default:
				return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Tracked' };
		}
	}

	function goBack() {
		history.back();
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-2xl mx-auto">
				<!-- Header -->
				<div class="flex items-center gap-4 mb-6">
					<button
						type="button"
						onclick={goBack}
						class="p-2 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
					>
						<ArrowLeft size={24} />
					</button>
					<div>
						<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">What's New</h1>
						<p class="text-[var(--color-text-secondary)]">Updates and upcoming features</p>
					</div>
				</div>

				<!-- Tab Bar -->
				<div class="flex gap-1 mb-6 p-1 bg-[var(--color-bg-secondary)] rounded-xl">
					<button
						type="button"
						onclick={() => (activeTab = 'releases')}
						class="flex-1 py-3 px-4 rounded-lg font-medium transition-colors {activeTab === 'releases'
							? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
							: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
					>
						Recent Updates
					</button>
					<button
						type="button"
						onclick={() => (activeTab = 'roadmap')}
						class="flex-1 py-3 px-4 rounded-lg font-medium transition-colors {activeTab === 'roadmap'
							? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
							: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
					>
						Coming Soon
					</button>
				</div>

				{#if changelog.loading}
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
						<div class="text-[var(--color-text-muted)]">Loading...</div>
					</div>
				{:else if activeTab === 'releases'}
					<!-- Releases Tab -->
					<div class="space-y-4">
						{#each changelog.releases as release (release.id)}
							<div class="bg-[var(--color-bg-secondary)] rounded-xl p-5">
								<!-- Version & Date Header -->
								<div class="flex items-center justify-between mb-3">
									<div class="flex items-center gap-2">
										<span class="px-2.5 py-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-sm font-semibold rounded-lg">
											v{release.version}
										</span>
										{#if release.version === changelog.currentVersion}
											<span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
												Latest
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
										<Calendar size={14} />
										{formatDate(release.released_at)}
									</div>
								</div>

								<!-- Title -->
								{#if release.title}
									<h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
										{release.title}
									</h3>
								{/if}

								<!-- Highlights -->
								{#if release.highlights && release.highlights.length > 0}
									<div class="flex flex-wrap gap-2 mb-4">
										{#each release.highlights as highlight}
											<span class="px-3 py-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm rounded-full">
												{highlight}
											</span>
										{/each}
									</div>
								{/if}

								<!-- Changes List -->
								{#if release.changes && release.changes.length > 0}
									<ul class="space-y-2">
										{#each release.changes as change}
											<li class="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
												<Circle size={6} class="mt-1.5 fill-current text-[var(--color-accent)]" />
												{change}
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/each}

						{#if changelog.releases.length === 0}
							<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
								<Sparkles size={32} class="mx-auto mb-3 text-[var(--color-text-muted)]" />
								<p class="text-[var(--color-text-muted)]">No releases yet</p>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Roadmap Tab -->
					<div class="space-y-3">
						{#each changelog.roadmap as item (item.id)}
							{@const badge = getStatusBadge(item.status)}
							<div class="bg-[var(--color-bg-secondary)] rounded-xl p-5">
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1">
										<h3 class="font-semibold text-[var(--color-text-primary)] mb-1">
											{item.title}
										</h3>
										{#if item.description}
											<p class="text-sm text-[var(--color-text-secondary)]">
												{item.description}
											</p>
										{/if}
									</div>
									<span class="px-2.5 py-1 text-xs font-medium rounded-lg {badge.bg} {badge.text} whitespace-nowrap">
										{badge.label}
									</span>
								</div>
							</div>
						{/each}

						{#if changelog.roadmap.length === 0}
							<div class="bg-[var(--color-bg-secondary)] rounded-xl p-8 text-center">
								<Sparkles size={32} class="mx-auto mb-3 text-[var(--color-text-muted)]" />
								<p class="text-[var(--color-text-muted)]">No upcoming features listed</p>
							</div>
						{/if}
					</div>

					<!-- Legend -->
					<div class="mt-6 p-4 bg-[var(--color-bg-secondary)] rounded-xl">
						<p class="text-xs font-medium text-[var(--color-text-muted)] mb-3">Status Guide</p>
						<div class="flex flex-wrap gap-4 text-sm">
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-400">In Progress</span>
								<span class="text-[var(--color-text-secondary)]">Currently building</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 text-xs font-medium rounded bg-blue-500/20 text-blue-400">Planned</span>
								<span class="text-[var(--color-text-secondary)]">Coming soon</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-500/20 text-gray-400">Tracked</span>
								<span class="text-[var(--color-text-secondary)]">On the radar</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</AppShell>
{/if}
