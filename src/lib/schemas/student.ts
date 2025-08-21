import { z } from 'zod';

// Schema for adding a new student
export const addStudentSchema = z.object({
	// Personal Information
	studentId: z
		.string()
		.min(1, 'Student ID is required')
		.max(50, 'Student ID must be 50 characters or less'),
	firstName: z
		.string()
		.min(1, 'First name is required')
		.max(100, 'First name must be 100 characters or less'),
	lastName: z
		.string()
		.min(1, 'Last name is required')
		.max(100, 'Last name must be 100 characters or less'),
	middleName: z.string().max(100, 'Middle name must be 100 characters or less').optional(),
	email: z.email('Please enter a valid email address').optional().or(z.literal('')),
	dateOfBirth: z.string().min(1, 'Date of birth is required'),
	gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
		message: 'Please select a gender'
	}),
	grade: z.string().min(1, 'Grade is required').max(20, 'Grade must be 20 characters or less'),
	section: z.string().max(50, 'Section must be 50 characters or less').optional(),
	address: z.string().max(500, 'Address must be 500 characters or less').optional(),

	// Medical Information
	chronicHealthConditions: z.string().optional(),
	currentMedications: z.string().optional(),
	healthHistory: z.string().max(1000, 'Health history must be 1000 characters or less').optional(),
	doctorId: z.string().optional(),

	// Emergency Contact (Primary)
	emergencyContactName: z
		.string()
		.min(1, 'Emergency contact name is required')
		.max(200, 'Name must be 200 characters or less'),
	emergencyContactRelationship: z.enum(['parent', 'guardian', 'sibling', 'grandparent', 'other'], {
		message: 'Please select a relationship'
	}),
	emergencyContactPhone: z
		.string()
		.min(1, 'Emergency contact phone is required')
		.max(20, 'Phone must be 20 characters or less'),
	emergencyContactAlternatePhone: z
		.string()
		.max(20, 'Alternate phone must be 20 characters or less')
		.optional(),
	emergencyContactEmail: z
		.string()
		.email('Please enter a valid email address')
		.optional()
		.or(z.literal('')),
	emergencyContactAddress: z.string().max(500, 'Address must be 500 characters or less').optional()
});

export type AddStudentSchema = typeof addStudentSchema;
