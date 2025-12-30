<script lang="ts">
	import { X, Mic, MicOff, Keyboard, Loader2, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-svelte';
	import {
		isWebSpeechSupported,
		createSpeechRecognition,
		requestMicrophonePermission,
		type SpeechStatus,
		type SpeechCallbacks
	} from '$lib/ai/speech/webSpeech';
	import type { SpeechResult, ToolCall } from '$lib/ai/types';

	interface Props {
		onClose: () => void;
		onCommand: (transcript: string) => Promise<{ success?: boolean; toolCall: ToolCall; message: string } | null>;
	}

	let { onClose, onCommand }: Props = $props();

	let status = $state<SpeechStatus>('idle');
	let transcript = $state('');
	let interimTranscript = $state('');
	let error = $state('');
	let resultMessage = $state('');
	let showTextInput = $state(false);
	let showHelp = $state(false);
	let textInput = $state('');

	let recognition: ReturnType<typeof createSpeechRecognition> | null = null;

	const isSupported = isWebSpeechSupported();

	// Initialize speech recognition when modal opens
	$effect(() => {
		if (isSupported && !recognition) {
			const callbacks: SpeechCallbacks = {
				onResult: handleSpeechResult,
				onError: handleSpeechError,
				onStatusChange: handleStatusChange
			};
			recognition = createSpeechRecognition(callbacks);
		}

		// Cleanup on unmount
		return () => {
			if (recognition) {
				recognition.abort();
			}
		};
	});

	function handleSpeechResult(result: SpeechResult) {
		if (result.isFinal) {
			transcript = result.transcript;
			interimTranscript = '';
			processTranscript(result.transcript);
		} else {
			interimTranscript = result.transcript;
		}
	}

	function handleSpeechError(errorMsg: string) {
		error = errorMsg;
	}

	function handleStatusChange(newStatus: SpeechStatus) {
		status = newStatus;
	}

	async function startListening() {
		error = '';
		transcript = '';
		interimTranscript = '';
		resultMessage = '';
		status = 'idle';

		// Request permission first if needed
		const hasPermission = await requestMicrophonePermission();
		if (!hasPermission) {
			error = 'Microphone permission denied';
			status = 'error';
			return;
		}

		if (recognition) {
			recognition.start();
		}
	}

	function stopListening() {
		if (recognition) {
			recognition.stop();
		}
	}

	async function processTranscript(text: string) {
		status = 'processing';
		error = '';

		try {
			const result = await onCommand(text);
			if (result) {
				// Check if the command was successful
				if (result.success === false) {
					// Command was understood but couldn't be executed
					error = result.message;
					status = 'error';
				} else {
					resultMessage = result.message;
					status = 'success';
					// Don't auto-close - let user read the response and ask follow-ups
				}
			} else {
				error = 'Could not process command';
				status = 'error';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to process command';
			status = 'error';
		}
	}

	async function handleTextSubmit(e: Event) {
		e.preventDefault();
		if (!textInput.trim()) return;

		transcript = textInput.trim();
		textInput = '';
		showTextInput = false;
		await processTranscript(transcript);
	}

	function handleClose() {
		if (recognition) {
			recognition.abort();
		}
		onClose();
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
	role="dialog"
	aria-modal="true"
	aria-labelledby="voice-modal-title"
>
	<div
		class="w-full max-w-sm overflow-hidden rounded-2xl bg-[var(--color-bg-secondary)] shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-[var(--color-border)] p-4">
			<h2 id="voice-modal-title" class="font-semibold text-[var(--color-text-primary)]">
				{showHelp ? 'Voice Commands Help' : 'Voice Command'}
			</h2>
			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={() => (showHelp = !showHelp)}
					class="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-tertiary)] {showHelp ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]' : ''}"
					aria-label="Toggle help"
				>
					<HelpCircle size={20} />
				</button>
				<button
					type="button"
					onclick={handleClose}
					class="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
				>
					<X size={20} />
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="p-6">
			{#if showHelp}
				<!-- Help content -->
				<div class="space-y-4 text-sm max-h-80 overflow-y-auto">
					<div>
						<h3 class="font-semibold text-[var(--color-text-primary)] mb-2">During a Workout</h3>
						<ul class="space-y-1.5 text-[var(--color-text-secondary)]">
							<li><span class="text-[var(--color-accent)]">"185 for 8"</span> - Log a set</li>
							<li><span class="text-[var(--color-accent)]">"Same weight, got 7"</span> - Repeat weight</li>
							<li><span class="text-[var(--color-accent)]">"185 for 8, 2 in reserve"</span> - Log with RIR</li>
							<li><span class="text-[var(--color-accent)]">"Skip this one"</span> - Skip exercise</li>
							<li><span class="text-[var(--color-accent)]">"Do cable flyes instead"</span> - Swap current</li>
							<li><span class="text-[var(--color-accent)]">"Swap incline with flat bench"</span> - Swap specific</li>
							<li><span class="text-[var(--color-accent)]">"Add some curls"</span> - Add exercise</li>
							<li><span class="text-[var(--color-accent)]">"I'm done"</span> - Complete workout</li>
						</ul>
					</div>
					<div>
						<h3 class="font-semibold text-[var(--color-text-primary)] mb-2">Questions (Anytime)</h3>
						<ul class="space-y-1.5 text-[var(--color-text-secondary)]">
							<li><span class="text-[var(--color-accent)]">"What's my workout today?"</span></li>
							<li><span class="text-[var(--color-accent)]">"How much volume for chest?"</span></li>
							<li><span class="text-[var(--color-accent)]">"Show me my PRs"</span></li>
							<li><span class="text-[var(--color-accent)]">"How many workouts this week?"</span></li>
						</ul>
					</div>
					<div>
						<h3 class="font-semibold text-[var(--color-text-primary)] mb-2">Schedule Changes</h3>
						<ul class="space-y-1.5 text-[var(--color-text-secondary)]">
							<li><span class="text-[var(--color-accent)]">"Swap today with tomorrow"</span></li>
							<li><span class="text-[var(--color-accent)]">"Skip today"</span></li>
							<li><span class="text-[var(--color-accent)]">"Do leg day instead"</span></li>
						</ul>
					</div>
					<div>
						<h3 class="font-semibold text-[var(--color-text-primary)] mb-2">Block Modifications</h3>
						<ul class="space-y-1.5 text-[var(--color-text-secondary)]">
							<li><span class="text-[var(--color-accent)]">"Add a set to bench press"</span></li>
							<li><span class="text-[var(--color-accent)]">"Change squats to 6-8 reps"</span></li>
							<li><span class="text-[var(--color-accent)]">"Remove lat pulldowns"</span></li>
						</ul>
					</div>
					<p class="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
						Tip: Speak naturally. The AI understands context like "felt easy" (high RIR) or "to failure" (RIR 0).
					</p>
				</div>
			{:else if !isSupported}
				<!-- Speech not supported -->
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20"
					>
						<MicOff size={32} class="text-red-400" />
					</div>
					<p class="mb-2 text-[var(--color-text-primary)]">Speech not supported</p>
					<p class="mb-4 text-sm text-[var(--color-text-muted)]">
						Your browser doesn't support voice input. Use text instead.
					</p>
					<button
						type="button"
						onclick={() => (showTextInput = true)}
						class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[var(--color-bg-primary)]"
					>
						Use Text Input
					</button>
				</div>
			{:else if showTextInput}
				<!-- Text input mode -->
				<form onsubmit={handleTextSubmit} class="space-y-4">
					<div>
						<label for="text-command" class="mb-2 block text-sm text-[var(--color-text-muted)]">
							Type your command:
						</label>
						<input
							id="text-command"
							type="text"
							bind:value={textInput}
							placeholder="e.g., 185 for 8, 2 in reserve"
							class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
							autofocus
						/>
					</div>
					<div class="flex gap-3">
						<button
							type="button"
							onclick={() => (showTextInput = false)}
							class="flex-1 rounded-lg bg-[var(--color-bg-tertiary)] py-3 font-medium text-[var(--color-text-secondary)]"
						>
							Back
						</button>
						<button
							type="submit"
							disabled={!textInput.trim()}
							class="flex-1 rounded-lg bg-[var(--color-accent)] py-3 font-medium text-[var(--color-bg-primary)] disabled:opacity-50"
						>
							Submit
						</button>
					</div>
				</form>
			{:else if status === 'success' && resultMessage}
				<!-- Success state with follow-up option -->
				<div class="text-center">
					<div class="mb-4 rounded-xl bg-[var(--color-bg-tertiary)] p-4 text-left">
						<p class="text-[var(--color-text-primary)] whitespace-pre-wrap">{resultMessage}</p>
					</div>
					<button
						type="button"
						onclick={startListening}
						class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-lg transition-transform hover:scale-105 active:scale-95"
					>
						<Mic size={28} />
					</button>
					<p class="text-sm text-[var(--color-text-muted)]">
						Tap to ask a follow-up question
					</p>
				</div>
			{:else if status === 'error'}
				<!-- Error state -->
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20"
					>
						<AlertCircle size={40} class="text-red-400" />
					</div>
					<p class="mb-2 text-[var(--color-text-primary)]">{error}</p>
					<button
						type="button"
						onclick={startListening}
						class="mt-4 rounded-lg bg-[var(--color-accent)] px-6 py-2 text-[var(--color-bg-primary)]"
					>
						Try Again
					</button>
				</div>
			{:else if status === 'processing'}
				<!-- Processing state -->
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)]/20"
					>
						<Loader2 size={40} class="animate-spin text-[var(--color-accent)]" />
					</div>
					<p class="text-lg font-medium text-[var(--color-text-primary)]">Processing...</p>
					<p class="mt-2 text-[var(--color-text-muted)]">"{transcript}"</p>
				</div>
			{:else if status === 'listening'}
				<!-- Listening state -->
				<div class="text-center">
					<button
						type="button"
						onclick={stopListening}
						class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
					>
						<div class="relative">
							<Mic size={40} />
							<!-- Pulsing ring -->
							<div
								class="absolute inset-0 -m-2 animate-ping rounded-full bg-red-500 opacity-50"
							></div>
						</div>
					</button>
					<p class="text-lg font-medium text-[var(--color-text-primary)]">Listening...</p>
					{#if interimTranscript}
						<p class="mt-2 text-[var(--color-text-muted)]">"{interimTranscript}"</p>
					{:else}
						<p class="mt-2 text-sm text-[var(--color-text-muted)]">
							Say something like "185 for 8, 2 in reserve"
						</p>
					{/if}
				</div>
			{:else}
				<!-- Idle state - ready to listen -->
				<div class="text-center">
					<button
						type="button"
						onclick={startListening}
						class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-lg transition-transform hover:scale-105 active:scale-95"
					>
						<Mic size={40} />
					</button>
					<p class="text-lg font-medium text-[var(--color-text-primary)]">Tap to speak</p>
					<p class="mt-2 text-sm text-[var(--color-text-muted)]">
						Or say "185 for 8", "skip this", "I'm done"
					</p>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		{#if !showTextInput && !showHelp && status !== 'processing'}
			<div class="border-t border-[var(--color-border)] p-4">
				<button
					type="button"
					onclick={() => (showTextInput = true)}
					class="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
				>
					<Keyboard size={16} />
					Type instead
				</button>
			</div>
		{/if}
	</div>
</div>
