<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="" />
	<title>MediSYNC - School Clinic Management</title>
	<meta
		name="description"
		content="Modern school clinic management system with QR code technology for emergency healthcare access."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />

	<!-- Theme initialization script to prevent flash of incorrect theme -->
	<script>
		// This script runs immediately to prevent FOUC (Flash of Unstyled Content)
		(function () {
			// Check if we already have a theme class set by the server
			const htmlElement = document.documentElement;
			if (
				htmlElement.classList.contains('dark') ||
				htmlElement.getAttribute('data-theme') === 'dark'
			) {
				return; // Server already set the theme correctly
			}

			// Fallback: check localStorage and system preference
			const savedTheme = localStorage.getItem('theme');
			const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

			if (shouldUseDark) {
				htmlElement.classList.add('dark');
				htmlElement.setAttribute('data-theme', 'dark');
			}
		})();
	</script>

	<!-- Fallback for no-JavaScript users -->
	<noscript>
		<style>
			/* Default to light theme when JavaScript is disabled */
			html {
				color-scheme: light;
			}
			/* Use system preference if supported */
			@media (prefers-color-scheme: dark) {
				html {
					color-scheme: dark;
				}
				html:not([data-theme='light']) {
					filter: invert(1) hue-rotate(180deg);
				}
			}
		</style>
	</noscript>
</svelte:head>

{@render children()}
