import { addStudentSchema } from '$lib/schemas/student.js';
import { db } from '$lib/server/db/index.js';
import { emergencyContacts, students } from '$lib/server/db/schema.js';
import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all students with their emergency contacts for client-side filtering and pagination
		const allStudents = await db
			.select({
				id: students.id,
				studentId: students.studentId,
				firstName: students.firstName,
				lastName: students.lastName,
				middleName: students.middleName,
				email: students.email,
				dateOfBirth: students.dateOfBirth,
				gender: students.gender,
				grade: students.grade,
				section: students.section,
				address: students.address,
				chronicHealthConditions: students.chronicHealthConditions,
				currentMedications: students.currentMedications,
				healthHistory: students.healthHistory,
				enrollmentDate: students.enrollmentDate,
				isActive: students.isActive,
				// Emergency contact info (primary contact only)
				emergencyContactId: emergencyContacts.id,
				emergencyContactName: emergencyContacts.name,
				emergencyContactRelationship: emergencyContacts.relationship,
				emergencyContactPhone: emergencyContacts.phoneNumber,
				emergencyContactAlternatePhone: emergencyContacts.alternatePhone,
				emergencyContactEmail: emergencyContacts.email,
				emergencyContactAddress: emergencyContacts.address
			})
			.from(students)
			.leftJoin(emergencyContacts, eq(emergencyContacts.studentId, students.id))
			.orderBy(asc(students.lastName), asc(students.firstName));

		// Calculate statistics
		const stats = {
			total: allStudents.length,
			active: allStudents.filter((s) => s.isActive).length,
			withMedicalConditions: allStudents.filter((s) => s.chronicHealthConditions.length > 0).length,
			recentlyEnrolled: allStudents.filter((s) => {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				return new Date(s.enrollmentDate) > thirtyDaysAgo;
			}).length
		};

		// Get unique values for client-side filters
		const uniqueGrades = [...new Set(allStudents.map((s) => s.grade))].sort();
		const uniqueMedicalConditions = [
			...new Set(
				allStudents
					.flatMap((s) => s.chronicHealthConditions)
					.map((condition) => condition.split('(')[0].trim())
					.filter(Boolean)
			)
		].sort();

		return {
			students: allStudents,
			stats,
			filterOptions: {
				grades: uniqueGrades,
				medicalConditions: uniqueMedicalConditions
			}
		};
	} catch (error) {
		console.error('Error loading students:', error);

		// Return empty state on error
		return {
			students: [],
			stats: {
				total: 0,
				active: 0,
				withMedicalConditions: 0,
				recentlyEnrolled: 0
			},
			filterOptions: {
				grades: [],
				medicalConditions: []
			}
		};
	}
};

