<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let theme = $state('light');
	let mounted = $state(false);

	onMount(() => {
		mounted = true;

		// Get theme from localStorage or system preference
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			theme = savedTheme;
		} else {
			theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}

		updateTheme();

		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem('theme')) {
				theme = e.matches ? 'dark' : 'light';
				updateTheme();
			}
		};

		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	function updateTheme() {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		updateTheme();
	}
</script>

{#if mounted}
	<button
		onclick={toggleTheme}
		class="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg
		       border border-border bg-background/80 text-foreground transition-all
		       duration-200 ease-out
		       hover:border-border-hover hover:bg-accent hover:text-accent-foreground
		       focus-visible:outline-2
		       focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
		aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
		title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
	>
		<!-- Light mode icon -->
		<Sun
			class="absolute h-4 w-4 transition-all duration-300 ease-in-out
			       {theme === 'light' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}"
		/>

		<!-- Dark mode icon -->
		<Moon
			class="absolute h-4 w-4 transition-all duration-300 ease-in-out
			       {theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'}"
		/>

		<!-- Subtle glow effect on hover -->
		<div
			class="absolute inset-0 rounded-lg bg-primary/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
		></div>
	</button>
{/if}
