import * as auth from '$lib/server/auth';
import { hash } from '@node-rs/argon2';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	const route = event.route.id;
	if (!route) {
		return error(404);
	}

	if (sessionToken) {
		const res = await auth.validateSessionToken(sessionToken);

		event.locals.user = res.user;
		event.locals.session = res.session;

		if (!res.user) {
			auth.deleteSessionTokenCookie(event);
		}
	}

	if (!route.includes('(auth)')) {
		if (!event.locals.user) {
			event.locals.user = null;
			event.locals.session = null;

			return redirect(302, '/login');
		}
	}

	return resolve(event);
};

const handleTheme: Handle = async ({ event, resolve }) => {
	// Get theme from cookie, fallback to 'light' if not set
	const theme = event.cookies.get('theme') || 'light';

	// Set theme in locals for access throughout the app
	event.locals.theme = theme;

	return await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Replace the empty data-theme attribute with the actual theme
			// Also add the theme class to the html element for Tailwind CSS dark mode
			return html
				.replace('data-theme=""', `data-theme="${theme}"`)
				.replace('<html lang="en"', `<html lang="en" class="${theme === 'dark' ? 'dark' : ''}"`);
		}
	});
};

export const handle: Handle = sequence(handleTheme, handleAuth);

console.log(await hash('password123'));
