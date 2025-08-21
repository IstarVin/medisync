import { addStaffSchema, updateStaffSchema } from '$lib/schemas/staff.js';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { hash } from '@node-rs/argon2';
import { fail } from '@sveltejs/kit';
import { asc, eq, or } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all staff members (nurses, doctors, admins, staff)
		const allStaff = await db
			.select({
				id: users.id,
				email: users.email,
				firstName: users.firstName,
				lastName: users.lastName,
				role: users.role,
				phoneNumber: users.phoneNumber,
				isActive: users.isActive,
				lastLogin: users.lastLogin,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt
			})
			.from(users)
			.where(
				or(
					eq(users.role, 'nurse'),
					eq(users.role, 'doctor'),
					eq(users.role, 'admin'),
					eq(users.role, 'staff')
				)
			)
			.orderBy(asc(users.role), asc(users.lastName), asc(users.firstName));

		// Calculate statistics
		const stats = {
			total: allStaff.length,
			nurses: allStaff.filter((s) => s.role === 'nurse').length,
			doctors: allStaff.filter((s) => s.role === 'doctor').length,
			admins: allStaff.filter((s) => s.role === 'admin').length,
			active: allStaff.filter((s) => s.isActive).length,
			inactive: allStaff.filter((s) => !s.isActive).length
		};

		return {
			staff: allStaff,
			stats
		};
	} catch (error) {
		console.error('Error loading staff data:', error);
		return {
			staff: [],
			stats: {
				total: 0,
				nurses: 0,
				doctors: 0,
				admins: 0,
				active: 0,
				inactive: 0
			}
		};
	}
};

export const actions: Actions = {
	addStaff: async ({ request }) => {
		try {
			const formData = await request.formData();

			// Convert FormData to object
			const staffData = {
				email: formData.get('email')?.toString() || '',
				firstName: formData.get('firstName')?.toString() || '',
				lastName: formData.get('lastName')?.toString() || '',
				role: formData.get('role')?.toString() || '',
				phoneNumber: formData.get('phoneNumber')?.toString() || ''
			};

			// Validate the data
			const validationResult = addStaffSchema.safeParse(staffData);

			if (!validationResult.success) {
				const errors: Record<string, string[]> = {};
				validationResult.error.issues.forEach((issue) => {
					const path = issue.path.join('.');
					if (!errors[path]) {
						errors[path] = [];
					}
					errors[path].push(issue.message);
				});

				return fail(400, {
					errors,
					data: staffData
				});
			}
			const validatedData = validationResult.data;

			// Check if email already exists
			const existingUser = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, validatedData.email))
				.limit(1);

			if (existingUser.length > 0) {
				return fail(400, {
					errors: {
						email: ['A user with this email already exists']
					},
					data: staffData
				});
			}

			// Generate a temporary password (in production, you might want to send this via email)
			const temporaryPassword = 'temp123!'; // You should generate a random password
			const passwordHash = await hash(temporaryPassword, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			// Create the staff member
			const [newStaff] = await db
				.insert(users)
				.values({
					email: validatedData.email,
					passwordHash,
					firstName: validatedData.firstName,
					lastName: validatedData.lastName,
					role: validatedData.role as 'nurse' | 'doctor' | 'admin' | 'staff',
					phoneNumber: validatedData.phoneNumber || null,
					isActive: true
				})
				.returning();

			if (!newStaff) {
				throw new Error('Failed to create staff member');
			}

			return {
				success: true,
				message: `Staff member ${validatedData.firstName} ${validatedData.lastName} has been added successfully.`,
				temporaryPassword // In production, don't return this - send via email instead
			};
		} catch (error) {
			console.error('Error adding staff member:', error);
			return fail(500, {
				errors: {
					general: ['An error occurred while adding the staff member. Please try again.']
				}
			});
		}
	},

	updateStaff: async ({ request }) => {
		try {
			const formData = await request.formData();

			// Convert FormData to object
			const staffData = {
				id: formData.get('id')?.toString() || '',
				firstName: formData.get('firstName')?.toString() || '',
				lastName: formData.get('lastName')?.toString() || '',
				role: formData.get('role')?.toString() || '',
				phoneNumber: formData.get('phoneNumber')?.toString() || ''
			};

			// Validate the data
			const validationResult = updateStaffSchema.safeParse(staffData);

			if (!validationResult.success) {
				const errors: Record<string, string[]> = {};
				validationResult.error.issues.forEach((issue) => {
					const path = issue.path.join('.');
					if (!errors[path]) {
						errors[path] = [];
					}
					errors[path].push(issue.message);
				});

				return fail(400, {
					errors,
					data: staffData
				});
			}
			const validatedData = validationResult.data;

			// Update the staff member
			const [updatedStaff] = await db
				.update(users)
				.set({
					firstName: validatedData.firstName,
					lastName: validatedData.lastName,
					role: validatedData.role as 'nurse' | 'doctor' | 'admin' | 'staff',
					phoneNumber: validatedData.phoneNumber || null,
					updatedAt: new Date()
				})
				.where(eq(users.id, validatedData.id))
				.returning();

			if (!updatedStaff) {
				throw new Error('Staff member not found');
			}

			return {
				success: true,
				message: `Staff member ${validatedData.firstName} ${validatedData.lastName} has been updated successfully.`
			};
		} catch (error) {
			console.error('Error updating staff member:', error);
			return fail(500, {
				errors: {
					general: ['An error occurred while updating the staff member. Please try again.']
				}
			});
		}
	},

	deleteStaff: async ({ request }) => {
		try {
			const formData = await request.formData();
			const staffId = formData.get('id')?.toString();

			if (!staffId) {
				return fail(400, {
					errors: {
						general: ['Staff ID is required']
					}
				});
			}

			// Instead of deleting, we'll deactivate the staff member
			// This preserves historical data and references
			const [deactivatedStaff] = await db
				.update(users)
				.set({
					isActive: false,
					updatedAt: new Date()
				})
				.where(eq(users.id, staffId))
				.returning();

			if (!deactivatedStaff) {
				throw new Error('Staff member not found');
			}

			return {
				success: true,
				message: `Staff member has been deactivated successfully.`
			};
		} catch (error) {
			console.error('Error deactivating staff member:', error);
			return fail(500, {
				errors: {
					general: ['An error occurred while deactivating the staff member. Please try again.']
				}
			});
		}
	},

	activateStaff: async ({ request }) => {
		try {
			const formData = await request.formData();
			const staffId = formData.get('id')?.toString();

			if (!staffId) {
				return fail(400, {
					errors: {
						general: ['Staff ID is required']
					}
				});
			}

			// Activate the staff member
			const [activatedStaff] = await db
				.update(users)
				.set({
					isActive: true,
					updatedAt: new Date()
				})
				.where(eq(users.id, staffId))
				.returning();

			if (!activatedStaff) {
				throw new Error('Staff member not found');
			}

			return {
				success: true,
				message: `Staff member has been activated successfully.`
			};
		} catch (error) {
			console.error('Error activating staff member:', error);
			return fail(500, {
				errors: {
					general: ['An error occurred while activating the staff member. Please try again.']
				}
			});
		}
	}
};
