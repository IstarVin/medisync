import { db } from '$lib/server/db/index.js';
import { clinicVisits, emergencyContacts, students, users } from '$lib/server/db/schema.js';
import { error, fail, isHttpError } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const studentId = params.id;

	try {
		// Fetch student with all related data
		const [student] = await db
			.select({
				id: students.id,
				studentId: students.studentId,
				qrCodeId: students.qrCodeId,
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
				profilePicture: students.profilePicture,
				createdAt: students.createdAt,
				updatedAt: students.updatedAt,
				// Doctor information
				doctorId: students.doctorId,
				doctorFirstName: users.firstName,
				doctorLastName: users.lastName,
				doctorEmail: users.email,
				doctorPhone: users.phoneNumber
			})
			.from(students)
			.leftJoin(users, eq(students.doctorId, users.id))
			.where(eq(students.studentId, studentId));

		if (!student) {
			throw error(404, {
				message: 'Student not found'
			});
		}

		// Fetch all emergency contacts for this student
		const emergencyContactsList = await db
			.select()
			.from(emergencyContacts)
			.where(eq(emergencyContacts.studentId, student.id))
			.orderBy(emergencyContacts.priority);

		// Fetch recent clinic visits (last 10 visits)
		const recentVisits = await db
			.select({
				id: clinicVisits.id,
				visitNumber: clinicVisits.visitNumber,
				visitType: clinicVisits.visitType,
				status: clinicVisits.status,
				severity: clinicVisits.severity,
				checkInTime: clinicVisits.checkInTime,
				checkOutTime: clinicVisits.checkOutTime,
				chiefComplaint: clinicVisits.chiefComplaint,
				diagnosis: clinicVisits.diagnosis,
				treatment: clinicVisits.treatment,
				isEmergency: clinicVisits.isEmergency,
				parentNotified: clinicVisits.parentNotified,
				// Staff member who attended
				attendedByFirstName: users.firstName,
				attendedByLastName: users.lastName,
				attendedByRole: users.role
			})
			.from(clinicVisits)
			.leftJoin(users, eq(clinicVisits.attendedById, users.id))
			.where(eq(clinicVisits.studentId, student.id))
			.orderBy(desc(clinicVisits.checkInTime))
			.limit(10);

		// Calculate visit statistics
		const visitStats = {
			total: recentVisits.length,
			emergency: recentVisits.filter((v) => v.isEmergency).length,
			thisMonth: recentVisits.filter((v) => {
				const visitDate = new Date(v.checkInTime);
				const now = new Date();
				return (
					visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
				);
			}).length,
			lastVisit: recentVisits[0]?.checkInTime || null
		};

		// Fetch available nurses for the form
		const availableNurses = await db
			.select({
				id: users.id,
				name: users.firstName,
				lastName: users.lastName,
				role: users.role
			})
			.from(users)
			.where(eq(users.role, 'nurse'))
			.orderBy(users.firstName, users.lastName);

		// Format nurse names for display
		const formattedNurses = availableNurses.map((nurse) => ({
			id: nurse.id,
			name: `${nurse.name} ${nurse.lastName}`
		}));

		return {
			student: {
				...student,
				dateOfBirth: student.dateOfBirth.toISOString(),
				enrollmentDate: student.enrollmentDate.toISOString(),
				createdAt: student.createdAt.toISOString(),
				updatedAt: student.updatedAt.toISOString()
			},
			emergencyContacts: emergencyContactsList.map((contact) => ({
				...contact,
				createdAt: contact.createdAt.toISOString(),
				updatedAt: contact.updatedAt.toISOString()
			})),
			recentVisits: recentVisits.map((visit) => ({
				...visit,
				checkInTime: visit.checkInTime.toISOString(),
				checkOutTime: visit.checkOutTime?.toISOString() || null
			})),
			visitStats,
			availableNurses: formattedNurses
		};
	} catch (err) {
		console.error('Error loading student:', err);

		if (isHttpError(err)) {
			throw err; // Re-throw SvelteKit errors
		}

		throw error(500, {
			message: 'Failed to load student information'
		});
	}
};

export const actions: Actions = {
	createVisit: async ({ request, params }) => {
		try {
			const formData = await request.formData();
			const studentId = params.id;

			// Extract visit data
			const visitData = {
				nurseId: formData.get('nurseId') as string,
				visitType: formData.get('visitType') as string,
				severity: formData.get('severity') as string,
				isEmergency: formData.get('isEmergency') === 'true',
				reason: formData.get('reason') as string,
				details: formData.get('details') as string,
				medicationsGiven: formData.get('medicationsGiven') as string
			};

			// Validate required fields
			if (!visitData.reason.trim()) {
				return fail(400, {
					error: 'Reason for visit is required'
				});
			}

			if (!visitData.nurseId) {
				return fail(400, {
					error: 'Nurse selection is required'
				});
			}

			// Validate visit type
			const validVisitTypes = [
				'emergency',
				'illness',
				'injury',
				'medication',
				'checkup',
				'mental_health',
				'other'
			];
			if (!validVisitTypes.includes(visitData.visitType)) {
				return fail(400, {
					error: 'Invalid visit type'
				});
			}

			// Validate severity
			const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
			if (!validSeverityLevels.includes(visitData.severity)) {
				return fail(400, {
					error: 'Invalid severity level'
				});
			}

			// Verify student exists
			const [student] = await db
				.select({ id: students.id })
				.from(students)
				.where(eq(students.studentId, studentId))
				.limit(1);

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
			}

			// Verify nurse exists
			const [nurse] = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.id, visitData.nurseId))
				.limit(1);

			if (!nurse) {
				return fail(400, {
					error: 'Selected nurse not found'
				});
			}

			// Create the visit
			const [newVisit] = await db
				.insert(clinicVisits)
				.values({
					studentId: student.id,
					attendedById: visitData.nurseId,
					visitType: visitData.visitType as
						| 'emergency'
						| 'illness'
						| 'injury'
						| 'medication'
						| 'checkup'
						| 'mental_health'
						| 'other',
					severity: visitData.severity as 'low' | 'medium' | 'high' | 'critical',
					isEmergency: visitData.isEmergency,
					chiefComplaint: visitData.reason,
					symptoms: visitData.details || null,
					medicationGiven: visitData.medicationsGiven || null,
					status: 'active',
					parentNotified: visitData.isEmergency // Auto-notify parents for emergency visits
				})
				.returning({ id: clinicVisits.id });

			return {
				success: true,
				visitId: newVisit.id
			};
		} catch (error) {
			console.error('Error creating visit:', error);
			return fail(500, {
				error: 'Failed to create visit. Please try again.'
			});
		}
	}
};
