import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth';
import { db, User } from '$lib/server/db';
import { verify } from '@node-rs/argon2';
import { fail, isRedirect, redirect, type Actions } from '@sveltejs/kit';
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

			// Ensure DB connection
			await db;

			// Find user by email
			const user = await User.findOne({ email, isActive: true });
			if (!user) {
				return fail(401, { error: 'Invalid email or password.' });
			}

			// Check password
			const valid = await verify(user.passwordHash, password);
			if (!valid) {
				return fail(401, { error: 'Invalid email or password.' });
			}

			// Update last login time
			user.lastLogin = new Date();
			await user.save();

			// Create session using Lucia auth
			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, user._id.toString());
			setSessionTokenCookie(event, sessionToken, session.expiresAt);

			return redirect(303, '/');
		} catch (err) {
			if (isRedirect(err)) {
				throw err;
			}
			console.error('Unknown error', err);

			return redirect(302, '/login');
		}
	}
};
