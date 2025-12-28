<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { changelog } from '$lib/stores/changelogStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import AppShell from '$lib/components/AppShell.svelte';
	import { ArrowLeft, Bug, Lightbulb, MessageCircle, Camera, X, CheckCircle, Send } from 'lucide-svelte';
	import type { FeedbackType } from '$lib/types';

	type FeedbackTypeOption = {
		type: FeedbackType;
		label: string;
		icon: typeof Bug;
		titlePlaceholder: string;
		descPlaceholder: string;
	};

	const feedbackTypes: FeedbackTypeOption[] = [
		{
			type: 'bug',
			label: 'Bug Report',
			icon: Bug,
			titlePlaceholder: 'What went wrong?',
			descPlaceholder: 'Steps to reproduce, what you expected vs what happened'
		},
		{
			type: 'feature',
			label: 'Feature Request',
			icon: Lightbulb,
			titlePlaceholder: 'Feature idea',
			descPlaceholder: 'Describe the feature and why it would be useful'
		},
		{
			type: 'general',
			label: 'General',
			icon: MessageCircle,
			titlePlaceholder: 'Subject',
			descPlaceholder: 'Your feedback, suggestions, or comments'
		}
	];

	let selectedType = $state<FeedbackType>('bug');
	let title = $state('');
	let description = $state('');
	let screenshots = $state<File[]>([]);
	let screenshotPreviews = $state<string[]>([]);
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	const currentType = $derived(feedbackTypes.find(t => t.type === selectedType)!);
	const canSubmit = $derived(title.trim().length > 0 && description.trim().length > 0);

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;

		const newFiles = Array.from(input.files);
		const remainingSlots = 3 - screenshots.length;
		const filesToAdd = newFiles.slice(0, remainingSlots);

		// Validate file sizes (5MB max)
		const validFiles = filesToAdd.filter(file => {
			if (file.size > 5 * 1024 * 1024) {
				error = `${file.name} is too large. Max size is 5MB.`;
				return false;
			}
			return true;
		});

		for (const file of validFiles) {
			screenshots.push(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				screenshotPreviews.push(e.target?.result as string);
				screenshotPreviews = [...screenshotPreviews];
			};
			reader.readAsDataURL(file);
		}
		screenshots = [...screenshots];

		// Reset input
		input.value = '';
	}

	function removeScreenshot(index: number) {
		screenshots.splice(index, 1);
		screenshotPreviews.splice(index, 1);
		screenshots = [...screenshots];
		screenshotPreviews = [...screenshotPreviews];
	}

	async function uploadScreenshots(feedbackId: string): Promise<string[]> {
		if (screenshots.length === 0) return [];

		const urls: string[] = [];
		const userId = auth.user?.id;
		if (!userId) return [];

		for (let i = 0; i < screenshots.length; i++) {
			const file = screenshots[i];
			const ext = file.name.split('.').pop() || 'png';
			const path = `${userId}/${feedbackId}/${i + 1}.${ext}`;

			const { error: uploadError } = await supabase.storage
				.from('feedback-screenshots')
				.upload(path, file, {
					contentType: file.type,
					upsert: false
				});

			if (uploadError) {
				console.error('Error uploading screenshot:', uploadError);
				continue;
			}

			// Get public URL
			const { data: urlData } = supabase.storage
				.from('feedback-screenshots')
				.getPublicUrl(path);

			if (urlData?.publicUrl) {
				urls.push(urlData.publicUrl);
			}
		}

		return urls;
	}

	async function handleSubmit() {
		if (!canSubmit || !auth.user) return;

		submitting = true;
		error = null;

		try {
			// Generate feedback ID first for screenshot paths
			const feedbackId = crypto.randomUUID();

			// Upload screenshots if any
			const screenshotUrls = await uploadScreenshots(feedbackId);

			// Insert feedback
			const { error: insertError } = await supabase
				.from('user_feedback' as 'profiles')
				.insert({
					id: feedbackId,
					user_id: auth.user.id,
					type: selectedType,
					title: title.trim(),
					description: description.trim(),
					screenshot_urls: screenshotUrls,
					app_version: changelog.currentVersion,
					user_agent: navigator.userAgent
				} as never);

			if (insertError) {
				throw insertError;
			}

			submitted = true;
		} catch (err) {
			console.error('Error submitting feedback:', err);
			error = 'Failed to submit feedback. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

{#if auth.isAuthenticated}
	<AppShell>
		<div class="p-6">
			<div class="max-w-2xl mx-auto">
				{#if submitted}
					<!-- Success State -->
					<div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
						<div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
							<CheckCircle size={32} class="text-green-400" />
						</div>
						<h1 class="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
							Thanks for your feedback!
						</h1>
						<p class="text-[var(--color-text-secondary)] mb-8">
							We appreciate you taking the time to help us improve.
						</p>
						<a
							href="/settings"
							class="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-primary)] font-semibold rounded-lg transition-colors"
						>
							Back to Settings
						</a>
					</div>
				{:else}
					<!-- Header -->
					<div class="flex items-center gap-4 mb-6">
						<a
							href="/settings"
							class="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
						>
							<ArrowLeft size={20} />
						</a>
						<div>
							<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Send Feedback</h1>
							<p class="text-[var(--color-text-secondary)]">Help us improve MyLiftPal</p>
						</div>
					</div>

					<!-- Form -->
					<div class="space-y-6">
						<!-- Type Selector -->
						<div class="grid grid-cols-3 gap-3">
							{#each feedbackTypes as ft}
								<button
									type="button"
									onclick={() => selectedType = ft.type}
									class="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors {selectedType === ft.type
										? 'bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]'
										: 'bg-[var(--color-bg-secondary)] border-2 border-transparent hover:bg-[var(--color-bg-tertiary)]'}"
								>
									<ft.icon size={24} class={selectedType === ft.type ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
									<span class="text-sm font-medium {selectedType === ft.type ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}">
										{ft.label}
									</span>
								</button>
							{/each}
						</div>

						<!-- Title -->
						<div>
							<label for="title" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
								Title
							</label>
							<input
								type="text"
								id="title"
								bind:value={title}
								placeholder={currentType.titlePlaceholder}
								class="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
							/>
						</div>

						<!-- Description -->
						<div>
							<label for="description" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
								Description
							</label>
							<textarea
								id="description"
								bind:value={description}
								placeholder={currentType.descPlaceholder}
								rows="5"
								class="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
							></textarea>
						</div>

						<!-- Screenshots -->
						<div>
							<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
								Screenshots (optional)
							</label>
							<div class="flex flex-wrap gap-3">
								{#each screenshotPreviews as preview, i}
									<div class="relative w-20 h-20 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]">
										<img src={preview} alt="Screenshot {i + 1}" class="w-full h-full object-cover" />
										<button
											type="button"
											onclick={() => removeScreenshot(i)}
											class="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
										>
											<X size={12} />
										</button>
									</div>
								{/each}

								{#if screenshots.length < 3}
									<label class="w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors cursor-pointer">
										<Camera size={20} />
										<span class="text-xs">Add</span>
										<input
											type="file"
											accept="image/png,image/jpeg,image/webp"
											multiple
											onchange={handleFileSelect}
											class="hidden"
										/>
									</label>
								{/if}
							</div>
							<p class="text-xs text-[var(--color-text-muted)] mt-2">
								Max 3 images, 5MB each
							</p>
						</div>

						<!-- Error Message -->
						{#if error}
							<div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
								{error}
							</div>
						{/if}

						<!-- Submit Button -->
						<button
							type="button"
							onclick={handleSubmit}
							disabled={!canSubmit || submitting}
							class="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-bg-primary)] font-semibold py-4 rounded-xl transition-colors"
						>
							{#if submitting}
								<div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
								Submitting...
							{:else}
								<Send size={20} />
								Submit Feedback
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</AppShell>
{/if}
