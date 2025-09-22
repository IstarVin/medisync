import { addStaffSchema, updateStaffSchema } from '$lib/schemas/staff.js';
import { connectMongoDB, User } from '$lib/server/db/index.js';
import { sendStaffCredentials } from '$lib/server/mail.js';
import { hash } from '@node-rs/argon2';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// const data = await parent();
	try {
		// Ensure MongoDB connection
		await connectMongoDB();

		// Fetch all staff members (nurses, doctors, admins, staff)
		const allStaff = await User.find({
			role: { $in: ['nurse', 'doctor', 'admin', 'staff'] }
		})
			.select({
				_id: 1,
				email: 1,
				firstName: 1,
				lastName: 1,
				role: 1,
				phoneNumber: 1,
				profileUrl: 1,
				isActive: 1,
				lastLogin: 1,
				createdAt: 1,
				updatedAt: 1
			})
			.sort({ role: 1, lastName: 1, firstName: 1 })
			.lean();

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
			staff: allStaff.map((staff) => ({
				id: staff._id?.toString() || '',
				email: staff.email,
				firstName: staff.firstName,
				lastName: staff.lastName,
				role: staff.role,
				phoneNumber: staff.phoneNumber,
				profileUrl: staff.profileUrl,
				isActive: staff.isActive,
				lastLogin: staff.lastLogin,
				createdAt: staff.createdAt,
				updatedAt: staff.updatedAt
			})),
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
	addStaff: async ({ request, locals }) => {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, {
				errors: {
					general: ['Access denied. Only administrators can add staff members.']
				}
			});
		}

		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();

			// Convert FormData to object
			const staffData = {
				email: formData.get('email')?.toString() || '',
				firstName: formData.get('firstName')?.toString() || '',
				lastName: formData.get('lastName')?.toString() || '',
				role: formData.get('role')?.toString() || '',
				phoneNumber: formData.get('phoneNumber')?.toString() || '',
				profileUrl: formData.get('profileUrl')?.toString() || ''
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
			const existingUser = await User.findOne({ email: validatedData.email }).select('_id');

			if (existingUser) {
				return fail(400, {
					errors: {
						email: ['A user with this email already exists']
					},
					data: staffData
				});
			}

			// Generate a temporary password and send it via email
			const temporaryPassword = crypto.randomUUID();

			// Send credentials via email
			try {
				await sendStaffCredentials(
					validatedData.email,
					validatedData.firstName,
					validatedData.lastName,
					validatedData.role,
					temporaryPassword
				);
			} catch (emailError) {
				console.error('Failed to send credentials email:', emailError);
				// Continue with user creation even if email fails
			}

			const passwordHash = await hash(temporaryPassword, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			// Create the staff member
			const newStaff = await User.create({
				email: validatedData.email,
				passwordHash,
				firstName: validatedData.firstName,
				lastName: validatedData.lastName,
				role: validatedData.role as 'nurse' | 'doctor' | 'admin' | 'staff',
				phoneNumber: validatedData.phoneNumber || undefined,
				profileUrl: validatedData.profileUrl || undefined,
				isActive: true
			});

			if (!newStaff) {
				throw new Error('Failed to create staff member');
			}

			return {
				success: true,
				message: `Staff member ${validatedData.firstName} ${validatedData.lastName} has been added successfully. Login credentials have been sent to their email address.`
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

	updateStaff: async ({ request, locals }) => {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, {
				errors: {
					general: ['Access denied. Only administrators can update staff members.']
				}
			});
		}

		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();

			// Convert FormData to object
			const staffData = {
				id: formData.get('id')?.toString() || '',
				firstName: formData.get('firstName')?.toString() || '',
				lastName: formData.get('lastName')?.toString() || '',
				role: formData.get('role')?.toString() || '',
				phoneNumber: formData.get('phoneNumber')?.toString() || '',
				profileUrl: formData.get('profileUrl')?.toString() || ''
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
			const updatedStaff = await User.findByIdAndUpdate(
				validatedData.id,
				{
					firstName: validatedData.firstName,
					lastName: validatedData.lastName,
					role: validatedData.role as 'nurse' | 'doctor' | 'admin' | 'staff',
					phoneNumber: validatedData.phoneNumber || undefined,
					profileUrl: validatedData.profileUrl || undefined,
					updatedAt: new Date()
				},
				{ new: true }
			);

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

	deleteStaff: async ({ request, locals }) => {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, {
				errors: {
					general: ['Access denied. Only administrators can deactivate staff members.']
				}
			});
		}

		try {
			// Ensure MongoDB connection
			await connectMongoDB();

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
			const deactivatedStaff = await User.findByIdAndUpdate(
				staffId,
				{
					isActive: false,
					updatedAt: new Date()
				},
				{ new: true }
			);

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

	activateStaff: async ({ request, locals }) => {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, {
				errors: {
					general: ['Access denied. Only administrators can activate staff members.']
				}
			});
		}

		try {
			// Ensure MongoDB connection
			await connectMongoDB();

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
			const activatedStaff = await User.findByIdAndUpdate(
				staffId,
				{
					isActive: true,
					updatedAt: new Date()
				},
				{ new: true }
			);

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
