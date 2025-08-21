<script lang="ts">
	import MobileMenuButton from '$lib/components/mobile-menu-button.svelte';
	import MobileNavigation from '$lib/components/mobile-navigation.svelte';
	import SidebarNavigation from '$lib/components/sidebar-navigation.svelte';
	import { app } from '$lib/states/app.svelte';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';

	let { children, data } = $props();

	let isMobileMenuOpen = $state(false);
	let isSidebarCollapsed = $state(false);

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	onMount(() => {
		let qrEnabled = localStorage.getItem('qrEnabled');
		if (qrEnabled) {
			app.qrEnabled = qrEnabled === 'true';
		} else {
			localStorage.setItem('qrEnabled', String(app.qrEnabled));
		}
	});

	$effect(() => {
		localStorage.setItem('qrEnabled', String(app.qrEnabled));
	});
</script>

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

<!-- Toast notifications -->
<Toaster richColors position="top-right" />

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
