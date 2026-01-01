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

		// Auto-recover from "Stale Shell" errors (version mismatch)
		const message = event.error?.message || event.message || '';
		const isChunkError =
			message.includes('Failed to fetch dynamically imported module') ||
			message.includes('Importing a module script failed') ||
			message.includes('error loading dynamically imported module');

		if (isChunkError) {
			console.warn('[MyLiftPal] Detected version mismatch (stale shell), triggering reload...');
			// Prevent infinite reload loops (max 1 reload per 10 seconds)
			const lastReload = sessionStorage.getItem('myliftpal_last_chunk_reload');
			const now = Date.now();

			if (!lastReload || now - parseInt(lastReload) > 10000) {
				sessionStorage.setItem('myliftpal_last_chunk_reload', String(now));
				window.location.reload();
			}
		}
	});
}

export {};
