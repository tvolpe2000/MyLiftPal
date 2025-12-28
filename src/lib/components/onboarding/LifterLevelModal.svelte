<script lang="ts">
	import { supabase } from '$lib/db/supabase';
	import { auth } from '$lib/stores/auth.svelte';
	import { LIFTER_LEVELS, type LifterLevel } from '$lib/data/volumePrograms';

	interface Props {
		onselect?: (level: LifterLevel) => void;
	}

	let { onselect }: Props = $props();

	let selectedLevel = $state<LifterLevel | null>(null);
	let saving = $state(false);
	let error = $state<string | null>(null);

	async function handleSelect(level: LifterLevel) {
		if (!auth.user) return;

		selectedLevel = level;
		saving = true;
		error = null;

		try {
			const { error: updateError } = await supabase
				.from('profiles')
				.update({
					lifter_level: level,
					updated_at: new Date().toISOString()
				} as never)
				.eq('id', auth.user.id);

			if (updateError) {
				console.error('Error saving lifter level:', updateError);
				error = updateError.message || 'Failed to save. Please try again.';
				saving = false;
				return;
			}

			// Refresh profile to update the auth store
			await auth.fetchProfile(auth.user.id);

			saving = false;
			onselect?.(level);
		} catch (e) {
			console.error('Unexpected error:', e);
			error = 'An unexpected error occurred. Please try again.';
			saving = false;
		}
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
	<div class="w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl overflow-hidden">
		<!-- Header -->
		<div class="p-6 text-center border-b border-[var(--color-border)]">
			<h2 class="text-2xl font-bold text-[var(--color-text-primary)]">Welcome to MyLiftPal!</h2>
			<p class="mt-2 text-[var(--color-text-secondary)]">
				What's your training experience?
			</p>
		</div>

		<!-- Level Options -->
		<div class="p-6 space-y-3">
			{#if error}
				<div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-2">
					{error}
				</div>
			{/if}

			{#each LIFTER_LEVELS as level}
				<button
					onclick={() => handleSelect(level.value)}
					disabled={saving}
					class="w-full flex items-center gap-4 p-4 rounded-xl transition-all {selectedLevel === level.value && saving
						? 'bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]'
						: 'bg-[var(--color-bg-tertiary)] border-2 border-transparent hover:border-[var(--color-accent)]/50'} disabled:opacity-50"
				>
					<div class="w-12 h-12 flex items-center justify-center text-2xl rounded-full bg-[var(--color-bg-primary)]">
						{level.emoji}
					</div>
					<div class="text-left flex-1">
						<div class="font-semibold text-[var(--color-text-primary)]">{level.label}</div>
						<div class="text-sm text-[var(--color-text-secondary)]">{level.description}</div>
					</div>
					{#if selectedLevel === level.value && saving}
						<div class="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Footer -->
		<div class="px-6 pb-6 text-center">
			<p class="text-xs text-[var(--color-text-muted)]">
				You can change this anytime in Settings
			</p>
		</div>
	</div>
</div>
