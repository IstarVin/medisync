import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { verify } from '@node-rs/argon2';
import { fail, isHttpError, redirect, type Actions } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return redirect(302, '/');
	}

	return {};
};

export const actions: Actions = {
	default: async (event) => {
		try {
			const { request } = event;
			const form = await request.formData();
			const email = String(form.get('email') || '')
				.trim()
				.toLowerCase();
			const password = String(form.get('password') || '');

			if (!email || !password) {
				return fail(400, { error: 'Email and password are required.' });
			}

			// Find user by email
			const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
			if (!user || !user.isActive) {
				return fail(401, { error: 'Invalid email or password.' });
			}

			// Check password
			const valid = await verify(user.passwordHash, password);
			if (!valid) {
				return fail(401, { error: 'Invalid email or password.' });
			}

			// Create session using Lucia auth
			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, user.id);
			setSessionTokenCookie(event, sessionToken, session.expiresAt);

			return redirect(303, '/');
		} catch (err) {
			if (isHttpError(err)) {
				throw err;
			}
			console.error('Unknown error', err);

			return redirect(302, '/login');
		}
	}
};
