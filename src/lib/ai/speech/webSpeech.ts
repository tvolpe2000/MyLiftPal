/**
 * Web Speech API Wrapper for IronAthena
 *
 * Browser-native speech recognition (free, no API costs).
 */

import type { SpeechResult } from '../types';

// Extend Window for webkit prefix
declare global {
	interface Window {
		SpeechRecognition: typeof SpeechRecognition;
		webkitSpeechRecognition: typeof SpeechRecognition;
	}
}

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export interface SpeechCallbacks {
	onResult: (result: SpeechResult) => void;
	onError: (error: string) => void;
	onStatusChange: (status: SpeechStatus) => void;
}

/**
 * Check if Web Speech API is supported
 */
export function isWebSpeechSupported(): boolean {
	return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Create a speech recognition instance
 */
export function createSpeechRecognition(callbacks: SpeechCallbacks): {
	start: () => void;
	stop: () => void;
	abort: () => void;
} | null {
	if (!isWebSpeechSupported()) {
		return null;
	}

	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	const recognition = new SpeechRecognition();

	// Configure recognition
	recognition.continuous = false; // Stop after first result
	recognition.interimResults = true; // Show partial results
	recognition.lang = 'en-US';
	recognition.maxAlternatives = 1;

	// Handle results
	recognition.onresult = (event: SpeechRecognitionEvent) => {
		const result = event.results[event.results.length - 1];
		const transcript = result[0].transcript;
		const confidence = result[0].confidence;
		const isFinal = result.isFinal;

		callbacks.onResult({
			transcript: transcript.trim(),
			confidence,
			isFinal
		});

		if (isFinal) {
			callbacks.onStatusChange('processing');
		}
	};

	// Handle start
	recognition.onstart = () => {
		callbacks.onStatusChange('listening');
	};

	// Handle end
	recognition.onend = () => {
		// Only set to idle if we're not processing
		callbacks.onStatusChange('idle');
	};

	// Handle errors
	recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
		let errorMessage: string;

		switch (event.error) {
			case 'no-speech':
				errorMessage = 'No speech detected. Try again.';
				break;
			case 'audio-capture':
				errorMessage = 'No microphone found. Check your device.';
				break;
			case 'not-allowed':
				errorMessage = 'Microphone access denied. Check permissions.';
				break;
			case 'network':
				errorMessage = 'Network error. Check your connection.';
				break;
			case 'aborted':
				// User cancelled, not an error
				callbacks.onStatusChange('idle');
				return;
			default:
				errorMessage = `Speech error: ${event.error}`;
		}

		callbacks.onError(errorMessage);
		callbacks.onStatusChange('error');
	};

	return {
		start: () => {
			try {
				recognition.start();
			} catch (e) {
				// Handle case where recognition is already started
				console.warn('Recognition already started:', e);
			}
		},
		stop: () => {
			recognition.stop();
		},
		abort: () => {
			recognition.abort();
		}
	};
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		// Stop all tracks to release the microphone
		stream.getTracks().forEach((track) => track.stop());
		return true;
	} catch {
		return false;
	}
}

/**
 * Check microphone permission status
 */
export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
	try {
		const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
		return result.state;
	} catch {
		// Permissions API not supported, assume prompt
		return 'prompt';
	}
}
