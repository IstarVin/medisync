import { generateSessionToken } from '$lib/server/auth';
import { db, SystemSetting, User } from '$lib/server/db';
import { hash, verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	await db;

	// Get the current user's full details
	const currentUser = await User.findById(locals.user.id);

	if (!currentUser) {
		return redirect(302, '/login');
	}

	// Get all API keys from system settings
	const apiKeys = await SystemSetting.find({
		settingKey: { $regex: /^api_key/ }
	});

	return {
		user: {
			id: currentUser._id.toString(),
			email: currentUser.email,
			firstName: currentUser.firstName,
			lastName: currentUser.lastName,
			role: currentUser.role,
			phoneNumber: currentUser.phoneNumber,
			isActive: currentUser.isActive,
			lastLogin: currentUser.lastLogin,
			createdAt: currentUser.createdAt,
			updatedAt: currentUser.updatedAt
		},
		apiKeys: apiKeys.map((key) => ({
			id: key._id.toString(),
			settingKey: key.settingKey,
			description: key.description,
			isActive: key.isActive,
			createdAt: key.createdAt,
			updatedAt: key.updatedAt
		}))
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		await db;

		const data = await request.formData();
		const firstName = data.get('firstName') as string;
		const lastName = data.get('lastName') as string;
		const email = data.get('email') as string;
		const phoneNumber = data.get('phoneNumber') as string;

		// Validate input
		if (!firstName || !lastName || !email) {
			return fail(400, { message: 'First name, last name, and email are required' });
		}

		// Check if email is already taken by another user
		const existingUser = await User.findOne({ email, _id: { $ne: locals.user.id } });

		if (existingUser) {
			return fail(400, { message: 'Email is already taken by another user' });
		}

		try {
			await User.findByIdAndUpdate(locals.user.id, {
				firstName,
				lastName,
				email,
				phoneNumber: phoneNumber || null,
				updatedAt: new Date()
			});

			return { success: true, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Failed to update profile:', error);
			return fail(500, { message: 'Failed to update profile' });
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		await db;

		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		// Validate input
		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { message: 'All password fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { message: 'New passwords do not match' });
		}

		if (newPassword.length < 8) {
			return fail(400, { message: 'New password must be at least 8 characters long' });
		}

		// Get current user's password hash
		const user = await User.findById(locals.user.id, 'passwordHash');

		if (!user) {
			return fail(404, { message: 'User not found' });
		}

		// Verify current password
		const validPassword = await verify(user.passwordHash, currentPassword);
		if (!validPassword) {
			return fail(400, { message: 'Current password is incorrect' });
		}

		try {
			// Hash new password
			const passwordHash = await hash(newPassword);

			// Update password
			await User.findByIdAndUpdate(locals.user.id, {
				passwordHash,
				updatedAt: new Date()
			});

			return { success: true, message: 'Password changed successfully' };
		} catch (error) {
			console.error('Failed to change password:', error);
			return fail(500, { message: 'Failed to change password' });
		}
	},

	createApiKey: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		await db;

		// Check if user is admin
		const user = await User.findById(locals.user.id, 'role');

		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Only admins can manage API keys' });
		}

		const data = await request.formData();
		const description = data.get('description') as string;

		if (!description) {
			return fail(400, { message: 'Description is required' });
		}

		try {
			// Generate a secure API key
			const apiKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

			await SystemSetting.create({
				settingKey: 'api_key_' + generateSessionToken(),
				settingValue: apiKey,
				description,
				isActive: true
			});

			return { success: true, message: 'API key created successfully', apiKey };
		} catch (error) {
			console.error('Failed to create API key:', error);
			return fail(500, { message: 'Failed to create API key' });
		}
	},

	toggleApiKey: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		await db;

		// Check if user is admin
		const user = await User.findById(locals.user.id, 'role');

		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Only admins can manage API keys' });
		}

		const data = await request.formData();
		const keyId = data.get('keyId') as string;

		if (!keyId) {
			return fail(400, { message: 'Key ID is required' });
		}

		try {
			// Get current status
			const apiKey = await SystemSetting.findById(keyId, 'isActive');

			if (!apiKey) {
				return fail(404, { message: 'API key not found' });
			}

			// Toggle status
			await SystemSetting.findByIdAndUpdate(keyId, {
				isActive: !apiKey.isActive,
				updatedAt: new Date()
			});

			return { success: true, message: 'API key status updated successfully' };
		} catch (error) {
			console.error('Failed to toggle API key:', error);
			return fail(500, { message: 'Failed to update API key status' });
		}
	},

	deleteApiKey: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		await db;

		// Check if user is admin
		const user = await User.findById(locals.user.id, 'role');

		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Only admins can manage API keys' });
		}

		const data = await request.formData();
		const keyId = data.get('keyId') as string;

		if (!keyId) {
			return fail(400, { message: 'Key ID is required' });
		}

		try {
			await SystemSetting.findByIdAndDelete(keyId);

			return { success: true, message: 'API key deleted successfully' };
		} catch (error) {
			console.error('Failed to delete API key:', error);
			return fail(500, { message: 'Failed to delete API key' });
		}
	}
};