export const actions: Actions = {
	addStudent: async ({ request }) => {
		try {
			const formData = await request.formData();

			// Convert FormData to object
			const studentData = {
				studentId: formData.get('studentId') as string,
				firstName: formData.get('firstName') as string,
				lastName: formData.get('lastName') as string,
				middleName: formData.get('middleName') as string | null,
				email: formData.get('email') as string | null,
				dateOfBirth: formData.get('dateOfBirth') as string,
				gender: formData.get('gender') as 'male' | 'female' | 'other' | 'prefer_not_to_say',
				grade: formData.get('grade') as string,
				section: formData.get('section') as string | null,
				address: formData.get('address') as string | null,
				chronicHealthConditions: formData.get('chronicHealthConditions') as string | null,
				currentMedications: formData.get('currentMedications') as string | null,
				healthHistory: formData.get('healthHistory') as string | null,
				emergencyContactName: formData.get('emergencyContactName') as string,
				emergencyContactRelationship: formData.get('emergencyContactRelationship') as
					| 'parent'
					| 'guardian'
					| 'sibling'
					| 'grandparent'
					| 'other',
				emergencyContactPhone: formData.get('emergencyContactPhone') as string,
				emergencyContactAlternatePhone: formData.get('emergencyContactAlternatePhone') as
					| string
					| null,
				emergencyContactEmail: formData.get('emergencyContactEmail') as string | null,
				emergencyContactAddress: formData.get('emergencyContactAddress') as string | null
			};

			// Validate the form data (server-side validation)
			const validationResult = addStudentSchema.safeParse(studentData);

			if (!validationResult.success) {
				return fail(400, {
					errors: validationResult.error.flatten().fieldErrors,
					data: studentData
				});
			}

			const validData = validationResult.data;

			// Start a transaction to insert student and emergency contact
			const result = await db.transaction(async (tx) => {
				// Insert student
				const [newStudent] = await tx
					.insert(students)
					.values({
						studentId: validData.studentId,
						firstName: validData.firstName,
						lastName: validData.lastName,
						middleName: validData.middleName || null,
						email: validData.email || null,
						dateOfBirth: new Date(validData.dateOfBirth),
						gender: validData.gender,
						grade: validData.grade,
						section: validData.section || null,
						address: validData.address || null,
						chronicHealthConditions: validData.chronicHealthConditions
							? validData.chronicHealthConditions
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						currentMedications: validData.currentMedications
							? validData.currentMedications
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						healthHistory: validData.healthHistory || null,
						enrollmentDate: new Date(),
						isActive: true
					})
					.returning();

				// Insert emergency contact
				await tx.insert(emergencyContacts).values({
					studentId: newStudent.id,
					name: validData.emergencyContactName,
					relationship: validData.emergencyContactRelationship,
					phoneNumber: validData.emergencyContactPhone,
					alternatePhone: validData.emergencyContactAlternatePhone || null,
					email: validData.emergencyContactEmail || null,
					address: validData.emergencyContactAddress || null,
					isPrimary: true,
					priority: 1
				});

				return newStudent;
			});

			return {
				success: true,
				student: result
			};
		} catch (error) {
			console.error('Error adding student:', error);
			return fail(500, {
				error: 'Failed to add student. Please try again.'
			});
		}
	},

	updateStudent: async ({ request }) => {
		try {
			const formData = await request.formData();

			// Get student ID for updating
			const studentId = formData.get('id') as string;
			if (!studentId) {
				return fail(400, {
					error: 'Student ID is required for updating.'
				});
			}

			// Convert FormData to object
			const studentData = {
				studentId: formData.get('studentId') as string,
				firstName: formData.get('firstName') as string,
				lastName: formData.get('lastName') as string,
				middleName: formData.get('middleName') as string | null,
				email: formData.get('email') as string | null,
				dateOfBirth: formData.get('dateOfBirth') as string,
				gender: formData.get('gender') as 'male' | 'female' | 'other' | 'prefer_not_to_say',
				grade: formData.get('grade') as string,
				section: formData.get('section') as string | null,
				address: formData.get('address') as string | null,
				chronicHealthConditions: formData.get('chronicHealthConditions') as string | null,
				currentMedications: formData.get('currentMedications') as string | null,
				healthHistory: formData.get('healthHistory') as string | null,
				emergencyContactName: formData.get('emergencyContactName') as string,
				emergencyContactRelationship: formData.get('emergencyContactRelationship') as
					| 'parent'
					| 'guardian'
					| 'sibling'
					| 'grandparent'
					| 'other',
				emergencyContactPhone: formData.get('emergencyContactPhone') as string,
				emergencyContactAlternatePhone: formData.get('emergencyContactAlternatePhone') as
					| string
					| null,
				emergencyContactEmail: formData.get('emergencyContactEmail') as string | null,
				emergencyContactAddress: formData.get('emergencyContactAddress') as string | null
			};

			// Validate the form data (server-side validation)
			const validationResult = addStudentSchema.safeParse(studentData);

			if (!validationResult.success) {
				return fail(400, {
					errors: validationResult.error.flatten().fieldErrors,
					data: studentData
				});
			}

			const validData = validationResult.data;

			// Start a transaction to update student and emergency contact
			const result = await db.transaction(async (tx) => {
				// Update student
				const [updatedStudent] = await tx
					.update(students)
					.set({
						firstName: validData.firstName,
						lastName: validData.lastName,
						middleName: validData.middleName || null,
						email: validData.email || null,
						dateOfBirth: new Date(validData.dateOfBirth),
						gender: validData.gender,
						grade: validData.grade,
						section: validData.section || null,
						address: validData.address || null,
						chronicHealthConditions: validData.chronicHealthConditions
							? validData.chronicHealthConditions
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						currentMedications: validData.currentMedications
							? validData.currentMedications
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						healthHistory: validData.healthHistory || null,
						updatedAt: new Date()
					})
					.where(eq(students.id, studentId))
					.returning();

				if (!updatedStudent) {
					throw new Error('Student not found');
				}

				// Update emergency contact (find primary contact and update)
				await tx
					.update(emergencyContacts)
					.set({
						name: validData.emergencyContactName,
						relationship: validData.emergencyContactRelationship,
						phoneNumber: validData.emergencyContactPhone,
						alternatePhone: validData.emergencyContactAlternatePhone || null,
						email: validData.emergencyContactEmail || null,
						address: validData.emergencyContactAddress || null,
						updatedAt: new Date()
					})
					.where(eq(emergencyContacts.studentId, studentId));

				return updatedStudent;
			});

			return {
				success: true,
				student: result
			};
		} catch (error) {
			console.error('Error updating student:', error);
			return fail(500, {
				error: 'Failed to update student. Please try again.'
			});
		}
	}
};
