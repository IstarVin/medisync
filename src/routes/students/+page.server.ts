import { db } from '$lib/server/db/index.js';
import { emergencyContacts, students } from '$lib/server/db/schema.js';
import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all students with their emergency contacts using the relation query
		const allStudents = await db.query.students.findMany({
			with: {
				emergencyContacts: {
					orderBy: [asc(emergencyContacts.priority), asc(emergencyContacts.createdAt)]
				}
			},
			orderBy: [asc(students.lastName), asc(students.firstName)]
		});

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

			// Extract student data
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
				healthHistory: formData.get('healthHistory') as string | null
			};

			// Extract emergency contacts data
			const emergencyContactsData: {
				name: string;
				relationship: 'parent' | 'guardian' | 'sibling' | 'grandparent' | 'other' | 'adviser';
				phoneNumber: string;
				alternatePhone: string | null;
				email: string | null;
				address: string | null;
				isPrimary: boolean;
				priority: number;
			}[] = [];
			let contactIndex = 0;
			while (formData.get(`emergencyContacts[${contactIndex}][name]`)) {
				emergencyContactsData.push({
					name: formData.get(`emergencyContacts[${contactIndex}][name]`) as string,
					relationship: formData.get(`emergencyContacts[${contactIndex}][relationship]`) as
						| 'parent'
						| 'guardian'
						| 'sibling'
						| 'grandparent'
						| 'other'
						| 'adviser',
					phoneNumber: formData.get(`emergencyContacts[${contactIndex}][phoneNumber]`) as string,
					alternatePhone: formData.get(`emergencyContacts[${contactIndex}][alternatePhone]`) as
						| string
						| null,
					email: formData.get(`emergencyContacts[${contactIndex}][email]`) as string | null,
					address: formData.get(`emergencyContacts[${contactIndex}][address]`) as string | null,
					isPrimary: formData.get(`emergencyContacts[${contactIndex}][isPrimary]`) === 'true',
					priority:
						parseInt(formData.get(`emergencyContacts[${contactIndex}][priority]`) as string) ||
						contactIndex + 1
				});
				contactIndex++;
			}

			// Validate the form data (basic validation)
			if (
				!studentData.studentId ||
				!studentData.firstName ||
				!studentData.lastName ||
				!studentData.dateOfBirth ||
				!studentData.gender ||
				!studentData.grade
			) {
				return fail(400, {
					error: 'Required fields are missing'
				});
			}

			if (emergencyContactsData.length === 0) {
				return fail(400, {
					error: 'At least one emergency contact is required'
				});
			}

			// Validate each emergency contact
			for (const contact of emergencyContactsData) {
				if (!contact.name || !contact.relationship || !contact.phoneNumber) {
					return fail(400, {
						error: 'Emergency contact name, relationship, and phone number are required'
					});
				}
			}

			// Start a transaction to insert student and emergency contacts
			const result = await db.transaction(async (tx) => {
				// Insert student
				const [newStudent] = await tx
					.insert(students)
					.values({
						studentId: studentData.studentId,
						firstName: studentData.firstName,
						lastName: studentData.lastName,
						middleName: studentData.middleName || null,
						email: studentData.email || null,
						dateOfBirth: new Date(studentData.dateOfBirth),
						gender: studentData.gender,
						grade: studentData.grade,
						section: studentData.section || null,
						address: studentData.address || null,
						chronicHealthConditions: studentData.chronicHealthConditions
							? studentData.chronicHealthConditions
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						currentMedications: studentData.currentMedications
							? studentData.currentMedications
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						healthHistory: studentData.healthHistory || null,
						enrollmentDate: new Date(),
						isActive: true
					})
					.returning();

				// Insert emergency contacts
				for (const contact of emergencyContactsData) {
					await tx.insert(emergencyContacts).values({
						studentId: newStudent.id,
						name: contact.name,
						relationship: contact.relationship,
						phoneNumber: contact.phoneNumber,
						alternatePhone: contact.alternatePhone || null,
						email: contact.email || null,
						address: contact.address || null,
						isPrimary: contact.isPrimary,
						priority: contact.priority
					});
				}

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

			// Extract student data
			const studentData = {
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
				healthHistory: formData.get('healthHistory') as string | null
			};

			// Extract emergency contacts data
			const emergencyContactsData: {
				name: string;
				relationship: 'parent' | 'guardian' | 'sibling' | 'grandparent' | 'other' | 'adviser';
				phoneNumber: string;
				alternatePhone: string | null;
				email: string | null;
				address: string | null;
				isPrimary: boolean;
				priority: number;
			}[] = [];
			let contactIndex = 0;
			while (formData.get(`emergencyContacts[${contactIndex}][name]`)) {
				emergencyContactsData.push({
					name: formData.get(`emergencyContacts[${contactIndex}][name]`) as string,
					relationship: formData.get(`emergencyContacts[${contactIndex}][relationship]`) as
						| 'parent'
						| 'guardian'
						| 'sibling'
						| 'grandparent'
						| 'other'
						| 'adviser',
					phoneNumber: formData.get(`emergencyContacts[${contactIndex}][phoneNumber]`) as string,
					alternatePhone: formData.get(`emergencyContacts[${contactIndex}][alternatePhone]`) as
						| string
						| null,
					email: formData.get(`emergencyContacts[${contactIndex}][email]`) as string | null,
					address: formData.get(`emergencyContacts[${contactIndex}][address]`) as string | null,
					isPrimary: formData.get(`emergencyContacts[${contactIndex}][isPrimary]`) === 'true',
					priority:
						parseInt(formData.get(`emergencyContacts[${contactIndex}][priority]`) as string) ||
						contactIndex + 1
				});
				contactIndex++;
			}

			// Basic validation
			if (
				!studentData.firstName ||
				!studentData.lastName ||
				!studentData.dateOfBirth ||
				!studentData.gender ||
				!studentData.grade
			) {
				return fail(400, {
					error: 'Required fields are missing'
				});
			}

			if (emergencyContactsData.length === 0) {
				return fail(400, {
					error: 'At least one emergency contact is required'
				});
			}

			// Validate each emergency contact
			for (const contact of emergencyContactsData) {
				if (!contact.name || !contact.relationship || !contact.phoneNumber) {
					return fail(400, {
						error: 'Emergency contact name, relationship, and phone number are required'
					});
				}
			}

			// Start a transaction to update student and emergency contacts
			const result = await db.transaction(async (tx) => {
				// Update student
				const [updatedStudent] = await tx
					.update(students)
					.set({
						firstName: studentData.firstName,
						lastName: studentData.lastName,
						middleName: studentData.middleName || null,
						email: studentData.email || null,
						dateOfBirth: new Date(studentData.dateOfBirth),
						gender: studentData.gender,
						grade: studentData.grade,
						section: studentData.section || null,
						address: studentData.address || null,
						chronicHealthConditions: studentData.chronicHealthConditions
							? studentData.chronicHealthConditions
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						currentMedications: studentData.currentMedications
							? studentData.currentMedications
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean)
							: [],
						healthHistory: studentData.healthHistory || null,
						updatedAt: new Date()
					})
					.where(eq(students.id, studentId))
					.returning();

				if (!updatedStudent) {
					throw new Error('Student not found');
				}

				// Delete existing emergency contacts
				await tx.delete(emergencyContacts).where(eq(emergencyContacts.studentId, studentId));

				// Insert new emergency contacts
				for (const contact of emergencyContactsData) {
					await tx.insert(emergencyContacts).values({
						studentId: studentId,
						name: contact.name,
						relationship: contact.relationship,
						phoneNumber: contact.phoneNumber,
						alternatePhone: contact.alternatePhone || null,
						email: contact.email || null,
						address: contact.address || null,
						isPrimary: contact.isPrimary,
						priority: contact.priority
					});
				}

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
