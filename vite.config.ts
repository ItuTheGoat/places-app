import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa';
import manifest from './static/manifest.json';

export default defineConfig({
	envPrefix: ['VITE_', 'FIREBASE_'],
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			injectRegister: false,
			manifestFilename: 'manifest.json',
			manifest: manifest as Partial<ManifestOptions>,
			includeAssets: ['robots.txt', 'icons/*.png'],
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
