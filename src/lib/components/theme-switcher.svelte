<script lang="ts">
	import { browser } from '$app/environment';
	import { Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface Props {
		initialTheme?: string;
	}

	let { initialTheme = 'light' }: Props = $props();

	let theme = $state(initialTheme);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;

		// Get initial theme from the html element's class (set by server)
		const htmlElement = document.documentElement;
		const serverTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';

		// Use server theme or initial prop
		theme = serverTheme;

		// Check localStorage for any client preference that might override server
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme && savedTheme !== theme) {
			theme = savedTheme;
			updateTheme();
			syncWithServer();
		}

		// Listen for system theme changes only if no explicit preference is set
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem('theme')) {
				theme = e.matches ? 'dark' : 'light';
				updateTheme();
				syncWithServer();
			}
		};

		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	function updateTheme() {
		if (!browser) return;

		const htmlElement = document.documentElement;

		if (theme === 'dark') {
			htmlElement.classList.add('dark');
			htmlElement.setAttribute('data-theme', 'dark');
		} else {
			htmlElement.classList.remove('dark');
			htmlElement.setAttribute('data-theme', 'light');
		}
	}

	async function syncWithServer() {
		if (!browser) return;

		try {
			// Send theme preference to server via cookie
			await fetch('/api/theme', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ theme })
			});
		} catch (error) {
			// Fallback: set cookie directly if API route doesn't exist
			document.cookie = `theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
		}
	}

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		updateTheme();
		syncWithServer();
	}
</script>

{#if mounted}
	<button
		onclick={toggleTheme}
		class="group hover:border-border-hover relative inline-flex h-9 w-9 items-center justify-center
		       rounded-lg border border-border bg-background/80 text-foreground
		       transition-all duration-200
		       ease-out hover:bg-accent hover:text-accent-foreground
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
