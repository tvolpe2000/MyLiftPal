import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'prompt',
			manifest: false,
			workbox: {
				// Precache all static assets at install time (true offline-first)
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
				// After first install, take control immediately for better offline experience
				skipWaiting: true,
				clientsClaim: true,
				// Increase max file size for caching (default is 2MB)
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				// Enable navigation preload for faster responses
				navigationPreload: true,
				runtimeCaching: [
					// App shell & navigation - ALWAYS serve from cache first, update in background
					// This is the key to "never shows loading" behavior like RP Hypertrophy
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'pages-cache',
							expiration: { maxEntries: 50, maxAgeSeconds: 86400 } // 24 hours
						}
					},
					// Static assets - Cache First (they have hashed names anyway)
					{
						urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|ico)$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'static-assets',
							expiration: { maxEntries: 100, maxAgeSeconds: 604800 } // 7 days
						}
					},
					// Supabase API - Stale While Revalidate (show cached immediately, refresh in background)
					{
						urlPattern: /^https:\/\/.*supabase.*\/rest\/v1\/.*/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'api-cache',
							expiration: { maxEntries: 100, maxAgeSeconds: 3600 }, // 1 hour
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					// Supabase Auth - Stale While Revalidate (use cached auth, refresh in background)
					{
						urlPattern: /^https:\/\/.*supabase.*\/auth\/.*/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'auth-cache',
							expiration: { maxEntries: 10, maxAgeSeconds: 300 },
							cacheableResponse: { statuses: [0, 200] }
						}
					}
				]
			}
		})
	]
});
