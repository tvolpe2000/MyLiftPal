<script lang="ts">
	import { Mic, ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Voice Commands | IronAthena</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg-primary)] p-4 pb-24 md:pb-8">
	<div class="mx-auto max-w-lg">
		<!-- Header -->
		<div class="mb-6 flex items-center gap-3">
			<a
				href="/"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
			>
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1 class="text-xl font-bold text-[var(--color-text-primary)]">Voice Commands</h1>
				<p class="text-sm text-[var(--color-text-muted)]">How to use the AI assistant</p>
			</div>
		</div>

		<!-- Intro -->
		<div class="mb-6 rounded-xl bg-[var(--color-bg-secondary)] p-4">
			<div class="flex items-center gap-3 mb-3">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg-primary)]">
					<Mic size={24} />
				</div>
				<div>
					<p class="font-medium text-[var(--color-text-primary)]">Tap the mic button</p>
					<p class="text-sm text-[var(--color-text-muted)]">Found in the bottom-right corner</p>
				</div>
			</div>
			<p class="text-sm text-[var(--color-text-secondary)]">
				Speak naturally - the AI understands context like "felt easy" (high RIR) or "to failure" (RIR 0).
			</p>
		</div>

		<!-- Command Categories -->
		<div class="space-y-4">
			<!-- During a Workout -->
			<div class="rounded-xl bg-[var(--color-bg-secondary)] p-4">
				<h2 class="font-semibold text-[var(--color-text-primary)] mb-3">During a Workout</h2>
				<ul class="space-y-2 text-sm text-[var(--color-text-secondary)]">
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"185 for 8"</span>
						<span class="text-[var(--color-text-muted)]">- Log a set</span>
					</li>
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"Same weight, got 7"</span>
						<span class="text-[var(--color-text-muted)]">- Repeat weight</span>
					</li>
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"185 for 8, 2 in reserve"</span>
						<span class="text-[var(--color-text-muted)]">- Log with RIR</span>
					</li>
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"Skip this one"</span>
						<span class="text-[var(--color-text-muted)]">- Skip exercise</span>
					</li>
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"Do cable flyes instead"</span>
						<span class="text-[var(--color-text-muted)]">- Swap current</span>
					</li>
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"Swap incline with flat bench"</span>
						<span class="text-[var(--color-text-muted)]">- Swap specific</span>
					</li>
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"Add some curls"</span>
						<span class="text-[var(--color-text-muted)]">- Add exercise</span>
					</li>
					<li class="flex gap-2">
						<span class="text-[var(--color-accent)] shrink-0">"I'm done"</span>
						<span class="text-[var(--color-text-muted)]">- Complete workout</span>
					</li>
				</ul>
			</div>

			<!-- Questions -->
			<div class="rounded-xl bg-[var(--color-bg-secondary)] p-4">
				<h2 class="font-semibold text-[var(--color-text-primary)] mb-3">Questions (Anytime)</h2>
				<ul class="space-y-2 text-sm text-[var(--color-text-secondary)]">
					<li><span class="text-[var(--color-accent)]">"What's my workout today?"</span></li>
					<li><span class="text-[var(--color-accent)]">"How much volume for chest?"</span></li>
					<li><span class="text-[var(--color-accent)]">"Show me my PRs"</span></li>
					<li><span class="text-[var(--color-accent)]">"How many workouts this week?"</span></li>
				</ul>
			</div>

			<!-- Schedule Changes -->
			<div class="rounded-xl bg-[var(--color-bg-secondary)] p-4">
				<h2 class="font-semibold text-[var(--color-text-primary)] mb-3">Schedule Changes</h2>
				<ul class="space-y-2 text-sm text-[var(--color-text-secondary)]">
					<li><span class="text-[var(--color-accent)]">"Swap today with tomorrow"</span></li>
					<li><span class="text-[var(--color-accent)]">"Skip today"</span></li>
					<li><span class="text-[var(--color-accent)]">"Do leg day instead"</span></li>
				</ul>
			</div>

			<!-- Block Modifications -->
			<div class="rounded-xl bg-[var(--color-bg-secondary)] p-4">
				<h2 class="font-semibold text-[var(--color-text-primary)] mb-3">Block Modifications</h2>
				<ul class="space-y-2 text-sm text-[var(--color-text-secondary)]">
					<li><span class="text-[var(--color-accent)]">"Add a set to bench press"</span></li>
					<li><span class="text-[var(--color-accent)]">"Change squats to 6-8 reps"</span></li>
					<li><span class="text-[var(--color-accent)]">"Remove lat pulldowns"</span></li>
				</ul>
			</div>
		</div>

		<!-- Tip -->
		<div class="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-4">
			<p class="text-sm text-[var(--color-text-muted)]">
				<strong class="text-[var(--color-text-secondary)]">Tip:</strong> You can also type commands instead of speaking.
				Tap "Type instead" at the bottom of the voice modal.
			</p>
		</div>
	</div>
</div>
