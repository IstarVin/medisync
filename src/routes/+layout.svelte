<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import MobileMenuButton from '$lib/components/mobile-menu-button.svelte';
	import MobileNavigation from '$lib/components/mobile-navigation.svelte';
	import SidebarNavigation from '$lib/components/sidebar-navigation.svelte';
	import '../app.css';

	let { children, data } = $props();

	let isMobileMenuOpen = $state(false);
	let isSidebarCollapsed = $state(false);

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}
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

<!-- Modern responsive layout using Tailwind CSS -->
<div
	class="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-background text-foreground md:flex-row"
>
	<!-- Desktop sidebar - fixed position, hidden on mobile -->
	<div
		class="fixed top-0 left-0 z-40 hidden h-full transition-transform duration-300 ease-in-out md:block {isSidebarCollapsed
			? '-translate-x-full'
			: 'translate-x-0'}"
	>
		<SidebarNavigation {data} />
	</div>

	<!-- Mobile navigation overlay -->
	<MobileNavigation isOpen={isMobileMenuOpen} onClose={closeMobileMenu} {data} />

	<!-- Enhanced responsive layout container -->
	<div class="flex h-full grow flex-col md:flex-1 {isSidebarCollapsed ? '' : 'md:ml-64 lg:ml-80'}">
		<!-- Mobile menu button for when sidebar is collapsed -->
		<div class="flex items-center justify-between p-4 md:hidden">
			<MobileMenuButton isOpen={isMobileMenuOpen} onToggle={toggleMobileMenu} />
		</div>

		<!-- Main content area -->
		<div class="flex flex-1 justify-center">
			<!-- Render children -->
			{@render children?.()}
		</div>
	</div>
</div>

<style>
	/* Enhanced focus management for accessibility */
	:global(:focus-visible) {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	/* Smooth transitions for theme changes */
	:global(*) {
		transition-property: color, background-color, border-color;
		transition-duration: 150ms;
		transition-timing-function: ease-out;
	}

	/* Optimize font rendering */
	:global(body) {
		font-feature-settings:
			'rlig' 1,
			'calt' 1;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
	}

	/* Typography improvements */
	:global(h1, h2, h3, h4, h5, h6) {
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
</style>
