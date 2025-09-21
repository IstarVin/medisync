import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth';
import { db, User } from '$lib/server/db';
import { serverState } from '$lib/server/state';
import { hash } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Validation schema for admin creation
const createAdminSchema = z
	.object({
		email: z.email('Please enter a valid email address'),
		firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
		lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
		password: z.string().min(8, 'Password must be at least 8 characters long'),
		confirmPassword: z.string().min(1, 'Please confirm your password'),
		phoneNumber: z.string().optional().or(z.literal(''))
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export const load: PageServerLoad = async () => {
	// Ensure DB connection
	await db;

	const admin = await User.findOne({ role: 'admin' });
	if (admin) {
		// return redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	createAdmin: async (event) => {
		// Ensure DB connection
		await db;

		// Check if admin already exists
		const existingAdmin = await User.findOne({ role: 'admin' });
		if (existingAdmin) {
			return redirect(302, '/');
		}

		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const firstName = formData.get('firstName')?.toString() ?? '';
		const lastName = formData.get('lastName')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';
		const phoneNumber = formData.get('phoneNumber')?.toString() ?? '';

		// Validate input
		const validation = createAdminSchema.safeParse({
			email,
			firstName,
			lastName,
			password,
			confirmPassword,
			phoneNumber
		});

		if (!validation.success) {
			const errors: Record<string, string[]> = {};
			validation.error.issues.forEach((issue) => {
				const field = issue.path[0] as string;
				if (!errors[field]) {
					errors[field] = [];
				}
				errors[field].push(issue.message);
			});
			return fail(400, { errors });
		}

		const validatedData = validation.data;

		try {
			// Check if email already exists
			const existingUser = await User.findOne({ email: validatedData.email });

			if (existingUser) {
				return fail(400, {
					errors: { email: ['This email is already registered'] }
				});
			}

			// Hash password
			const passwordHash = await hash(validatedData.password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			// Create admin user
			const newAdmin = new User({
				email: validatedData.email,
				firstName: validatedData.firstName,
				lastName: validatedData.lastName,
				passwordHash,
				role: 'admin',
				phoneNumber: validatedData.phoneNumber || undefined,
				isActive: true,
				lastLogin: new Date()
			});

			await newAdmin.save();

			// Create session for the new admin
			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, newAdmin._id.toString());
			setSessionTokenCookie(event, sessionToken, session.expiresAt);

			serverState.init = true;
		} catch (error) {
			console.error('Error creating admin:', error);
			return fail(500, {
				errors: { general: ['Failed to create admin account. Please try again.'] }
			});
		}
		return redirect(302, '/');
	}
};
