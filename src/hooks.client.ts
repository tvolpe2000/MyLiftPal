// Global error handling for client-side errors
// This catches unhandled errors that would otherwise cause blank pages

import { browser } from '$app/environment';

if (browser) {
	// Catch unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		console.error('[MyLiftPal] Unhandled promise rejection:', event.reason);
		event.preventDefault();
	});

	// Catch global errors
	window.addEventListener('error', (event) => {
		console.error('[MyLiftPal] Global error:', event.error);
		console.error('[MyLiftPal] Error at:', event.filename, 'line', event.lineno);
	});

	// Detect page visibility changes
	document.addEventListener('visibilitychange', () => {
		console.log('[MyLiftPal] Visibility changed:', document.visibilityState);
	});

	// Detect before unload (page about to navigate away or reload)
	window.addEventListener('beforeunload', (event) => {
		console.log('[MyLiftPal] Page unloading - this may indicate a redirect or reload');
	});

	// Detect page hide (more reliable on mobile)
	window.addEventListener('pagehide', (event) => {
		console.log('[MyLiftPal] Page hide event, persisted:', event.persisted);
	});

	// Monitor for unexpected navigation
	const originalPushState = history.pushState;
	history.pushState = function (...args) {
		console.log('[MyLiftPal] pushState:', args[2]);
		return originalPushState.apply(this, args);
	};

	const originalReplaceState = history.replaceState;
	history.replaceState = function (...args) {
		console.log('[MyLiftPal] replaceState:', args[2]);
		return originalReplaceState.apply(this, args);
	};
}

export {};
