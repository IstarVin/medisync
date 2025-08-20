import { db } from '$lib/server/db/index.js';
import { clinicVisits, emergencyContacts, students, users } from '$lib/server/db/schema.js';
import { error, isHttpError } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

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
			visitStats
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
