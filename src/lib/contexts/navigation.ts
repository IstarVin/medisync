import { getContext, setContext } from 'svelte';

interface NavigationContext {
	isMobileMenuOpen: boolean;
	toggleMobileMenu: () => void;
	closeMobileMenu: () => void;
}

const NAVIGATION_KEY = Symbol('navigation');

export function setNavigationContext(context: NavigationContext) {
	setContext(NAVIGATION_KEY, context);
}

export function getNavigationContext(): NavigationContext {
	const context = getContext<NavigationContext>(NAVIGATION_KEY);
	if (!context) {
		throw new Error(
			'Navigation context not found. Make sure to call setNavigationContext in a parent component.'
		);
	}
	return context;
}
