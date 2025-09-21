import {
	ClinicVisit,
	connectMongoDB,
	EmergencyContact,
	Student,
	User,
	type IEmergencyContact,
	type IStudent
} from '$lib/server/db/index.js';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Ensure MongoDB connection
		await connectMongoDB();

		// Fetch all students first
		const allStudents = await Student.find().sort({ lastName: 1, firstName: 1 }).lean();

		// Fetch all emergency contacts for the students
		const studentIds = allStudents.map((student) => student._id);
		const allEmergencyContacts = await EmergencyContact.find({
			studentId: { $in: studentIds }
		})
			.sort({ priority: 1, createdAt: 1 })
			.lean();

		// Group emergency contacts by studentId for easy lookup
		const contactsByStudentId = allEmergencyContacts.reduce(
			(acc, contact) => {
				const studentId = contact.studentId.toString();
				if (!acc[studentId]) {
					acc[studentId] = [];
				}
				acc[studentId].push(contact);
				return acc;
			},
			{} as Record<string, typeof allEmergencyContacts>
		);

		// Fetch available doctors for the form
		const availableDoctors = await User.find({ role: 'doctor' })
			.select('_id firstName lastName role')
			.sort({ firstName: 1, lastName: 1 })
			.lean();

		// Format doctor names for display
		const formattedDoctors = availableDoctors.map((doctor) => ({
			id:
				(
					doctor as unknown as { _id: unknown; firstName: string; lastName: string }
				)._id?.toString() || '',
			name: `${(doctor as unknown as { firstName: string; lastName: string }).firstName} ${(doctor as unknown as { firstName: string; lastName: string }).lastName}`
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

		// Format students for frontend
		const formattedStudents = allStudents.map((student) => ({
			id: (student as unknown as IStudent)._id?.toString() || '',
			studentId: (student as unknown as IStudent).studentId || '',
			qrCodeId: (student as unknown as IStudent).qrCodeId || null,
			firstName: (student as unknown as IStudent).firstName || '',
			lastName: (student as unknown as IStudent).lastName || '',
			middleName: (student as unknown as IStudent).middleName || null,
			email: (student as unknown as IStudent).email || null,
			dateOfBirth: (student as unknown as IStudent).dateOfBirth,
			gender: (student as unknown as IStudent).gender,
			grade: (student as unknown as IStudent).grade || '',
			section: (student as unknown as IStudent).section || null,
			address: (student as unknown as IStudent).address || null,
			chronicHealthConditions: (student as unknown as IStudent).chronicHealthConditions || [],
			currentMedications: (student as unknown as IStudent).currentMedications || [],
			doctorId: (student as unknown as IStudent).doctorId?.toString() || null,
			healthHistory: (student as unknown as IStudent).healthHistory || null,
			enrollmentDate: (student as unknown as IStudent).enrollmentDate,
			isActive: (student as unknown as IStudent).isActive || false,
			profileUrl: (student as unknown as IStudent).profileUrl || null,
			createdAt: (student as unknown as IStudent).createdAt,
			updatedAt: (student as unknown as IStudent).updatedAt,
			emergencyContacts: (
				contactsByStudentId[(student as unknown as IStudent)._id?.toString()] || []
			).map((contact) => ({
				id: (contact as unknown as IEmergencyContact)._id?.toString() || '',
				studentId: (contact as unknown as IEmergencyContact).studentId?.toString() || '',
				name: (contact as unknown as IEmergencyContact).name || '',
				relationship: (contact as unknown as IEmergencyContact).relationship || 'other',
				phoneNumber: (contact as unknown as IEmergencyContact).phoneNumber || '',
				alternatePhone: (contact as unknown as IEmergencyContact).alternatePhone || null,
				email: (contact as unknown as IEmergencyContact).email || null,
				address: (contact as unknown as IEmergencyContact).address || null,
				isPrimary: (contact as unknown as IEmergencyContact).isPrimary || false,
				priority: (contact as unknown as IEmergencyContact).priority || 0,
				createdAt: (contact as unknown as IEmergencyContact).createdAt,
				updatedAt: (contact as unknown as IEmergencyContact).updatedAt
			}))
		}));

		return {
			students: formattedStudents,
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
			// Ensure MongoDB connection
			await connectMongoDB();

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
			const existingStudent = await Student.findOne({ studentId: studentData.studentId }).select(
				'_id'
			);

			if (existingStudent) {
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
				const existingEmail = await Student.findOne({ email: studentData.email }).select('_id');

				if (existingEmail) {
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
			const newStudent = await Student.create({
				studentId: studentData.studentId,
				firstName: studentData.firstName,
				lastName: studentData.lastName,
				middleName: studentData.middleName || undefined,
				email: studentData.email || undefined,
				dateOfBirth: new Date(studentData.dateOfBirth),
				gender: studentData.gender,
				grade: studentData.grade,
				section: studentData.section || undefined,
				address: studentData.address || undefined,
				profileUrl: studentData.profileUrl || undefined,
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
				healthHistory: studentData.healthHistory || undefined,
				doctorId: studentData.doctorId || undefined,
				enrollmentDate: new Date(),
				isActive: true
			});

			// Insert emergency contacts
			const emergencyContactsToCreate = emergencyContactsData.map((contact) => ({
				studentId: newStudent._id,
				name: contact.name,
				relationship: contact.relationship,
				phoneNumber: contact.phoneNumber,
				alternatePhone: contact.alternatePhone || undefined,
				email: contact.email || undefined,
				address: contact.address || undefined,
				isPrimary: contact.isPrimary,
				priority: contact.priority
			}));

			await EmergencyContact.insertMany(emergencyContactsToCreate);

			return {
				success: true,
				student: {
					id: newStudent._id?.toString() || '',
					studentId: newStudent.studentId,
					firstName: newStudent.firstName,
					lastName: newStudent.lastName,
					middleName: newStudent.middleName || null,
					email: newStudent.email || null,
					dateOfBirth: newStudent.dateOfBirth,
					gender: newStudent.gender,
					grade: newStudent.grade,
					section: newStudent.section || null,
					address: newStudent.address || null,
					profileUrl: newStudent.profileUrl || null,
					chronicHealthConditions: newStudent.chronicHealthConditions || [],
					currentMedications: newStudent.currentMedications || [],
					healthHistory: newStudent.healthHistory || null,
					doctorId: newStudent.doctorId?.toString() || null,
					enrollmentDate: newStudent.enrollmentDate,
					isActive: newStudent.isActive,
					createdAt: newStudent.createdAt,
					updatedAt: newStudent.updatedAt
				}
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
			// Ensure MongoDB connection
			await connectMongoDB();

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
			const existingStudentId = await Student.findOne({
				studentId: studentData.studentId,
				_id: { $ne: studentId }
			}).select('_id');

			if (existingStudentId) {
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
				const existingEmail = await Student.findOne({
					email: studentData.email,
					_id: { $ne: studentId }
				}).select('_id');

				if (existingEmail) {
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
			const updatedStudent = await Student.findByIdAndUpdate(
				studentId,
				{
					studentId: studentData.studentId,
					firstName: studentData.firstName,
					lastName: studentData.lastName,
					middleName: studentData.middleName || undefined,
					email: studentData.email || undefined,
					dateOfBirth: new Date(studentData.dateOfBirth),
					gender: studentData.gender,
					grade: studentData.grade,
					section: studentData.section || undefined,
					address: studentData.address || undefined,
					profileUrl: studentData.profileUrl || undefined,
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
					healthHistory: studentData.healthHistory || undefined,
					doctorId: studentData.doctorId || undefined,
					updatedAt: new Date()
				},
				{ new: true }
			);

			if (!updatedStudent) {
				throw new Error('Student not found');
			}

			// Delete existing emergency contacts
			await EmergencyContact.deleteMany({ studentId: studentId });

			// Insert new emergency contacts
			const emergencyContactsToCreate = emergencyContactsData.map((contact) => ({
				studentId: studentId,
				name: contact.name,
				relationship: contact.relationship,
				phoneNumber: contact.phoneNumber,
				alternatePhone: contact.alternatePhone || undefined,
				email: contact.email || undefined,
				address: contact.address || undefined,
				isPrimary: contact.isPrimary,
				priority: contact.priority
			}));

			await EmergencyContact.insertMany(emergencyContactsToCreate);

			return {
				success: true,
				student: {
					id: updatedStudent._id?.toString() || '',
					studentId: updatedStudent.studentId,
					firstName: updatedStudent.firstName,
					lastName: updatedStudent.lastName,
					middleName: updatedStudent.middleName || null,
					email: updatedStudent.email || null,
					dateOfBirth: updatedStudent.dateOfBirth,
					gender: updatedStudent.gender,
					grade: updatedStudent.grade,
					section: updatedStudent.section || null,
					address: updatedStudent.address || null,
					profileUrl: updatedStudent.profileUrl || null,
					chronicHealthConditions: updatedStudent.chronicHealthConditions || [],
					currentMedications: updatedStudent.currentMedications || [],
					healthHistory: updatedStudent.healthHistory || null,
					doctorId: updatedStudent.doctorId?.toString() || null,
					enrollmentDate: updatedStudent.enrollmentDate,
					isActive: updatedStudent.isActive,
					createdAt: updatedStudent.createdAt,
					updatedAt: updatedStudent.updatedAt
				}
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
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;

			if (!studentId) {
				return fail(400, {
					error: 'Student ID is required'
				});
			}

			// Check if student exists
			const existingStudent = await Student.findById(studentId).select('firstName lastName').lean();

			if (!existingStudent) {
				return fail(404, {
					error: 'Student not found'
				});
			}

			// Soft delete - mark as inactive
			await Student.findByIdAndUpdate(studentId, {
				isActive: false,
				updatedAt: new Date()
			});

			return {
				success: true,
				message: `Student ${(existingStudent as unknown as { firstName: string; lastName: string }).firstName} ${(existingStudent as unknown as { firstName: string; lastName: string }).lastName} has been deactivated due to existing clinic visit records.`,
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
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;

			if (!studentId) {
				return fail(400, {
					error: 'Student ID is required'
				});
			}

			// Check if student exists and is inactive
			const existingStudent = await Student.findById(studentId)
				.select('firstName lastName isActive')
				.lean();

			if (!existingStudent) {
				return fail(404, {
					error: 'Student not found'
				});
			}

			if ((existingStudent as unknown as { isActive: boolean }).isActive) {
				return fail(400, {
					error: 'Student is already active'
				});
			}

			// Reactivate the student
			await Student.findByIdAndUpdate(studentId, {
				isActive: true,
				updatedAt: new Date()
			});

			return {
				success: true,
				message: `Student ${(existingStudent as unknown as { firstName: string; lastName: string }).firstName} ${(existingStudent as unknown as { firstName: string; lastName: string }).lastName} has been reactivated.`,
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
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;

			if (!studentId) {
				return fail(400, {
					error: 'Student ID is required'
				});
			}

			// Check if student exists and is inactive
			const existingStudent = await Student.findById(studentId)
				.select('firstName lastName isActive')
				.lean();

			if (!existingStudent) {
				return fail(404, {
					error: 'Student not found'
				});
			}

			if ((existingStudent as unknown as { isActive: boolean }).isActive) {
				return fail(400, {
					error: 'Cannot permanently delete an active student. Please deactivate first.'
				});
			}

			// Check if student has clinic visits
			const visitCount = await ClinicVisit.countDocuments({ studentId: studentId });

			// Hard delete - permanently remove the student and all related data
			// Delete emergency contacts first
			await EmergencyContact.deleteMany({ studentId: studentId });

			// Delete clinic visits
			await ClinicVisit.deleteMany({ studentId: studentId });

			// Delete the student
			await Student.findByIdAndDelete(studentId);

			const visitMessage =
				visitCount > 0
					? ` and ${visitCount} clinic visit record${visitCount === 1 ? '' : 's'}`
					: '';

			return {
				success: true,
				message: `Student ${(existingStudent as unknown as { firstName: string; lastName: string }).firstName} ${(existingStudent as unknown as { firstName: string; lastName: string }).lastName} has been permanently deleted${visitMessage}.`,
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
