import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('light');

	return {
		subscribe,
		set: (theme: Theme) => {
			if (browser) {
				// Update DOM
				const htmlElement = document.documentElement;
				if (theme === 'dark') {
					htmlElement.classList.add('dark');
					htmlElement.setAttribute('data-theme', 'dark');
				} else {
					htmlElement.classList.remove('dark');
					htmlElement.setAttribute('data-theme', 'light');
				}

				// Update localStorage
				localStorage.setItem('theme', theme);

				// Sync with server
				fetch('/api/theme', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ theme })
				}).catch(() => {
					// Fallback: set cookie directly
					document.cookie = `theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
				});
			}

			set(theme);
		},
		toggle: () => {
			update((current) => {
				const newTheme = current === 'light' ? 'dark' : 'light';
				// Use the custom set method to handle all side effects
				createThemeStore().set(newTheme);
				return newTheme;
			});
		},
		init: (initialTheme: Theme) => {
			set(initialTheme);
		}
	};
}

export const themeStore = createThemeStore();
