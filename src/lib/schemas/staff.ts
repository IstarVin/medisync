import { z } from 'zod';

// Schema for adding a new staff member
export const addStaffSchema = z.object({
	email: z
		.string()
		.min(1, 'Email is required')
		.email('Please enter a valid email address')
		.max(255, 'Email must be 255 characters or less'),
	firstName: z
		.string()
		.min(1, 'First name is required')
		.max(100, 'First name must be 100 characters or less'),
	lastName: z
		.string()
		.min(1, 'Last name is required')
		.max(100, 'Last name must be 100 characters or less'),
	role: z.enum(['nurse', 'doctor', 'admin', 'staff'], {
		message: 'Please select a valid role'
	}),
	phoneNumber: z
		.string()
		.max(20, 'Phone number must be 20 characters or less')
		.optional()
		.or(z.literal(''))
});

// Schema for updating a staff member
export const updateStaffSchema = z.object({
	id: z.string().min(1, 'Staff ID is required'),
	firstName: z
		.string()
		.min(1, 'First name is required')
		.max(100, 'First name must be 100 characters or less'),
	lastName: z
		.string()
		.min(1, 'Last name is required')
		.max(100, 'Last name must be 100 characters or less'),
	role: z.enum(['nurse', 'doctor', 'admin', 'staff'], {
		message: 'Please select a valid role'
	}),
	phoneNumber: z
		.string()
		.max(20, 'Phone number must be 20 characters or less')
		.optional()
		.or(z.literal(''))
});

export type AddStaffSchema = typeof addStaffSchema;
export type UpdateStaffSchema = typeof updateStaffSchema;
