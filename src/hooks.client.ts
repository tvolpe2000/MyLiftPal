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
}

export {};
