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
</svelte:head>

<!-- Modern responsive layout using enhanced Tailwind CSS 4 patterns -->
<div
	class="medical-container group/design-root @container relative flex size-full min-h-screen flex-col overflow-x-hidden bg-background medical-typography-body text-foreground"
	style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
>
	<!-- Enhanced responsive layout container -->
	<div class="layout-container flex h-full grow flex-col">
		<!-- Main content area with responsive container queries -->
		<div class="@container flex flex-1 justify-center">
			<!-- Render children with enhanced error boundaries -->
			{@render children?.()}
		</div>
	</div>
</div>

<style>
	/* Enhanced focus management for accessibility */
	:global(:focus-visible) {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	/* Smooth transitions for theme changes */
	:global(*) {
		transition-property: color, background-color, border-color;
		transition-duration: var(--duration-fast);
		transition-timing-function: ease-out;
	}

	/* Optimize font rendering and body styles with system fonts */
	:global(body) {
		font-feature-settings:
			'rlig' 1,
			'calt' 1;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}

	/* Responsive typography improvements */
	:global(h1, h2, h3, h4, h5, h6) {
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
</style>
