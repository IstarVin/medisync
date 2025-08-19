import { addStudentSchema } from '$lib/schemas/student.js';
import { db } from '$lib/server/db/index.js';
import { emergencyContacts, students } from '$lib/server/db/schema.js';
import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { asc, count } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const page = parseInt(params.page || '1');
	const limit = 50; // Fixed page size
	const offset = (page - 1) * limit;

	try {
		// Simple pagination - get students for current page
		const [studentsResult, totalCountResult] = await Promise.all([
			db
				.select()
				.from(students)
				.orderBy(asc(students.lastName), asc(students.firstName))
				.limit(limit)
				.offset(offset),
			db.select({ count: count() }).from(students)
		]);

		const totalCount = totalCountResult[0]?.count || 0;

		if (studentsResult.length === 0) {
			return redirect(302, '/students/1');
		}
		const totalPages = Math.ceil(totalCount / limit);

		// Get all students for stats and filter options (needed for client-side filtering)
		const allStudents = await db.select().from(students);

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
			students: studentsResult,
			allStudents, // For client-side filtering
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1
			},
			stats,
			filterOptions: {
				grades: uniqueGrades,
				medicalConditions: uniqueMedicalConditions
			}
		};
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}

		console.error('Error loading students:', error);

		// Return empty state on error
		return {
			students: [],
			allStudents: [],
			pagination: {
				page: 1,
				limit,
				total: 0,
				totalPages: 0,
				hasNext: false,
				hasPrev: false
			},
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
	}
};
