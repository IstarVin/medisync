import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { serverState } from '$lib/server/state';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { eq } from 'drizzle-orm';

const handleAuth: Handle = async ({ event, resolve }) => {
	const route = event.route.id;
	if (!route) {
		return error(404);
	}

	if (!serverState.init) {
		const admin = await db.query.users.findFirst({ where: eq(users.role, 'admin') });

		if (!admin && !route.includes('init')) {
			return redirect(302, '/init');
		}
	}

	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (sessionToken) {
		const res = await auth.validateSessionToken(sessionToken);

		if (res.user) {
			event.locals.user = res.user;
			event.locals.session = res.session;
		} else {
			auth.deleteSessionTokenCookie(event);
		}
	}

	if (route.includes('(app)')) {
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
