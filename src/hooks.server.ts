import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// const handleAuth: Handle = async ({ event, resolve }) => {
// 	const sessionToken = event.cookies.get(auth.sessionCookieName);

// 	if (!sessionToken) {
// 		event.locals.user = null;
// 		event.locals.session = null;
// 		return resolve(event);
// 	}

// 	const { session, user } = await auth.validateSessionToken(sessionToken);

// 	if (session) {
// 		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
// 	} else {
// 		auth.deleteSessionTokenCookie(event);
// 	}

// 	event.locals.user = user;
// 	event.locals.session = session;
// 	return resolve(event);
// };

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

export const handle: Handle = sequence(handleTheme);
