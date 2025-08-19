import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { theme } = await request.json();

		// Validate theme value
		if (theme !== 'light' && theme !== 'dark') {
			return json({ error: 'Invalid theme value' }, { status: 400 });
		}

		// Set the theme cookie with proper options
		cookies.set('theme', theme, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365, // 1 year
			sameSite: 'lax',
			secure: false, // Set to true in production with HTTPS
			httpOnly: false // Allow client-side access for JavaScript
		});

		return json({ success: true, theme });
	} catch {
		return json({ error: 'Failed to update theme' }, { status: 500 });
	}
};
