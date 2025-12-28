<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import { supabase } from '$lib/db/supabase';
	import { User, Scale, Palette, LogOut, Dumbbell, MessageSquare, Send, TrendingUp } from 'lucide-svelte';
	import { LIFTER_LEVELS, type LifterLevel } from '$lib/data/volumePrograms';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import { workoutSettings, type WeightInputStyle, type WeightIncrement } from '$lib/stores/workoutSettings.svelte';

	let displayName = $state(auth.profile?.display_name || '');
	let weightUnit = $state<'lbs' | 'kg'>(auth.profile?.weight_unit || 'lbs');
	let defaultRestSeconds = $state(auth.profile?.default_rest_seconds || 90);
	let lifterLevel = $state<LifterLevel | null>(auth.profile?.lifter_level as LifterLevel | null ?? null);
	let saving = $state(false);
	let saved = $state(false);

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	$effect(() => {
		if (auth.profile) {
			displayName = auth.profile.display_name || '';
			weightUnit = auth.profile.weight_unit;
			defaultRestSeconds = auth.profile.default_rest_seconds;
			lifterLevel = auth.profile.lifter_level as LifterLevel | null ?? null;
		}
	});

	async function saveProfile() {
		if (!auth.user) return;

		saving = true;
		saved = false;

		const { error } = await supabase
			.from('profiles')
			.update({
				display_name: displayName,
				weight_unit: weightUnit,
				default_rest_seconds: defaultRestSeconds,
				lifter_level: lifterLevel,
				updated_at: new Date().toISOString()
			} as never)
			.eq('id', auth.user.id);

		if (error) {
			console.error('Error saving profile:', error);
		} else {
			await auth.fetchProfile(auth.user.id);
			saved = true;
			setTimeout(() => saved = false, 2000);
		}

		saving = false;
	}

	async function handleSignOut() {
		await auth.signOut();
		goto('/auth/login');
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-2xl mx-auto">
				<div class="mb-8">
					<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
					<p class="text-[var(--color-text-secondary)]">Manage your profile and preferences</p>
				</div>

				<div class="space-y-6">
					<!-- Profile Section -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<div class="flex items-center gap-3 mb-6">
							<User size={20} class="text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Profile</h2>
						</div>

						<div class="space-y-4">
							<div>
								<label for="displayName" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
									Display Name
								</label>
								<input
									type="text"
									id="displayName"
									bind:value={displayName}
									class="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
								/>
							</div>

							<div>
								<span class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
									Email
								</span>
								<div class="px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)]">
									{auth.user?.email}
								</div>
							</div>
						</div>
					</div>

					<!-- Experience Level Section -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<div class="flex items-center gap-3 mb-6">
							<TrendingUp size={20} class="text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Experience Level</h2>
						</div>

						<div class="space-y-3">
							{#each LIFTER_LEVELS as level}
								<button
									onclick={() => lifterLevel = level.value}
									class="w-full flex items-center gap-4 p-4 rounded-xl transition-colors {lifterLevel === level.value
										? 'bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]'
										: 'bg-[var(--color-bg-tertiary)] border-2 border-transparent hover:border-[var(--color-border)]'}"
								>
									<div class="w-10 h-10 flex items-center justify-center text-xl rounded-full bg-[var(--color-bg-primary)]">
										{level.emoji}
									</div>
									<div class="text-left flex-1">
										<div class="font-medium text-[var(--color-text-primary)]">{level.label}</div>
										<div class="text-xs text-[var(--color-text-secondary)]">{level.description}</div>
									</div>
								</button>
							{/each}
						</div>

						<p class="text-xs text-[var(--color-text-muted)] mt-4">
							Your experience level affects volume recommendations for Fill to Optimal
						</p>
					</div>

					<!-- Preferences Section -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<div class="flex items-center gap-3 mb-6">
							<Scale size={20} class="text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Preferences</h2>
						</div>

						<div class="space-y-4">
							<div role="group" aria-labelledby="weight-unit-label">
								<span id="weight-unit-label" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
									Weight Unit
								</span>
								<div class="flex gap-3">
									<button
										onclick={() => weightUnit = 'lbs'}
										class="flex-1 py-3 rounded-lg font-medium transition-colors {weightUnit === 'lbs' ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
									>
										Pounds (lbs)
									</button>
									<button
										onclick={() => weightUnit = 'kg'}
										class="flex-1 py-3 rounded-lg font-medium transition-colors {weightUnit === 'kg' ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
									>
										Kilograms (kg)
									</button>
								</div>
							</div>

							<div>
								<label for="restTime" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
									Default Rest Time (seconds)
								</label>
								<div class="flex items-center gap-4">
									<input
										type="range"
										id="restTime"
										bind:value={defaultRestSeconds}
										min="30"
										max="300"
										step="15"
										class="flex-1 accent-[var(--color-accent)]"
									/>
									<span class="text-[var(--color-text-primary)] font-mono w-16 text-right">{defaultRestSeconds}s</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Theme Section -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<div class="flex items-center gap-3 mb-6">
							<Palette size={20} class="text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Theme</h2>
						</div>
						<ThemeSelector />
					</div>

					<!-- Workout Preferences Section -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<div class="flex items-center gap-3 mb-6">
							<Dumbbell size={20} class="text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Workout Input</h2>
						</div>

						<div class="space-y-6">
							<!-- Weight Input Style -->
							<div role="group" aria-labelledby="weight-input-style-label">
								<span id="weight-input-style-label" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
									Weight Input Style
								</span>
								<div class="flex gap-3">
									<button
										onclick={() => workoutSettings.setWeightInputStyle('scroll')}
										class="flex-1 py-3 rounded-lg font-medium transition-colors {workoutSettings.weightInputStyle === 'scroll' ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
									>
										Scroll Wheel
									</button>
									<button
										onclick={() => workoutSettings.setWeightInputStyle('buttons')}
										class="flex-1 py-3 rounded-lg font-medium transition-colors {workoutSettings.weightInputStyle === 'buttons' ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
									>
										+/- Buttons
									</button>
								</div>
							</div>

							<!-- Default Weight Increment -->
							<div role="group" aria-labelledby="weight-increment-label">
								<span id="weight-increment-label" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
									Default Weight Increment
								</span>
								<div class="flex gap-2">
									{#each [2.5, 5, 10] as inc}
										<button
											onclick={() => workoutSettings.setDefaultWeightIncrement(inc as WeightIncrement)}
											class="flex-1 py-3 rounded-lg font-medium transition-colors {workoutSettings.defaultWeightIncrement === inc ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
										>
											{inc} lbs
										</button>
									{/each}
								</div>
							</div>

							<!-- Rep Input Style -->
							<div role="group" aria-labelledby="rep-input-style-label">
								<span id="rep-input-style-label" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
									Rep Input Style
								</span>
								<div class="flex gap-3">
									<button
										onclick={() => workoutSettings.setRepInputStyle('buttons')}
										class="flex-1 py-3 rounded-lg font-medium transition-colors {workoutSettings.repInputStyle === 'buttons' ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
									>
										Quick Select
									</button>
									<button
										onclick={() => workoutSettings.setRepInputStyle('scroll')}
										class="flex-1 py-3 rounded-lg font-medium transition-colors {workoutSettings.repInputStyle === 'scroll' ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
									>
										Scroll Wheel
									</button>
								</div>
							</div>

							<!-- Rep Quick-Select Values (only show if using buttons) -->
							{#if workoutSettings.repInputStyle === 'buttons'}
								<div>
									<span class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
										Rep Quick-Select Values
									</span>
									<div class="flex flex-wrap gap-2">
										{#each workoutSettings.repQuickSelectValues as rep}
											<div class="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-medium">
												{rep}
											</div>
										{/each}
									</div>
									<p class="text-xs text-[var(--color-text-muted)] mt-2">
										Customize coming soon
									</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Feedback Section -->
					<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
						<div class="flex items-center gap-3 mb-4">
							<MessageSquare size={20} class="text-[var(--color-accent)]" />
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">Feedback</h2>
						</div>
						<p class="text-sm text-[var(--color-text-secondary)] mb-4">
							Found a bug? Have an idea? Let us know!
						</p>
						<a
							href="/feedback"
							class="flex items-center justify-center gap-2 w-full py-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg transition-colors"
						>
							<Send size={18} />
							Send Feedback
						</a>
					</div>

					<!-- Save Button -->
					<button
						onclick={saveProfile}
						disabled={saving}
						class="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-[var(--color-bg-primary)] font-semibold py-3 rounded-lg transition-colors"
					>
						{#if saving}
							Saving...
						{:else if saved}
							Saved
						{:else}
							Save Changes
						{/if}
					</button>

					<!-- Sign Out -->
					<div class="pt-6 border-t border-[var(--color-border)]">
						<button
							onclick={handleSignOut}
							class="flex items-center justify-center gap-2 w-full py-3 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
						>
							<LogOut size={20} />
							<span>Sign Out</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</AppShell>
{/if}
