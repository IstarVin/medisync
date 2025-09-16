import { db } from '$lib/server/db/index.js';
import { clinicVisits, emergencyContacts, students, users } from '$lib/server/db/schema.js';
import { fail } from '@sveltejs/kit';
import { asc, count, eq } from 'drizzle-orm';
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

		// Fetch available doctors for the form
		const availableDoctors = await db
			.select({
				id: users.id,
				name: users.firstName,
				lastName: users.lastName,
				role: users.role
			})
			.from(users)
			.where(eq(users.role, 'doctor'))
			.orderBy(users.firstName, users.lastName);

		// Format doctor names for display
		const formattedDoctors = availableDoctors.map((doctor) => ({
			id: doctor.id,
			name: `${doctor.name} ${doctor.lastName}`
		}));

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
			availableDoctors: formattedDoctors,
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
			availableDoctors: [],
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
				profileUrl: formData.get('profileUrl') as string | null,
				chronicHealthConditions: formData.get('chronicHealthConditions') as string | null,
				currentMedications: formData.get('currentMedications') as string | null,
				healthHistory: formData.get('healthHistory') as string | null,
				doctorId: formData.get('doctorId') as string | null
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

			// Comprehensive validation
			const errors: Record<string, string[]> = {};

			// Validate required student fields
			if (!studentData.studentId?.trim()) {
				errors.studentId = ['Student ID is required'];
			} else if (studentData.studentId.length > 50) {
				errors.studentId = ['Student ID must be 50 characters or less'];
			}

			if (!studentData.firstName?.trim()) {
				errors.firstName = ['First name is required'];
			} else if (studentData.firstName.length > 100) {
				errors.firstName = ['First name must be 100 characters or less'];
			}

			if (!studentData.lastName?.trim()) {
				errors.lastName = ['Last name is required'];
			} else if (studentData.lastName.length > 100) {
				errors.lastName = ['Last name must be 100 characters or less'];
			}

			if (studentData.middleName && studentData.middleName.length > 100) {
				errors.middleName = ['Middle name must be 100 characters or less'];
			}

			if (studentData.email && studentData.email.trim()) {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(studentData.email)) {
					errors.email = ['Please enter a valid email address'];
				}
			}

			if (!studentData.dateOfBirth?.trim()) {
				errors.dateOfBirth = ['Date of birth is required'];
			} else {
				const birthDate = new Date(studentData.dateOfBirth);
				if (isNaN(birthDate.getTime())) {
					errors.dateOfBirth = ['Please enter a valid date'];
				} else if (birthDate > new Date()) {
					errors.dateOfBirth = ['Date of birth cannot be in the future'];
				}
			}

			if (!studentData.gender?.trim()) {
				errors.gender = ['Gender is required'];
			} else if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(studentData.gender)) {
				errors.gender = ['Please select a valid gender'];
			}

			if (!studentData.grade?.trim()) {
				errors.grade = ['Grade is required'];
			} else if (studentData.grade.length > 20) {
				errors.grade = ['Grade must be 20 characters or less'];
			}

			if (studentData.section && studentData.section.length > 50) {
				errors.section = ['Section must be 50 characters or less'];
			}

			if (studentData.address && studentData.address.length > 500) {
				errors.address = ['Address must be 500 characters or less'];
			}

			if (studentData.profileUrl && studentData.profileUrl.trim()) {
				try {
					new URL(studentData.profileUrl);
				} catch {
					errors.profileUrl = ['Please enter a valid URL'];
				}
				if (studentData.profileUrl.length > 500) {
					errors.profileUrl = ['Profile URL must be 500 characters or less'];
				}
			}

			if (studentData.healthHistory && studentData.healthHistory.length > 1000) {
				errors.healthHistory = ['Health history must be 1000 characters or less'];
			}

			// Validate emergency contacts
			if (emergencyContactsData.length === 0) {
				errors.emergencyContacts = ['At least one emergency contact is required'];
			} else {
				emergencyContactsData.forEach((contact, index) => {
					if (!contact.name?.trim()) {
						errors[`emergencyContacts.${index}.name`] = ['Contact name is required'];
					} else if (contact.name.length > 200) {
						errors[`emergencyContacts.${index}.name`] = ['Name must be 200 characters or less'];
					}

					if (!contact.relationship?.trim()) {
						errors[`emergencyContacts.${index}.relationship`] = ['Relationship is required'];
					} else if (
						!['parent', 'guardian', 'sibling', 'grandparent', 'other', 'adviser'].includes(
							contact.relationship
						)
					) {
						errors[`emergencyContacts.${index}.relationship`] = [
							'Please select a valid relationship'
						];
					}

					if (!contact.phoneNumber?.trim()) {
						errors[`emergencyContacts.${index}.phoneNumber`] = ['Phone number is required'];
					} else if (contact.phoneNumber.length > 20) {
						errors[`emergencyContacts.${index}.phoneNumber`] = [
							'Phone number must be 20 characters or less'
						];
					}

					if (contact.alternatePhone && contact.alternatePhone.length > 20) {
						errors[`emergencyContacts.${index}.alternatePhone`] = [
							'Alternate phone must be 20 characters or less'
						];
					}

					if (contact.email && contact.email.trim()) {
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
						if (!emailRegex.test(contact.email)) {
							errors[`emergencyContacts.${index}.email`] = ['Please enter a valid email address'];
						}
					}

					if (contact.address && contact.address.length > 500) {
						errors[`emergencyContacts.${index}.address`] = [
							'Address must be 500 characters or less'
						];
					}
				});
			}

			// Return validation errors if any
			if (Object.keys(errors).length > 0) {
				return fail(400, {
					errors,
					formData: studentData,
					emergencyContacts: emergencyContactsData
				});
			}

			// Check for existing student ID
			const existingStudent = await db
				.select({ id: students.id })
				.from(students)
				.where(eq(students.studentId, studentData.studentId))
				.limit(1);

			if (existingStudent.length > 0) {
				return fail(400, {
					errors: {
						studentId: ['A student with this ID already exists']
					},
					formData: studentData,
					emergencyContacts: emergencyContactsData
				});
			}

			// Check for existing email if provided
			if (studentData.email && studentData.email.trim()) {
				const existingEmail = await db
					.select({ id: students.id })
					.from(students)
					.where(eq(students.email, studentData.email))
					.limit(1);

				if (existingEmail.length > 0) {
					return fail(400, {
						errors: {
							email: ['A student with this email already exists']
						},
						formData: studentData,
						emergencyContacts: emergencyContactsData
					});
				}
			}

			// Insert student
			const [newStudent] = await db
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
					profileUrl: studentData.profileUrl || null,
					chronicHealthConditions: studentData.chronicHealthConditions
						? studentData.chronicHealthConditions
								.split(/[\n,]+/)
								.map((s) => s.trim())
								.filter(Boolean)
						: [],
					currentMedications: studentData.currentMedications
						? studentData.currentMedications
								.split(/[\n,]+/)
								.map((s) => s.trim())
								.filter(Boolean)
						: [],
					healthHistory: studentData.healthHistory || null,
					doctorId: studentData.doctorId || null,
					enrollmentDate: new Date(),
					isActive: true
				})
				.returning();

			// Insert emergency contacts
			for (const contact of emergencyContactsData) {
				await db.insert(emergencyContacts).values({
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

			return {
				success: true,
				student: newStudent
			};
		} catch (error) {
			console.error('Error adding student:', error);

			// Handle specific database errors
			if (error instanceof Error) {
				if (error.message.includes('UNIQUE constraint failed: students.student_id')) {
					return fail(400, {
						errors: {
							studentId: ['A student with this ID already exists']
						}
					});
				}
				if (error.message.includes('UNIQUE constraint failed: students.email')) {
					return fail(400, {
						errors: {
							email: ['A student with this email already exists']
						}
					});
				}
			}

			return fail(500, {
				errors: {
					_form: ['Failed to add student. Please try again.']
				}
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
					errors: {
						_form: ['Student ID is required for updating.']
					}
				});
			}

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
				profileUrl: formData.get('profileUrl') as string | null,
				chronicHealthConditions: formData.get('chronicHealthConditions') as string | null,
				currentMedications: formData.get('currentMedications') as string | null,
				healthHistory: formData.get('healthHistory') as string | null,
				doctorId: formData.get('doctorId') as string | null
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

			// Comprehensive validation
			const errors: Record<string, string[]> = {};

			// Validate required student fields
			if (!studentData.studentId?.trim()) {
				errors.studentId = ['Student ID is required'];
			} else if (studentData.studentId.length > 50) {
				errors.studentId = ['Student ID must be 50 characters or less'];
			}

			if (!studentData.firstName?.trim()) {
				errors.firstName = ['First name is required'];
			} else if (studentData.firstName.length > 100) {
				errors.firstName = ['First name must be 100 characters or less'];
			}

			if (!studentData.lastName?.trim()) {
				errors.lastName = ['Last name is required'];
			} else if (studentData.lastName.length > 100) {
				errors.lastName = ['Last name must be 100 characters or less'];
			}

			if (studentData.middleName && studentData.middleName.length > 100) {
				errors.middleName = ['Middle name must be 100 characters or less'];
			}

			if (studentData.email && studentData.email.trim()) {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(studentData.email)) {
					errors.email = ['Please enter a valid email address'];
				}
			}

			if (!studentData.dateOfBirth?.trim()) {
				errors.dateOfBirth = ['Date of birth is required'];
			} else {
				const birthDate = new Date(studentData.dateOfBirth);
				if (isNaN(birthDate.getTime())) {
					errors.dateOfBirth = ['Please enter a valid date'];
				} else if (birthDate > new Date()) {
					errors.dateOfBirth = ['Date of birth cannot be in the future'];
				}
			}

			if (!studentData.gender?.trim()) {
				errors.gender = ['Gender is required'];
			} else if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(studentData.gender)) {
				errors.gender = ['Please select a valid gender'];
			}

			if (!studentData.grade?.trim()) {
				errors.grade = ['Grade is required'];
			} else if (studentData.grade.length > 20) {
				errors.grade = ['Grade must be 20 characters or less'];
			}

			if (studentData.section && studentData.section.length > 50) {
				errors.section = ['Section must be 50 characters or less'];
			}

			if (studentData.address && studentData.address.length > 500) {
				errors.address = ['Address must be 500 characters or less'];
			}

			if (studentData.profileUrl && studentData.profileUrl.trim()) {
				try {
					new URL(studentData.profileUrl);
				} catch {
					errors.profileUrl = ['Please enter a valid URL'];
				}
				if (studentData.profileUrl.length > 500) {
					errors.profileUrl = ['Profile URL must be 500 characters or less'];
				}
			}

			if (studentData.healthHistory && studentData.healthHistory.length > 1000) {
				errors.healthHistory = ['Health history must be 1000 characters or less'];
			}

			// Validate emergency contacts
			if (emergencyContactsData.length === 0) {
				errors.emergencyContacts = ['At least one emergency contact is required'];
			} else {
				emergencyContactsData.forEach((contact, index) => {
					if (!contact.name?.trim()) {
						errors[`emergencyContacts.${index}.name`] = ['Contact name is required'];
					} else if (contact.name.length > 200) {
						errors[`emergencyContacts.${index}.name`] = ['Name must be 200 characters or less'];
					}

					if (!contact.relationship?.trim()) {
						errors[`emergencyContacts.${index}.relationship`] = ['Relationship is required'];
					} else if (
						!['parent', 'guardian', 'sibling', 'grandparent', 'other', 'adviser'].includes(
							contact.relationship
						)
					) {
						errors[`emergencyContacts.${index}.relationship`] = [
							'Please select a valid relationship'
						];
					}

					if (!contact.phoneNumber?.trim()) {
						errors[`emergencyContacts.${index}.phoneNumber`] = ['Phone number is required'];
					} else if (contact.phoneNumber.length > 20) {
						errors[`emergencyContacts.${index}.phoneNumber`] = [
							'Phone number must be 20 characters or less'
						];
					}

					if (contact.alternatePhone && contact.alternatePhone.length > 20) {
						errors[`emergencyContacts.${index}.alternatePhone`] = [
							'Alternate phone must be 20 characters or less'
						];
					}

					if (contact.email && contact.email.trim()) {
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
						if (!emailRegex.test(contact.email)) {
							errors[`emergencyContacts.${index}.email`] = ['Please enter a valid email address'];
						}
					}

					if (contact.address && contact.address.length > 500) {
						errors[`emergencyContacts.${index}.address`] = [
							'Address must be 500 characters or less'
						];
					}
				});
			}

			// Return validation errors if any
			if (Object.keys(errors).length > 0) {
				return fail(400, {
					errors,
					formData: studentData,
					emergencyContacts: emergencyContactsData
				});
			}

			// Check for existing student ID (exclude current student)
			const existingStudentId = await db
				.select({ id: students.id })
				.from(students)
				.where(eq(students.studentId, studentData.studentId))
				.limit(1);

			if (existingStudentId.length > 0 && existingStudentId[0].id !== studentId) {
				return fail(400, {
					errors: {
						studentId: ['A student with this ID already exists']
					},
					formData: studentData,
					emergencyContacts: emergencyContactsData
				});
			}

			// Check for existing email if provided (exclude current student)
			if (studentData.email && studentData.email.trim()) {
				const existingEmail = await db
					.select({ id: students.id })
					.from(students)
					.where(eq(students.email, studentData.email))
					.limit(1);

				if (existingEmail.length > 0 && existingEmail[0].id !== studentId) {
					return fail(400, {
						errors: {
							email: ['A student with this email already exists']
						},
						formData: studentData,
						emergencyContacts: emergencyContactsData
					});
				}
			}

			// Update student
			const [updatedStudent] = await db
				.update(students)
				.set({
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
					profileUrl: studentData.profileUrl || null,
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
					doctorId: studentData.doctorId || null,
					updatedAt: new Date()
				})
				.where(eq(students.id, studentId))
				.returning();

			if (!updatedStudent) {
				throw new Error('Student not found');
			}

			// Delete existing emergency contacts
			await db.delete(emergencyContacts).where(eq(emergencyContacts.studentId, studentId));

			// Insert new emergency contacts
			for (const contact of emergencyContactsData) {
				await db.insert(emergencyContacts).values({
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

			return {
				success: true,
				student: updatedStudent
			};
		} catch (error) {
			console.error('Error updating student:', error);

			// Handle specific database errors
			if (error instanceof Error) {
				if (error.message.includes('UNIQUE constraint failed: students.student_id')) {
					return fail(400, {
						errors: {
							studentId: ['A student with this ID already exists']
						}
					});
				}
				if (error.message.includes('UNIQUE constraint failed: students.email')) {
					return fail(400, {
						errors: {
							email: ['A student with this email already exists']
						}
					});
				}
			}

			return fail(500, {
				errors: {
					_form: ['Failed to update student. Please try again.']
				}
			});
		}
	},

	deleteStudent: async ({ request }) => {
		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;

			if (!studentId) {
				return fail(400, {
					error: 'Student ID is required'
				});
			}

			// Check if student exists
			const [existingStudent] = await db
				.select({ id: students.id, firstName: students.firstName, lastName: students.lastName })
				.from(students)
				.where(eq(students.id, studentId));

			if (!existingStudent) {
				return fail(404, {
					error: 'Student not found'
				});
			}

			// Soft delete - mark as inactive
			await db
				.update(students)
				.set({
					isActive: false,
					updatedAt: new Date()
				})
				.where(eq(students.id, studentId));

			return {
				success: true,
				message: `Student ${existingStudent.firstName} ${existingStudent.lastName} has been deactivated due to existing clinic visit records.`,
				type: 'deactivated'
			};
		} catch (error) {
			console.error('Error deleting student:', error);
			return fail(500, {
				error: 'Failed to delete student. Please try again.'
			});
		}
	},

	reactivateStudent: async ({ request }) => {
		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;

			if (!studentId) {
				return fail(400, {
					error: 'Student ID is required'
				});
			}

			// Check if student exists and is inactive
			const [existingStudent] = await db
				.select({
					id: students.id,
					firstName: students.firstName,
					lastName: students.lastName,
					isActive: students.isActive
				})
				.from(students)
				.where(eq(students.id, studentId));

			if (!existingStudent) {
				return fail(404, {
					error: 'Student not found'
				});
			}

			if (existingStudent.isActive) {
				return fail(400, {
					error: 'Student is already active'
				});
			}

			// Reactivate the student
			await db
				.update(students)
				.set({
					isActive: true,
					updatedAt: new Date()
				})
				.where(eq(students.id, studentId));

			return {
				success: true,
				message: `Student ${existingStudent.firstName} ${existingStudent.lastName} has been reactivated.`,
				type: 'reactivated'
			};
		} catch (error) {
			console.error('Error reactivating student:', error);
			return fail(500, {
				error: 'Failed to reactivate student. Please try again.'
			});
		}
	},

	permanentDeleteStudent: async ({ request }) => {
		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;

			if (!studentId) {
				return fail(400, {
					error: 'Student ID is required'
				});
			}

			// Check if student exists and is inactive
			const [existingStudent] = await db
				.select({
					id: students.id,
					firstName: students.firstName,
					lastName: students.lastName,
					isActive: students.isActive
				})
				.from(students)
				.where(eq(students.id, studentId));

			if (!existingStudent) {
				return fail(404, {
					error: 'Student not found'
				});
			}

			if (existingStudent.isActive) {
				return fail(400, {
					error: 'Cannot permanently delete an active student. Please deactivate first.'
				});
			}

			// Check if student has clinic visits (they will be deleted due to cascade)
			const visitCountResult = await db
				.select({ count: count() })
				.from(clinicVisits)
				.where(eq(clinicVisits.studentId, studentId));

			const visitCount = visitCountResult[0]?.count || 0;

			// Hard delete - permanently remove the student and all related data
			// Emergency contacts and clinic visits will be automatically deleted due to cascade
			await db.delete(students).where(eq(students.id, studentId));

			const visitMessage =
				visitCount > 0
					? ` and ${visitCount} clinic visit record${visitCount === 1 ? '' : 's'}`
					: '';

			return {
				success: true,
				message: `Student ${existingStudent.firstName} ${existingStudent.lastName} has been permanently deleted${visitMessage}.`,
				type: 'permanently_deleted'
			};
		} catch (error) {
			console.error('Error permanently deleting student:', error);
			return fail(500, {
				error: 'Failed to permanently delete student. Please try again.'
			});
		}
	}
};
