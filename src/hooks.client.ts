// Global error handling for client-side errors
// This catches unhandled errors that would otherwise cause blank pages

import { browser } from '$app/environment';

if (browser) {
	// Catch unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		console.error('Unhandled promise rejection:', event.reason);

		// Prevent the error from causing a blank page
		// The app will continue running but log the error
		event.preventDefault();
	});

	// Catch global errors
	window.addEventListener('error', (event) => {
		console.error('Global error:', event.error);

		// Log additional context
		console.error('Error occurred at:', event.filename, 'line', event.lineno);
	});

	// Detect when the page visibility changes (phone locked, tab switched)
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			// Page became visible again - could trigger a state refresh here
			console.log('Page became visible');
		}
	});
}

export {};
